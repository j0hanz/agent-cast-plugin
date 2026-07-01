[meta]
date: 2026-06-30
topic: Mock/live data-source toggle for the AgentCast dashboard
status: approved (locked via interview 2026-06-30)

## Approach

Split `web/src/data/data.js` into two sibling modules — `mock.js` (today's literal
content, untouched) and `live.js` (same export shape, empty/placeholder values) —
switched by `import.meta.env.VITE_DATA_SOURCE` inside `data.js` itself. The 8 files
that currently `import { X } from '../data/data.js'` do not change.

## Why

`data.js` is already the single seam every view, the router, and the layout import
through (`Prototypes.jsx`, `Sandbox.jsx`, `System.jsx`, `Detail.jsx`, `Shell.jsx`,
`router.jsx`, `Tests.jsx`, `data.check.mjs`). Swapping the source behind that one
seam is the smallest diff that fully separates "content for CSS/layout work" from
"content for real-world testing," with zero new dependencies (Vite env vars are
already idiomatic here) and zero touch to consumers.

## Scope

S/M. New files: `mock.js`, `live.js`. Modified: `data.js` (shrinks to helpers +
switcher), `data.check.mjs` (add shape-parity assertion). No view file changes.

## Constraints

- Flipping `VITE_DATA_SOURCE` requires a dev-server restart (Vite resolves env vars
  at server start) — accepted: design sessions and real-world test sessions are
  separate sittings already, not a per-second toggle.
- `mock.js` and `live.js` must export the exact same key set, or the app silently
  breaks in one mode only. Enforced by extending `data.check.mjs`.
- Pure config/vocab that isn't "content" stays in `data.js`, not duplicated into
  mock/live: `cap`, `deviceIcon`, `STATUS_OF`, `VIEWPORTS`, `NAV`, `SYSTEM`,
  `filterPrototypes`, `filterScreenshots`, `SCREENSHOT_PROTOS` (these last three are
  pure functions/derived values that operate on whichever `PROTOTYPES`/`SCREENSHOTS`
  the switcher resolves — they don't move).

## Interface

Moves to `mock.js` / `live.js` (the actual fake-content exports):
`AGENT, PROTOTYPES, VERSIONS, LOOP, FINDINGS, SCREENSHOTS, SESSION, LOG, TESTS, MCP, MCP_TOOLS, MCP_CALLS, SETTINGS`

Stays in `data.js`: `cap, deviceIcon, STATUS_OF, VIEWPORTS, NAV, SYSTEM, filterPrototypes, filterScreenshots, SCREENSHOT_PROTOS`

```js
// data.js (new shape)
import * as mock from './mock.js';
import * as live from './live.js';
const SRC = import.meta.env.VITE_DATA_SOURCE === 'live' ? live : mock;

export const {
  AGENT,
  PROTOTYPES,
  VERSIONS,
  LOOP,
  FINDINGS,
  SCREENSHOTS,
  SESSION,
  LOG,
  TESTS,
  MCP,
  MCP_TOOLS,
  MCP_CALLS,
  SETTINGS,
} = SRC;

// unchanged: cap, deviceIcon, STATUS_OF, VIEWPORTS, NAV, SYSTEM,
// filterPrototypes, filterScreenshots, SCREENSHOT_PROTOS
```

`live.js` exports the same shape with empty/neutral placeholders: `[]` for list
exports, `AGENT = { running: false, stage: '' }`. No new "not connected" UI is
needed — every consumer already null/empty-guards (`list.length ? … : <EmptyState/>`
in `Prototypes.jsx`, `Sandbox.jsx` LOG; `AgentPill` already returns `null` when
`running` is falsy; `Tests.jsx`'s reduce and `System.jsx`'s `.map()`s degrade to
empty/zero with no crash) — verified by reading all 8 consumers during discovery.

## Architecture

No new layer. `data.js` remains the only import path; the switch is resolved once,
at module load, by Vite's static `import.meta.env` replacement — no runtime
indirection, no extra render cost.

## Risks

- Shape drift between `mock.js`/`live.js` → mitigated by `data.check.mjs` assertion
  (`Object.keys(mock).sort()` deep-equals `Object.keys(live).sort()`).
- `live.js` has nowhere real to read from yet (no backend exists) — out of scope for
  this brief by design; see Roadmap item 3 below.

## First Step

1. `git mv web/src/data/data.js web/src/data/mock.js`, delete the helper functions
   from the bottom of `mock.js` (they move to the new `data.js`, not duplicated).
2. Create `web/src/data/live.js` with the same export names as empty/neutral values.
3. Create new `web/src/data/data.js`: the switcher + the helpers that stayed behind.
4. Extend `web/src/data/data.check.mjs` with the key-set parity assertion.
