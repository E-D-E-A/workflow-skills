---
name: transcript-file
description: File a meeting recorded with EDEA Transcript into the E.D.E.A Confluence Brain — a nameless notes page in the eight-section Meeting notes template, with the full speaker-and-time transcript on a child page — then check what the meeting changes in the Brain. Use when the user wants to file, summarize, document or write up a recorded meeting, call or conversation into Confluence; says "file my last meeting" or to add a meeting to the Brain; asks for a Confluence page, wiki or דף מידע from a recording or transcript; or pastes a link to a meeting in the EDEA Transcript web app.
---

# File a recorded meeting into the Brain

**Read `../../TRANSCRIPT.md` first** — it sits at the root of this plugin. It says how to find
and read a meeting, how names work, and how to quote the meeting. Everything below assumes it.

**This skill builds on `edea-confluence`.** Its `confluence-write` skill and `BRAIN.md` govern
how any page is written: space discovery, search before creating, the exact-title link rule,
the Hebrew right-to-left recipe, and the Meeting notes template.

## Nothing is written without a yes

Before every write — a page, a name saved with `name_voice`, the filing record — show exactly
what will be written and wait for an explicit yes. The notes page is shown in full. The
transcript page is shown as its shape — title, parent, line count, speakers, time span, every
cut and its first ten lines — with the full body on request, because it is copied, not written. The
request approves the goal, not the writes, and silence is not a yes. If the session runs
unattended, park on the question.

## Step 1 — Find the meeting and read all of it

Resolve which meeting is meant, as `TRANSCRIPT.md` says. Read it with `get_meeting` and
`get_transcript`, all of it.

Done when you can state, without guessing: the date and time, the duration, who took part
(the named voices), and every subject the conversation covered, in order. If part couldn't be
read, you've said which part.

## Step 2 — Settle the names

If `get_meeting` lists an unnamed voice, handle it as `TRANSCRIPT.md` says — the review screen
or a typed name — before drafting. Show a few of that voice's lines to help the person place
it. Done when every voice has a name or the person has said to leave it unnamed.

## Step 3 — Ask before writing

Three questions, every time, none with a default:

1. **Which space?** List the live spaces with `getConfluenceSpaces` and recommend the one the
   meeting belongs to; ask when more than one fits. Both pages go under that space's
   `Meetings` tree.
2. **Hebrew or English?** The language the meeting was held in decides nothing. The answer
   covers the notes page. The transcript page keeps the words as spoken.
3. **Task owners?** Offer exactly two answers: leave the action items unowned, or the user
   names who owns what right now.

## Step 4 — Write the notes page, nameless

Build it on the Meeting notes template in `BRAIN.md`: all eight sections, in order, an empty
section saying that it's empty. Title: `YYYY-MM-DD — <what the meeting was about>`.

- **The body names nobody.** Phrase everything as the room: "the team agreed", "one view
  was… the counter was…", "it was proposed that…".
- **Meeting details**: participants are the named voices, listed once here. The recording row
  links the meeting in the web app, which is how the audio is found again.
- **Decisions** holds only what the room settled. Something discussed but left open goes under
  **Open questions**. When it's unclear which it was, ask.
- **Completeness**: every subject, decision, number and open question in the transcript is in
  the page. Summarize the wording, never the coverage.

## Step 5 — Write the transcript page

A child of the notes page, titled `<notes page title> — Transcript`. One opening line saying
what it is and linking back to the notes page, then every line in order:

```
[00:03:12] <Speaker>: <the words as spoken>
```

Nothing is merged or reworded, and nothing is cut on your own judgment. The one exception is a
personal part the person filing asks to leave out — whole lines, or a few words inside one
line. A marker with its time takes its place and says a personal part was left out, so the gap
stays visible. A Hebrew transcript uses the Hebrew recipe from
`confluence-write`, line by line. If Confluence rejects the page as too large, split it into
consecutive parts by time — `… — Transcript (1 of 3)`, each a child of the notes page — and say
so.

## Step 6 — The names pass

Reread the notes draft once, looking only for names — a person's name that slipped into the
body from the transcript. It's a separate pass from reading for correctness. Fix what you find.

## Step 7 — File it

Follow `confluence-write` from its search step. If notes for this meeting already exist, show
them and ask: Meeting notes are never overwritten. If the notes page exists but the transcript
page doesn't — an earlier filing stopped half-way — create only what's missing. Wire
`## Related` to the previous meeting's page and anything the conversation pointed at.

Show the notes draft and the transcript page's shape, wait for the yes, create the notes page, then the transcript page. Then call
`record_filing` with the links of every page created.

Done when the pages exist and the meeting is marked filed. Give the titles and URLs.

## Step 8 — Check what the meeting changes in the Brain

Hand off to `transcript-brain-check` for this meeting, with the transcript you've already read.
It finds what the meeting decided or discussed that disagrees with, updates or adds to what
the Brain says, and proposes each edit before → after. Tell the user it's starting; they can
skip it.

Then offer, without doing them unasked: action items → Linear issues (`linear-issue`, if
installed).
