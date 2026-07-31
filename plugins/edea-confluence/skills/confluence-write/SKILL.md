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

If matches turn up in more than one space — the house space and a venture's, or two
ventures' — the *where* is ambiguous as well as the *what*. Ask which space is meant, naming
the candidates and the one you'd pick, before deciding anything else.

Skipping this step is how a wiki ends up with two pages that disagree, which is the failure
mode that makes people stop trusting it.

## Step 3 — Do you have enough to write it?

The bar: **someone who wasn't in the room can read it and act without asking you what you
meant.**

If you're missing what the type needs — the decision itself, what done looks like, the sources,
who owns it — **stop and ask.** Never fill a gap with a plausible guess, and never treat an
answer you worked out for the user as one they gave — even a good one, even one you announce.
Ask specific questions with likely answers attached, so the user can pick rather than compose:

- "Is this a Decision or a Research page? I'd say Decision, since it settles something."
- "What would make us revisit this?"
- "Who owns this runbook — whoever would have to fix it if it broke?"

Two questions are asked on **every** page, even when the request looks complete, and neither
has a default:

- **"Hebrew or English?"** The language the request was written in answers nothing — a Hebrew
  ask can want an English page, and the other way round. Step 5 says what the answer covers.
- **"Is there a Linear issue for this work?"** Offer exactly three answers: **yes** (ask which
  one if it wasn't named), **no**, or **no — create one for me**. Step 7 acts on the answer.

For a whole idea that's still fuzzy rather than one missing field, work it out with them before
writing — one question at a time, each with the answer you'd recommend attached, until you both
describe the page the same way.

## Step 4 — Pick the type and therefore the place

The five types are in `BRAIN.md`. Pick one and the location follows:

1. **Which space?** House space, unless it's about a venture that has its own space — check
   the live list with `getConfluenceSpaces` rather than remembering. **If it isn't clear
   which space the page belongs to, stop and ask**, naming the candidates and the one you'd
   recommend. This question gates updating as much as creating.
2. **Which tree?** The type tree — `Decisions/`, `Specs/`, `Research/`, `Runbooks/`, `Meetings/`.
3. **Inside `Ideas/`?** The tree is prefixed with the venture name: `Acme — Decisions`.

Resolve the parent page by title with `searchConfluenceUsingCql` or
`getPagesInConfluenceSpace`; don't assume an id.

If the user says the venture should have its own space and none exists yet, **stop and ask
them to create it** — the connector can't. Then continue.

If the page is about an idea with no tree under `Ideas/` yet, the tree is missing, not implied.
Creating it names the idea, and names stick — so propose the tree, ask what the idea should be
called, and wait for the answer before creating anything.

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

Title and body are written in the language the user chose in Step 3. The skeleton stays in
English either way — `Topics:` keeps its canonical vocabulary, and `Owner:`, `Review by:`,
`## Related` and `Supersedes:` are the exact strings that search and the repair pass in
`confluence-retire` match on.

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

Pages and issues answer different questions, so they point at each other. Act on the Linear
answer from Step 3:

- **Yes, there's an issue** → wire both ways, below.
- **No** → skip this step. Don't invent an issue to link.
- **No — create one for me** → create it first: with the `linear-issue` skill if it's
  installed (it knows the house format), otherwise `save_issue` — confirming title and team
  with the user before creating. Then wire both ways.

Wiring both ways:

- Put the issue key in the page — `ENG-123`, `BIZ-45` — and paste the issue link.
- On the issue, paste the page URL into `## Context`, where Linear renders a preview, or add a
  comment with `save_comment` carrying the page's title and URL. (`create_attachment` can't do
  this — it uploads file content, not links.)
- A **Spec** names the issues that implement it. A **Decision** names the issue that triggered
  it.

## Step 8 — Say what you did

Give the user the page title, its URL, and where it sits in the tree. If you updated rather
than created, say which page and why — they may have expected a new one.
