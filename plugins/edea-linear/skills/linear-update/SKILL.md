---
name: linear-update
description: Update an existing Linear issue in E.D.E.A house format — transition status (including the Business Waiting/Done/Canceled flow), reassign, add or edit labels, attach a GitHub PR/branch or Confluence doc after the fact, and close, cancel, or (rarely) delete. Use when the user wants to move, transition, close, reassign, relabel, link, or delete a Linear issue/ticket that already exists.
---

# Update a Linear issue (E.D.E.A house format)

This is the companion to `linear-issue` (which covers creating them). Always **load the issue
first** with `get_issue`, so you change it from its real current state, then save your changes
with `save_issue`. Each team has its own statuses and labels, so look up the names with
`list_issue_statuses` / `list_issue_labels` for **that issue's team** before you set them.

## Nothing is written without a yes

Nothing changes in Linear without the user seeing it first and agreeing to it. Before
**every** write — a status move, a reassignment, a label change, an attachment, an edit to
the description, a delete — show exactly what will change and wait for an explicit yes:

- **Updating** → show before → after for each field you'll touch: "`ENG-123`: status
  `In Progress` → `Done`, assignee stays."
- **Attaching or commenting** → show what will be attached or said, and on which issue.

The request approves the goal, not the writes, and silence is not a yes — if the session is
running unattended, park on the question and wait.

## Before you change anything — is the intent clear?

Load the issue and compare what you're being asked to do against its current state. If the
request is ambiguous — which status to move to, who to assign, or close vs. cancel vs. delete —
**ask a specific follow-up question first, and suggest the likely options** so the user can
just pick. For example: "Move this to `Waiting` or `Done`?" or "Do you want to cancel it, or
delete it for good?" Make the change only once the intent is clear. Don't guess at intent on an
issue that already exists.

## Moving between statuses

**ENG:** `Backlog` → `Todo` → `In Progress` → `In Review` → `Done` / `Canceled`
GitHub does most of this for you: opening a pull request that mentions the issue moves it
along, and a magic word like `Fixes ENG-123` marks it `Done` when the PR merges. Let the
GitHub link move ENG issues instead of moving them by hand.

**BIZ:** `Backlog` → `Todo` → `In Progress` → `Waiting` → `Done` / `Canceled`
- `In Progress` — someone is actively working on it right now (a call, a deck, a filing).
- `Waiting` — the ball is in someone else's court: outreach sent, a contract out for review, an
  investor deciding. It's normal to bounce between `Waiting` and `In Progress` many times, and
  to move backward.
- `Done` — you got the result (decision made, deal signed, document produced).
- `Canceled` — you decided not to pursue it, or it died. A lost deal or a rejected grant is
  `Canceled`, not `Done`.

Whenever you move an issue to `Waiting`, make sure the **Next action** in the description says
what it's waiting on and who picks it back up — that's the whole point of the status.

## Reassigning

Set the assignee to whoever owns the **next** step. On a `Waiting` issue, that's the person who
will pick it up when the other side replies — keep it assigned to them, don't clear it.

## Labels

Use the same type labels as when creating (`product`, `design`, `research`, `fundraising`,
`finance`, `legal`, `ops` on BIZ; the existing labels on ENG). Change the label if the kind of
work changed. Don't pile on several labels to be safe — pick the main one.

## Linking a PR, branch, or document to an existing issue

- **GitHub:** the cleanest way is to edit the pull request — add the issue ID and a magic word
  to its title or description (`Fixes ENG-123` to close the issue when it merges; `ref ENG-123`
  to link only). If you just have the link and are working through the Linear tools, attach it
  with `create_attachment`.
- **Confluence / Google Docs / Figma:** attach the link with `create_attachment` and give it a
  clear title, or paste it into the description, where Linear shows it as a preview.
- Linking never removes anything, but it's still a write — show what you're about to attach
  or edit and get a yes first. A magic word does more than link: it changes the issue's
  status by itself when the PR merges, so say that consequence when you ask.

## Closing an issue

Prefer an **end status** over deleting — it keeps the history and can be undone:
- Finished → `Done`.
- Won't do, or it died → `Canceled`.
- It's a duplicate → use Linear's **mark as duplicate**, so the main issue keeps the link,
  instead of deleting.

## Deleting — stop and check first

Deleting removes the issue for good and is almost never the right move. **Ask the user before
deleting**, and only do it for:
- a genuine mistake (created by accident, a test, junk, or spam), or
- something with no history worth keeping.

If it has any activity, comments, or links, close it (`Canceled`) or mark it as a duplicate
instead. Don't delete just to tidy up a real-but-old issue — that's what `Canceled` is for.

## A few rules to keep

- Don't switch an issue's team as a shortcut. If the work really moved from business to
  engineering (BIZ decided, now ENG builds), make a new linked ENG issue instead of moving the
  BIZ one.
- Never write target markets, customer names, pricing, or strategy into this skill file — it's
  in a public repo. What's inside a Linear issue is fine.
