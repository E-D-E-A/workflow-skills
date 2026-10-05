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
