# TRACE UI prototype

Interactive Vue 3 prototype for the fictional investigation in ../TRACE_Architecture.md.

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


## Ten-timeline exploration

The default page now opens **T1**. These throwaway views answer: **How can an operator scan a dense investigation, discover patterns independently of the assistant, and drill down to evidence?** The chat stays on the right in every view. No timeline has been selected yet.

Run `npm run dev`; switch with the floating 01–10 bar or left/right arrows. The switcher is development-only. Each view is also directly addressable:

| Key | URL | Design question |
| --- | --- | --- |
| T1 — Source lanes | http://localhost:5173/?variant=T1 | What happened across systems at the same moment? |
| T2 — Density matrix | http://localhost:5173/?variant=T2 | Which source/time cell deserves investigation? |
| T3 — Activity river | http://localhost:5173/?variant=T3 | Which sources contributed to a change in total volume? |
| T4 — Entity tracks | http://localhost:5173/?variant=T4 | What happened to the same entity across sources? |
| T5 — State ribbons | http://localhost:5173/?variant=T5 | Which durations, outages and evidence gaps overlap? |
| T6 — Chronicle | http://localhost:5173/?variant=T6 | What did each system record in successive time windows? |
| T7 — Time lens | http://localhost:5173/?variant=T7 | Can we investigate seconds while retaining the full-day context? |
| T8 — Message paths | http://localhost:5173/?variant=T8 | Where does a traceable message path stop having delivery evidence? |
| T9 — Small multiples | http://localhost:5173/?variant=T9 | Do patterns change together, including in quieter sources? |
| T10 — Window comparison | http://localhost:5173/?variant=T10 | How does the incident differ from another five-minute window? |

The shared deterministic fixture contains **24,429 simulated records over 16 hours** (08:00–24:00), five sources, multiple targets, routine traffic variation, the existing 102-second incident, an unrelated archive-error burst, a sensor-quality interval, and a missing sensor-file interval. This is an interaction study with thousands of records, **not a benchmark for hundreds of thousands or millions**.

All variants support filtered evidence inspection. Overview bins count record starts; detail windows include overlapping duration records. Click an aggregate to page through its underlying records, then open an event and its raw source. Use the incident/30-minute/day presets, zoom, pan or the time slider in T1–T6 and T9. T7 has its own five-minute lens, T8 has correlation-group selection, and T10 has its own reference-window selector. These independent controls are explicit in the UI.

T5 deliberately separates simulated state spans from event filters. The no-action span is derived for T-041 only and links its endpoint evidence; missing source data is hatched and does not imply inactivity. T8 separates shared message IDs from entity-only correlation and does not imply causation from temporal order. T9 labels independent per-source scales; T10 uses the same scale in both windows.

Evidence can be sent to the demo assistant. Its prepared replies are marked as simulated. Operator observations can be saved in memory with an optional selected evidence link; they are not approved conclusions. Reloading clears the session. The switcher's information control and console log expose study state.

A useful evaluation pass:
1. Start at the full-day overview and identify a suspicious period without opening chat.
2. Distinguish the alert-service outage from the later unrelated archive burst.
3. Find the missing sensor interval and distinguish it from the derived operator-action gap.
4. Drill into the 102-second interval, inspect source records, and write an evidence-linked observation.
5. Compare a quiet source with a noisy source; decide whether aggregation hid something important.

Implementation: `src/prototypes/timelines/`. The fixed shell is intentionally shared because the decision is about timeline representation, not chat placement or visual branding. The ten views differ in grouping, geometry, time scale, information hierarchy or investigation operation. Screenshots: `artifacts/timeline-T1.png` through `timeline-T10.png`. Browser review exercised all ten primary drill-downs, source evidence, chat citations, observation capture, wraparound switching and laptop-width overflow. Production build and direct production URLs were checked.

The prior six layout designs remain at `?variant=A` through `?variant=F`; the original remains at `?variant=original`. Captured on `media/one-brain-video`; no implementation issue was supplied. Verdict pending operator review.
