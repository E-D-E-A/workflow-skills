---
name: grilling
description: Interview the user relentlessly, one question at a time, to work out what a new plugin or skill is actually for before any of it gets written — the job it does, the words that should trigger it, who relies on it, and how it could fail. Use when someone wants a new skill or plugin in this marketplace, says grill me, or has an idea for one that isn't sharp yet.
---

# Grill the purpose before writing anything

A skill built on a fuzzy purpose is worse than no skill: it fires on the wrong things, gives
confident instructions nobody wanted, and quietly teaches everyone the wrong process. That's
expensive to undo once four people have it installed.

So before `skill-writing` runs, work out what the thing is genuinely **for**, by interviewing
the user until you both describe it the same way without checking.

## How to run it

**One question at a time.** Ask, wait for the answer, then ask the next. Several at once is
bewildering and gets you shallow answers to all of them.

**Recommend an answer with every question.** Don't ask open questions and leave the user to
generate the whole answer. Say which way you'd go and why, so they can agree, correct you, or
pick from what you named. "Should this be one skill or two? I'd say one, because create and
update are the same judgement" is a good question. "How should we structure it?" is not.

**Look facts up, ask only for decisions.** If it can be found — in this repo, in Linear, in
Confluence, in an MCP connector's tool list — go and find it. Never ask what tools a connector
exposes, what our statuses are called, or what an existing skill already covers. The user's
time is for the calls only they can make.

**Walk the tree in dependency order.** Resolve what everything else hangs off first. If an
answer makes a later branch irrelevant, drop it rather than asking anyway.

**Keep going past the comfortable part.** The useful questions are the awkward ones — what
this replaces, what happens when it's wrong, who actually maintains it.

## What to grill for

Cover these before handing off. They're roughly in dependency order, but follow the
conversation rather than the list.

**The job.** What does it do, in one sentence someone else would recognise? If it takes a
paragraph, it's probably two skills.

**The trigger.** What would a person actually say when they need it — in their words, not ours?
This becomes the `description`, which is the only thing deciding whether it ever fires. Get
five real phrasings, not a category.

**Who relies on it.** Two of the four aren't developers. A skill written for developers fails
for them silently.

**Where it lives.** A tool's plugin, or `.claude/skills/` for anything about this repo. The
test: would its instructions be wrong in someone's product repo?

**What it replaces.** Is there an existing skill that already covers part of this? Overlapping
skills compete to fire, and the loser's rules never run.

**How it fails.** What does it do when information is missing, when a name has drifted, when
the user asks for something destructive? These become the gates, and they're the difference
between a skill that's safe to install and one that isn't.

**What's out of scope.** Naming this stops the skill sprawling later.

## Don't start writing

Grilling produces understanding, not files. Don't write `SKILL.md`, `plugin.json` or anything
else until the user confirms you've reached a shared understanding — then hand off to
`skill-writing`, which turns it into a skill that follows the house rules.

## Also useful for the tool skills

The same method works when a skill can't do its job with what it's been given.
`linear-issue` and `confluence-write` each have a small gate of their own — stop and ask when a
field is missing. This is the deeper version, for when the whole idea is fuzzy rather than one
blank. Reach for it when the answer to "what does done look like?" is a shrug.

---

Adapted from [`grilling`](https://github.com/mattpocock/skills) by Matt Pocock, MIT licensed.
See `ATTRIBUTION.md`.
