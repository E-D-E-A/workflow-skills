---
name: confluence-retire
description: Retire a Confluence page that is no longer the answer — marking it superseded, linking what replaced it, and finding and repairing every page that pointed at it so the Brain has no dangling references. Also handles moving a venture's pages into its own space when it graduates. Use when the user says a page is out of date, wrong, replaced, superseded, or should be removed, or when a venture graduates into its own space.
---

# Retire a page, and repair what pointed at it

**Read `../../BRAIN.md` first** — it sits at the root of this plugin, two levels up from this
file.

Retiring is not deleting. The connector cannot delete anything, and that matches the design:
the paths we rejected are part of what the Brain knows. What retiring means is **this page is
no longer the answer, and everything pointing at it now knows that.**

## Nothing is written without a yes

Nothing changes in Confluence or Linear without the user seeing it first and agreeing to it.
That covers **every** write in the steps below — the supersede notice (Step 4), each repaired
pointer (Step 5), the Linear attachment fix (Step 6), and every move and rename in a
graduation. Show what will change — which page, and before → after — and wait for an explicit
yes. For the bulk passes, one approval of the full list is enough; don't re-ask per page.

The request approves the goal, not the writes, and silence is not a yes — if the session is
running unattended, park on the question and wait.

## Step 1 — Is retiring the right move?

Load the page with `getConfluencePage` and check what it actually is:

| Situation | What to do |
| --- | --- |
| A newer page replaces it | **Supersede** — the main path below |
| It's simply wrong and you know the fix | Not this skill — use `confluence-write` and correct it |
| It's stale and nobody knows the answer | Not this skill — mark it stale on the page and ask |
| It's junk: a test page, an accident, an empty draft | The connector can't delete. Ask the user to remove it in Confluence |

If the user asked to "delete" something real, say plainly that deleting isn't how this works,
and offer superseding instead. Don't just do something adjacent to what they asked without
saying so.

## Step 2 — What replaces it?

A supersede needs a replacement. If the user hasn't named one, ask — and offer to write it with
`confluence-write` first if it doesn't exist yet.

A page can be retired with **no** replacement (an idea that died, a runbook for a process you
no longer run). That's fine, but say so explicitly on the page — a reader needs to know whether
to go somewhere else or that there's nowhere to go.

## Step 3 — Find everything that points at it

**There is no backlink API.** The only way to find inbound references is to search for the
page's exact title, which is why the linking rule exists:

```
searchConfluenceUsingCql: type = page AND text ~ "<the exact page title>"
```

Search the house space and every venture space — references cross spaces.

**Report the count before changing anything**, and be honest about the limit: this finds links
written with the page's real title. Anything linked as "see the review decision" is invisible
here, and there is no way to find it. Say that rather than implying the sweep was complete.

## Step 4 — Mark the page itself

Update the retired page with a notice at the very top, above everything:

```
> **Superseded** by [New page title](https://…/pages/123/…) on <date>. Kept for the record —
> don't act on this.
```

With no replacement:

```
> **Retired** on <date> — <one line on why>. Kept for the record.
```

**Don't edit the body.** The content is the record of what we thought at the time; changing it
destroys the thing worth keeping. Only the notice goes on.

## Step 5 — Repair the pointers

For each page found in Step 3, update its `## Related` (or wherever the reference sits) to point
at the replacement instead, keeping the exact-title-plus-URL rule:

```
- [Monday reviews — Jan 2026](https://…/pages/789/…) (Decision)                          ← before
- [Run the weekly review on Thursday, not Monday](https://…/pages/123/…) (Decision)      ← after
```

If the old reference is bare text with no URL, write the replacement as a real link — that's
the form the next repair pass can find.

Where the old reference is historically meaningful — a Decision citing the Research that
informed it — **keep it and add the replacement** rather than swapping. Losing why a decision
was made is worse than an extra line.

**Repairing the link is half the repair.** A page that pointed here may also *rely* on what
the retired page said. Use the flow table in `BRAIN.md` — the one saying which types depend
on which — to know where damage lands: retiring Research means the Decisions citing it may
no longer be justified; retiring a Decision means the Specs and Runbooks built on it may now
describe the wrong thing. Where a linking page's own content has been made doubtful, don't
rewrite it yourself — flag it in the same report, and where only a person can say whether it
still holds, ask.

**Confirm before you start.** Show the user the list of pages you're about to change and what
each change is. This is a bulk edit across pages other people wrote, and there's no undo beyond
Confluence's per-page version history.

## Step 6 — Check Linear

If the retired page is attached to any Linear issue, update the attachment to the replacement,
or leave it and add the new one. A stale page link on a live issue sends people to the wrong
answer with no warning.

## Graduating a venture

The other job this skill does. Graduation is a human decision, not a status change — Linear
is organised by team, not by venture, so nothing in Linear announces it. It happens when the
user says a venture is now committed and should have its own space while its pages still sit
under `Ideas/<Venture>/`.

1. **Ask the user to create the space.** The connector can't — it needs a name matching the
   venture and a key that's the name uppercased, or a sensible short form of it. Wait for it.
2. **Move the tree.** `updateConfluencePage` with the new `spaceId` and `parentId`, walking the
   tree from `getConfluencePageDescendants` so nothing is orphaned.
3. **Drop the prefix.** `Acme — Decisions` becomes `Decisions` — the space carries the
   venture name now. Titles are unique per space, so check the target space doesn't already
   have that title before renaming.
4. **Re-point the links.** Page URLs change on a move. Find pages referencing the moved ones
   and update them, and fix any Linear issue attachments pointing at the old locations.

Confirm before moving. It's a bulk change across two tools, and tedious to unpick.
