# Test Plan: AgentCast Dashboard

**Status:** Draft · **Owner:** QA · **Last updated:** 2026-07-01

## Executive Summary

AgentCast is a solo-operator instrument panel for an autonomous frontend coding agent — five views (Prototypes/Screenshots, Detail, Sandbox, Tests, System) rendering data from either a static mock fixture or a live, file-polled data source. There is no backend, no auth, and (per [AGENTS.md](../../AGENTS.md)) no CI and no automated-testing requirement — `web/src/data/data.check.mjs` is the only existing automated check, and it covers pure data functions only, not rendering. This plan makes manual testing the primary safety net for the UI layer.

**Objectives:** confirm each view renders correctly from both data sources, derived state (agent-running pill, loop steps, findings scoping, test-status gating) is computed correctly rather than hand-toggled, navigation/routing is sound, and the app degrades gracefully (broken images, missing live files, render errors).

**Key risks:** see [Risk Assessment](#risk-assessment) below.

## Test Scope

**In scope:**

- All 5 views: Prototypes (incl. Screenshots sub-tab), Detail, Sandbox, Tests, System
- Hash-based routing (`router.ts`), including the 404/NotFound path
- Mock vs. live data source switching (`VITE_DATA_SOURCE`)
- Derived-state logic exercised through the UI: `deriveAgent`, `deriveLoop`, `findingsFor` (latest-version scoping), `testStatus`/`testSummary`, `relativeTime`, `versionsFor`
- Status/filter chips, sub-tab switching, device Seg controls
- Responsive breakpoints (860px sidebar collapse, 53.75em/47.5em/44em/35em component breakpoints)
- Accessibility baseline: keyboard reachability, `aria-current`/`role=progressbar`/`aria-label` usage, `prefers-reduced-motion`
- Image fallback behavior (broken/missing screenshots)
- `ErrorBoundary` crash recovery
- `npm run check` (`data.check.mjs`) as a regression gate

**Out of scope:**

- The Playwright MCP server and Chrome for Testing browser themselves (third-party, not this repo)
- The agent/hook scripts that produce `state.json`/`*.jsonl` (`hooks/*.sh`) — tested only as a data _consumer_, not producer
- Figma design-fidelity comparison (no Figma file has been provided for this app)
- Cross-browser matrix beyond Chromium + a Firefox spot-check (this is a CSS-only app with no browser-specific APIs beyond `clipboard`/`fetch`)
- Load/performance testing (single local operator, no concurrency)
- Text search (removed — filtering is status-chip/proto-chip only; see [test-cases.md](test-cases.md) §2/§3)
- Finding-highlight screenshots (content baked in by the agent's `browser_highlight` call before capture) are agent-side behavior; dashboard QA covers rendering of screenshots regardless of their content, not whether highlights were correctly placed

## Test Strategy

- **Manual functional + exploratory testing** in a browser against `npm run dev` (primary method — no component/UI test framework exists in this repo).
- **Mock-mode first** (deterministic, hardcoded fixture counts in `mock.ts`), **live-mode second** (polling `/state.json` + `*.jsonl` every 2s, must be tested both with files absent and present).
- **Boundary/equivalence testing** on version sort (`v9` vs `v10` string-vs-numeric), timestamp recency windows (5-minute agent-fresh cutoff), and truncation (60-char MCP arg preview).
- **Regression via `npm run check`** for all pure derivation logic before any manual pass.
- **Accessibility spot-checks**, not a full WCAG audit — reduced-motion, keyboard reachability, and the ARIA roles already present in code.

## Test Environment

| Aspect         | Detail                                                                                                                                                                                    |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OS             | Windows 11 (dev machine)                                                                                                                                                                  |
| Browsers       | Chrome/Edge (Chromium) primary; Firefox spot-check                                                                                                                                        |
| Viewports      | 1440×900 (Desktop), 834×1112 (Tablet), 390×844 (Mobile) — matches `VIEWPORTS` map; also test at exactly 860px for the sidebar collapse                                                    |
| Run command    | `npm run dev` from `web/` (default = mock data)                                                                                                                                           |
| Live mode      | Set `VITE_DATA_SOURCE=live` in `web/.env.local`, restart dev server                                                                                                                       |
| Test data      | `web/src/data/mock.ts` — 6 prototypes, 3 findings (all on `landing-hero` v4), 8 screenshots, 6 test runs, 4 MCP calls. Counts are stable and can be hardcoded into test case expectations |
| Live test data | `web/public/state.json` + `*.jsonl` files (gitignored) — test both absent and manually-populated states                                                                                   |

## Entry Criteria

- [ ] `npm run typecheck` passes (`web/`)
- [ ] `npm run check` (`data.check.mjs`) passes (`web/`)
- [ ] `npm run build` completes without error (`web/`)
- [ ] `npm run dev` boots on `:5173` with zero console errors on initial load

## Exit Criteria

- [ ] All P0 test cases in [test-cases.md](test-cases.md) pass in mock mode
- [ ] Smoke suite (see [regression-suite.md](regression-suite.md)) passes in both mock and live mode
- [ ] No open critical/high-severity bug affecting navigation, data derivation, or rendering

## Risk Assessment

| Risk                                                                                                                                                          | Probability | Impact | Mitigation                                                                                                                                 |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| No automated UI/component tests exist — `data.check.mjs` only covers pure functions                                                                           | High        | Med    | This manual suite is the primary UI safety net; re-run the smoke suite after every change touching `web/src/views` or `web/src/components` |
| Live mode is polling + file-based; `state.json`/`*.jsonl` may not exist locally                                                                               | Med         | Med    | Explicit test cases for both absent-file and populated-file states                                                                         |
| Version comparisons rely on parsing `vN` strings numerically (`v10 > v9`)                                                                                     | Low         | Med    | Boundary test cases included in [test-cases.md](test-cases.md)                                                                             |
| "Agent running" pill is derived from a 5-minute freshness window on the latest screenshot's `capturedAt`, not a flag                                          | Med         | Low    | Time-sensitive test case using a deliberately stale timestamp                                                                              |
| Findings/tests are gated by prototype+version scoping (`findingsFor`, `testStatus`) — a regression here silently leaks another prototype's or version's state | Low         | High   | Cross-prototype/cross-version isolation test cases included; `data.check.mjs` already asserts this at the function level                   |

## Test Deliverables

- This test plan (`docs/qa/test-plan.md`)
- Manual test cases (`docs/qa/test-cases.md`)
- Regression suite (`docs/qa/regression-suite.md`)
