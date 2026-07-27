# Setting up E.D.E.A's Confluence

A one-time runbook. Work through it in order — later steps assume earlier ones.

This is written for a person clicking through Confluence, not for Claude. Once Confluence
exists, **this page becomes the first Runbook page in it** — copy it in, give it an owner and
a review date, and delete nothing from the repo.

Everything here follows the design settled in `plugins/edea-confluence/skills/` and
`docs/confluence-guide.html`. If you deviate, the skills will be wrong — change them too.

---

## 1. Create the house space

| Field      | Value                                 |
| ---------- | ------------------------------------- |
| Space name | `E.D.E.A`                             |
| Space key  | `EDEA`                                |
| Type       | Team space (**not** a personal space) |

Personal spaces can't be shared properly and get deleted with the account. Make sure it's a
team space.

**Permissions:** all four of us (dvir, eden, eylon, amit) get full access — view, add, edit,
delete. No anonymous access. No restricted areas.

We decided against permission walls deliberately: at four founders they cost real friction and
protect nothing. Revisit at the first hire who isn't a founder.

**Don't create a space for Ideascout.** It hasn't graduated — its Linear Project is still
`Backlog`. It lives inside the house space until the Project is started. See step 3.

---

## 2. Build the page tree

Create these as **top-level pages** in `EDEA`. Each one is a container for the pages beneath
it.

```
E.D.E.A (EDEA)
├── Decisions
├── Specs
├── Research
├── Runbooks
├── Meetings
└── Ideas
    └── Ideascout
        ├── Decisions
        ├── Specs
        ├── Research
        ├── Runbooks
        └── Meetings
```

**Don't leave the container pages empty.** Give each one a single line saying what belongs in
it — an empty container tells a new reader nothing, and an empty page in Confluence looks
broken. For example, on `Decisions`:

> Every choice we've made and why, including the options we turned down. One page per
> decision. Never edited to a different answer — superseded instead.

The same five type trees repeat inside every idea and, later, inside every venture space. That
repetition is deliberate: it means a venture graduating is a straight subtree move with
nothing to reshape.

**Page titles must be unique within a space.** Confluence enforces this silently — create a
second `Decisions` and it becomes `Decisions (2)` without telling you. So inside `Ideas/`, the
type trees carry the venture name:

```
Ideascout — Decisions      Ideascout — Specs      Ideascout — Research
Ideascout — Runbooks       Ideascout — Meetings
```

This is better than a bare name anyway: search results show a title without its parent, so
`Decisions` alone would be ambiguous. When a venture graduates to its own space the prefix
becomes redundant — the space name carries it — so drop it during the move.

---

## 3. Leave venture spaces until they're earned

A venture gets its own space when its **Linear Project status reaches In Progress**. Until
then it's an idea and lives under `Ideas/<Name>/`.

Today that means `Ideascout` stays in the house space. When you start that Project, create the
space then:

| Field      | Value                                                |
| ---------- | ---------------------------------------------------- |
| Space name | The venture name, as written in Linear               |
| Space key  | The venture name, uppercase, no spaces — `IDEASCOUT` |

Match the Linear Project name exactly. The skills find the space by that name, and a mismatch
means they can't.

Once the space exists, ask Claude to move the tree — it moves the pages and re-points the page
links attached to Linear issues, which is the part that's easy to forget.

---

## 4. Subject goes in a `Topics:` line, not a Confluence label

**The connector cannot set Confluence labels.** There is no label tool, neither create nor
update accepts a labels parameter, and no label scope is granted. It can *read* labels through
search — it just can't write them.

So subject is carried by a **`Topics:` line near the top of the page body**, which the skill
can write and search can find:

```
Topics: pricing, fundraising
```

The canonical vocabulary lives on the **`Topics`** page in the space. Seven core topics, the
same words used as Business labels in Linear so both tools share one vocabulary:

`product` · `design` · `research` · `fundraising` · `finance` · `legal` · `ops`

Plus free topics for whatever the page is actually about: `pricing`, `onboarding`,
`e-invoicing`. Lowercase, singular, hyphens instead of spaces.

Rules: all lowercase — `Legal` and `legal` are different strings and the vocabulary splits.
Never a topic for the page type (the tree says that). Never a topic for the venture (the space
says that).

Real Confluence labels are optional and human-added on top. Nothing depends on them.

---

## 5. Create the five templates

This is the highest-value step. Templates make the convention automatic for people, and give
the skills a stable shape to write into and read back.

Create each as a **space template** in `EDEA`.

### Decision

```
> One line: what this decides, and who it's for.

## Decision
The decision, stated as a sentence someone can act on.

## Why
What led here, the constraints, and what we knew at the time.

## Rejected
- Option — why not.

## Revisit if
What would change our mind.

## Related
- [Page name] (type)
```

### Spec

```
Owner:  <name>   Review by: <date>

> One line: what this builds, and who it's for.

## Problem
In the reader's terms, not the implementation's.

## Done looks like
- [ ] Concrete, checkable.

## Decisions already made
Link the Decision pages rather than restating them.

## Out of scope
Deliberately not doing.

## Related
- [Page name] (type)
```

### Research

```
> One line: the question, and who it's for.

## Question

## What we found
Claim — [source](url)

## Gaps
What we still don't know, and what we'd have to do to find out.

## Related
- [Page name] (type)
```

### Runbook

```
Owner:  <name>   Review by: <date>

> One line: what this gets done, and who it's for.

## Before you start
What you need to have or know.

## Steps
1.

## When a step fails
The failures we've actually hit, and what to do.

## Related
- [Page name] (type)
```

### Meeting notes

```
Date: <date>   Present: <names>

## Decided
Anything settled. Each of these is a candidate for its own Decision page.

## Actions
- [ ] Who — what

## Discussed
Everything else, briefly.

## Related
- [Page name] (type)
```

**`Owner` and `Review by` appear on Specs and Runbooks only.** They describe how things
currently are, so they go silently wrong when reality moves. Decisions and Meeting notes are
records of a moment and can't expire; Research carries its date in the title instead.

---

## 6. The conventions the templates don't enforce

**Titles are for the person searching in six months**, who types what they want to know rather
than what you called it.

- A Decision's title **states the decision**: `Charge per seat, not per invoice`, not
  `Pricing model`. It should answer the question for someone who never opens it.
- Date anything that's a snapshot — Meeting notes, Research. Never `current` or `latest`; both
  are wrong within the month.
- Say the subject, not the ceremony. `Meeting notes 3` tells nobody anything.

**Every page ends with `## Related`**, holding real Confluence links — not plain text names.
Real links are what let Confluence answer "what points at this?", which is how the Brain gets
repaired when a page is retired. A typed line goes above it only where the type carries meaning
that would otherwise be lost:

```
Supersedes: [Flat pricing — Jan 2026]
Implements: [Invoice export spec]
```

**Nothing is deleted.** When a page stops being the answer, mark it superseded and link what
replaced it. The rejected paths are part of what the Brain knows — delete them and the same
idea comes back round in six months.

---

## 7. Don't do these yet

- **Don't create venture spaces.** Nothing has graduated.
- **Don't restrict permissions.** Decided against, deliberately.
- **Don't add a sixth page type.** If pages keep not fitting the five, that's a real signal —
  but give it a fortnight of actual use first.
- **Don't import anything in bulk.** An empty Brain that's trusted beats a full one that isn't.

---

## Checklist

- [ ] `EDEA` team space created, all four with full access
- [ ] Six top-level pages created, each with a line explaining what it holds
- [ ] `Ideas/Ideascout/` created with its five type trees
- [ ] `EDEA/Labels` page created with the canonical vocabulary
- [ ] Five space templates created
- [ ] This runbook copied into `EDEA/Runbooks/` with an owner and review date

Once that's done, connect the Atlassian MCP and tell Claude — the skills can be finished
against the real thing rather than against assumptions.
