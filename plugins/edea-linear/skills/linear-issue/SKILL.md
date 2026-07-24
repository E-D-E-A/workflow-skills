---
name: linear-issue
description: Create a Linear issue in E.D.E.A house format — routing it to the right team (Engineering vs Business), setting the correct starting status and type labels, writing the standard description structure, and attaching GitHub branches/PRs and Confluence docs. Use when the user wants to create, file, open, or draft a Linear issue/ticket/task for E.D.E.A.
---

# Create a Linear issue (E.D.E.A house format)

E.D.E.A runs **two permanent teams**: `Engineering` (ENG) and `Business` (BIZ). Teams are
*function* (how work flows); Projects are *venture* (what's being built). A new venture is a
new Project, never a new team. Every issue belongs to exactly one team.

Before writing, resolve real values from the workspace rather than assuming — use
`list_teams`, `list_issue_statuses` (per team), and `list_issue_labels` (per team). Then
create with `save_issue`. Statuses and labels are team-scoped, so an ENG label is not a BIZ
label even if the name matches.

## Step 1 — Route it: ENG or BIZ

**Tiebreaker:** if the next action is *writing code*, it's ENG. If the next action is
*talking to a person*, it's BIZ.

- **ENG** — features, bugs, refactors, deploys, infra, technical spikes, tooling. Cycle-based.
- **BIZ** — discovery, validation, pricing, partnerships, legal, fundraising, finance,
  product/design decisions, ops. No cycles; work moves on status, not sprints.

Example: a spike to test whether an external API can do what's needed is ENG (throwaway
code). Deciding whether a customer will pay for it is BIZ. If BIZ work implies building
something, the build becomes a **separate linked ENG issue** — don't mix them.

## Step 2 — Title

Imperative and specific — the next action, not a topic.
- ENG: `Add invoice export to settings`, `Fix 500 on empty cart`.
- BIZ: `Decide pilot pricing for X`, `Talk to <role> about e-invoicing`, `Research grant options`.

## Step 3 — Starting status

Pick by team (confirm exact names via `list_issue_statuses`; pick the closest if names drift):

**ENG:** `Backlog` → `Todo` → `In Progress` → `In Review` → `Done` / `Canceled`
**BIZ:** `Idea` → `Todo` → `In Progress` → `Waiting` → `Done` / `Dropped`

- Unformed / someday → `Backlog` (ENG) or `Idea` (BIZ).
- Committed, queued, not started → `Todo`. On BIZ this is the real "what's next",
  since there are no cycles to define "now".
- `Waiting` (BIZ only) means blocked on someone else — investor, lawyer, customer, vendor,
  the other teammate. Sitting here for two weeks is normal, not a failure.

## Step 4 — Labels

Labels are one axis: **type of work**. There is **no vertical/market label** — the Project
already encodes the venture, and target verticals stay out of this public repo.

**BIZ type labels:** `product`, `design`, `research`, `fundraising`, `finance`, `legal`, `ops`.
- `product` = what to build / specs / roadmap · `design` = UI/UX, wireframes, prototypes
- `research` = desk work (competitor, market, regulation) · `discovery` lives under `research`
  unless you have a dedicated discovery label
- `fundraising` = investors, pitch, grants · `finance` = runway, bookkeeping, invoicing, payroll
- `legal` = incorporation, contracts, compliance · `ops` = tooling, hiring, vendors, admin

**ENG labels:** apply whatever type labels exist on the ENG team (e.g. `bug`, `feature`,
`chore`). Don't invent a taxonomy here — list and reuse.

Apply exactly one type label when it's obvious; skip rather than guess.

## Step 5 — Description (the house structure)

Keep it short. Four sections, drop any that genuinely don't apply:

```
## Context
Why this exists. 1–3 sentences. Link the Confluence doc or related issue here.

## Outcome
What "done" looks like.
- ENG: acceptance criteria as a checklist.
- BIZ: the decision, answer, or artifact we'll walk away with.

## Next action
The single concrete next step. Required on BIZ issues so a `Waiting` item is
resumable by either teammate without re-reading everything.

## Links
GitHub branch/PR, Confluence docs, related issues.
```

## Step 6 — Assignee

- Leave **unassigned** while in `Backlog` / `Idea`.
- Assign from `Todo` / `To do` onward to whoever owns the next action.
- Keep an assignee on `Waiting` items — it's the person who picks it back up when the other
  party replies, not a sign they're actively working it.

## Step 7 — Link GitHub and Confluence

**GitHub (ENG issues).** Linear's GitHub integration links automatically when the issue ID
appears in the branch name or PR. Teach/use these conventions:
- Branch name: include the ID, e.g. `eng-123-invoice-export` (use Linear's *Copy git branch
  name* action to get the canonical format).
- PR title or description: reference the ID. Use a **closing magic word** to auto-advance the
  issue on merge — `Fixes ENG-123`, `Closes ENG-123`, `Resolves ENG-123`, `Completes ENG-123`,
  `Implements ENG-123`. Multiple issues: `Fixes ENG-12, ENG-34`.
- To link *without* auto-closing (partial work), use a **contributing word** — `ref`,
  `related to`, `part of`, `contributes to`, `towards`.

When operating over MCP and you already have a PR URL, attach it directly with
`create_attachment` (issue + URL + title).

**Confluence (any doc).** There's no special connector needed to *reference* a doc — attach
its URL with `create_attachment` (title it clearly, e.g. the doc name), or paste the link in
the `## Context` section where it unfurls. Do the same for Google Docs, Figma, etc.

## Guardrails

- One issue = one team. If it spans both, create the BIZ issue and a linked ENG issue.
- Don't set a Project unless you know which venture it belongs to — ask.
- Never put target verticals, customer names, pricing, or strategy into anything that ends up
  in the public skills repo. Issue *content* lives in Linear and is fine; this skill file is not.
- Related updates, transitions, closing, and deleting are handled by the `linear-update` skill.
