# Deck craft — the reference

The rules `presentation-create` builds on. Everything here serves one goal: the audience
understands what matters and moves toward a decision. Looking good is a side effect.

## The bar

Every output reads like a senior operator at a top international technology company wrote
it: clear, focused, decision-oriented, credible, and copy-ready. No startup clichés, no
marketing fluff, no claim without a basis.

## Story frames

Pick the frame that fits the deck type, then keep **only the sections that strengthen this
particular argument** — a frame is a menu, not a march.

**Investor** — vision · problem · why now · solution · product · market · business model ·
go-to-market · traction · competition · defensibility · unit economics · team · roadmap ·
the ask.

**Go-to-market** — market reality · target segment · customer pain · entry wedge ·
positioning · value proposition · customer journey · channels · funnel · pricing ·
partnerships · KPIs · risks · scale plan.

**Product strategy** — business context · user problem · current behavior · opportunity ·
product thesis · target user · core use case · user journey · MVP · prioritization ·
success metrics · risks · roadmap · decision.

**Board / management** — executive summary · current state · performance · key insights ·
main problem · options · recommendation · impact · resources · risks · milestones ·
decision required.

## One slide, one message

- Every slide answers **one management question**: What is broken? Why now? What is the
  opportunity? What must be proven? What creates defensibility? What could fail? What
  decision is required?
- **Titles state the conclusion, not the topic.** "The current process creates high cost
  and low scalability" — not "Market" or "Our Product".
- **Show causality** between slides: cases create data → data reveals patterns → patterns
  become automation → automation cuts cost → lower cost enables scale. Each step earns the
  next.
- **Separate fact, assumption, and target** with explicit words — Fact, Evidence,
  Assumption, Target, Validation required (עובדה / הנחה / יעד). An assumption presented as
  fact costs the whole deck its credibility.
- **Density per slide:** one main message, one primary visual, up to 3 supporting points,
  one key metric — roughly 40–60 words. Past that, split the slide.

## Design system

- **Palette:** white or deep-navy background; dark navy, charcoal, soft gray; **one accent
  color**. More colors only when they encode information.
- **Type:** at most 2 font families. Large titles, strong hierarchy, body text big enough
  to read from the back of the room.
- **Layout:** a consistent grid, generous whitespace, one visual anchor per slide, titles
  in the same position throughout.
- **Visual vocabulary:** process flows, roadmaps, timelines, funnels, stage gates, customer
  journeys, before/after comparisons, competitive matrices, KPI cards, unit-economics
  bridges, market maps.

### Choosing a chart

| To show                | Use                              |
| ---------------------- | -------------------------------- |
| Comparison             | Bar chart                        |
| Change over time       | Line chart                       |
| Conversion             | Funnel                           |
| An economic bridge     | Waterfall                        |
| Prioritization         | 2×2 matrix                       |
| Sequence               | Timeline                         |
| Exact values           | Table — only when they matter    |
| Executive summary      | KPI cards                        |

Every chart answers a question; highlight the one series or number that carries the answer.

### What to tell the generator to leave out

Generators fill silence with garbage, so every generated prompt names the exclusions: no
stock photos, no generic AI imagery (robots, glowing brains, handshakes), no decorative 3D,
no cartoon illustrations, one accent color only, no dense text blocks, no tiny charts.

## Hebrew means RTL

When the deck is in Hebrew, direction is part of correctness:

1. Titles, body text, and bullets align right.
2. Any sequence — process, timeline, roadmap, funnel stages — **starts at the far right and
   progresses left**. Arrows point right-to-left.
3. Tables put the lead column on the right.
4. Numbering follows the visual reading order.
5. English terms stay only where they're clearer than the Hebrew.
6. Logos, data charts, and icons are **not** mirrored.
7. Check mixed Hebrew–English punctuation by reading the line back — it's where reversed
   text hides.

## Writing a prompt for a generator

When the output is a prompt for NotebookLM, Gamma, or similar, it opens with a direct
instruction — צור / Create — and then defines, in order: slide count, audience, strategic
objective, narrative sequence, mandatory content, visual direction, RTL or LTR, what to
leave out, and the expected outcome. Copy-ready, needing no explanation around it.

### Compact description template (Hebrew)

**תיאור המצגת שרוצים ליצור:**

צור מצגת מקצועית בת [מספר] שקפים, בעברית וב־RTL, עבור [קהל היעד], המציגה [נושא]. מטרת
המצגת היא [ההחלטה או הפעולה]. בנה סיפור ברור: המציאות הקיימת, הבעיה ומשמעותה העסקית, למה
עכשיו, ההזדמנות והפתרון, מודל הפעולה, מדדי ההצלחה, הסיכונים והשלבים הבאים. כל שקף יעביר
מסר אחד בלבד באמצעות כותרת מסקנתית, מעט טקסט וויזואל אחד. הפרד בין עובדות, הנחות ויעדים.
העיצוב נקי וטכנולוגי: רקע לבן או כחול כהה, צבע הדגשה אחד, Funnel, Roadmap, KPI cards
והשוואות Before/After. הימנע מתמונות סטוק, איורי AI גנריים ופסקאות צפופות. כל התהליכים
והחצים מתחילים מימין ומתקדמים שמאלה.

### Infographic template (Hebrew)

**תיאור האינפוגרפיקה שרוצים ליצור:**

צור אינפוגרפיקה אופקית בעברית וב־RTL המציגה [תהליך] בציר בן [מספר] שלבים, מימין לשמאל.
בכל שלב: שם, פעולה מרכזית, תוצר, KPI ותנאי מעבר. חבר את השלבים בחצים ברורים והוסף מעל
הציר משפט אסטרטגי קצר. אייקונים קוויים מינימליים, רקע בהיר, צבע הדגשה אחד, מעט טקסט
והיררכיה חזקה.

Fill the brackets with the real details at run time. The specifics in any example that
lives in this file stay invented — this repo is public.

## Output shape

Copy-ready output only — no commentary before or after unless the user asks.

- A description or prompt opens with **תיאור המצגת שרוצים ליצור:** (or its English
  equivalent, "Description of the presentation to create:").
- An infographic opens with **תיאור האינפוגרפיקה שרוצים ליצור:**.
- A slide-by-slide structure repeats this block per slide (English decks use the same
  fields in English):

```
### שקף 1 — [כותרת מסקנתית]
**השאלה הניהולית:** …
**המסר המרכזי:** …
**תוכן נדרש:** …
**ויזואל מומלץ:** …
**מסקנת הנהלה:** …
```

## The checklist

An output is done when every answer is yes:

- Did the user state the audience, the goal, and the language themselves — none of them
  inferred?
- Is the deck's purpose explicit, and the audience clear?
- Does each slide carry one message, under a conclusion title?
- Are facts, assumptions, and targets separated?
- Is every visual tied to the claim it supports?
- Is RTL handled, if the deck is in Hebrew?
- Is the output copy-ready — pasteable with zero edits?
- Does the whole thing lead the audience to the decision named in Step 1?
