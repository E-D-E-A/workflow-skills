---
name: linear-issue
description: Create a Linear issue in E.D.E.A house format — routing it to the right team (Engineering vs Business), setting the correct starting status and type labels, writing the standard description structure, and attaching GitHub branches/PRs and Confluence docs. Use when the user wants to create, file, open, or draft a Linear issue/ticket/task for E.D.E.A.
---

# Create a Linear issue (E.D.E.A house format)

E.D.E.A has **two permanent teams**: `Engineering` (ENG) and `Business` (BIZ). A team is about
*how* work gets done. A **Project** is about *what* you're building — a specific product or
venture. When you start a new venture you make a new Project, not a new team. Every issue
belongs to exactly one team.

Before you write, check the real names in the workspace instead of guessing — list the teams
(`list_teams`), the statuses for the team (`list_issue_statuses`), and its labels
(`list_issue_labels`). Then create the issue with `save_issue`.

**Statuses belong to a team**, so ENG and BIZ have separate ones even where the names match.
**Labels are mixed:** some belong to a team, and some are workspace-level and show up on every
team's list. `list_issue_labels` returns both together, so check whether a label really belongs
to the team before treating it as team-specific — a workspace-level label can be applied to any
issue, which is not always what you want.

## Before you create — do you have enough to write a good issue?

Go through the steps below and check what you actually know. If you're missing anything the
rules need — especially a clear **Outcome**, the right **team**, or enough detail for someone
to act without asking — **stop and ask the user before you create the issue.** Don't guess,
and don't leave blanks and hope.

When you ask, make it easy to answer: ask specific follow-up questions, and suggest the likely
options so the user can just pick. For example:
- "Is this Engineering or Business? (I'd guess BIZ, because the next step is a customer call.)"
- "Which label fits best — `product` or `design`?"
- "What does 'done' look like here — a signed pilot, or just a first reply?"

Create the issue only once it will read clearly to someone who wasn't part of the conversation.

## Step 1 — Pick the team: ENG or BIZ

Quick rule: if the next thing to do is **write code**, it's ENG. If the next thing to do is
**talk to a person**, it's BIZ.

- **ENG** — building and running the software: features, bugs, cleanups, releases, servers and
  setup, quick coding experiments, and developer tools. ENG works in fixed time cycles (like
  sprints).
- **BIZ** — everything that decides *what* to build and *who pays*: talking to customers,
  validating ideas, pricing, partnerships, legal, fundraising, finance, product and design
  decisions, and day-to-day operations. BIZ has no cycles — work moves when its status
  changes, not on a sprint schedule.

Example: a quick throwaway coding test to see whether an outside service can do what you need
is ENG. Deciding whether a customer will actually pay for it is BIZ. If a BIZ issue leads to
building something, make that a **separate ENG issue and link the two** — don't mix both kinds
of work in one issue.

## Step 2 — Title

Start with a verb and be specific. The title should say the actual thing to do, not just name
a topic.
- ENG: `Add invoice export to settings`, `Fix 500 error on empty cart`.
- BIZ: `Decide pilot pricing for X`, `Talk to <role> about e-invoicing`, `Research grant options`.

## Step 3 — Starting status

Use the statuses that belong to the team (check the exact names with `list_issue_statuses`; if
a name is slightly different, pick the closest match):

**ENG:** `Backlog` → `Todo` → `In Progress` → `In Review` → `Done` / `Canceled`
**BIZ:** `Backlog` → `Todo` → `In Progress` → `Waiting` → `Done` / `Canceled`

- Not shaped yet, or maybe-someday → `Backlog`.
- Decided and lined up, but not started → `Todo`. On BIZ this is your real "what's next" list,
  because there are no cycles to mark what's "now".
- `Waiting` (BIZ only) means you're blocked on someone else — an investor, a lawyer, a
  customer, a supplier, or the other teammate. An issue sitting here for two weeks is normal,
  not a failure.

## Step 4 — Labels

A label says one thing: the **type of work**. Don't add a label for the market or industry —
the Project already tells you which venture the issue belongs to, and we keep target markets
out of this public repo.

**BIZ labels:**
- `product` — what to build: specs, roadmap
- `design` — UI/UX, wireframes, prototypes
- `research` — reading and desk work: competitors, market, regulation (customer discovery goes
  here too, unless you add a separate `discovery` label)
- `fundraising` — investors, pitch, grants
- `finance` — runway, bookkeeping, invoicing, payroll
- `legal` — incorporation, contracts, compliance
- `ops` — tools, hiring, suppliers, admin

**ENG labels:** `Bug`, `Feature`, `Improvement`. Don't invent new ones — list what's there and
reuse it.

These three are currently **workspace-level**, not owned by Engineering, so they also appear
when you list Business labels. They still mean engineering work: don't put `Bug` on a BIZ
issue just because Linear offers it.

Add one label when the type is obvious; if you're not sure, leave it off rather than guess.

## Step 5 — Description

The rule: **anyone on the team should be able to open the issue and start working on it
without asking you what you meant.** That is the bar for how much to write. A simple task
needs a line or two. A fuzzy or big task needs more. Add detail wherever a reader could get it
wrong — and don't pad a clear task just to fill in sections.

Before you save, read the issue as if someone else wrote it. If you'd need to ask a question
to get started, answer that question in the issue.

Always include:

- **A clear title** (from Step 2).
- **Outcome** — what "done" actually looks like, in concrete terms.
  - ENG: the acceptance criteria — a checklist of what must be true for it to be finished.
  - BIZ: the decision, answer, or thing we'll have in hand at the end.

Add these whenever they help the reader (usually they do):

- **Context** — why this matters and the background someone needs: what led to it, any
  constraints, and decisions already made. Add it whenever the title alone doesn't make the
  "why" clear. Link the Confluence doc or related issue here.
- **Next action** — the single next step to take. Especially important for BIZ issues that
  will sit in `Waiting`, so whoever comes back to it knows exactly where to pick up.
- **Links** — GitHub branch/PR, Confluence docs, related issues.

### Bugs (ENG)

For a bug, always give enough to reproduce it — that's the detail a bug can't be worked
without:

```
## Steps to reproduce
1. …
## Expected
what should happen
## Actual
what actually happens
## Environment
browser / OS / version / URL
```

## Step 6 — Assignee

- Leave it **unassigned** while it's in `Backlog`.
- From `Todo` onward, assign it to whoever owns the next step.
- Keep an assignee on `Waiting` items. That person isn't actively working on it — they're the
  one who picks it back up when the other side replies.

## Step 7 — Link GitHub and Confluence

**GitHub (ENG issues).** Linear links a branch or pull request (PR) to an issue automatically
when the issue ID shows up in the branch name or the PR. How to do it:
- Branch name: put the ID in it, e.g. `eng-123-invoice-export`. (In Linear, the *Copy git
  branch name* action gives you the exact format.)
- PR title or description: mention the ID. Add a **"magic word"** — a keyword GitHub and Linear
  both recognize — to move the issue automatically when the PR merges: `Fixes ENG-123`,
  `Closes ENG-123`, `Resolves ENG-123`, `Completes ENG-123`, or `Implements ENG-123`. For
  several issues at once: `Fixes ENG-12, ENG-34`.
- To link a PR *without* closing the issue when it merges (for example, it's only part of the
  work), use a plain linking word instead: `ref`, `related to`, `part of`, `contributes to`,
  or `towards`.

If you're working through the Linear tools (the MCP connection) and already have the PR link,
just attach it to the issue with `create_attachment` (issue + URL + a title).

**Confluence (or any document).** You don't need a special connector just to point at a doc —
attach its link with `create_attachment` and give it a clear title (like the doc's name), or
paste the link into the `## Context` section, where Linear shows it as a preview. Same goes
for Google Docs, Figma, and similar.

## A few rules to keep

- One issue belongs to one team. If it truly covers both, make the BIZ issue and a separate,
  linked ENG issue.
- Don't set a Project unless you know which venture it's for — ask first.
- Never put target markets, customer names, pricing, or strategy into this skill file — it
  lives in a **public** repo. (What you write inside a Linear issue is private and fine; this
  file is not.)
- Updating, moving, closing, and deleting issues are covered by the `linear-update` skill.
