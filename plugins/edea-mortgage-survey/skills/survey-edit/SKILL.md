---
name: survey-edit
description: Build and change a survey questionnaire from chat — pick the survey, load the
  current draft, propose the change, show the diff and wait for a yes, apply it, then simulate
  the respondent paths it affects. Use when someone wants to add, reword, reorder or remove a
  question or screen, change routing, conditions, quotas or draws, start a new questionnaire,
  or asks what a respondent would actually see — including when they say שאלון, מסלול, or ask
  you to walk a persona through it.
---

# Editing a survey questionnaire

The survey tools run against the **draft** of a questionnaire, never a published version.
Everything a respondent reads is Hebrew.

The server that provides these tools ships its own workflow rules — get the draft first,
propose before applying, simulate afterwards — and those rules are the ones actually running.
This skill is what sits around them: choosing the right survey, knowing what the tools cannot
do, and recording the change where the team will find it.

## Start by finding out which survey

Call `list_surveys` and use a slug from the result. Never type a slug from memory or infer one
from the way someone described the questionnaire — the names drift, and a wrong slug edits the
wrong draft silently.

If more than one survey plausibly matches what they asked for, show the candidates with their
Hebrew names and ask which one. If none match, say so rather than picking the closest.

## Ask before you propose, not after

Work out the specifics with the user **before** calling `propose_change`. The things worth
stopping for:

- A threshold or number that was implied rather than stated ("high earners" — above what?)
- The exact Hebrew wording of a new question, option, or screen
- Where a new screen sits in the order, and what routes into and out of it
- Which existing answers the change is supposed to affect

Suggest the likely answer alongside each question so the user can confirm rather than compose
from scratch. Leave nothing as a guess and nothing as a blank.

## Show the change and wait

`propose_change` writes nothing — it returns a diff and the validation result. Show the user
the diff in full, in plain language, and wait for an explicit yes before `apply_change`.

The request approves the goal, not the write. Silence is not a yes: if nobody answers, the
change stays unapplied.

After a successful apply, run `simulate_path` for each persona or route the change touches and
report the screen sequences you got back. A change that validates can still send someone
somewhere nobody intended, and the simulation is the only place that shows up.

## Creating a new questionnaire writes immediately

`create_survey` has no dry run and nothing here can undo it. Take the slug and the Hebrew name
from the user in their own words, read both back, and get a yes before calling it. Then fill in
the questionnaire with the normal propose-and-apply flow.

## What these tools cannot do

Publishing, archiving, renaming and deleting a survey are human actions in the admin console.
There is no tool for them here, so when someone asks for one, say plainly that it is a console
action and point them at it — do not look for a way around it.

After a change is applied, remind the user that it is still only a draft, and that someone has
to review and publish it in the console for a respondent to ever see it.

## When a tool comes back with an error

The server explains each of these in its own response — pass that explanation on rather than
rewriting it. Two are worth handling deliberately:

- **A draft conflict** means someone saved while you were working. Call `get_draft` again,
  rebuild the change on top of what is there now, and propose it again. Never merge blindly.
- **A rate limit** means stop. Tell the user when they can try again; do not retry in a loop.

## Recording it

A questionnaire change that came from a Linear issue belongs back on that issue — add what
changed and which survey, so the next person reads it there rather than in a chat log.

If the change settles something the team will need to look up later — why a route exists, why a
threshold is what it is — that is a Confluence decision page, not a comment.
