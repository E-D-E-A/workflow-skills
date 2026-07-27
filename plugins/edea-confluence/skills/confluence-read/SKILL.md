---
name: confluence-read
description: Answer a question from E.D.E.A's Confluence Brain — searching our structure, following supersede chains so a retired page is never quoted as current, citing every claim to the page it came from, and saying plainly when nothing covers the question. Use when the user asks what we decided, what we know, why we did something, whether something is documented, or asks you to find, look up, or check a page.
---

# Answer from the Brain

**Read `BRAIN.md` at the root of this plugin first.** It holds the structure, the page types,
and the linking rules this skill searches against.

The job is an **answer**, not a list of search results — but an answer that can be checked,
and that never presents a retired page as current.

## Step 1 — Work out what's being asked

Different questions want different types, which narrows the search a long way:

| The question | Look in |
| --- | --- |
| "What did we decide about…" / "Why do we…" | `Decisions` |
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

## Step 3 — Check each page before you believe it

**This is the step that makes the Brain safe to use.** A superseded page reads exactly like a
current one.

For every page you're about to draw on:

1. **Is it superseded?** Look for a supersede marker or a `Supersedes:` line pointing at it.
   If it's been replaced, follow the chain to the current page and use that. Mention the old
   one only as history.
2. **Is it stale?** Specs and Runbooks carry `Review by`. If that date has passed, you can
   still use the page — but say the review date has passed.
3. **Is it a snapshot?** Research is true as of its date. Quote it with that date attached.
4. **Does it actually answer the question**, or is it merely nearby? Adjacent is not an answer.

## Step 4 — Answer

Write the answer in prose, and **cite every claim to the page it came from.** A claim without
a page behind it is you reasoning, not the Brain telling you — and the user can't tell the
difference unless you mark it.

```
We charge per seat, decided March 2026.
  → Charge per seat, not per invoice (Decision)
  → supersedes Flat pricing — Jan 2026

⚠ Deploy runbook — review date passed 2026-04-01, may be out of date.
```

Include the page links so they can go and read it.

**Connect across pages** — that's the whole point of a Brain rather than a search box. If a
Decision cites Research, say what the Decision was and what evidence sat behind it.

## Step 5 — Say when the Brain doesn't know

**The most valuable thing this skill does.** If nothing covers the question, say so plainly:

> Nothing in the Brain covers the refund policy. The closest is *Charge per seat, not per
> invoice*, which sets pricing but says nothing about refunds.

Then offer the useful next move: write it up with `confluence-write` once they've decided, or
grill the question out with `grilling` if it isn't decided yet.

Do **not** stitch an answer together from adjacent pages and present it as what we know. A
confident wrong answer is worse than no Brain at all, because the user would have checked
otherwise.

Same when the pages disagree: say they disagree, cite both, and don't pick a winner silently.
Two pages contradicting each other is a real finding — flag it so someone fixes it.
