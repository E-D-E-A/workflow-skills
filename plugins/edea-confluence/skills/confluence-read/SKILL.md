---
name: confluence-read
description: Answer a question from E.D.E.A's Confluence Brain — searching our structure, reading a group's rules page first for what we decided, following supersede chains so a retired page is never quoted as current, showing a Decision page's earlier versions when asked what a rule used to say, citing every claim to the page it came from, and saying plainly when nothing covers the question. Use when the user asks what we decided, what we know, why we did something, whether something is documented, or asks you to find, look up, or check a page. Also use unasked, in any session including coding, the moment the work touches something E.D.E.A may already have decided, documented or specced — building a feature a spec might cover, discussing a choice a Decision page may have settled — keeping the pull light so it never crowds the session.
---

# Answer from the Brain

**Read `../../BRAIN.md` first** — it sits at the root of this plugin, two levels up from this
file. It holds the structure, the page types,
and the linking rules this skill searches against.

The job is an **answer**, not a list of search results — but an answer that can be checked,
and that never presents a retired page as current.

## Asked, or speaking up?

This skill runs two ways, and the difference is how much room it may take:

- **The user asked.** Search as widely and read as deeply as the question needs. The steps
  below assume this.
- **You noticed.** Nobody asked, but the work just touched something the Brain may hold — a
  feature that might have a spec, a choice a Decision page may have settled. Then the Brain
  is a guest in someone else's session: run one search, say which page titles matched and
  why they look relevant, and load a page's body only if it clearly matters to what's being
  built — or the user says yes. `BRAIN.md` calls this rule "the Brain speaks up": context
  spent on the Brain is context taken from the work, so in a coding session stay lean and
  hand the session straight back.

Either way, while you're inside a page, glance at its health on the way through — a passed
`Review by` date, a link written as loose words instead of the target's real title. Mention
what you noticed as a proposal; a full sweep is the `confluence-doctor` skill's job.

## Step 1 — Work out what's being asked

Different questions want different types, which narrows the search a long way:

| The question | Look in |
| --- | --- |
| "What did we decide about…" / "Why do we…" | `Decisions` — the group's rules page first: one sentence per current rule, dated, linked. Open the Decision page for the why and what was rejected |
| "What did we use to do…" / "When did that change…" | The Decision page's `Changed` lines at its bottom, then its version history: `scripts/brain.mjs versions <id>` lists the versions, `--version N` shows one |
| "What are we building…" / "What does done look like…" | `Specs` |
| "What do we know about…" / "Did we look into…" | `Research` |
| "How do I…" | `Runbooks` |
| "What happened in…" / "Who said…" | `Meetings` |

If it's about a venture, search that venture's space — or `Ideas/<Venture>/` if it hasn't
graduated. If you can't tell which venture, search everywhere rather than guessing.

## Step 2 — Search properly

Cast wider than the user's exact words. People search for what they want to know; pages are
titled for what they say.

```
type = page AND text ~ "<subject>"
type = page AND title ~ "<subject>"
type = page AND text ~ "Topics:" AND text ~ "<topic>"
```

Try the subject, its obvious synonyms, and the `Topics:` word if one fits. A single query
returning nothing is not an answer — it's an incomplete search.

Keep each search small — `limit` of 10 or so with a title or topic filter — because the
connector's quota is shared and a wide search spends it fast. When the job grows past a few
pages, or a call comes back `429 Too Many Requests`, move to the plugin's REST script,
`scripts/brain.mjs` two levels up from this file: same pages, your own token, parallel reads
allowed. `BRAIN.md` ("Two ways to read") has the commands and the one-time setup. If the
script says the token variables are missing, tell the user the two-minute setup and carry on
with the connector one page at a time.

## Step 3 — Check each page before you believe it

**This is the step that makes the Brain safe to use.** A superseded page reads exactly like a
current one.

For every page you're about to draw on:

1. **Is it superseded or retired?** Look for a notice at the top or a `Supersedes:` line
   pointing at it. If it's been replaced, follow the chain to the current page and use that.
   Mention the old one only as history. A Decision page carries no such notice: it always
   states today's rule, and its `Changed` lines say when that rule moved. If you find a
   Decision page with a banner or struck-out text, it was left behind by the old rule —
   read it as current with care, and mention it as a finding for the doctor.
2. **Is it stale?** Specs and Runbooks carry `Review by`. If that date has passed, you can
   still use the page — but say the review date has passed.
3. **Is it a snapshot?** Research is true as of its date. Quote it with that date attached.
4. **Does it actually answer the question**, or is it merely nearby? Adjacent is not an answer.

## Step 4 — Answer

Write the answer in prose, and **cite every claim to the page it came from.** A claim without
a page behind it is you reasoning, not the Brain telling you — and the user can't tell the
difference unless you mark it.

```
The weekly review runs on Thursday, decided March 2026.
  → Run the weekly review on Thursday, not Monday (Decision)
  → supersedes Monday reviews — Jan 2026

⚠ Deploy runbook — review date passed 2026-04-01, may be out of date.
```

Include the page links so they can go and read it.

**Connect across pages** — that's the whole point of a Brain rather than a search box. If a
Decision cites Research, say what the Decision was and what evidence sat behind it.

**When asked what a rule used to say**, the answer is the page's Rejected section and its
`Changed` lines, and — for the exact old wording — the version from before the dated line,
read with `scripts/brain.mjs versions <id> --version N`. Quote it with its date and say it
is no longer the rule.

## Step 5 — Say when the Brain doesn't know

**The most valuable thing this skill does.** If nothing covers the question, say so plainly:

> Nothing in the Brain covers who runs the weekly review. The closest is *Run the weekly review
> on Thursday, not Monday*, which sets the day but says nothing about who runs it.

Then offer the useful next move: write it up with `confluence-write` once they've decided, or —
if it isn't decided yet — work the question out with them first, one question at a time with
the answer you'd recommend attached.

Do **not** stitch an answer together from adjacent pages and present it as what we know. A
confident wrong answer is worse than no Brain at all, because the user would have checked
otherwise.

Same when the pages disagree: say they disagree, cite both, and don't pick a winner silently.
Two pages contradicting each other is a real finding — flag it so someone fixes it.
