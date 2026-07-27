---
name: confluence-doc
description: Write or update a Confluence page in E.D.E.A house format — deciding whether something belongs in Confluence or Linear at all, picking the document type, giving it a title people can find, writing it so it stays true after the work moves on, and linking it to the Linear issue it came from. Use when the user wants to write, draft, create, update, or reorganise a Confluence page, doc, spec, decision record, runbook, research write-up, or meeting notes.
---

# Write a Confluence page (E.D.E.A house format)

Before you write, look up the real workspace instead of guessing: list the spaces you can
reach and search for existing pages on the topic. Names drift, and a page written into the
wrong space is worse than no page — nobody finds it, and it quietly contradicts the one that
does exist.

**Always search before you create.** If a page on this topic already exists, update it rather
than adding a second one. Two pages saying different things about the same subject is the
main way a wiki dies.

## Step 1 — Does this belong in Confluence at all?

The split with Linear is about **lifespan**, not size:

- **Linear** holds *work to be done*. It has an owner, a status, and an end. When it's done,
  it stops being interesting.
- **Confluence** holds *what we know*. It stays true — and stays useful — after the work that
  produced it is finished.

So: "Decide pilot pricing" is a Linear issue. The pricing we decided, and why, is a Confluence
page. If you can't say who would read it in three months and what they'd get from it, it's
probably an issue description or a comment, not a page.

Never copy an issue into a page just to have a record. Link to the issue instead.

## Step 2 — Pick the document type

| Type | What it holds | Stays true because |
| --- | --- | --- |
| **Decision** | What we chose, what we rejected, and why | It records a moment; it's never edited to a different answer |
| **Spec** | What we're building and what done looks like | It's written before the build and closed out after |
| **Research** | What we found out, and where it came from | Every claim names its source |
| **Runbook** | How to do a repeatable thing, step by step | Whoever changes the process updates the page |
| **Meeting notes** | What was said, decided, and assigned | It's dated and never rewritten |

If it fits none of these, say so and ask the user rather than forcing it into the nearest one.

A **Decision** is the highest-value page type and the one most often skipped. Whenever a
conversation settles an argument, that's a Decision page — including the options you turned
down, which is the part people come back for.

## Step 3 — Where it goes

Confluence is organised by **venture**, not by team. A Linear issue belongs to a team because
teams decide how work gets done — but a finished page is knowledge *about* something, and
everything known about one venture belongs together regardless of who wrote it.

There are two kinds of space:

- **`EDEA` — the house space.** Everything that outlives any single venture: how we work,
  legal, finance, fundraising, ops, and every idea that hasn't been committed to yet.
- **One space per committed venture** — `IDEASCOUT`, and one more each time a venture starts.

### Has this venture earned a space?

A venture gets its own space once its **Linear Project has actually started**. Read the
project with `get_project` and look at `status.type`:

| `status.type` | Where the page goes |
| --- | --- |
| `backlog`, `planned` | Still an idea — house space, under `Ideas/<Venture>/` |
| `started` | Committed — its own space |
| `completed`, `canceled` | Leave the pages where they are and archive in place |

If the page isn't about a venture at all, it belongs in the house space directly.

Don't guess which venture a page belongs to. If it came from a Linear issue, use that issue's
Project. If there's no issue and it isn't obvious, ask.

### Inside a space

Trees by **document type**, the same five everywhere — in the house space, in each venture
space, and inside each `Ideas/<Venture>/` tree:

```
Decisions/   Specs/   Research/   Runbooks/   Meetings/
```

Placement follows from the type you picked in Step 2, so there's no judgement call here.

**Subject is carried by labels, not by trees.** Reuse the words already used as Business
labels in Linear — `product`, `design`, `research`, `fundraising`, `finance`, `legal`, `ops` —
plus whatever the page is actually about (`pricing`, `onboarding`). One vocabulary across both
tools beats two.

### Never create a space

Creating a space sets a key, permissions and a template, and it can't be renamed cleanly
afterwards. That's a person's job. If a venture has graduated and no space exists yet, say so
and ask the user to create it — then continue.

## Step 3b — Has a venture outgrown the house space?

Whenever you write a page for a venture, check whether it's still in the right place. If the
Project's `status.type` is `started` but its pages are still under `Ideas/<Venture>/`, it has
graduated and nobody has moved it.

Say so, and offer to do the move:

1. Ask the user to create the space (see above). Wait for it.
2. Move the whole `Ideas/<Venture>/` tree into the new space, keeping the type trees intact.
3. **Re-point the links.** Confluence leaves redirects behind, but any page URL attached to a
   Linear issue still points at the old location — find those attachments and update them.

Confirm before moving anything. It's a bulk change across two tools, and it's tedious to undo.

## Step 4 — Title it so it can be found

Someone searching in six months types what they want to know, not what you called it.

- Say the subject, not the ceremony: `Pilot pricing — decided Mar 2026`, not `Meeting notes 3`.
- **Decisions state the decision**, not the topic: `Charge per seat, not per invoice` beats
  `Pricing model`. The title alone should answer the question for someone who never opens it.
- **Date anything that is a snapshot** — meeting notes, research, anything that will be
  overtaken. Use a real date, not "current" or "latest", which are wrong within the month.
- No internal codenames without the plain word beside them.

## Step 5 — Write it

Same bar as a Linear issue: **someone who wasn't in the room should be able to read it and act
without asking you what you meant.** That sets how much to write. Don't pad a short page to
fill a template, and don't compress a complicated one to look tidy.

Every page opens with **one or two lines saying what it's for and who it's for.** Someone who
landed here from search decides in about five seconds whether to keep reading.

Then, by type:

- **Decision** — what we decided; what we rejected and why; what would make us revisit it.
  That last part is what stops the same argument being re-run in six months.
- **Spec** — the problem in the reader's terms; what done looks like, concretely; the decisions
  already made; what's deliberately out of scope.
- **Research** — the question; what you found; **a source for every claim**. An unsourced
  research page is an opinion page.
- **Runbook** — numbered steps someone can follow without you; what to do when a step fails.
- **Meeting notes** — date, who was there, what was decided, who owns what next.

Write in plain language, as in every other E.D.E.A skill. Prefer short sections and tables
over long prose — these pages get scanned for one answer, not read start to finish.

### Owner and review date — on the two types that rot

**Runbooks and Specs** describe how things currently are, so they go quietly wrong when
reality moves on. Both get a line at the very top:

```
Owner: <name>   Review by: <date, about three months out>
```

Ask who the owner is if you can't tell — it's the person who'd have to fix the page, not
whoever happened to write it.

**Decisions and Meeting notes get neither.** They're records of a moment, so they can't go out
of date — and an expired review date on a Decision reads as "this might be wrong" when the
decision is simply history. **Research** carries its date in the title instead, because it's a
snapshot rather than a standing description.

## Step 6 — Link it to Linear

Pages and issues answer different questions, so they should always point at each other:

- Put the issue key in the page — `ENG-123`, `BIZ-45` — and paste the issue link. Linear picks
  the mention up, so the connection shows from both sides.
- On the issue, attach the page URL with `create_attachment` and give it the page's title, or
  paste the link into the issue's `## Context` section, where Linear renders a preview.
- A **Spec** page names the issues that implement it. A **Decision** page names the issue that
  triggered it.

## Updating an existing page

Load the page first and work from what's actually there, not from memory.

- **Fix a page that's now wrong.** A wiki people don't trust is worse than no wiki.
- **Never rewrite a Decision or Meeting notes page to say something different.** Those record a
  moment. When the answer changes, write a new Decision page and link the old one as
  superseded, so the history of the thinking survives.
- If a page has gone stale and you don't know the current answer, say so on the page and ask
  the user — don't quietly leave a confident, wrong page in place.

## Deleting — stop and check first

Ask the user before deleting anything, and offer the reversible option first:

- Out of date but historically real → **archive** it, or mark it superseded and link to what
  replaced it.
- Genuinely junk — an accident, a test page, an empty draft → deleting is fine.

Never delete a page because it's old. Old and correct is the point of a wiki.

## A few rules to keep

- One page, one subject. If it's answering two questions, it's two pages that link to each
  other.
- Don't create a page to record work that's still in progress — that's what the Linear issue
  is for. Write the page when there's something that outlives the work.
- Never write target markets, customer names, pricing, or strategy into **this skill file** —
  it lives in a public repo. What you write inside a Confluence page is private and fine.
