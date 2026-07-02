# Manual Test Cases: AgentCast Dashboard

Companion to [test-plan.md](test-plan.md). Run against `npm run dev` (`web/`) in mock mode unless a case says otherwise. Mock fixture counts referenced below come from `web/src/data/mock.ts`.

**Format:** ID · Priority (P0–P3) · Steps → Expected. Preconditions are stated once per section when shared.

---

## 1. Routing & Navigation (`router.ts`)

_Precondition: dev server running at `localhost:5173`._

**TC-NAV-001** (P0) — Default route

1. Open `/` with no hash. **Expected:** Prototypes view loads, "Prototypes" nav item is `aria-current="page"`.

**TC-NAV-002** (P1) — Direct nav links

1. Click Sandbox, Tests, System nav items in turn. **Expected:** each loads its view, its own nav item becomes active, the previous one deactivates.

**TC-NAV-003** (P0) — Detail route with valid id

1. Navigate to `#/prototype/landing-hero`. **Expected:** Detail view for "Landing hero" loads; "Prototypes" nav item stays highlighted (not a dead 4th state).

**TC-NAV-004** (P1) — Detail route with unknown id

1. Navigate to `#/prototype/does-not-exist`. **Expected:** "Prototype not found" empty state renders; breadcrumb reads "Prototype not found", not a blank/undefined name.

**TC-NAV-005** (P1) — Unknown top-level route

1. Navigate to `#/nonsense`. **Expected:** NotFound view renders; no sidebar nav item is highlighted.

**TC-NAV-006** (P2) — Malformed prototype route

1. Navigate to `#/prototype/` (trailing slash, no id). **Expected:** falls through to NotFound (no `seg1` present), does not crash or render a blank Detail.

**TC-NAV-007** (P2) — Document title sync

1. Visit Prototypes, then a Detail page, then an unknown route. **Expected:** browser tab title updates to "Prototypes — AgentCast", "Landing hero — Prototype — AgentCast", and "Page not found — AgentCast" respectively.

**TC-NAV-008** (P1) — Back/forward browser buttons

1. Navigate Prototypes → Sandbox → Tests, then use browser Back twice. **Expected:** returns to Sandbox then Prototypes via `hashchange`, without a full page reload.

---

## 2. Prototypes view — Prototypes tab

**TC-PROTO-001** (P0) — Default listing

1. Load Prototypes view. **Expected:** "Prototypes" sub-tab active by default; all 6 mock prototypes render; toolbar reads "6 prototypes".

**TC-PROTO-002** (P0) — Status filter chips

1. Click "Live". **Expected:** only `landing-hero` and `dashboard-shell` show (status = live).
2. Click "Drafts". **Expected:** only `pricing-page` and `onboarding` show.
3. Click "Passed". **Expected:** only `checkout-flow` shows.
4. Click "Failed". **Expected:** only `settings-panel` shows.
5. Click "All". **Expected:** all 6 return.

**TC-PROTO-003** (P1) — Live-status indicator

1. Inspect the `landing-hero` and `dashboard-shell` cards. **Expected:** each shows the amber "live" dot overlay on its thumbnail; other cards do not.

**TC-PROTO-004** (P1) — Card thumbnail vs. icon fallback

1. Inspect a prototype with a screenshot vs. one without (or with an unreachable image path). **Expected:** with a valid latest screenshot, the thumbnail image renders; on `onError` (broken/missing file), it falls back to the device-type icon (monitor/mobile), never a broken-image glyph.

**TC-PROTO-005** (P0) — Card navigation

1. Click a prototype card. **Expected:** navigates to `#/prototype/{id}` and loads that prototype's Detail view.

**TC-PROTO-006** (P3) — No-match empty state

1. Attempt to reach a status filter with zero matches. **Expected (design intent):** "No results found" empty state renders. **Note:** not reproducible with current mock fixtures (every status chip has ≥1 match); verify instead in live mode with a data set that has zero prototypes of some status.

---

## 3. Prototypes view — Screenshots sub-tab

**TC-SC-001** (P0) — Sub-tab switch

1. Click "Screenshots" sub-tab. **Expected:** view switches to the captures grid, toolbar reads "8 captures" (all 8 mock screenshots).

**TC-SC-002** (P1) — Proto filter chips derived from data

1. Inspect the chip row. **Expected:** "All" plus one chip per distinct `proto` name found in `SCREENSHOTS` (`screenshotProtos()`) — chip set updates automatically if a prototype is renamed/added, no hardcoded list.

**TC-SC-003** (P1) — Filter by prototype

1. Click a specific proto chip (e.g., "Checkout flow"). **Expected:** only that prototype's captures show (2 for Checkout flow in mock: v4 preview, v5 critique).

**TC-SC-004** (P2) — Stage tag styling

1. Compare a "critique"-stage card to a "preview"-stage card. **Expected:** critique stage renders with the distinct `crit` tag styling; preview does not.

**TC-SC-005** (P1) — Relative time display

1. Inspect capture timestamps. **Expected:** each card shows a live-computed relative time (e.g., "0m"/"just now", "6m", "27m") matching its `capturedAt` offset, not a frozen string.

**TC-SC-006** (P1) — Screenshot card navigation

1. Click a screenshot card. **Expected:** navigates to `#/prototype/{protoId}` (the owning prototype's Detail view), not a screenshot-specific page.

**TC-SC-007** (P2) — Independent filter/tab state

1. On the Prototypes tab, set filter to "Live". Switch to Screenshots tab and set a proto filter. Switch back to Prototypes tab. **Expected:** the Prototypes tab's "Live" filter is preserved, unaffected by the Screenshots tab's filter (`filter.prototypes` and `filter.screenshots` are independent).

---

## 4. Detail view

**TC-DETAIL-001** (P0) — Header rendering

1. Open `#/prototype/landing-hero`. **Expected:** name "Landing hero", status pill "Live", device/viewport readout matches `VIEWPORTS['Desktop']` (1440×900), device Seg control shows Desktop/Tablet/Mobile with Desktop active.

**TC-DETAIL-002** (P1) — Device Seg toggle

1. Click "Tablet", then "Mobile" in the Seg control. **Expected:** the device/viewport readout updates to `834×1112` then `390×844` respectively; the change is local to Detail's own `seg.detail` state.

**TC-DETAIL-003** (P0) — Versions scoped per prototype

1. Open `landing-hero`'s "Captured versions" panel. **Expected:** exactly `v3` and `v4` listed (mock data), `v4` marked "· current". No other prototype's versions appear.
2. Open `checkout-flow`'s Detail. **Expected:** its own versions (`v4`, `v5`) show — confirms no cross-prototype leak (`versionsFor` scoping).

**TC-DETAIL-004** (P0) — Preview reflects latest version

1. On `landing-hero`, confirm the Preview panel shows the `v4` screenshot (the latest), not `v3`.

**TC-DETAIL-005** (P1) — Loop progress reflects derived stage

1. On `landing-hero` (latest screenshot stage = `critique`). **Expected:** Build and Preview steps show "done"/"completed"; Screenshot-critique step shows "live"/"running…"; Refine and Test remain queued.
2. Repeat on a prototype whose latest capture stage is `preview` (e.g., `pricing-page`). **Expected:** Preview step is "live", Screenshot-critique/Refine/Test remain queued.

**TC-DETAIL-006** (P0) — Findings scoped to latest version only

1. On `landing-hero`, open "Critique findings". **Expected:** exactly 3 findings shown (all tagged `v4` in mock), count reads "3 open".
2. Confirm no `v3`-tagged finding would appear if one existed (`findingsFor` keeps only the numerically-latest version per prototype) — cross-reference the equivalent assertion in `data.check.mjs`.

**TC-DETAIL-007** (P2) — Finding severity presentation

1. Inspect the 3 `landing-hero` findings (high/med/low). **Expected:** each renders with severity-distinct styling and a screen-reader-only "X severity finding:" prefix ahead of the visible text.

**TC-DETAIL-008** (P2) — No-findings empty state

1. Open a prototype with no findings (e.g., `dashboard-shell`). **Expected:** "No findings" empty state renders instead of an empty list.

**TC-DETAIL-009** (P1) — Breadcrumb navigation

1. From a Detail page, click the "Prototypes" breadcrumb link. **Expected:** returns to `#/prototypes` with any prior filter state intact.

**TC-DETAIL-010** (P1) — Preview mode toggle renders video element

1. On a Detail page, in the Preview panel's mode Seg control (`aria-label="Preview mode"`), click "Video". **Expected:** the screenshot image is replaced by a `<video controls>` element with `src` pointing at `/artifacts/{id}-{ver}.webm` for the version shown (the prototype's latest version); clicking back to "Screenshot" restores the image view.

**TC-DETAIL-011** (P1) — Missing recording fallback is per-version

1. With "Video" mode active and no matching file at `/artifacts/{id}-{ver}.webm` (the default in mock mode, and in live mode for any version without a captured recording). **Expected:** the `<video>` element's `onError` fires (404) and it is replaced by a "No recording for this version" message instead of a broken player.
2. Repeat on a different prototype/version whose `.webm` does exist. **Expected:** that Detail page's Video mode renders the playable `<video>` element instead of the fallback — confirms the check is scoped to that specific prototype+version (`videoSrc(id, ver)`), not a single global flag.

---

## 5. Sandbox view

**TC-SANDBOX-001** (P1) — Default load

1. Open Sandbox. **Expected:** "Running" status pill shown, device Seg defaults to Desktop, Preview panel populated.

**TC-SANDBOX-002** (P0) — Preview shows globally latest capture

1. Confirm the Preview panel targets the single most-recently-captured screenshot across _all_ prototypes (by `capturedAt`, not array position) — in mock data, `landing-hero` v4 (`ago(0)`). **Expected:** matches, not whichever prototype happens to be first/last in the array.

**TC-SANDBOX-003** (P1) — Device state isolation from Detail

1. Set Sandbox's device Seg to "Mobile". Navigate to a Detail page and check its device Seg. **Expected:** Detail's device selection is unaffected (`seg.sandbox` and `seg.detail` are independent state slices).

**TC-SANDBOX-004** (P1) — Session panel

1. Inspect the "Session" panel. **Expected:** 5 KV rows in mock mode (Prototype, Viewport, URL, Dev server, Started) matching `SESSION` fixture values.

**TC-SANDBOX-005** (P1) — Live log rendering

1. Inspect the "Live log" panel. **Expected:** 4 entries render in order with `<b>` markup parsed into bold text (not literal tags); the entry with `cur: true` is visually marked and carries `aria-current="step"`.

**TC-SANDBOX-006** (P2) — Empty session/log (live mode)

1. In live mode with no `state.json`/`log.jsonl` present, open Sandbox. **Expected:** Session and Log panels each show their own empty state ("No session data", "No log entries") without a crash.

**TC-SANDBOX-007** (P1) — Video toggle for latest capture

1. On Sandbox, click "Video" in the Preview panel's mode Seg control. **Expected:** the same Screenshot↔Video toggle behavior as Detail applies here, scoped to the globally latest capture (`activeProtoId`/`activeVer`); with no matching `.webm` present, "No recording for this version" renders instead of the video element.

---

## 6. Tests view

**TC-TESTS-001** (P0) — Summary stats

1. Open Tests view. **Expected:** Passing = 2 (Checkout flow, Dashboard shell), Failing = 2 (Pricing page, Settings panel), Suites = 6 — counted by suite _status_, not by raw check totals (a "running" or "queued" suite must not be double-counted into passing/failing).

**TC-TESTS-002** (P1) — Passed row rendering

1. Inspect the "Checkout flow" row (24/24). **Expected:** full bar, "24/24" text, green "Passed" pill.

**TC-TESTS-003** (P1) — Failed row rendering

1. Inspect "Pricing page" (14/16). **Expected:** partial bar sized to 87–88%, "14/16" text, red "Failed" pill.

**TC-TESTS-004** (P1) — Running row rendering

1. Inspect "Landing hero" (running). **Expected:** "running" muted text (no fraction), indeterminate/pulsing bar treatment, amber "Running" pill.

**TC-TESTS-005** (P1) — Queued row rendering

1. Inspect "Onboarding" (queued). **Expected:** "—" placeholder text, no bar fill, neutral "Queued" pill.

**TC-TESTS-006** (P2) — Accessible progress values

1. Inspect the DOM/accessibility tree for each row's result region. **Expected:** `role="progressbar"` with `aria-valuenow` matching the visually rendered percentage (100 / computed % / 40 / 0 respectively for passed/failed/running/queued).

**TC-TESTS-007** (P2) — No tests empty state

1. In live mode with no `tests.jsonl`, open Tests. **Expected:** "No tests" empty state; summary stats show 0/0/0 without a divide-by-zero error.

**TC-TESTS-008** (P0) — Findings gate a clean-checks suite to Failed

1. Using live-mode data (or via `data.check.mjs`'s equivalent assertion), construct a run with `pass === total` but a `high`-severity finding on that prototype+version. **Expected:** suite status is "Failed", not "Passed" — a clean check count alone does not guarantee a pass.

---

## 7. System view

**TC-SYS-001** (P1) — Settings group

1. Open System view, inspect "Environment" panel. **Expected:** exactly 5 flat KV rows (Default viewport, Image format, Dev server port, Theme, Accent); no toggle/switch controls present (none of these values are currently configurable).

**TC-SYS-002** (P1) — Server panel

1. Inspect "Server" panel. **Expected:** Server/Transport/Status/Uptime-or-Recent-activity rows; Status renders as a colored pill (live/draft-styled) matching connection state.

**TC-SYS-003** (P1) — Exposed tools panel

1. Inspect "Exposed tools" panel. **Expected:** count badge equals the number of listed tools; each row shows a tool name and its call count.

**TC-SYS-004** (P2) — Recent calls truncation

1. Inspect "Recent calls" rows. **Expected:** each shows relative time + tool name + JSON args; args longer than 60 characters are truncated with a trailing "…", args at or under 60 characters render in full (boundary case).

**TC-SYS-005** (P2) — Empty MCP panels (live mode)

1. In live mode before any MCP calls have been logged. **Expected:** Server/Exposed tools/Recent calls each show their own independent empty state, not a shared or missing one.

**TC-SYS-006** (P1) — Console panel lists only error-level entries

1. Open System view, inspect the "Console" panel. **Expected:** count badge and row count equal `CONSOLE.length` — 2 entries in mock mode (`mock.ts`). In live mode, `CONSOLE` is pre-filtered in `live.ts` to keep only error-level lines returned by `browser_console_messages` calls (summary/header lines like "Total messages:"/"Returning N messages" are excluded); there is no filter UI, the panel simply renders whatever `CONSOLE` contains.

**TC-SYS-007** (P1) — Network panel lists only failed/4xx–5xx requests

1. Open System view, inspect the "Network" panel. **Expected:** count badge and row count equal `NETWORK.length` — 2 entries in mock mode (`mock.ts`). In live mode, `NETWORK` is pre-filtered in `live.ts` to keep only lines from `browser_network_requests` calls that end in `[FAILED]` or a 4xx/5xx status; successful requests never appear, and there is no filter UI control — the array itself is the assertion.

**TC-SYS-008** (P2) — Empty Console/Network panels (live mode)

1. In live mode with no console errors or failed network requests logged. **Expected:** Console and Network panels each render their own empty state ("No console errors" / "No failed requests") instead of a shared or missing one. **Note:** not reproducible with current mock fixtures — `mock.ts` populates both `CONSOLE` and `NETWORK` with 2 entries each; this case requires live mode with no error-level console output and no failed requests captured.

---

## 8. Data source behavior (mock vs. live)

**TC-DATA-001** (P0) — Default mock mode

1. Run `npm run dev` with no `VITE_DATA_SOURCE` set. **Expected:** all views render the deterministic `mock.ts` fixtures described above.

**TC-DATA-002** (P1) — Live mode, no files present

1. Set `VITE_DATA_SOURCE=live`, ensure `web/public/state.json` and the `*.jsonl` files are absent, restart dev server. **Expected:** every view renders its empty state; no thrown/unhandled error; at most one console `warn` per missing resource (no runaway warning loop from the 2s poll).

**TC-DATA-003** (P1) — Live mode, data appears while app is open

1. With the app open in live mode, write a valid `state.json` (with a `screenshots` array) to `web/public/`. **Expected:** within ~2 seconds, Prototypes/Screenshots/Sandbox update to reflect the new data without a manual page refresh (`live-data-update` event fires and views re-render).

**TC-DATA-004** (P1) — Live "agent running" recency window

1. In live mode, set a screenshot's `capturedAt` to under 5 minutes ago. **Expected:** its prototype's derived status is "live" and the AgentPill shows "Agent running".
2. Set `capturedAt` to over 5 minutes ago. **Expected:** status becomes "draft" and the AgentPill disappears.

**TC-DATA-005** (P0) — Automated data-layer regression

1. Run `npm run check` (`web/`). **Expected:** exits 0, prints "data check: ok" — covers `filterPrototypes`, `filterScreenshots`, `findingsFor`, `testStatus`, `testSummary`, `deriveLoop`, `versionsFor`, `loopFor`, `relativeTime`, `deriveAgent`.

---

## 9. Responsive layout

**TC-RESP-001** (P1) — Sidebar collapse at 860px

1. Resize viewport to ≤860px width. **Expected:** sidebar collapses to a 64px icon-only rail; labels and the "Workspace" section header disappear together; nav items remain clickable and keyboard-focusable.

**TC-RESP-002** (P2) — Prototypes grid reflow

1. Resize to ≤53.75em (Prototypes/UI breakpoint). **Expected:** card grid reflows to fewer columns without overlapping cards or clipped text.

**TC-RESP-003** (P2) — System grid reflow

1. Resize to ≤47.5em. **Expected:** System's settings/MCP panel grid collapses to a single column.

**TC-RESP-004** (P2) — Tests table reflow

1. Resize to ≤44em and ≤35em (Tests breakpoints). **Expected:** table columns adapt without overlapping the pass/fail text or status pill.

---

## 10. Accessibility

**TC-A11Y-001** (P1) — Keyboard-only pass

1. Using only Tab/Shift+Tab/Enter, traverse sidebar nav, sub-tabs, filter chips, device Seg controls, and prototype/screenshot cards. **Expected:** every interactive element is reachable in a logical order and shows a visible focus indicator; nothing is a keyboard trap or unreachable.

**TC-A11Y-002** (P1) — Reduced motion respected

1. Enable `prefers-reduced-motion: reduce` at the OS/browser level. **Expected:** the live-status pulse, record-dot, and any other looping animation stop animating (per the `@media (prefers-reduced-motion: reduce)` rules in `styles.css`, `Shell.module.css`, `Prototypes.module.css`, `Detail.module.css`, `ui.module.css`).

**TC-A11Y-003** (P2) — ARIA roles/labels present and correct

1. Inspect the accessibility tree for the sub-tab group ("View mode"), the device Seg group ("Select viewport"), and Tests' `role="progressbar"` regions. **Expected:** each exposes the expected role/label and current value/state.

---

## 11. Error handling

**TC-ERR-001** (P0) — Render error is caught and recoverable

1. Force a render-time throw in a view (e.g., via React DevTools component override or a temporary debug throw). **Expected:** `ErrorBoundary` renders a "Render error" card with the error message and Retry / Reload / Copy error actions; the sidebar and other routes remain usable.

**TC-ERR-002** (P2) — Copy error action

1. From the crashed state, click "Copy error". **Expected:** the error message is copied to the clipboard (paste to verify).

**TC-ERR-003** (P1) — Boundary resets per route

1. From a crashed view, navigate to a different nav item, then back. **Expected:** the boundary remounts fresh (`key={active}`) and re-attempts rendering the target view rather than staying stuck in the error state.

---

## Priority Summary

| Priority | Count | Run cadence                                             |
| -------- | ----- | ------------------------------------------------------- |
| P0       | 16    | Every change touching `web/src/views` or `web/src/data` |
| P1       | 36    | Every feature branch before merge                       |
| P2       | 17    | Before a local "release" checkpoint                     |
| P3       | 1     | Opportunistic                                           |

Total: 70 test cases.
