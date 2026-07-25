# workflow-skills

E.D.E.A's shared skills, published as a Claude Code plugin marketplace. This repo holds the
house conventions for the tools we run on, so everyone works the same way without having to
remember the rules.

The marketplace is named `edea`. There is **one plugin per tool** — `edea-linear` today,
`edea-confluence` and others later.

## Layout

```
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
  linear-guide.html             # team-facing handbook for our Linear setup
```

## Why one plugin per tool

Each tool's MCP connector ships inside its own plugin. That way installing
`edea-confluence` later doesn't force a Confluence connector onto someone who only needs
Linear. Don't merge tools into one large plugin.

## Adding a new plugin

Worked example for Confluence:

1. **Create the directories**

   ```
   plugins/edea-confluence/.claude-plugin/
   plugins/edea-confluence/skills/confluence-doc/
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

6. **Validate, then push** — see below.

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

## Writing skills

Frontmatter needs `name` and `description`:

```markdown
---
name: confluence-doc
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

**edit the skill → bump `version` in `plugin.json` → push.**

Everyone else has it next session, assuming auto-update is on.

## Installing

Once per person:

```
/plugin marketplace add E-D-E-A/workflow-skills
/plugin install edea-linear@edea
```

Then `/plugin` → Marketplaces → enable auto-update. Without that, people silently drift
onto different skill versions.

Note: the Claude Code CLI resolves marketplaces through local git credentials, but the web
and desktop apps go through the GitHub app. If a teammate can't add the marketplace there,
check that the Claude GitHub app is installed on the `E-D-E-A` org with access to this
repo.
