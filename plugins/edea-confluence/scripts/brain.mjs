#!/usr/bin/env node
// Read the Confluence Brain through the REST API with a personal API token.
//
// Why this exists: the Confluence connector (Atlassian's Rovo MCP server) reads
// through one shared hourly quota and throttles bursts. A personal API token is
// metered per person and takes parallel reads without complaint. Use this for
// any bulk or parallel read, and whenever the connector answers 429. Writes stay
// on the connector, where every page is shown for approval first.
//
// Setup, once per person, in the shell profile:
//   export ATLASSIAN_SITE="first-edea-team.atlassian.net"
//   export ATLASSIAN_EMAIL="you@first-edea.com"
//   export ATLASSIAN_API_TOKEN="…"   # id.atlassian.com → Security → API tokens
//
// Usage:
//   brain.mjs page <id|url>                       one page as markdown, to stdout
//   brain.mjs pages <id|url>... --out <dir>       many pages in parallel, one .md each
//   brain.mjs search "<cql>" [--limit N]          titles, ids and urls; N defaults to 10
//   brain.mjs children <id> [--depth N]           the page tree under a page
//   brain.mjs backlinks "<exact page title>"      pages whose text mentions that title
//   brain.mjs versions <id|url>                   every saved version: number, date, message
//   brain.mjs versions <id|url> --version N       that version's body as markdown
//
// Options: --out <dir> (also for page/search), --concurrency N (default 6),
//          --no-cache, --json (raw API json instead of markdown), --version N.
// A Decision page is edited in place, so its version history is the record of what
// the rule used to say; `versions` is how a skill reads that record.
// Pages are cached at ~/.cache/edea-brain/<id>-v<version>.md; a page is fetched
// again only when its version number changed (one cheap metadata call).

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";

const site = process.env.ATLASSIAN_SITE ?? "first-edea-team.atlassian.net";
const email = process.env.ATLASSIAN_EMAIL;
const token = process.env.ATLASSIAN_API_TOKEN;
const base = `https://${site}/wiki`;
const cacheDir = path.join(homedir(), ".cache", "edea-brain");

function fail(message) {
  process.stderr.write(`brain: ${message}\n`);
  process.exit(1);
}

if (!email || !token) {
  fail("ATLASSIAN_EMAIL and ATLASSIAN_API_TOKEN must be set in the shell profile");
}

const auth = `Basic ${Buffer.from(`${email}:${token}`).toString("base64")}`;

// ---------- arguments ----------

const argv = process.argv.slice(2);
const command = argv.shift();
const options = { concurrency: 6, limit: 10, cache: true, json: false, depth: 3 };
const positional = [];
for (let i = 0; i < argv.length; i++) {
  const arg = argv[i];
  if (arg === "--out") options.out = argv[++i];
  else if (arg === "--concurrency") options.concurrency = Number(argv[++i]);
  else if (arg === "--limit") options.limit = Number(argv[++i]);
  else if (arg === "--depth") options.depth = Number(argv[++i]);
  else if (arg === "--version") options.version = Number(argv[++i]);
  else if (arg === "--no-cache") options.cache = false;
  else if (arg === "--json") options.json = true;
  else positional.push(arg);
}

// ---------- http with retry ----------

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function get(url) {
  let delay = 5000;
  for (let attempt = 0; attempt < 5; attempt++) {
    const response = await fetch(url, {
      headers: { Authorization: auth, Accept: "application/json" },
    });
    if (response.ok) return response.json();
    const retryAfter = Number(response.headers.get("retry-after"));
    if (response.status === 429 || response.status >= 500) {
      const wait = retryAfter > 0 ? retryAfter * 1000 : delay * (0.7 + Math.random() * 0.6);
      process.stderr.write(
        `brain: ${response.status} on ${url}, waiting ${Math.round(wait / 1000)}s\n`,
      );
      await sleep(Math.min(wait, 60000));
      delay = Math.min(delay * 2, 30000);
      continue;
    }
    fail(`${response.status} ${response.statusText} for ${url}\n${await response.text()}`);
  }
  fail(`gave up after 5 attempts: ${url}`);
}

async function mapWithLimit(items, limit, work) {
  const results = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const index = next++;
      results[index] = await work(items[index], index);
    }
  }
  const workers = Array.from({ length: Math.min(limit, items.length) }, worker);
  await Promise.all(workers);
  return results;
}

// ---------- storage-format html → markdown (light) ----------

function decodeEntities(text) {
  const named = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    nbsp: " ",
    mdash: "—",
    ndash: "–",
    middot: "·",
    hellip: "…",
    laquo: "«",
    raquo: "»",
    rarr: "→",
    larr: "←",
  };
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&([a-z]+);/gi, (match, name) => named[name.toLowerCase()] ?? match);
}

function toMarkdown(html) {
  let text = html;
  // Confluence macros and structured nodes: keep their text, mark their kind.
  text = text.replace(
    /<ac:structured-macro[^>]*ac:name="([^"]+)"[^>]*>([\s\S]*?)<\/ac:structured-macro>/g,
    (_, name, inner) => `\n> [${name}] ${inner}\n`,
  );
  text = text.replace(/<ac:parameter[^>]*>[\s\S]*?<\/ac:parameter>/g, "");
  text = text.replace(/<ac:rich-text-body>([\s\S]*?)<\/ac:rich-text-body>/g, "$1");
  text = text.replace(
    /<ac:plain-text-body><!\[CDATA\[([\s\S]*?)\]\]><\/ac:plain-text-body>/g,
    "\n```\n$1\n```\n",
  );
  text = text.replace(/<ac:task-list>([\s\S]*?)<\/ac:task-list>/g, "\n$1\n");
  text = text.replace(
    /<ac:task>[\s\S]*?<ac:task-status>(\w+)<\/ac:task-status>[\s\S]*?<ac:task-body>([\s\S]*?)<\/ac:task-body>[\s\S]*?<\/ac:task>/g,
    (_, status, body) => `- [${status === "complete" ? "x" : " "}] ${body}\n`,
  );
  text = text.replace(/<ac:adf-extension>[\s\S]*?<\/ac:adf-extension>/g, "");
  text = text.replace(
    /<ac:link[^>]*>[\s\S]*?<ri:page[^>]*ri:content-title="([^"]+)"[^>]*\/>[\s\S]*?(?:<ac:plain-text-link-body><!\[CDATA\[([\s\S]*?)\]\]><\/ac:plain-text-link-body>|<ac:link-body>([\s\S]*?)<\/ac:link-body>)?[\s\S]*?<\/ac:link>/g,
    (_, title, plain, rich) => `[${plain ?? rich ?? title}](page:${title})`,
  );
  text = text.replace(/<ac:emoticon[^>]*ac:emoji-fallback="([^"]*)"[^>]*\/>/g, "$1");
  text = text.replace(/<ac:emoticon[^>]*\/>/g, "");
  text = text.replace(
    /<ac:inline-comment-marker[^>]*>([\s\S]*?)<\/ac:inline-comment-marker>/g,
    "$1",
  );
  text = text.replace(/<ac:placeholder>[\s\S]*?<\/ac:placeholder>/g, "");
  text = text.replace(/<time[^>]*datetime="([^"]+)"[^>]*\/>/g, "$1");
  // Ordinary html.
  text = text.replace(
    /<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/g,
    (_, level, inner) => `\n${"#".repeat(Number(level))} ${inner.trim()}\n`,
  );
  text = text.replace(/<(strong|b)>([\s\S]*?)<\/\1>/g, "**$2**");
  text = text.replace(/<(em|i)>([\s\S]*?)<\/\1>/g, "*$2*");
  text = text.replace(/<code>([\s\S]*?)<\/code>/g, "`$1`");
  text = text.replace(/<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g, "[$2]($1)");
  text = text.replace(/<br\s*\/?>/g, "\n");
  text = text.replace(/<hr\s*\/?>/g, "\n---\n");
  const flat = (inner) => inner.replace(/<\/?p[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  text = text.replace(/<blockquote>([\s\S]*?)<\/blockquote>/g, (_, inner) => `\n> ${flat(inner)}\n`);
  text = text.replace(/<li[^>]*>([\s\S]*?)<\/li>/g, (_, inner) => `- ${flat(inner)}\n`);
  text = text.replace(/<\/?(ul|ol)[^>]*>/g, "\n");
  // Tables: one row per line, cells separated by pipes.
  text = text.replace(/<table[^>]*>([\s\S]*?)<\/table>/g, (_, inner) => {
    const rows = [...inner.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)].map((row) =>
      [...row[1].matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/g)].map((cell) =>
        cell[1]
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim(),
      ),
    );
    if (rows.length === 0) return "";
    const line = (cells) => `| ${cells.join(" | ")} |`;
    const separator = `| ${rows[0].map(() => "---").join(" | ")} |`;
    return `\n${[line(rows[0]), separator, ...rows.slice(1).map(line)].join("\n")}\n`;
  });
  text = text.replace(/<p[^>]*>([\s\S]*?)<\/p>/g, "\n$1\n");
  text = text.replace(/<[^>]+>/g, "");
  text = decodeEntities(text);
  return text
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// ---------- pages ----------

function pageId(input) {
  const match = String(input).match(/pages\/(\d+)/) ?? String(input).match(/^(\d+)$/);
  if (!match) fail(`not a page id or url: ${input}`);
  return match[1];
}

function header(meta) {
  const url = `${base}${meta._links.webui}`;
  return `# ${meta.title}\n\nid: ${meta.id} · version: ${meta.version.number} · updated: ${meta.version.createdAt.slice(0, 10)} · parent: ${meta.parentId ?? "—"}\nurl: ${url}\n`;
}

async function fetchPage(id) {
  const meta = await get(`${base}/api/v2/pages/${id}`);
  const cacheFile = path.join(cacheDir, `${id}-v${meta.version.number}.md`);
  if (options.cache && !options.json) {
    try {
      return { meta, markdown: await readFile(cacheFile, "utf8"), cached: true };
    } catch {
      // not cached yet
    }
  }
  const full = await get(`${base}/api/v2/pages/${id}?body-format=storage`);
  if (options.json) return { meta, markdown: JSON.stringify(full, null, 2) };
  const markdown = `${header(full)}\n${toMarkdown(full.body.storage.value)}\n`;
  if (options.cache) {
    await mkdir(cacheDir, { recursive: true });
    await writeFile(cacheFile, markdown);
  }
  return { meta, markdown, cached: false };
}

function safeName(title) {
  return title
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

async function emit(pages) {
  if (options.out) {
    await mkdir(options.out, { recursive: true });
    for (const { meta, markdown, cached } of pages) {
      const file = path.join(options.out, `${meta.id}-${safeName(meta.title)}.md`);
      await writeFile(file, markdown);
      process.stderr.write(`${cached ? "cached " : "fetched"} ${file}\n`);
    }
  } else {
    process.stdout.write(pages.map((p) => p.markdown).join("\n\n---\n\n"));
  }
}

// ---------- search ----------

async function search(cql, limit) {
  const url = `${base}/rest/api/content/search?cql=${encodeURIComponent(cql)}&limit=${limit}&expand=version`;
  const data = await get(url);
  return data.results.map((r) => ({
    id: r.id,
    title: r.title,
    updated: r.version?.when?.slice(0, 10) ?? "",
    url: `${base}${r._links.webui}`,
  }));
}

function printList(rows) {
  if (options.json) {
    process.stdout.write(`${JSON.stringify(rows, null, 2)}\n`);
    return;
  }
  for (const row of rows)
    process.stdout.write(`${row.id}\t${row.updated}\t${row.title}\t${row.url}\n`);
}

async function children(id, depth) {
  const url = `${base}/api/v2/pages/${id}/descendants?depth=${depth}&limit=250`;
  const data = await get(url);
  return data.results.map((r) => ({
    id: r.id,
    title: r.title,
    depth: r.depth,
    parent: r.parentId,
    url: `${base}/spaces/MTG/pages/${r.id}`,
  }));
}

// ---------- versions ----------

async function versions(id) {
  const rows = [];
  let url = `${base}/api/v2/pages/${id}/versions?limit=100`;
  while (url) {
    const data = await get(url);
    for (const v of data.results) {
      rows.push({
        number: v.number,
        date: v.createdAt.slice(0, 10),
        message: v.message ?? "",
        author: v.authorId,
      });
    }
    url = data._links?.next ? new URL(data._links.next, `https://${site}`).href : null;
  }
  return rows.sort((a, b) => a.number - b.number);
}

// The v2 API lists versions but returns no body for an old one; the v1 API does.
async function versionBody(id, number) {
  const url = `${base}/rest/api/content/${id}?version=${number}&expand=body.storage,version`;
  const data = await get(url);
  if (options.json) return JSON.stringify(data, null, 2);
  const head = `# ${data.title}\n\nid: ${data.id} · version: ${data.version.number} of the page's history · saved: ${data.version.when.slice(0, 10)}\n`;
  return `${head}\n${toMarkdown(data.body.storage.value)}\n`;
}

// ---------- main ----------

switch (command) {
  case "page":
  case "pages": {
    if (positional.length === 0) fail("give at least one page id or url");
    const ids = positional.map(pageId);
    const pages = await mapWithLimit(ids, options.concurrency, fetchPage);
    await emit(pages);
    break;
  }
  case "search": {
    if (!positional[0])
      fail("give a CQL string, e.g. 'space = MTG AND type = page AND title ~ \"guided flow\"'");
    printList(await search(positional[0], options.limit));
    break;
  }
  case "children": {
    if (!positional[0]) fail("give the parent page id");
    const rows = await children(pageId(positional[0]), options.depth);
    if (options.json) printList(rows);
    else
      for (const row of rows)
        process.stdout.write(`${"  ".repeat(row.depth - 1)}${row.id}\t${row.title}\n`);
    break;
  }
  case "backlinks": {
    if (!positional[0]) fail("give the exact page title");
    const cql = `type = page AND text ~ "${positional[0].replace(/"/g, '\\"')}"`;
    printList(await search(cql, Math.max(options.limit, 25)));
    break;
  }
  case "versions": {
    if (!positional[0]) fail("give the page id or url");
    const id = pageId(positional[0]);
    if (options.version) {
      process.stdout.write(await versionBody(id, options.version));
      break;
    }
    const rows = await versions(id);
    if (options.json) process.stdout.write(`${JSON.stringify(rows, null, 2)}\n`);
    else
      for (const row of rows)
        process.stdout.write(`v${row.number}\t${row.date}\t${row.message}\n`);
    break;
  }
  default:
    fail("commands: page, pages, search, children, backlinks, versions — see the header of this file");
}
