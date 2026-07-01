Status: APPROVED
<!-- receive-plan (contract): APPROVED, 1 critic pass. See video-recording.plan.md
     header for the fix applied and Low findings noted. -->

# video-recording — specs

Implements "Approach C" from `docs/design/2026-07-01-playwright-mcp-adoption-design.md`:
optional per-iteration video recording of a prototype, toggled inside the
existing `Preview` component. This document is the WHAT; `video-recording.plan.md`
is the HOW (ordered, dependency-tracked tasks satisfying the requirements below).

## Requirements

- **REQ-001**: `browser_start_video` can optionally be called in the Preview
  step of `skills/frontend-loop/SKILL.md`, immediately before
  `browser_navigate` (not after), so page-load/transition animations are
  captured from their first frame.
- **REQ-002**: `browser_stop_video` is called unconditionally right after the
  critique screenshot+highlight sequence (before moving to Refine) _if_ a
  recording was started. `browser_annotate` is never called anywhere in
  `SKILL.md` (it blocks an autonomous loop forever waiting on a human).
- **REQ-003**: `videoSrc(protoId, ver)` is a pure helper in
  `web/src/data/data.ts` returning `` `/artifacts/${protoId}-${ver}.webm` ``,
  mirroring the existing `screenshotSrc`.
- **REQ-004**: The `Preview` component (`web/src/components/ui.tsx`) exposes
  a self-contained Screenshot/Video toggle (default: Screenshot). It needs no
  new props — `id`/`ver` (already passed by both call sites) are sufficient
  to compute both `screenshotSrc`/`videoSrc`.
- **REQ-005**: Selecting Video mode renders a native `<video controls>`
  sourced from `videoSrc(id, ver)`. If it fails to load, show an inline "No
  recording for this version" message — never silently revert the toggle
  back to Screenshot mode.
- **REQ-006**: No new hook trigger, jsonl file, exported data type, or
  mock/live parity entry is introduced. Video existence is determined purely
  client-side via the `<video>` element's `onError`, exactly like the
  screenshot `<img>` already does.
- **REQ-007**: The design brief established, by reading playwright-mcp's
  source directly, that `browser_start_video`'s `filename` param resolves
  the output file to the exact given workspace-relative path. That has never
  been confirmed by an actual capture in this repo — REQ-007 requires that
  empirical confirmation to happen before any UI code that depends on it is
  written.

## Explicitly out of scope (do not touch)

- `.mcp.json` — `--caps=testing,config,devtools` is already enabled, no change.
- `hooks/*.sh` — no new hook trigger.
- `web/src/data/types.ts`, `mock.ts`, `live.ts`, `data.check.mjs` — no new
  exported type or mock/live parity entry.
- `web/src/views/Detail.tsx`, `web/src/views/Sandbox.tsx` — both existing
  `<Preview>` call sites are unchanged; the toggle is fully self-contained.
- `browser_start_tracing`/`browser_stop_tracing`, `browser_annotate` — out of
  scope per the locked design brief (tracing has no filename param and no
  in-dashboard viewer; annotate is a hard exclusion, not a gap to fill).

## Acceptance criteria

1. `npm run check && npm run typecheck && npm run lint && npm run build`
   (from `web/` where noted) all pass with zero errors.
2. In the browser (mock data mode), `Preview`'s toggle switches between
   Screenshot and Video without a full page reload, defaults to Screenshot,
   and Video mode shows an honest "No recording for this version" message
   when no `.webm` exists at the expected path (mock data has none).
3. A real `browser_start_video` → `browser_stop_video` capture (done once,
   manually, during implementation) produces a file at the exact path given
   in `filename`, confirming REQ-007 before it's relied upon by the UI.
4. `skills/frontend-loop/SKILL.md` reads unambiguously: an implementer (or
   agent) following it cannot mistake "before navigate" for "before the
   screenshot," and cannot come away thinking `browser_annotate` is ever
   appropriate to call from this skill.
