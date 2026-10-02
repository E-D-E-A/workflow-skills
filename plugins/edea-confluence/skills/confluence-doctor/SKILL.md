---
name: confluence-doctor
description: Health-check E.D.E.A's Confluence Brain — sweep it for broken or vague links, stale and orphaned pages, records that drifted, knowledge that stopped at the Linear boundary, and pages that contradict each other, then report findings worst-first with a proposed fix for each and apply the ones the user approves. Use when the user wants to check, audit, tidy or clean up the Brain or the wiki, asks whether anything is stale, out of date or broken, says "run the doctor" or "health check", or asks whether the Brain can still be trusted.
---

# The Brain's health check

**Read `../../BRAIN.md` first** — it sits at the root of this plugin, two levels up from this
file. Everything below leans on it: the page types, the flow table saying which types depend
on which, the exact-title link rule, and the rule that a Decision page is edited in place
while Meeting notes are never rewritten.

The job: find where the Brain has drifted from the truth, say so in plain words, and fix what
the user approves. The Brain degrades quietly — that's the only way it ever degrades — and
this skill is the loud counterpart to the quiet glances the other skills make in passing.

## Keep it light

Thorough and heavy are not the same thing. The check runs as four passes, **cheapest first**,
and the expensive pass is aimed, never sprayed:

- Passes 1 and 2 read search results and page metadata — run them in full.
- Pass 3 crosses into Linear — run it when the Linear tools are connected.
- Pass 4 reads page bodies and judges meaning — run it only where the earlier passes point.

If the Brain has grown past a quick sweep, offer to scope the run — one space, one venture,
or "what changed since the last check" — before starting, with the scope you'd recommend.

## Pass 1 — Structure

The mechanical faults, found with search (`searchConfluenceUsingCql`) and the space trees
(`getConfluencePageDescendants`):

- **Vague links** — a reference written as loose words ("see the review decision") instead of
  the target's exact title with its URL. These are invisible to every repair pass, which is
  why they're worth hunting.
- **Dangling links** — link text whose target title no longer matches any page.
- **Orphan pages** — pages sitting outside every type tree (the five trees `BRAIN.md`
  defines: Decisions, Specs, Research, Runbooks, Meetings).
- **Missing skeleton** — a page with no `Topics:` line or no `## Related` section. Structural
  pages are exempt: the five tree roots, and any sub-folder page directly under one (a subject
  group holding a description and an index of its children — `BRAIN.md` defines them).
- **A sub-folder index that lies** — a sub-folder page whose linked index no longer matches
  its actual children: a page moved in but never listed, or listed but since moved away.
- **A live Decision page carrying a banner or struck-out text** — a supersede or amendment
  notice at its top, or text struck through. Under the rule in `BRAIN.md` ("How a decision
  is kept") a live Decision page always states today's rule, with the old rule under
  Rejected and a dated `Changed` line at the bottom. A banner means a reader has to work
  out which sentences still hold. Fix: change the page in place with `confluence-write`.
- **A dropped idea still mentioned** — a page names an idea that a Decision page lists under
  Rejected, outside that entry: as an example, a side remark, or a "dropped for now" tag.
  An agent reads the mention as direction. Fix: remove it with `confluence-write`. Meeting
  notes and finished Research pages are exempt.
- **A Decision page with no rules line** — every live Decision page has one sentence on its
  group's rules page. Missing means a reader of the group never learns the rule exists.
- **A rules line with no date or no source** — every line on a rules page carries the date
  it was settled and a link to the Decision page, meeting or issue behind it. Check the
  link's target exists.
- **A dropped page still sitting in the live tree** — a page marked superseded or retired
  belongs under its tree's `… — History` sub-folder (`BRAIN.md` defines it). One still
  parked among the current pages, or still listed in a live index as if current, misleads
  every reader of that tree. The reverse is a fault too: a page inside History with no
  supersede or retire notice on it.
- **Twins** — two pages covering one subject, the failure that makes people stop trusting a
  wiki.

## Pass 2 — Freshness

Still cheap — dates and markers, not meaning:

- **`Review by` passed** on a Spec, a Runbook, or a Decisions rules page.
- **A rules page past about forty lines** — the group has outgrown one page. Propose a
  split, with the mapping, and wait.
- **Old snapshots quoted as current** — a Research page past roughly six months whose
  claims other pages still lean on.
- **A supersede chain whose current end is itself doubtful** — replaced but never marked, or
  stale in its own right.
- **A Meeting notes page that changed after filing** — Meeting notes are never edited to
  say something different. If the body changed after the first version, don't declare
  tampering — raise it as a question for the user, since page history alone can't say why.
- **A Decision version with no log line** — reported, never decided. List the page's
  versions (`scripts/brain.mjs versions <id>`), and for each version that changed the body,
  look for a `Changed <that date>: …` line at the bottom of the page. A version without one
  is either a clarification, which needs no line, or a change that forgot its line. The
  doctor cannot tell which; it reports the page, the version number and its date, and asks.

## Pass 3 — Across to Linear

Knowledge often stops at the tool boundary. When the Linear tools are connected, check:

- **Specs whose implementing issues are Done** but whose page never changed after the work
  finished — the built thing and its description may have parted ways.
- **Meeting notes with numbered decisions that never landed** — no rules line and no
  Decision page holds them. For each, propose the landing (a rules line or a page, and the
  group) exactly as `confluence-write` does, and put it in the report as a proposal. **A
  team member approves each one before it is written.** A meeting summary is where a
  decision is most easily invented, so the doctor never files one on its own — and "that
  was not a decision" is a valid answer that closes the finding.
- **Issue attachments pointing at superseded pages** — a live issue steering people to a
  retired answer.

If the Linear tools aren't connected, skip this pass **and say so in the report** — a check
that silently didn't run reads as a check that passed.

## Pass 4 — Contradictions

The expensive pass, and the most valuable: two pages stating things that can't both be true.
Never read the whole Brain for this. Aim it where the earlier passes point — pages the flow
table marks as downstream of something changed or superseded, pages flagged in Passes 1–3,
and pages changed recently. Read those bodies, compare them with the pages they link to, and
flag real disagreements — not wording differences.

## The report

One ranked list, worst first — a contradiction outranks a passed review date, which outranks
a missing `Topics:` line. Plain words throughout, the way `BRAIN.md`'s "Speak plainly" rule
demands: every finding says what's wrong, why it matters, and the proposed fix, and never
points at a page or rule without saying in the same breath what it is.

```
1. Two pages disagree on the refund window — the Spec "Refunds v2" says 30 days, the
   Runbook "Handling a refund" still says 14. Fix: update the Runbook to 30 days.
2. The Spec "Onboarding emails" was implemented in ENG-241, closed in May, but the page
   hasn't changed since April — it may describe the old design. Question: does it still
   match what was built?
```

End the report with what was **not** checked — a skipped pass, a scoped-out space — so the
sweep never reads as more complete than it was.

## Fixing — on a yes, and only a yes

Nothing is written without the user seeing it first and agreeing. Match how much you show to
what the fix is: a fix that changes what a page says gets full before → after, but a run of
same-shaped mechanical fixes — fourteen links re-pointed the same way — is shown as its
shape: one example, the count, and the affected page titles, with the full list ready if the
user asks. A wall of identical diffs is mental overhead that invites a skimmed yes, and a
skimmed yes is not consent. One yes may cover the whole approved list, as a bulk repair does
— don't re-ask per page. Then:

- **Mechanical faults** — repair vague links into real ones, add missing skeleton, fix the
  stale reference. Straightforward edits, done directly.
- **A Decision page whose rule changed, or one left with a banner** — hand off to the
  change-in-place flow in `confluence-write`: new body, old rule under Rejected, dated
  `Changed` line, rules line refreshed. Never a new page, never a move to History.
- **A page dropped outright or replaced whole** — hand off to `confluence-retire`, which
  writes the notice, moves it to History and repairs every page that pointed at it.
- **A meeting decision that never landed** — a proposal in the report, written only after
  a person says yes to that one.
- **Anything only a person can settle** — whether a spec still matches what was built,
  whether old research still holds, which of two twins is the real page — stays a question
  in the report. A question is a finding, not a failure; never close it with a guess.

Findings the user can't settle now shouldn't evaporate with the chat — offer to file them as
Linear issues (the `linear-issue` skill knows the house format), and take silence as no.
