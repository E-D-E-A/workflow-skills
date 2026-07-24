---
name: linear-update
description: Update an existing Linear issue in E.D.E.A house format — transition status (including the Business Waiting/Done/Dropped flow), reassign, add or edit labels, attach a GitHub PR/branch or Confluence doc after the fact, and close, cancel, or (rarely) delete. Use when the user wants to move, transition, close, reassign, relabel, link, or delete a Linear issue/ticket that already exists.
---

# Update a Linear issue (E.D.E.A house format)

Companion to `linear-issue` (creation). Always **load the current issue first** with
`get_issue` so you transition from the real state, then write with `save_issue`. Statuses and
labels are team-scoped — resolve names with `list_issue_statuses` / `list_issue_labels` for
*that issue's team* before setting them.

## Status transitions

**ENG:** `Backlog` → `Todo` → `In Progress` → `In Review` → `Done` / `Canceled`
GitHub automation moves most of this for you: opening a PR that references the issue advances
it, and a closing magic word (`Fixes ENG-123`) marks it `Done` on merge. Prefer letting the
integration drive ENG status over manual moves.

**BIZ:** `Idea` → `Todo` → `In Progress` → `Waiting` → `Done` / `Dropped`
- Move to `In Progress` when someone is actively working it (a call, a deck, a filing).
- Move to `Waiting` the moment the ball is in someone else's court — outreach sent, contract
  out for review, investor deciding. `Waiting` ⇄ `In Progress` loops as often as needed; going
  backward is expected here.
- `Done` = the outcome was reached (decision made, deal signed, artifact produced).
- `Dropped` = decided not to pursue / it died. A lost deal or rejected grant is `Dropped`,
  not `Done`.

When you move an issue to `Waiting`, make sure `## Next action` says what unblocks it and who
resumes — that's the whole point of the status.

## Reassign

Set the assignee to whoever owns the *next* action. On a `Waiting` item, that's the person who
picks it up when the other party responds — keep it assigned, don't clear it.

## Labels

Same one-axis type labels as creation (`product`, `design`, `research`, `fundraising`,
`finance`, `legal`, `ops` on BIZ; existing labels on ENG). Relabel if the nature of the work
changed; don't stack multiple type labels to hedge — pick the primary one.

## Link a PR, branch, or doc to an existing issue

- **GitHub:** the cleanest path is editing the PR — add the issue ID and a magic word to its
  title/description (`Fixes ENG-123` to auto-close on merge; `ref ENG-123` to link only).
  If you only have the URL and are working over MCP, attach it with `create_attachment`.
- **Confluence / Google Docs / Figma:** attach the URL with `create_attachment` (give it a
  clear title), or paste it into the description where it unfurls.
- Linking is never destructive — no confirmation needed.

## Closing

Prefer a **terminal status** over deletion — it preserves history and is reversible:
- Finished successfully → `Done`.
- Won't do / died → `Canceled` (ENG) or `Dropped` (BIZ).
- It's a duplicate → use Linear's **mark as duplicate** so the canonical issue absorbs it,
  rather than deleting.

## Deleting — hard stop

Deletion is destructive and almost never the right move. **Before deleting, confirm with the
user explicitly**, and only for:
- a genuine mistake (issue created in error, test/junk, spam), or
- something with no history worth keeping.

If it has any activity, comments, or links, close it (`Canceled`/`Dropped`) or mark-duplicate
instead. Never delete to "clean up" a real-but-stale issue — that's what `Dropped` is for.

## Guardrails

- Don't change an issue's team as a shortcut — if work genuinely moved function (BIZ decided,
  now ENG builds), create a linked ENG issue instead of moving the BIZ one.
- Never write target verticals, customer names, pricing, or strategy into this skill file
  (public repo). Issue content in Linear is fine.
