# The E.D.E.A Brain — shared reference

Every `edea-confluence` skill reads this before acting. It holds what they all need to agree
on: where pages live, how they connect, and what the connector can and can't do.

This file has no frontmatter and no description, so it never fires on its own. It's reference,
not a skill.

**If you change a rule here, change it in `docs/confluence-guide.html` too.** The skills are
what actually run, so the page follows this file — never the other way round.

---

## What the Brain is

Confluence holds **what we know**. Linear holds **work to be done**.

The split is lifespan, not size. A Linear issue has an owner, a status and an end; once it's
Done it stops being interesting. A Confluence page stays useful after the work that produced it
is finished.

The test: name who reads this in three months and what they get from it. If you can't, it's an
issue comment, not a page.

## Getting connected

Every call needs a `cloudId`. Don't hardcode it — call `getAccessibleAtlassianResources` and
use the id of the E.D.E.A site. Space ids likewise: get them from `getConfluenceSpaces` by key
rather than remembering numbers, because page and space ids change when things are rebuilt.

## Where pages live

Organised by **venture**, not by team. Teams decide how work gets done, which is right for
Linear; a finished page is knowledge *about* something, and everything known about one venture
belongs together no matter who wrote it.

- **`EDEA` — the house space.** Everything that outlives any single venture: how we work,
  legal, finance, fundraising, ops, plus every idea not yet committed to.
- **One space per committed venture** — created only when a venture graduates.

### Has the venture earned a space?

Read its Linear Project with `get_project` and look at `status.type`:

| `status.type` | Where its pages go |
| --- | --- |
| `backlog`, `planned` | House space, under `Ideas/<Venture>/` |
| `started` | Its own space |
| `completed`, `canceled` | Leave them where they are |

Not about a venture at all → house space, directly.

Don't guess which venture a page belongs to. If it came from a Linear issue, use that issue's
Project. If there's no issue and it isn't obvious, ask.

### The five type trees

The same five everywhere — in the house space, in each venture space, and inside each idea:

```
Decisions/   Specs/   Research/   Runbooks/   Meetings/
```

Pick the type and the location follows. There's no judgement call once the type is known.

### Titles are unique per space

**Confluence silently renames a duplicate to `Decisions (2)`.** It does not warn you. So inside
`Ideas/`, type trees carry the venture name:

```
Ideascout — Decisions      Ideascout — Specs      Ideascout — Research
Ideascout — Runbooks       Ideascout — Meetings
```

In a venture's own space the prefix is redundant — the space carries it — so it's dropped
during the move.

Before creating any page, **search for its title first**. If a page with that title exists,
you're updating it, not creating a second one.

## The five page types

| Type | Holds | `Owner` + `Review by` |
| --- | --- | --- |
| **Decision** | What we chose, what we rejected, why, what would make us revisit | No — a record |
| **Spec** | What we're building, what done looks like, what's out of scope | **Yes** |
| **Research** | A question, what we found, a source for every claim | No — date in the title |
| **Runbook** | A repeatable process, and what to do when a step fails | **Yes** |
| **Meeting notes** | Date, who was there, what was decided, who owns what | No — a record |

If something fits none of the five, say so and ask. Don't force it into the nearest one.

**Decisions and Meeting notes are records of a moment.** They are never edited to say something
different. When the answer changes, write a new page and supersede the old one.

## What every page carries

**A title written for the person searching in six months**, who types what they want to know
rather than what you called it. A Decision's title states the decision — `Charge per seat, not
per invoice`, not `Pricing model`. Date anything that's a snapshot; never `current` or `latest`.

**One or two opening lines** saying what it's for and who it's for.

**A `Topics:` line** near the top, listing subject words from the `Topics` page in the space —
`product`, `design`, `research`, `fundraising`, `finance`, `legal`, `ops`, plus free words like
`pricing`. All lowercase. Never a topic for the page type (the tree says that) or the venture
(the space says that).

**A `## Related` section** — see below.

**`Owner:` and `Review by:`** on Specs and Runbooks only, at the very top. The owner is whoever
would have to fix the page, not whoever wrote it. Review dates go about three months out.

## How pages connect

`## Related` at the end of every page, holding real Confluence links.

**Link text must be the target page's exact title.** This is a hard rule, not a style
preference:

```
## Related
- [Charge per seat, not per invoice] (Decision)
- [Pricing research — Mar 2026] (Research)
```

Above it, a typed line only where the relationship carries meaning that would otherwise be lost:

```
Supersedes: [Flat pricing — Jan 2026]
Implements: [Invoice export spec]
```

**Why exact titles matter.** The connector has no backlink API and CQL has no "what links here"
operator. The only way to find pages pointing at a page is to search for its title:

```
searchConfluenceUsingCql: text ~ "Charge per seat, not per invoice"
```

A link written as `[see the pricing decision]` is invisible to that search. It becomes a hole
in the Brain that nothing will ever report — the exact failure the Brain exists to prevent. If
you find a vague link while working on a page, fix it.

## What the connector can and can't do

Verified against the live site. Design around these rather than assuming.

| | |
| --- | --- |
| Create and update pages | ✅ `createConfluencePage`, `updateConfluencePage` |
| Move a page — new parent or new space | ✅ `updateConfluencePage` with `parentId` / `spaceId` |
| Read pages, descendants, spaces | ✅ |
| Search | ✅ `searchConfluenceUsingCql` |
| Comments | ✅ read and write |
| **Delete anything** | ❌ no tool, no scope |
| **Create a space** | ❌ no tool |
| **Set labels** | ❌ no tool, no scope, no parameter — hence `Topics:` |
| **Enumerate inbound links** | ❌ no API — hence the exact-title rule |

Inbound-link discovery by title search is **verified working**: searching a page's exact title
returns both that page and every page linking to it. That only holds while links carry the
real title, which is why the rule above is a rule.

Two of our rules are therefore enforced by the tooling rather than by discipline: **the skills
cannot delete anything, and cannot create a space.** When either is needed, ask the user to do
it and wait.

Write page bodies with `contentFormat: "markdown"`. It converts cleanly — headings, tables,
quotes, and checkbox lines become native Confluence task lists.

## Invariants

Break any of these and the Brain degrades quietly, which is the only way it ever degrades.

1. **Search before creating.** Two pages on one subject is how a wiki dies.
2. **Never rewrite a record.** Decisions and Meeting notes get superseded, not edited.
3. **Nothing is deleted.** Superseded pages stay — the paths we rejected are part of what we
   know, and losing them means re-running the same argument.
4. **Link by exact title**, or the link doesn't exist as far as the Brain is concerned.
5. **Never invent a space or a page tree.** Propose and wait.
6. **Say when you don't know.** A page that doesn't exist is a real, useful answer. Reasoning
   from adjacent pages and presenting it as knowledge is worse than silence.
