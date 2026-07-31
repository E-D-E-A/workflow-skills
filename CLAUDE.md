# workflow-skills

E.D.E.A's shared skills, published as a Claude Code plugin marketplace. This repo holds the
house conventions for the tools we run on, so everyone works the same way without having to
remember the rules.

The marketplace is named `edea`. There is **one plugin per tool** — `edea-linear`,
`edea-confluence`, `edea-presentations` and `edea-fireflies` today, others later. Nothing
else is published.
A tool doesn't have to mean an MCP connector: `edea-presentations` wraps NotebookLM, which
has no MCP server, so its skills drive a CLI instead and the plugin ships no `.mcp.json`.

The skills for *building* those plugins — grilling out what a new one is for, then writing it
— live in `.claude/skills/` and are never published. They only make sense in this repo.

## Layout

```
.claude/
  skills/<skill-name>/          # skills about THIS repo — never published
.claude-plugin/
  marketplace.json              # the catalog — must be at exactly this path
plugins/
  edea-<tool>/
    .claude-plugin/
      plugin.json               # name, description, version, author
    .mcp.json                   # the tool's MCP connector (no secrets)
    skills/
      <skill-name>/
        SKILL.md
docs/
  <plugin>-guide.html           # team-facing handbook — one per plugin
ATTRIBUTION.md                  # what we adapted from other people's public skills
```

## Why one plugin per tool

Each tool's MCP connector ships inside its own plugin. That way installing
`edea-confluence` doesn't force a Confluence connector onto someone who only needs Linear.
Don't merge tools into one large plugin.

Every plugin here wraps a tool. If a skill isn't about a tool the whole team uses, it doesn't
belong in a plugin at all — see "Plugin skill, or repo skill?" below.

## Adding a new plugin

**Grill it first.** Run the `grilling` skill before creating anything. A plugin installs for
the person, not the project, so it loads in every repo they open — a fuzzy purpose costs four
people's tooling rather than one file. The steps below assume you already know what it's for.

Worked example for Confluence:

1. **Create the directories**

   ```
   plugins/edea-confluence/.claude-plugin/
   plugins/edea-confluence/skills/confluence-write/
   ```

2. **Write `plugins/edea-confluence/.claude-plugin/plugin.json`**

   ```json
   {
     "name": "edea-confluence",
     "description": "Shared E.D.E.A workflows for Confluence: writing and organising docs in house format.",
     "version": "0.1.0",
     "author": { "name": "E.D.E.A" }
   }
   ```

   This file is **required**. Marketplaces run in strict mode by default, and a plugin
   without it fails validation — which surfaces in the web app as the unhelpful
   "Marketplace sync failed. Check the repository URL and try again."

3. **Write `.mcp.json`** if the tool has an MCP server. No credentials — each person
   authenticates on first use:

   ```json
   { "mcpServers": { "confluence": { "type": "http", "url": "https://..." } } }
   ```

4. **Add at least one real `SKILL.md`.** Git doesn't track empty directories, so a
   `skills/` folder with nothing in it silently disappears on push and the plugin ships
   with no skills.

5. **Register it in `.claude-plugin/marketplace.json`**

   ```json
   {
     "name": "edea-confluence",
     "source": "./plugins/edea-confluence",
     "description": "…",
     "category": "productivity"
   }
   ```

6. **Write the docs page** — `docs/confluence-guide.html`. See "Docs for every plugin" below.

7. **Validate, then push** — see below.

## Version discipline

Set `version` in **`plugin.json` only**. Never also in the marketplace entry: if it appears
in both, the plugin manifest wins silently and the marketplace value is ignored.

**Every content change must bump that number**, including edits to a `SKILL.md`. If you
don't, nobody picks up the change.

Use plain semver: patch for wording, minor for behaviour, major for a rewrite.

## Before every push

```bash
claude plugin validate .
```

It checks `marketplace.json`, every `plugin.json`, and skill frontmatter, and gives far
better errors than a sync failure does. It should pass with no warnings.

## Docs for every plugin

Every plugin gets a team-facing handbook page in `docs/`, named for the plugin with the
`edea-` prefix dropped — `linear-guide.html`, `confluence-guide.html`.
`docs/linear-guide.html` is the reference — **copy it as the starting point** for a new one
and swap the content, so the pages read as one family rather than several unrelated designs.

The skills tell Claude how to work. The docs page tells **people** how to work, including
the two who aren't developers. Both have to exist, and they have to agree.

What a page covers:

- The tool's structure and the concepts specific to how we use it
- Our conventions, laid out so they can be scanned — the statuses, labels, or equivalents
- How to do the most common task, step by step
- How it connects to our other tools
- The skills that automate it, and the install commands
- Anything set up but not yet finished, in a clearly marked notice

How to build it:

- **One self-contained HTML file.** All CSS inline, no external fonts, scripts, or images.
  It has to work opened from disk, emailed, or pasted into Confluence.
- **Dark only.** A deliberate single palette — don't follow the OS theme, or it renders
  white for whoever is in light mode.
- **Short.** Fragments and tables beat paragraphs. This is a page people scan to answer one
  question, not read start to finish. Cut words wherever the meaning survives.
- **Plain language**, same as the skills.

If a page and a skill ever disagree, the skill is what's actually running — fix the page.

## Writing skills

Frontmatter needs `name` and `description`:

```markdown
---
name: confluence-write
description: What it does, plus when to use it — this is what the model matches on, so
  name the trigger words someone would actually say.
---
```

The `description` is how the skill gets picked, so make it concrete about both the job and
the trigger. Vague descriptions mean the skill never fires.

House conventions for the body:

- **Plain language.** No jargon. Spell out anything that could be read two ways. Some
  readers are not developers.
- **Look up real values, don't hardcode them.** Tell the skill to list the workspace's
  actual teams, statuses, and labels before writing, and to pick the closest match if a
  name has drifted.
- **Gate on missing information.** If the skill can't do its job with what it's been
  given, it should ask specific follow-up questions and suggest the likely options rather
  than guessing.
- **Guard destructive actions.** Deleting anything gets an explicit confirmation, and a
  reversible alternative offered first.

Skill folder names are kebab-case and match the `name` in the frontmatter. Any commands a
plugin ships are namespaced on install, appearing as `/edea-<tool>:<name>`.

### The two skills that build the others

Both live in `.claude/skills/`, and both run in this order when a new plugin or skill is needed:

1. **`grilling`** — interviews you, one question at a time, about what the thing is actually
   for: the job, the words that should trigger it, who relies on it, what it replaces, how it
   fails. A skill built on a fuzzy purpose fires on the wrong things and teaches four people
   the wrong process.
2. **`skill-writing`** — turns that understanding into a skill that follows the rules above.

If you change the conventions in this file, change `skill-writing` too, or it keeps teaching
the old ones.

### Plugin skill, or repo skill?

**Plugins install for the user, not the project**, so a plugin's skills load in every repo that
person opens. That's right for a shared tool — Linear and Confluence are the same everywhere.

It's wrong for skills about **this repo**. `skill-writing` tells you to pick a plugin, bump
`plugin.json`, update a docs page and mind the public-repo rule — all meaningless in a product
repo, and stated confidently enough to be believed. `grilling` is the same: it grills the
purpose of a *plugin*, which is a question that only arises here.

So both live in `.claude/skills/` — committed with the repo, loaded nowhere else. No install
step, no version, no way to leak.

The test: **would this skill's instructions be wrong in someone's product repo?** If yes, it's
a repo skill.

### Adapting someone else's skill

Fine to do, and often better than starting blank. Check the source repo's licence first,
rewrite it in our voice against our conventions rather than pasting it in, and record what
came from where in `ATTRIBUTION.md` — including the licence text and what you deliberately
didn't take.

## What may go in this repo

**This repo is public.** Skills describe **how** we work, never **what** we're building.

Fine to publish: issue-writing standards, framing rules, workflow conventions, tool usage,
status and label definitions.

Never publish: target markets or verticals, customer names, pricing, kill criteria, idea
scoring, or anything about a specific venture. If a skill genuinely needs that context,
that's the signal to start a **second, private marketplace** — one public repo for craft,
one private for strategy. Don't smuggle it in here.

**Examples count.** A real venture name in a worked example publishes that venture as surely
as a sentence about it would, and nobody thinks to check an example. Invent the specifics and
make them obviously invented — `<Venture>` in a path, a plainly fictional name where the shape
needs a real-looking word, made-up figures and titles in sample pages. This covers every file
that ships: `SKILL.md`, reference files like `BRAIN.md`, the `description` fields in
`plugin.json` and `marketplace.json`, the `docs/` pages, and commit messages.

Before pushing, read the diff once looking only for real names. It's a separate pass from
reading it for correctness, and it's the one that catches this.

A public repo's git history is effectively permanent. Flipping to private later does not
unpublish what forks and caches already hold.

## Scope

Only genuinely shared tooling belongs here — Linear, Confluence, and similar. Personal
workflow skills stay local on each machine. Don't migrate personal skills in without an
explicit decision.

## Who maintains it

The two developers author and update skills. Everyone else is a consumer — they report
problems informally and a developer makes the edit. The whole loop is:

**edit the skill → update the docs page if the change is visible to people → bump `version`
in `plugin.json` → push.**

Everyone else has it next session, assuming auto-update is on.

## Installing

Once per person:

```
/plugin marketplace add E-D-E-A/workflow-skills
/plugin install edea-linear@edea
/plugin install edea-confluence@edea
/plugin install edea-presentations@edea
/plugin install edea-fireflies@edea
```

Linear, Confluence and Fireflies each prompt for a sign-in the first time they're used. Presentations
needs a one-time CLI install and Google sign-in per machine instead — the steps live in the
plugin's `NOTEBOOKLM.md` and in `docs/presentations-guide.html`. No credentials live in
this repo.

Then `/plugin` → Marketplaces → enable auto-update. Without that, people silently drift
onto different skill versions.

Note: the Claude Code CLI resolves marketplaces through local git credentials, but the web
and desktop apps go through the GitHub app. If a teammate can't add the marketplace there,
check that the Claude GitHub app is installed on the `E-D-E-A` org with access to this
repo.
