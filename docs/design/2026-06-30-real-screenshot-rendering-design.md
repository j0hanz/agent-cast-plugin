[meta]
date: 2026-06-30
topic: Real screenshot rendering for Preview and ScreenshotCard (roadmap item 2)
status: approved (locked via interview + Phase 5 critique 2026-06-30)

## Approach
Derive each screenshot's image path from data already in the `SCREENSHOTS`
shape via a pure helper, `screenshotSrc(protoId, ver)` → `/screenshots/{protoId}-{ver}.png`.
`Preview` (`web/src/components/ui.jsx`) and `ScreenshotCard`
(`web/src/views/Prototypes.jsx`) render an `<img>` at that path with an
`onError` fallback to today's decorative placeholder markup. Captures are
written to `web/public/screenshots/` (gitignored), served by Vite's built-in
static-file handling — no backend.

## Why
No backend exists in this repo. `web/public/` is the only zero-config way to
get a real file in front of the React app. Deriving the path (instead of
storing an explicit `src` field) needs no schema change — `SCREENSHOTS`
entries already carry `protoId` and `ver` — and makes the capture convention
self-documenting: write a file matching the pattern and it appears, no
separate "register it" step. Confirmed via interview over the explicit-`src`
alternative.

## Scope
L. `PrototypeCard` thumbnails are explicitly deferred (confirmed via
interview) — it only has a prototype id, no version, and would need a new
`latestScreenshot(protoId)` lookup that's out of scope for "render a real
screenshot." Items 3-6 (automated capture triggering, live MCP/test data,
etc.) remain separately scoped roadmap items.

## Constraints
- `web/public/screenshots/` must be added to `web/.gitignore` — captured PNGs
  are regenerated artifacts, not source (same precedent as the existing
  `.playwright-mcp` root-gitignore entry).
- File format is PNG (matches `browser_take_screenshot`'s explicit `type`
  param) — the derived path assumes `.png`, don't mix formats.
- No automated capture trigger exists yet. Capturing a screenshot today means
  manually calling Playwright MCP's `browser_take_screenshot` with
  `filename: 'web/public/screenshots/{protoId}-{ver}.png'`, then adding/
  updating the matching `SCREENSHOTS` entry in `live.js` (or `mock.js` for
  design-time fixtures) by hand.
- Real `alt` text required on both new `<img>` tags (accessibility, not
  optional): `` `${s.proto} — ${s.stage} capture, ${s.ver}` `` for
  `ScreenshotCard`; `` `${id} screenshot preview` `` for `Preview`.

## Interface
```js
// data.js — new pure helper, alongside cap/deviceIcon
export const screenshotSrc = (protoId, ver) => `/screenshots/${protoId}-${ver}.png`;
```
`Preview({ id, ver })` — gains a `ver` prop (callers must pass the version
being shown); renders `<img src={screenshotSrc(id, ver)} onError={...} alt={...}>`
when not in fallback state, else today's existing decorative JSX unchanged.
`ScreenshotCard({ s })` — same pattern using `s.protoId`/`s.ver`.

## Architecture
Fallback is a local `useState` flag per component instance, flipped by
`onError`, which swaps to rendering the **existing placeholder markup**
(no `src` attribute, no network request) — never a second `<img src>`.
This is the guardrail that prevents an `onError`-triggers-another-404 loop
(Phase 5 Skeptic finding). No data-shape change, no async loading state, no
new dependency.

## Risks
- None blocking. Git bloat risk fully mitigated by the gitignore entry.
  Security: capture path is chosen by Claude's own tool calls, not
  user-input-driven — no new attack surface (Constraint Guardian, accepted).
- `PrototypeCard` keeps showing its device-icon placeholder until a future
  cycle adds `latestScreenshot()` — by design, not an oversight.

## First Step
1. Add `web/public/screenshots/` to `web/.gitignore`.
2. Add `screenshotSrc(protoId, ver)` to `web/src/data/data.js`.
3. Update `Preview` in `ui.jsx` to accept `ver`, render the `<img>` +
   `onError` fallback + `alt` text.
4. Update `ScreenshotCard` in `Prototypes.jsx` the same way.
5. Update `Preview`'s two call sites (`Detail.jsx`, `Sandbox.jsx`) to pass `ver`.
