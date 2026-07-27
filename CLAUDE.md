# workflow-skills

E.D.E.A's shared skills, published as a Claude Code plugin marketplace. This repo holds the
house conventions for the tools we run on, so everyone works the same way without having to
remember the rules.

The marketplace is named `edea`. There is **one plugin per tool** — `edea-linear` and
`edea-confluence` today, others later — plus `edea-craft` for the skills that aren't about
any tool.

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
  edea-craft/                   # the one plugin with no tool and no .mcp.json
docs/
  <plugin>-guide.html           # team-facing handbook — one per plugin
ATTRIBUTION.md                  # what we adapted from other people's public skills
```

## Why one plugin per tool

Each tool's MCP connector ships inside its own plugin. That way installing
`edea-confluence` doesn't force a Confluence connector onto someone who only needs Linear.
Don't merge tools into one large plugin.

**`edea-craft` is the exception**, and only because it proves the rule: it holds skills about
how we work rather than what we work in — stress-testing an idea, writing skills — so it ships
no connector and there's nothing to force on anyone. Everything else about it is normal: its
own `plugin.json`, its own version, its own docs page.

Put a skill there only when it's genuinely tool-independent. A skill that spends most of its
words on one tool belongs in that tool's plugin, even if it reads like general advice.

## Adding a new plugin

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
`edea-` prefix dropped — `linear-guide.html`, `confluence-guide.html`, `craft-guide.html`.
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

The `skill-writing` skill in `.claude/skills/` carries these conventions in a form Claude can
apply. If you change the rules here, change it too — otherwise the skill keeps teaching the
old ones.

### Plugin skill, or repo skill?

**Plugins install for the user, not the project**, so a plugin's skills load in every repo
that person opens. That's right for skills about a shared tool — Linear and Confluence are the
same everywhere.

It's wrong for skills about **this repo**. `skill-writing` tells you to pick a plugin, bump
`plugin.json`, update a docs page and mind the public-repo rule — all meaningless in a product
repo, and stated confidently enough to be believed. So it lives in `.claude/skills/`, which is
committed here and loads nowhere else. No install step, no version, no way for it to leak.

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
/plugin install edea-craft@edea
```

`edea-linear` and `edea-confluence` each prompt for a sign-in the first time they're used.
`edea-craft` ships no connector, so it doesn't.

Then `/plugin` → Marketplaces → enable auto-update. Without that, people silently drift
onto different skill versions.

Note: the Claude Code CLI resolves marketplaces through local git credentials, but the web
and desktop apps go through the GitHub app. If a teammate can't add the marketplace there,
check that the Claude GitHub app is installed on the `E-D-E-A` org with access to this
repo.
