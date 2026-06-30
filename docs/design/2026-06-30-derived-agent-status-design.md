[meta]
date: 2026-06-30
topic: Derive AGENT status from SCREENSHOTS recency (roadmap item 4)
status: approved (locked via interview + Phase 5 critique 2026-06-30)

## Approach
Stop tracking `AGENT` as its own hand-maintained field. Add a real
`capturedAt` (ISO 8601) timestamp to every `SCREENSHOTS` entry, replacing the
pre-formatted `time` display string everywhere it's shown. `AGENT.stage`/
`running` and every displayed relative time are computed fresh from
`capturedAt` at render time via pure helpers.

## Why
Claude Code is turn-based, not continuously running — there's no moment a
human observes the dashboard while something is genuinely "in progress," so a
hand-toggled `{running, stage}` flag (the original roadmap framing) would be
theatrical and risks getting stuck stale if a session ends abruptly.
Deriving from real, already-existing capture data can't go stale because
nothing has to remember to reset it. Confirmed via interview over both the
hand-toggled-flag and defer-entirely alternatives.

## Scope
S, flagged for Phase 5 (redefines what "AGENT running" means; touches the
`state.json` manifest contract set in the prior cycle). Confirmed via
interview to also replace `time` everywhere (not just feed `AGENT`) — so
`ScreenshotCard` is in scope too, not just the pill.

## Constraints
- No timer/polling (confirmed via interview) — relative time and `AGENT`
  recompute correctly whenever a component naturally re-renders (navigation,
  state changes). Nothing ticks live on a static screen; this is consistent
  with the rest of the app, which has no polling anywhere.
- Mock mode must render identically to today. `mock.js`'s `capturedAt` values
  are computed as offsets from `Date.now()` at module load (e.g. `Date.now()
  - 2 * 60_000` for "2m ago"), not frozen ISO literals — otherwise the mock
  fixture would go visibly stale the day after it's written.
- `relativeTime(capturedAt)` must handle a missing/invalid timestamp without
  throwing (return `''`/safe default).
- The "most recent" screenshot lookup must compare `capturedAt` values
  directly — `mock.js`'s entries are confirmed NOT in chronological array
  order, so `SCREENSHOTS.at(-1)` or similar position-based shortcuts are
  wrong. Must also handle the empty-array case (the live-mode default)
  without throwing.

## Interface
```js
// data.js — new pure helpers, alongside cap/deviceIcon/screenshotSrc
export const relativeTime = (iso) => {
  if (!iso) return '';
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h`;
  return `${Math.floor(mins / 1440)}d`;
};

const latestScreenshot = (list) =>
  list.reduce((latest, s) => (!latest || s.capturedAt > latest.capturedAt) ? s : latest, null);

export const AGENT = (() => {
  const latest = latestScreenshot(SCREENSHOTS);
  if (!latest) return { running: false, stage: '' };
  const fresh = Date.now() - new Date(latest.capturedAt).getTime() < 5 * 60_000;
  return { running: fresh, stage: fresh ? latest.stage : '' };
})();
```
`SCREENSHOTS` entries: `{ protoId, proto, kind, stage, ver, capturedAt }` —
`time` field removed. `ScreenshotCard` ([Prototypes.jsx](web/src/views/Prototypes.jsx))
renders `relativeTime(s.capturedAt)` instead of `s.time`.

## Architecture
`AGENT` moves from a static export to a derived value computed once at
module evaluation (same timing as today — it's still a plain `const`, just
computed instead of literal). No new reactivity layer, no subscription, no
store change — `useUI`/`useSyncExternalStore` are untouched. Consistent with
this app's existing pattern of pure derived values (`filterPrototypes`,
`SCREENSHOT_PROTOS`).

## Risks
- None blocking after the three Skeptic guards (missing-timestamp safety,
  empty-array safety, recency-by-value not array-position) are built into
  the Interface above, not deferred.
- `AGENT.running`'s 5-minute window is a judgment call, not a measured
  constant — trivially adjustable later, not worth interviewing on.

## First Step
1. Replace `time` with `capturedAt` (ISO 8601) in `mock.js`'s `SCREENSHOTS`
   entries, computed as `Date.now()`-relative offsets.
2. Add `relativeTime()` and the `AGENT` derivation to `data.js`; remove the
   hardcoded `AGENT` export from both `mock.js` and `live.js`.
3. Update `live.js`'s manifest-sourced `SCREENSHOTS` to expect `capturedAt`
   instead of `time` (update the manifest shape note/comment).
4. Update `ScreenshotCard` to render `relativeTime(s.capturedAt)`.
5. Extend `data.check.mjs` if needed to cover the new derivation's edge cases
   (empty array, missing timestamp).
