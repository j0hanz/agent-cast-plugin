[meta]
date: 2026-06-30
topic: JSON manifest contract for live.js (roadmap item 3)
status: approved (locked via interview + Phase 5 critique 2026-06-30)

## Approach
`live.js` does a one-time top-level `await fetch('/state.json')` before its
exports are evaluated, wrapped in try/catch covering both the fetch and the
`.json()` parse. On any failure (file missing, network error, malformed JSON,
or running outside a browser e.g. `data.check.mjs`), it silently falls back to
today's empty values — with a `console.warn` breadcrumb for debugging.
`web/public/state.json` (gitignored) is a `{ screenshots: [...] }` envelope;
only `SCREENSHOTS` is manifest-backed this cycle.

## Why
Empirically confirmed (live test, since reverted): editing `live.js` directly
already propagates to a running dev session via Vite's existing HMR/file-watch,
with zero new code. That would have been sufficient — except the actual
driver here is a future background process (roadmap items 4-6's automation)
that runs outside any Claude-edited source file and needs a stable data
format to write to, not valid JS module syntax. A JSON manifest is the
minimum needed to support that, confirmed via interview over the
zero-code alternative.

## Scope
M, flagged for Phase 5 (first async/network-fetch pattern in this codebase,
and it defines an external file contract future automation depends on — risk
came from precedent-setting, not diff size). `SCREENSHOTS`-only — confirmed
via interview over designing the full `live.js` schema upfront; `AGENT`, `MCP`,
`TESTS`, etc. stay hardcoded empty until their own roadmap items (4-6) build
real producers.

## Constraints
- The async-ness is absorbed entirely at the module-graph level via top-level
  await — no `useEffect`, no loading state, no hook rewiring in any of the 8
  view files. They keep importing `SCREENSHOTS` from `data.js` exactly as today.
- Mock mode is completely unaffected — still 100% synchronous, this only
  touches the `VITE_DATA_SOURCE=live` path.
- `web/public/state.json` must be gitignored (same precedent as
  `web/public/screenshots/`) — it's a generated artifact, not source.
- Fallback is silent to the user (no error UI anywhere in this app today,
  consistent with item 2's `onError` precedent) but logs via `console.warn`.
- `state.screenshots` must be validated as an array before use
  (`Array.isArray`), not just null-checked — a malformed manifest must not
  crash `filterScreenshots`'s `.filter()`.

## Interface
```js
// live.js
let state = {};
try {
  const res = await fetch('/state.json');
  if (res.ok) state = await res.json();
} catch (err) {
  console.warn('live.js: no usable state.json, falling back to empty state', err);
}

export const SCREENSHOTS = Array.isArray(state.screenshots) ? state.screenshots : [];
// unchanged: AGENT, PROTOTYPES, VERSIONS, LOOP, FINDINGS, SESSION, LOG,
// TESTS, MCP, MCP_TOOLS, MCP_CALLS, SETTINGS stay hardcoded empty
```
`web/public/state.json` shape: `{ "screenshots": [{ protoId, proto, kind, stage, ver, time }, ...] }` — same entry shape as `SCREENSHOTS` always had.

## Architecture
No new layer, no new dependency. Top-level await is native ESM, supported by
Vite's dev server and (to be verified) its production build target. The
manifest is additive: future roadmap items add their own sibling key to the
envelope (`{ screenshots, agent, mcp, ... }`) and their own `Array.isArray`/
shape guard in `live.js`, following this exact pattern — no redesign needed.

## Risks
- None blocking after the two Skeptic fixes (try/catch around `.json()` too;
  `Array.isArray` guard) are built into the Interface above, not deferred.
- Need to confirm `vite build` (not just `vite dev`) handles top-level await
  correctly in `VITE_DATA_SOURCE=live` mode — verifying during implementation.

## First Step
1. Add `web/public/state.json` to `web/.gitignore`.
2. Rewrite `live.js`'s `SCREENSHOTS` export per the Interface above; leave
   every other export untouched.
3. Verify: `npm run check` (Node, no manifest, no browser) still passes;
   `npm run build` and `VITE_DATA_SOURCE=live npm run build` both succeed;
   browser-verify a hand-written `state.json` actually renders in live mode.
