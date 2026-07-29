---
name: confluence-write
description: Write a page into E.D.E.A's Confluence Brain, or update an existing one — deciding whether something belongs in Confluence at all, picking the document type, finding the right space and tree, searching first so nothing is duplicated, and wiring it to related pages and the Linear issue it came from. Use when the user wants to write up, document, record, capture, draft or update a decision, spec, research finding, runbook, or meeting notes.
---

# Write a page into the Brain

**Read `../../BRAIN.md` first** — it sits at the root of this plugin, two levels up from this
file. It holds the structure, the five page
types, the linking rules, and what the connector can and can't do. Everything below assumes it.

Creating and updating are one skill because they're one judgement: you can't know which you're
doing until you've searched.

## Step 1 — Does this belong in Confluence?

Linear holds work; Confluence holds what we know. If you can't name who reads this in three
months and what they get from it, it's an issue comment — say so rather than writing a page.

Never copy a Linear issue into a page to have a record. Link to the issue instead.

## Step 2 — Search before anything else

Search the space for the subject, by title and by text:

```
searchConfluenceUsingCql: type = page AND text ~ "<subject>"
```

Then decide honestly:

- **A page already covers this** → you're updating. Go to Step 6.
- **A page covers part of it** → update that one, or write a new page and link them. Ask if
  it's genuinely unclear.
- **Nothing covers it** → you're creating. Continue.

Skipping this step is how a wiki ends up with two pages that disagree, which is the failure
mode that makes people stop trusting it.

## Step 3 — Do you have enough to write it?

The bar: **someone who wasn't in the room can read it and act without asking you what you
meant.**

If you're missing what the type needs — the decision itself, what done looks like, the sources,
who owns it — **stop and ask.** Ask specific questions with likely answers attached, so the user
can pick rather than compose:

- "Is this a Decision or a Research page? I'd say Decision, since it settles something."
- "What would make us revisit this?"
- "Who owns this runbook — whoever would have to fix it if it broke?"

For a whole idea that's still fuzzy rather than one missing field, work it out with them before
writing — one question at a time, each with the answer you'd recommend attached, until you both
describe the page the same way.

## Step 4 — Pick the type and therefore the place

The five types are in `BRAIN.md`. Pick one and the location follows:

1. **Which space?** House space unless it's about a venture whose Linear Project has started.
2. **Which tree?** The type tree — `Decisions/`, `Specs/`, `Research/`, `Runbooks/`, `Meetings/`.
3. **Inside `Ideas/`?** The tree is prefixed with the venture name: `Acme — Decisions`.

Resolve the parent page by title with `searchConfluenceUsingCql` or
`getPagesInConfluenceSpace`; don't assume an id.

If the venture has graduated and no space exists yet, **stop and ask the user to create it** —
the connector can't. Then continue.

## Step 5 — Write it

Title first, for the person searching in six months. A Decision's title states the decision.
Snapshots carry their date.

Then, in order:

```
Owner: <name>   Review by: <date>        ← Specs and Runbooks only
Topics: <words from the Topics page>

> One line: what this is for, and who it's for.

<the type's sections — see BRAIN.md>

## Related
- [Exact page title](page URL) (type)
```

Write with `contentFormat: "markdown"`. Plain language, short sections, tables over prose —
these pages get scanned for one answer, not read start to finish.

**Every link in `## Related` is a real markdown link — the target's exact title, and its URL**
— `[Exact title](https://…/pages/123/…)`. Copy both verbatim from the search result that found
the page. Confluence turns that into a native page link, which is what keeps the page findable
when something later needs to know what points at it. `BRAIN.md` has the reasoning.

Don't pad a short page to fill the shape, and don't compress a complicated one to look tidy.

## Step 6 — Updating an existing page

Load it with `getConfluencePage` and work from what's actually there.

- **Is it a record?** Decisions and Meeting notes are never edited to say something different.
  If the answer has changed, this is a new Decision plus a supersede — hand off to
  `confluence-retire`, which handles the pointers.
- **Is it just wrong or stale?** Fix it. A wiki people don't trust is worse than no wiki.
- **Don't know the current answer?** Say so on the page and ask the user. Leaving a confident,
  wrong page in place is the worse option.
- **Spec or Runbook?** Refresh `Review by` when you make a real change, and check `Owner` is
  still the right person.

## Step 7 — Wire it to Linear

Pages and issues answer different questions, so they point at each other:

- Put the issue key in the page — `ENG-123`, `BIZ-45` — and paste the issue link.
- On the issue, attach the page URL with `create_attachment` titled with the page's name, or
  paste it into the issue's `## Context`, where Linear renders a preview.
- A **Spec** names the issues that implement it. A **Decision** names the issue that triggered
  it.

## Step 8 — Say what you did

Give the user the page title, its URL, and where it sits in the tree. If you updated rather
than created, say which page and why — they may have expected a new one.
