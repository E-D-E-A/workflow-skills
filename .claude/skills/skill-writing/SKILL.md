---
name: skill-writing
description: Write, edit, split, or review a skill in the E.D.E.A marketplace — picking the plugin it belongs to, writing a description that actually fires, keeping the body short and predictable, and following the repo rules on version bumps, docs pages, and what may not be published. Use when someone wants to add or change a skill, asks why a skill never fires or fires too often, or wants an existing skill tightened up.
---

# Writing a skill for the E.D.E.A marketplace

A skill exists to make Claude take the **same route every time**. Not to produce the same
answer — the answers differ — but to follow the same process, apply the same rules, and ask
the same questions. Everything below serves that.

This skill lives in `.claude/skills/` in the `workflow-skills` repo rather than in a published
plugin, because it's about authoring *this* marketplace. It loads here and nowhere else, and
anyone who clones the repo gets it with no install step.

Read `CLAUDE.md` at the repo root before you start. It's the source of truth for layout and
process; this skill is how to write the words inside.

## Step 1 — Is the purpose settled?

For anything **new** — a skill, or a whole plugin — you should be able to state its job in one
sentence, and name five phrasings someone here would really use to trigger it. If either is a
shrug, stop and run `grilling` — it interviews the user until the purpose is sharp, which is
the whole point of having it. Writing files off a fuzzy purpose is what it exists to prevent.

A plugin raises the stakes, so grill it harder: it installs for the person rather than the
project, and loads in every repo they open.

Editing an existing skill skips this.

## Step 2 — Which plugin does it belong to?

One plugin per tool, because each tool's MCP connector ships inside its own plugin. A skill
about Linear goes in `edea-linear`. A skill about Confluence goes in `edea-confluence`.

If the skill would need a new tool's connector, you're adding a plugin, not a skill. Follow
the "Adding a new plugin" steps in `CLAUDE.md` instead.

**If the skill is about this repo itself**, it belongs in `.claude/skills/` alongside this one
— not in a plugin, and not published. Plugins install for the user and load in every repo, so
a skill that only makes sense here would fire in someone's product repo and give confidently
wrong instructions. The test: would this skill's instructions be wrong there?

Everything published is a tool plugin. There is no plugin for general craft.

## Step 3 — Write the description

The `description` is the only part Claude sees before deciding whether to use the skill, so
it does all the firing. A vague one means the skill never runs and nobody finds out why.

It has two jobs: say what the skill does, and name the moments it should fire.

- **Lead with the job**, in concrete terms. Not "helps with issues" — "Create a Linear issue
  in E.D.E.A house format, routing it to the right team and writing the standard description
  structure".
- **Then name the triggers, in the words someone would actually say.** "Use when the user
  wants to create, file, open, or draft a Linear issue/ticket/task."
- **One trigger per distinct situation.** Listing synonyms for the same situation adds length
  without adding reach. Listing genuinely different situations adds reach.
- **Don't repeat the body.** The description is triggers, not a summary.

If a skill fires too often, the triggers are too broad. If it never fires, they don't match
the words people use. Both are fixed in the description, not the body.

## Step 4 — Write the body

Two kinds of content, and they mix freely:

- **Steps** — do this, then this. Use when order matters.
- **Reference** — rules, definitions, a table of statuses. Use when Claude needs to look
  something up rather than march through it. A flat list of rules is a perfectly good skill.

**End every step on something checkable.** "Ask until you know the Outcome, the team, and
enough for someone else to start" is checkable. "Gather requirements" is not, and Claude will
declare it done early.

**Keep the whole thing on one screen's worth of ideas.** If it's sprawling, either split it
or move the rarely-needed parts into a second file and point at them from `SKILL.md`. Only
what every run needs belongs in `SKILL.md`. `edea-confluence` does this with `BRAIN.md`: three
skills share one reference file instead of repeating it three times.

**Say what to do, not what to avoid.** "Leave the label off if you're unsure" beats "don't
guess at labels" — a prohibition names the bad behaviour and makes it more available, not
less. Keep an outright ban only for things that are genuinely destructive, and even then say
what to do instead.

**Reuse the same word for the same idea.** Every skill in this repo says `Outcome`, `Next
action`, `Waiting`, ENG, BIZ, `Topics`. A word that appears in the skills, in the tools, and
in how people talk becomes a reliable hook — Claude reaches for the same behaviour every time
it sees it. Inventing a fresh synonym in each skill throws that away.

## Step 5 — Apply the house rules

These are the ones that make a skill ours rather than generic. All four come from `CLAUDE.md`.

**Plain language.** No jargon. Spell out anything that could be read two ways. Two of the
people relying on these skills are not developers, and a skill that assumes otherwise fails
for them silently.

**Look up real values, never hardcode them.** Tell the skill to list the workspace's actual
teams, statuses, labels, and spaces before writing, and to pick the closest match if a name
has drifted. A hardcoded status name breaks the day someone renames it, and breaks quietly.

**Gate on missing information.** If the skill can't do its job with what it's been given, it
asks specific follow-up questions and suggests the likely answers — it does not guess and it
does not leave blanks. For a genuinely fuzzy idea rather than one missing field, hand off to
the `grilling` skill.

**Guard anything destructive.** Deleting gets an explicit confirmation, and a reversible
alternative offered first — cancel it, archive it, supersede it, mark it a duplicate.

## Step 6 — Cut it down

Go through line by line and ask of each: does this change what Claude does, compared with
having said nothing? "Be helpful", "think carefully", "use good judgement" — Claude already
does these, so they cost length and buy nothing. Delete the whole sentence rather than
trimming words out of it.

Then check for the same rule stated in two places. Pick the one place it belongs and delete
the other, so changing the rule later is a one-place edit.

Skills rot by accumulation: adding a line feels safe, removing one feels risky, and after a
year the skill is mostly sediment. Prune every time you edit.

## Step 7 — Before you push

Skill folder names are kebab-case and match the `name` in the frontmatter.

Then, in order:

1. **Check the description actually fires.** A skill nobody triggers fails silently — it looks
   installed, and simply never runs. `claude plugin validate` won't catch this; it only checks
   that the files are well-formed.

   Write down five prompts, in the words the people here would really use, covering the
   different situations the skill should cover. Then read the description cold and ask whether
   it would fire on each one. Fix the description, not the body — that's where triggering
   lives.

   If the `skill-creator` skill is available, use its evals instead: it runs prompts at the
   description and measures whether the skill is picked, which beats guessing.

   Do the same in reverse for a skill that fires too often — find the prompts it grabs but
   shouldn't, and narrow the triggers until it lets them go.
2. **Update the plugin's docs page** in `docs/` if the change is visible to people. The skill
   tells Claude how to work; the page tells people how to work. They have to agree — and if
   they ever disagree, the skill is what's actually running, so fix the page.
3. **Bump `version` in that plugin's `plugin.json`.** Every content change, including a
   wording tweak. Patch for wording, minor for behaviour, major for a rewrite. Skip it and
   nobody picks the change up. Never put a version in `marketplace.json` — if it's in both,
   the plugin manifest wins silently. *(Skills in `.claude/skills/` have no version — they
   ship with the repo, so a clone or pull is the whole distribution mechanism.)*
4. **Run `claude plugin validate .`** It should pass with no warnings. Skipping it means the
   next person sees "Marketplace sync failed. Check the repository URL and try again", which
   says nothing about what's actually wrong.

## The rule that can't be undone

**This repo is public, and a public repo's git history is permanent.** Flipping it to private
later does not unpublish what forks and caches already hold.

Fine to publish: how we write issues, framing rules, workflow conventions, tool usage, status
and label definitions.

Never: target markets or verticals, customer names, pricing, kill criteria, idea scoring, or
anything about a specific venture. If a skill genuinely needs that context, stop — that's the
signal to start a second, private marketplace, not to phrase it carefully.

What someone writes inside a Linear issue or a Confluence page is private and fine. This file
is not.

### Make every example up

The rule covers examples, not just statements. A real venture name in a worked example, a real
number in a sample page, a real customer in a "for instance" — each publishes the thing itself,
and reads as more reliable than a claim because nobody thinks to check an example.

So **invent the specifics, and make them obviously invented.** A venture is `<Venture>` in a
path and something plainly fictional where the shape needs a real-looking word. Names, figures,
dates and page titles in a sample are made up. If an example only works with the real value in
it, the surrounding text is the problem — rewrite it so the shape is what's being shown.

This applies to **everything that ships**, which is more files than people remember:

- `SKILL.md` and any reference file beside it, like `BRAIN.md`
- `description` in `plugin.json` and in `marketplace.json`
- the `docs/` page — it's in the same public repo as the skills
- commit messages, which are the part nobody edits and nobody can take back

Before you push, read the diff for real names rather than for correctness. It's a different
pass, and it's the only one that catches this.

---

Adapted from [`writing-great-skills`](https://github.com/mattpocock/skills) by Matt Pocock,
MIT licensed. See `ATTRIBUTION.md`.
