---
name: presentation-create
description: Create a presentation the E.D.E.A way — sharpen the ask into an executive-grade
  brief (audience, goal, one message per slide, Hebrew RTL handled), then generate the deck
  itself in NotebookLM and hand back the PPTX, or produce a copy-ready brief for another
  tool. Also covers slide-by-slide structures, infographic descriptions, visual design
  briefs, and improving an existing deck. Use when the user wants a presentation, deck,
  slides, pitch deck, or infographic — or says מצגת, שקפים, or אינפוגרפיקה — or wants a
  prompt for NotebookLM, Gamma, or a similar generator, whether creating new or improving
  one that exists.
---

# Create a presentation (E.D.E.A house format)

**Read `DECKCRAFT.md` first** — it sits beside this file. It holds the quality bar, the
story frames, the design system, the Hebrew RTL rules, the templates, and the checklist.
Everything below assumes it. Open `NOTEBOOKLM.md` only when you reach Step 5.

## Step 1 — Three things before anything

Continue only when you can state each of these in one line:

- **Audience** — who sits in front of it: investors, a partner, the board, the team?
- **Goal** — the decision, belief, or action the deck should produce.
- **Language** — Hebrew (which means full RTL, per `DECKCRAFT.md`) or English.

If any is missing, ask — one specific question at a time, with the likely answer attached
so the user can just pick:

- "Who is this for? Sounds like investors, since you mentioned a round."
- "What should they do after seeing it — agree to a pilot, or just understand the product?"
- "Hebrew or English? The audience you named suggests Hebrew."

One rule that applies to every output: **work only with the facts you were given.** A number
you don't have becomes a marked assumption (`Assumption`, `Target`, `Validation required` —
or הנחה / יעד in Hebrew), stated as such on the slide. Framing and sharpening are your job;
inventing evidence is not.

## Step 2 — Pick the output

The user's words pick it. If two could fit, ask, suggesting the likely one.

| The user wants                                              | You produce                                    |
| ----------------------------------------------------------- | ---------------------------------------------- |
| "Make me a deck / מצגת" — the finished thing                | Brief → NotebookLM → PPTX (Steps 3–5)          |
| A prompt to paste into NotebookLM, Gamma, or similar         | Compact description, per the template          |
| A structure to build themselves, or asked for N slides       | Slide-by-slide architecture                    |
| Design direction only                                        | Visual design brief                            |
| An infographic, timeline, funnel, or roadmap visual          | Infographic description                        |
| An existing deck made better                                 | Improvement pass (Step 6)                      |

## Step 3 — Build the brief

Apply `DECKCRAFT.md`: pick the story frame that fits the deck type and keep only the
sections that strengthen the argument; give every slide one message and a conclusion title;
separate fact, assumption, and target; tie every visual to the claim it supports; apply the
RTL rules when the language is Hebrew.

The brief is done when it passes the checklist at the end of `DECKCRAFT.md`.

## Step 4 — Ask where to deliver

Before running anything, ask: **"Generate the deck in NotebookLM now, or hand you the
brief?"**

- **Generate** → Step 5.
- **Hand it over** → give the copy-ready output in the shape `DECKCRAFT.md` defines, with
  no commentary around it, and stop.

## Step 5 — Generate and hand over

Follow the pipeline in `NOTEBOOKLM.md`: preflight check, notebook, sources, generate,
download. Two things to hold onto from it:

- Generation takes **15–45 minutes**. Start it, tell the user it's running and roughly how
  long, and don't sit blocked waiting.
- If the CLI is missing or broken, say so plainly, hand over the copy-ready brief so the
  user can paste it into NotebookLM themselves, and point them at the one-time setup in
  `NOTEBOOKLM.md` — or at a developer.

When the file is ready, give the user its path and offer slide-by-slide revisions — small
fixes go through `revise-slide` in `NOTEBOOKLM.md`, not a regeneration.

## Step 6 — Improving an existing deck

Work from what the deck is trying to achieve, not from what's on the slides. Fix the
strategic focus, the slide order, the titles, the message hierarchy, redundancy, credibility,
and RTL quality — and rebuild weak structure rather than preserving it because it exists.

If we generated the deck and its notebook still exists, offer targeted `revise-slide` fixes
through `NOTEBOOKLM.md` before proposing a rebuild.

## Where this stops

Hand over the brief or the deck, then stop: building in Figma or Canva, generating images,
and writing speaker notes or talk tracks are separate asks the user makes explicitly.
