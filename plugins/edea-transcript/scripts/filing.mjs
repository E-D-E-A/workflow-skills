#!/usr/bin/env node
// File an EDEA Transcript meeting into the Confluence Brain through the REST API.
//
// Why this exists: until the EDEA Transcript connector exists, a meeting is read from the
// app's storage with wrangler, and its pages are published from here. A full transcript page
// is 95–255 KB, too big to pass through the Confluence connector. These four commands replace
// the one-off scripts every filing used to rebuild.
//
// Setup, once per person, in the shell profile — the same three variables as
// edea-confluence's scripts/brain.mjs:
//   export ATLASSIAN_SITE="first-edea-team.atlassian.net"
//   export ATLASSIAN_EMAIL="you@first-edea.com"
//   export ATLASSIAN_API_TOKEN="…"   # id.atlassian.com → Security → API tokens
//
// Usage:
//   filing.mjs build-notes <notes.txt> <out.html> [--space-key KEY]
//   filing.mjs build-transcript <transcript.json> <names.json> <out.html>
//              --notes-title "<notes page title>" --notes-url <notes page url>
//              [--cuts <cuts.json>] [--note "<one more sentence for the opening quote>"]
//   filing.mjs create-page --space <key|id> --parent <page id> --title "<title>" --body <file>
//              [--dry-run]
//   filing.mjs patch-page <id|url> <edits.json> --out <file>
//   filing.mjs patch-page <id|url> <edits.json> --apply --version N [--message "<text>"]
//
// build-notes and build-transcript only write local files. create-page and patch-page write
// to Confluence: run them only after the person said yes to exactly what they write.
// Both build commands lay the page out right to left, for Hebrew, by confluence-write's recipe.
//
// build-notes reads a small line markup, one element per line (blank lines are skipped):
//   TITLE: <page title>             not part of the body; printed, for create-page
//   > <text>                        the opening quote
//   TOPICS: <a>, <b>                the Topics: line, English and left-aligned
//   ## <heading>   ### <heading>
//   * <text>                        a bullet, typed as &bull; so it sits on the right
//   | <value> | <label> |           a table row, label last so it renders rightmost;
//                                   consecutive rows make one table
//   - [ ] <text>                    an open task; consecutive tasks make one task list
//   ## Related                      the Related heading, English and left-aligned
//   @ <exact page title> | <note>   a Related link to a page in the same space as the notes,
//                                   or in --space-key's space
//   anything else                   a paragraph; number a list by hand: "1. …"
// [label](https://…) inside any text becomes a link.
//
// build-transcript reads:
//   transcript.json  {"lines": [{"start": 12.4, "voice": "mic:speaker_0", "text": "…"}, …]}
//                    — the app's own file; other fields are ignored
//   names.json       {"mic:speaker_0": "<name>", …} — every voice on a kept line needs a name;
//                    a voice nobody knows is named "Unnamed voice 1", "Unnamed voice 2", …
//   cuts.json        {"cuts": [[first, last], …], "trims": [[line, "exact words"], …]}
//                    line numbers count transcript.json's lines from 1. A cut replaces the
//                    lines first..last with one marker line; a trim replaces those words
//                    inside one line. A trim whose words are not on its line stops the build.
// It prints the page's shape — lines, speakers, time span, size and the first ten lines.
//
// patch-page reads edits.json, [["<old storage text>", "<new storage text>"], …], applied in
// order to the page's storage body; each old text must match exactly once. Without --apply it
// writes the new body to --out and prints the page's version. --apply with that version reads
// the page again, refuses if it changed since, and saves the edits as the next version.
//
// ATLASSIAN_SITE may also be a full origin such as http://127.0.0.1:8787, to test against a
// local stand-in.

import { randomUUID } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

function fail(message) {
  process.stderr.write(`filing: ${message}\n`);
  process.exit(1);
}

// ---------- arguments ----------

const argv = process.argv.slice(2);
const command = argv.shift();
const options = {};
const positional = [];
const valued = [
  "space-key",
  "notes-title",
  "notes-url",
  "cuts",
  "note",
  "space",
  "parent",
  "title",
  "body",
  "out",
  "version",
  "message",
];
for (let i = 0; i < argv.length; i++) {
  const arg = argv[i];
  const name = arg.startsWith("--") ? arg.slice(2) : null;
  if (name && valued.includes(name)) {
    if (i + 1 >= argv.length) fail(`${arg} needs a value`);
    options[name] = argv[++i];
  } else if (name === "dry-run" || name === "apply") options[name] = true;
  else if (name) fail(`unknown option ${arg}`);
  else positional.push(arg);
}

async function readJson(file) {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch (error) {
    fail(`cannot read ${file}: ${error.message}`);
  }
}

// ---------- right-to-left storage format ----------

const RLI = "⁧";
const PDI = "⁩";
const RIGHT = ' style="text-align: right;"';
const LINK = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g;

const escape = (text) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const escapeAttr = (text) => escape(text).replace(/"/g, "&quot;");

// Escape the text, then turn [label](url) into links.
function inline(text) {
  let out = "";
  let at = 0;
  for (const match of text.matchAll(LINK)) {
    out += escape(text.slice(at, match.index));
    out += `<a href="${escapeAttr(match[2])}">${escape(match[1])}</a>`;
    at = match.index + match[0].length;
  }
  return out + escape(text.slice(at));
}

// One right-aligned paragraph; its content is already storage format.
const paragraph = (content) => `<p${RIGHT}>${RLI}${content}${PDI}</p>`;

// ---------- build-notes ----------

function buildNotes(source, spaceKey) {
  let title = null;
  const parts = [];
  let table = [];
  let tasks = [];
  let related = [];
  let taskId = 0;

  function flush() {
    if (table.length) {
      const rows = table
        .map(
          (row) => `<tr>${row.map((cell) => `<td>${paragraph(inline(cell))}</td>`).join("")}</tr>`,
        )
        .join("");
      parts.push(`<table data-layout="default"><tbody>${rows}</tbody></table>`);
      table = [];
    }
    if (tasks.length) {
      const items = tasks
        .map(
          (task) =>
            `<ac:task><ac:task-id>${++taskId}</ac:task-id><ac:task-uuid>${randomUUID()}</ac:task-uuid>` +
            "<ac:task-status>incomplete</ac:task-status>" +
            `<ac:task-body><span class="placeholder-inline-tasks">${RLI}${inline(task)}${PDI}</span></ac:task-body></ac:task>`,
        )
        .join("");
      parts.push(`<ac:task-list>${items}</ac:task-list>`);
      tasks = [];
    }
    if (related.length) {
      const space = spaceKey ? ` ri:space-key="${escapeAttr(spaceKey)}"` : "";
      const items = related
        .map(
          ([pageTitle, note]) =>
            `<li><p><ac:link><ri:page${space} ri:content-title="${escapeAttr(pageTitle)}" />` +
            `<ac:link-body>${escape(pageTitle)}</ac:link-body></ac:link>${note ? ` (${inline(note)})` : ""}</p></li>`,
        )
        .join("");
      parts.push(`<ul>${items}</ul>`);
      related = [];
    }
  }

  for (const raw of source.split(/\r?\n/)) {
    const line = raw.trimEnd();
    if (!line.trim()) continue;
    if (line.startsWith("TITLE: ")) {
      title = line.slice(7).trim();
      continue;
    }
    if (line.startsWith("| ")) {
      table.push(
        line
          .trim()
          .replace(/^\||\|$/g, "")
          .split(" | ")
          .map((cell) => cell.trim()),
      );
      continue;
    }
    if (line.startsWith("- [ ] ")) {
      tasks.push(line.slice(6));
      continue;
    }
    if (line.startsWith("@ ")) {
      const [pageTitle, ...note] = line.slice(2).split(" | ");
      related.push([pageTitle.trim(), note.join(" | ").trim()]);
      continue;
    }
    flush();
    if (line.startsWith("> "))
      parts.push(`<blockquote>${paragraph(inline(line.slice(2)))}</blockquote>`);
    else if (line.startsWith("TOPICS: "))
      parts.push(`<p>Topics: ${escape(line.slice(8).trim())}</p>`);
    else if (line === "## Related") parts.push("<h2>Related</h2>");
    else if (line.startsWith("### "))
      parts.push(`<h3${RIGHT}>${RLI}${inline(line.slice(4))}${PDI}</h3>`);
    else if (line.startsWith("## "))
      parts.push(`<h2${RIGHT}>${RLI}${inline(line.slice(3))}${PDI}</h2>`);
    else if (line.startsWith("* ")) parts.push(paragraph(`&bull; ${inline(line.slice(2))}`));
    else parts.push(paragraph(inline(line)));
  }
  flush();
  if (!title) fail("the notes source has no TITLE: line");
  return { title, body: parts.join("") };
}

// ---------- build-transcript ----------

const CUT = "הושמט קטע אישי";

const plural = (count, word) => `${count} ${word}${count === 1 ? "" : "s"}`;

function clock(seconds) {
  const s = Math.floor(seconds);
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}`;
}

function checkCuts(spec, count) {
  const isLine = (n) => Number.isInteger(n) && n >= 1 && n <= count;
  const pairs = (key) => {
    const list = spec[key] ?? [];
    if (!Array.isArray(list) || !list.every((item) => Array.isArray(item) && item.length === 2))
      fail(`"${key}" in the cuts file must be a list of pairs, like [[3, 5]] or [[7, "words"]]`);
    return list;
  };
  const cuts = pairs("cuts").map(([first, last]) => {
    if (!isLine(first) || !isLine(last) || first > last)
      fail(`cut [${first}, ${last}] is not a range of lines 1..${count}`);
    return [first, last];
  });
  cuts.sort((a, b) => a[0] - b[0]);
  for (let i = 1; i < cuts.length; i++) {
    if (cuts[i][0] <= cuts[i - 1][1]) fail(`cuts [${cuts[i - 1]}] and [${cuts[i]}] overlap`);
  }
  const cutOf = new Map();
  for (const [first, last] of cuts) for (let n = first; n <= last; n++) cutOf.set(n, [first, last]);
  const trims = new Map();
  for (const [n, words] of pairs("trims")) {
    if (!isLine(n)) fail(`trim on line ${n}: not a line 1..${count}`);
    if (typeof words !== "string" || !words) fail(`trim on line ${n}: give the exact words to cut`);
    if (cutOf.has(n)) fail(`trim on line ${n}: that line is already inside cut [${cutOf.get(n)}]`);
    trims.set(n, [...(trims.get(n) ?? []), words]);
  }
  return { cutOf, trims };
}

function buildTranscript(lines, names, spec, notesTitle, notesUrl, note) {
  const { cutOf, trims } = checkCuts(spec, lines.length);

  const missing = new Map();
  for (let n = 1; n <= lines.length; n++) {
    const voice = lines[n - 1].voice ?? "(no voice)";
    if (!cutOf.has(n) && !names[voice]) missing.set(voice, (missing.get(voice) ?? 0) + 1);
  }
  if (missing.size) {
    const list = [...missing]
      .map(([voice, count]) => `${voice} (${plural(count, "line")})`)
      .join(", ");
    fail(
      `no name for ${list} — add each to the names file; a voice nobody knows is "Unnamed voice 1"`,
    );
  }

  let intro = "התמלול של הפגישה, שורה אחר שורה, עם הדובר והזמן.";
  if (cutOf.size || trims.size) intro += " הקטעים האישיים הושמטו, וכל השמטה מסומנת במקומה.";
  intro += " ההקלטה והתמלול המלא נמצאים ב-EDEA Transcript.";
  if (note) intro += ` ${note}`;
  intro += " הסיכום נמצא בדף ";
  const parts = [
    `<blockquote>${paragraph(`${escape(intro)}<a href="${escapeAttr(notesUrl)}">${escape(notesTitle)}</a>.`)}</blockquote>`,
  ];

  const shown = [];
  const speakers = new Map();
  let cutLines = 0;
  let cutBlocks = 0;
  for (let n = 1; n <= lines.length; ) {
    let text;
    if (cutOf.has(n)) {
      const [first, last] = cutOf.get(n);
      const size = last - first + 1;
      const when =
        size === 1
          ? clock(lines[first - 1].start)
          : `${clock(lines[first - 1].start)}–${clock(lines[last - 1].start)}`;
      text = `[${when}] ${CUT} (${size === 1 ? "שורה אחת" : `${size} שורות`}).`;
      cutLines += size;
      cutBlocks += 1;
      n = last + 1;
    } else {
      const line = lines[n - 1];
      let words = line.text ?? "";
      for (const cut of trims.get(n) ?? []) {
        if (!words.includes(cut))
          fail(`trim on line ${n}: the words are not on that line: ${JSON.stringify(cut)}`);
        words = words.split(cut).join(`[${CUT}]`);
      }
      const name = names[line.voice ?? "(no voice)"];
      speakers.set(name, (speakers.get(name) ?? 0) + 1);
      text = `[${clock(line.start)}] ${name}: ${words}`;
      n += 1;
    }
    shown.push(text);
    parts.push(paragraph(escape(text)));
  }

  const body = parts.join("");
  const last = lines[lines.length - 1];
  const report = [
    `${plural(lines.length - cutLines, "line")} kept, ${plural(cutLines, "line")} cut in ${plural(cutBlocks, "block")}, ${plural(trims.size, "line")} trimmed`,
    `speakers: ${[...speakers].map(([name, count]) => `${name} ${count}`).join(", ")}`,
    `time span: ${clock(lines[0]?.start ?? 0)}–${clock(last?.end ?? last?.start ?? 0)}`,
    `size: ${Math.round(Buffer.byteLength(body) / 1024)} KB`,
    "first ten lines:",
    ...shown.slice(0, 10).map((text) => `  ${text}`),
  ];
  return { body, report: report.join("\n") };
}

// ---------- REST API ----------

function connect() {
  const site = process.env.ATLASSIAN_SITE ?? "first-edea-team.atlassian.net";
  const email = process.env.ATLASSIAN_EMAIL;
  const token = process.env.ATLASSIAN_API_TOKEN;
  if (!email || !token)
    fail("ATLASSIAN_EMAIL and ATLASSIAN_API_TOKEN must be set in the shell profile");
  const base = `${site.includes("://") ? site : `https://${site}`}/wiki`;
  const auth = `Basic ${Buffer.from(`${email}:${token}`).toString("base64")}`;
  return { base, auth };
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function call({ base, auth }, method, path, payload) {
  const url = `${base}${path}`;
  let delay = 5000;
  for (let attempt = 0; attempt < 5; attempt++) {
    const response = await fetch(url, {
      method,
      headers: {
        Authorization: auth,
        Accept: "application/json",
        ...(payload ? { "Content-Type": "application/json" } : {}),
      },
      body: payload ? JSON.stringify(payload) : undefined,
    });
    if (response.ok) return response.json();
    // A 429 was not processed, so even a write is safe to send again. A 5xx write may have
    // landed, so only a read is retried on it.
    if (response.status === 429 || (method === "GET" && response.status >= 500)) {
      const retryAfter = Number(response.headers.get("retry-after"));
      const wait = retryAfter > 0 ? retryAfter * 1000 : delay * (0.7 + Math.random() * 0.6);
      process.stderr.write(
        `filing: ${response.status} on ${method} ${url}, waiting ${Math.round(wait / 1000)}s\n`,
      );
      await sleep(Math.min(wait, 60000));
      delay = Math.min(delay * 2, 30000);
      continue;
    }
    fail(
      `${response.status} ${response.statusText} for ${method} ${url}\n${await response.text()}`,
    );
  }
  fail(`gave up after 5 attempts: ${method} ${url}`);
}

function pageId(input) {
  const match = String(input).match(/pages\/(\d+)/) ?? String(input).match(/^(\d+)$/);
  if (!match) fail(`not a page id or url: ${input}`);
  return match[1];
}

async function spaceOf(api, space) {
  if (/^\d+$/.test(space)) return await call(api, "GET", `/api/v2/spaces/${space}`);
  const found = await call(api, "GET", `/api/v2/spaces?keys=${encodeURIComponent(space)}`);
  if (!found.results?.length) fail(`no space with key ${space}`);
  return found.results[0];
}

async function createPage(api, { space, parent, title, body, dryRun }) {
  const target = await spaceOf(api, space);
  const parentPage = await call(api, "GET", `/api/v2/pages/${pageId(parent)}`);
  if (String(parentPage.spaceId) !== String(target.id))
    fail(`the parent page "${parentPage.title}" is not in space ${target.key}`);
  // By default this lists current and archived pages; both block the title.
  const found = await call(
    api,
    "GET",
    `/api/v2/pages?space-id=${target.id}&title=${encodeURIComponent(title)}`,
  );
  const same = (found.results ?? []).find(
    (page) => page.title.trim().toLowerCase() === title.trim().toLowerCase(),
  );
  if (same)
    fail(
      `space ${target.key} already has a page titled this (${same.status}): ${api.base}${same._links.webui}`,
    );
  const size = `${Math.round(Buffer.byteLength(body) / 1024)} KB`;
  if (dryRun) {
    process.stdout.write(
      `would create "${title}" (${size}) under "${parentPage.title}" in space ${target.key}\n`,
    );
    return;
  }
  const page = await call(api, "POST", "/api/v2/pages", {
    spaceId: target.id,
    status: "current",
    title,
    parentId: parentPage.id,
    body: { representation: "storage", value: body },
  });
  process.stdout.write(`${page.id}\n${api.base}${page._links.webui}\n`);
}

function applyEdits(body, edits) {
  let next = body;
  edits.forEach((edit, index) => {
    if (
      !Array.isArray(edit) ||
      edit.length !== 2 ||
      typeof edit[0] !== "string" ||
      typeof edit[1] !== "string" ||
      !edit[0]
    )
      fail(`edit ${index + 1}: give ["<old text>", "<new text>"]`);
    const [before, after] = edit;
    const count = next.split(before).length - 1;
    if (count !== 1)
      fail(
        `edit ${index + 1} matches ${count} times, not once: ${JSON.stringify(before.slice(0, 120))}`,
      );
    next = next.replace(before, () => after);
  });
  return next;
}

async function patchPage(api, { id, edits, out, apply, version, message }) {
  const page = await call(api, "GET", `/api/v2/pages/${id}?body-format=storage`);
  const current = page.version.number;
  if (apply) {
    if (!version)
      fail("--apply needs --version N, the version the edits were read and approved against");
    if (current !== Number(version))
      fail(
        `"${page.title}" changed since it was read: it is version ${current} now, not ${version}. Read it again.`,
      );
  }
  const body = applyEdits(page.body.storage.value, edits);
  if (!apply) {
    if (!out) fail("give --out <file> for the new body, or --apply --version N to save it");
    await writeFile(out, body);
    process.stdout.write(
      `"${page.title}" version ${current}: ${plural(edits.length, "edit")}, each matched once; new body in ${out}\n`,
    );
    return;
  }
  const saved = await call(api, "PUT", `/api/v2/pages/${id}`, {
    id,
    status: "current",
    title: page.title,
    body: { representation: "storage", value: body },
    version: { number: current + 1, ...(message ? { message } : {}) },
  });
  process.stdout.write(
    `"${saved.title}" saved as version ${saved.version.number}\n${api.base}${saved._links.webui}\n`,
  );
}

// ---------- main ----------

switch (command) {
  case "build-notes": {
    const [source, out] = positional;
    if (!source || !out) fail("give the notes source file and the output file");
    const { title, body } = buildNotes(await readFile(source, "utf8"), options["space-key"]);
    await writeFile(out, body);
    process.stdout.write(`${title}\n${Math.round(Buffer.byteLength(body) / 1024)} KB in ${out}\n`);
    break;
  }
  case "build-transcript": {
    const [transcriptFile, namesFile, out] = positional;
    if (!transcriptFile || !namesFile || !out)
      fail("give transcript.json, the names file and the output file");
    if (!options["notes-title"] || !options["notes-url"])
      fail("give --notes-title and --notes-url");
    const transcript = await readJson(transcriptFile);
    const lines = Array.isArray(transcript) ? transcript : transcript.lines;
    if (!Array.isArray(lines) || lines.length === 0) fail(`${transcriptFile} has no lines`);
    const spec = options.cuts ? await readJson(options.cuts) : {};
    const { body, report } = buildTranscript(
      lines,
      await readJson(namesFile),
      spec,
      options["notes-title"],
      options["notes-url"],
      options.note,
    );
    await writeFile(out, body);
    process.stdout.write(`${report}\nwritten to ${out}\n`);
    break;
  }
  case "create-page": {
    const { space, parent, title, body } = options;
    if (!space || !parent || !title || !body) fail("give --space, --parent, --title and --body");
    await createPage(connect(), {
      space,
      parent,
      title,
      body: await readFile(body, "utf8"),
      dryRun: options["dry-run"],
    });
    break;
  }
  case "patch-page": {
    const [page, editsFile] = positional;
    if (!page || !editsFile) fail("give the page id or url and the edits file");
    if (options["dry-run"])
      fail("patch-page has no --dry-run: leave out --apply to only write --out");
    const edits = await readJson(editsFile);
    if (!Array.isArray(edits) || edits.length === 0) fail(`${editsFile} holds no edits`);
    await patchPage(connect(), {
      id: pageId(page),
      edits,
      out: options.out,
      apply: options.apply,
      version: options.version,
      message: options.message,
    });
    break;
  }
  default:
    fail(
      "commands: build-notes, build-transcript, create-page, patch-page — see the header of this file",
    );
}
