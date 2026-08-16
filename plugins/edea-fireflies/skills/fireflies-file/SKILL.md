---
name: fireflies-file
description: Turn a Fireflies meeting recording into a meeting-notes page in the E.D.E.A
  Confluence Brain — the full summary in the fixed eight-section template, no names in the
  body, filed under the right space's Meetings tree. Use when the user wants to summarize,
  file, document or write up a recorded meeting, call or conversation into Confluence; asks
  to create a Confluence page, wiki or דף מידע from a Fireflies conversation or transcript;
  says to add the meeting to the Brain; or pastes a Fireflies link and wants meeting notes
  out of it.
---

# File a recorded meeting into the Brain

**Read `../../FIREFLIES.md` first** — it holds how to find and read a meeting, and why
speaker labels can't be trusted. Everything below assumes it.

**This skill builds on `edea-confluence`.** Its `confluence-write` skill and `BRAIN.md` govern
how any page is written — space discovery, search-before-creating, the exact-title link rules,
the Hebrew right-to-left recipe, and the canonical Meeting notes template. If `edea-confluence`
isn't installed, stop and ask the user to install it (`/plugin install edea-confluence@edea`).

## Step 1 — Find the meeting and read all of it

Resolve which meeting is meant (`FIREFLIES.md` says how; ask when it's ambiguous). Then read
**both** the automatic summary and the full transcript, honouring the read-everything rule.

You're done with this step when you can state, without guessing: the date and time, the
duration, the participants from the metadata, and every major subject the conversation
covered. If the transcript had an unreadable part, you've said so.

## Step 2 — Ask before writing

Three questions, every time, none with a default:

1. **Which space?** List the live spaces with `getConfluenceSpaces` and recommend the one the
   meeting belongs to; ask when more than one fits. The page goes under that space's
   `Meetings` tree.
2. **Hebrew or English?** The language the meeting was held in decides nothing.
3. **Task owners?** Offer exactly two answers: leave the action items unowned, or the user
   names who owns what right now. An owner comes from a person — the transcript's speaker
   labels are not a source for this.

## Step 3 — Write the summary, nameless

Build the page on the Meeting notes template in `BRAIN.md` — all eight sections, in order,
an empty section saying explicitly that it's empty. Titles follow the house pattern:
`YYYY-MM-DD — <what the meeting was about>`.

The nameless rules, on top of the template:

- **The body carries no people's names.** Phrase everything as the room: "the team agreed",
  "one view was… the counter was…", "it was proposed that…". This is a hard rule because the
  alternative is publishing misattributions as a permanent record.
- **Participants appear once**, in the Meeting details table, from the meeting metadata only.
  If the metadata has no attendee list, leave the row out.
- **Action items are unowned** unless the user assigned owners in Step 2.
- The Meeting details table links the Fireflies recording — that's where attribution lives
  for anyone who needs it.

Completeness is the other half of the job: every subject, decision, number and open question
from the transcript is in the page. Summarize the wording, never the coverage.

## Step 4 — The names pass

Before publishing, reread the draft once looking **only** for names — a person's name that
slipped in from a speaker label or the automatic summary. It's a separate pass from reading
for correctness, and it's the one that catches leaks. Fix what you find.

## Step 5 — File it

Follow `confluence-write` from its search step: if a page for this same meeting already
exists, show it and ask — Meeting notes are records, so the answer is never to overwrite.
Hebrew pages get the right-to-left recipe. Wire `## Related` to the previous meeting's page
and anything the conversation pointed at.

While wiring, check what the meeting's decisions land on: search the Brain for the subject
of each numbered decision. If a current Decision page settles the same question the other
way, the meeting has likely replaced it — say so plainly ("decision 2 changes what the page
titled <title> decided about <subject>"), and fold the supersede path into the offers in
Step 6. Keep the check light — titles first, open a page only when it clearly matters.

Paste the summary, never the raw transcript — the recording link already covers it.

## Step 6 — Say what you did, offer what you didn't

Give the title, the URL, and where it sits. Then offer, without doing them unasked:

- Decisions in the page → their own Decision pages (`confluence-write`).
- A decision that replaced an existing Decision page (found in Step 5) → retire the old page
  properly, with the supersede notice and link repairs (`confluence-retire`).
- Action items → Linear issues (`linear-issue`, if installed).
