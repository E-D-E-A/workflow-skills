# TRACE UI prototype

Interactive Vue 3 prototype for the fictional investigation in [TRACE_Architecture.md](../TRACE_Architecture.md).

## Run

```powershell
npm.cmd install
npm.cmd run dev
```

Open http://127.0.0.1:5173. The dev server uses polling because this workspace is on a network drive.

## Interaction

- Select a labeled timeline event to open its details directly below the timeline. Duration events are shown as intervals, including intervals that cross the current window boundary.
- Search the timeline by text or identifier; filter to anomalies; toggle sources using the fixed system-name column.
- Move the time window with the arrow buttons or slider, zoom in/out, focus on the incident, or reset to the full six-minute sample.
- Ask one of the suggested questions; click a citation to select its event.
- Approve a conclusion to save it locally under Lessons. Export downloads those lessons as JSON.

All records and chat answers are simulated. Chat uses prepared scenario answers, with an explicit fallback for unrelated questions. There is no backend, model connection or shared multi-user state. Lessons persist only in the current browser using localStorage. The UI is Hebrew and RTL, with chat on the right and a dark blue palette; chronological time progresses left to right.

## Verify

```powershell
npm.cmd run build
node scripts/check-ui.mjs
```

The browser check requires the dev server at port 5173 and installed Microsoft Edge. It uses an isolated browser context, verifies search/filtering, evidence navigation, approval persistence, timeline focus, chat fallback and narrow-screen overflow. Screenshots are written to artifacts/.

Source: src/App.vue (interactions and layout), src/data.js (fictional scenario), src/style.css (design tokens and responsive styles).

## Six-design exploration

Run `npm run dev` and open http://localhost:5173. The floating bottom bar switches among six structurally different designs; left/right arrow keys also switch unless you are editing a field. Each URL is reload-stable.

| Variant | URL | Direction |
| --- | --- | --- |
| A — Quiet | http://localhost:5173/?variant=A | Light editorial sequence, generous space, optional assistant |
| B — Playback | http://localhost:5173/?variant=B | Dark single-moment stage with chapters and playback controls |
| C — Connections | http://localhost:5173/?variant=C | System/evidence relationship canvas with a detail drawer |
| D — Notebook | http://localhost:5173/?variant=D | Warm document layout with source footnotes and temporary notes |
| E — Studio | http://localhost:5173/?variant=E | Light blue source timeline, movable time window and side assistant |
| F — Conversation | http://localhost:5173/?variant=F | Charcoal conversation-first workspace with on-demand evidence |

The previous prototype remains at http://localhost:5173/?variant=original.

These are throwaway Vue components in `src/prototypes/`, built to answer: **Which layout and information hierarchy make a shared investigation feel light and readable?** No design has been selected yet. The six intentionally prioritize different interactions; they are not six complete production applications. They share the fictional scenario and prepared assistant answers. The variants store state only in memory; a reload clears it. State is visible through the switcher's info control and logged when switching variants.

The comparison bar is development-only. Production builds can open each variant by its URL but hide the comparison controls. Desktop screenshots are in `artifacts/design-A.png` through `design-F.png`. The existing `scripts/check-ui.mjs` remains targeted at the original prototype.
