---
name: transcript-brain-check
description: Go through a meeting recorded with EDEA Transcript — the full conversation, not only its summary — and find every decision, change or dropped idea that contradicts, updates or adds to what the E.D.E.A Confluence Brain says, then propose each Brain edit before → after and apply only the ones a person approves. Runs after transcript-file files a meeting. Use when the user asks what a meeting changes in the Brain, whether a meeting contradicts what we decided, to update the Brain from a meeting, to sync a filed meeting's decisions into Confluence, or which pages are out of date after a meeting.
---

# Check what a meeting changes in the Brain

**Read `../../TRANSCRIPT.md` first**, and `BRAIN.md` from `edea-confluence` — above all "How a
decision is kept", "How knowledge flows between the types" and the invariants. Every edit this
skill makes goes through `confluence-write` (or `confluence-retire` for a decision dropped
outright), and follows its flows.

## The rules for this skill

- **Nothing is written without a yes.** Every edit is a proposal, shown before → after, and
  waits for an explicit yes. The request approves the goal, not the writes.
- **A person decides what was a decision.** The skill proposes; a team member says yes. "That
  was not a decision" is final.
- **Only settled points get a drafted edit.** A point that was discussed but not settled is
  flagged, never drafted.
- **What may be edited:** Decision pages, Decisions rules pages, Specs and Runbooks. A
  Research page is only flagged, unless the person asks for an edit. Meeting notes are never
  edited — they are records.

## Step 1 — Have the whole meeting in hand

If `transcript-file` handed off, use the transcript it already read. Otherwise find the meeting
and read all of it, as `TRANSCRIPT.md` says. If the meeting is already filed, also read its
notes page, and use its date and its URL as the source of every rules line. If it isn't filed
yet, offer `transcript-file` first: an edit needs the notes page to point at as its source.

Done when the whole transcript has been read, end to end.

## Step 2 — Pull out every point that could land on the Brain

Walk the **transcript**, in order, not the summary. The summary tells you what someone thought
mattered; a changed rule often hides in a side remark, a correction, or the last five minutes.
Collect each point that:

- settles something — "so we'll…", "let's go with…", "agreed", a question asked and answered
  with no objection;
- changes a fact a page may state — a number, a date, a deadline, an owner, a vendor or tool,
  a scope, a process step;
- drops something — an option, a route, a tool, a feature, a plan;
- reverses or questions something said earlier — "we decided X last month, but…";
- adds something new that the team will rely on.

For each point, note the time and the quoted words, and mark it **settled** or **discussed**.
A point is settled only when the room arrived at it; one voice proposing it is discussed.
When a subject comes back later in the meeting, the **last word wins** — read to the end of
the subject before you mark it. Ask the person when you can't tell which it was.

Read the summary last, as a cross-check: anything it states as decided that the transcript
doesn't support is dropped from the list, and told to the person.

Done when you have a numbered list of points, each with time, quote, subject words and its
mark.

## Step 3 — Find what the Brain says on each subject

Search title-first, and open a page only when a title clearly matches.

1. **The Decisions rules pages first.** Each states every current rule in its group in one
   sentence, so one read covers many decisions. List the Decisions trees of the space the
   meeting belongs to, and of the house space.
2. **Then search by subject** for each point, in both Hebrew and English words, because pages
   may be in either:
   `searchConfluenceUsingCql: type = page AND text ~ "<subject words>"`.
3. **Open the matches that clearly matter** — the Decision page behind a rules line, the Spec
   or Runbook that states the same fact.

Context spent on the Brain is context taken from the work, so stay lean. For more than about
five page reads, use `scripts/brain.mjs` from `edea-confluence` when it is set up. If the
connector answers `429 Too Many Requests` and the script isn't available, stop and tell the
person; keep what you found so far.

Done when each point has either the page and the exact sentence it touches, or "nothing in
the Brain".

## Step 4 — Sort each point

| What you found | What to propose |
| --- | --- |
| The Brain already says the same | Nothing. Count it in the report |
| A settled point changes a current rule | Change the Decision page in place, by `confluence-write`'s flow: new rule, old rule under Rejected, a dated `Changed` line, the rules line refreshed |
| A settled point drops an idea inside a live decision | One entry under the owning page's Rejected section, and every other mention removed, as `confluence-write` says |
| A settled point drops a decision with nothing in its place | Retire it with `confluence-retire` |
| A settled point that nothing in the Brain holds | A new rules line, or a Decision page when something was rejected or the why needs more than a sentence. The date is the meeting's date |
| A settled point makes a Spec or Runbook wrong | Edit that page, before → after, and refresh its `Review by` |
| A settled point disagrees with a Research page | Flag only, unless the person asks for an edit |
| A discussed point touches a page | Flag only: the quote, the time, the sentence it touches, and a suggested open question |

Then three checks on every proposal:

- **Is the page newer than the meeting?** If its `Changed` line or last update is later than
  the meeting date, the page may already hold a later decision. Flag it instead of drafting —
  filing an old meeting must never roll the Brain back.
- **Does the edit rest on one machine-heard word** — a figure, a date, a name of a thing? Ask
  the person to confirm it, as `TRANSCRIPT.md` says.
- **Was this the room's call to make?** If outside guests took part, or the subject belongs to
  a venture whose people weren't there, say so beside the proposal.

## Step 5 — Show one report, then wait

One report, the most consequential items first. For each item:

```
3. <subject> — settled
   Meeting:  [00:42:10] "<quoted words>"
   Brain:    [Exact page title](url) — "<the sentence it touches>"
   Proposal: <before → after, in full>
   Ripple:   <the Specs, Runbooks or rules lines the flow table in BRAIN.md points at, each before → after>
```

After the drafted items: the flagged items, each with quote, time, the page it touches and the
open question to ask. Then one line: how many points agreed with the Brain and need nothing.

Ask for a yes on each item. The person may approve some, change some, reject some. Done when
every drafted item has an answer.

## Step 6 — Write what was approved, and report

Write only the approved items, through `confluence-write`'s flows, each item as one batch with
its ripple. Every rules line and `Changed` line points at the meeting's notes page as its
source.

Then say what changed: each page title, its URL and the one-line change. List what was
flagged and not changed, so nothing is lost.
