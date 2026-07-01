---
name: qa-runner
description: This skill should be used when the user asks to "run the QA suite", "run the smoke tests", "run the regression suite", "execute test cases", "run TC-<ID>", "test the AgentCast dashboard", or wants the manual test cases in docs/qa/ executed against the running app via Playwright MCP browser automation.
---

# QA Runner

Drives execution of AgentCast's manual QA suite (`docs/qa/`) against the
running dashboard using Playwright MCP browser tools, standing in for a human
tester clicking through the app. The docs already define what to test — this
skill only describes how to execute it. Read the relevant `docs/qa/` file(s)
fresh each run rather than from memory; fixture counts and case lists change
as the app evolves.

## Source files (do not duplicate their content here)

- `docs/qa/test-plan.md` — scope, environment, entry/exit criteria, risk assessment
- `docs/qa/test-cases.md` — 64 numbered cases (`TC-<AREA>-<NNN>`) across 11
  sections, each with Priority (P0–P3), steps, and expected result
- `docs/qa/regression-suite.md` — pre-suite gate, Smoke (12 cases), Targeted
  (per changed source file), and Full (all 64) tiers, plus pass/fail criteria
  and known non-regressions

## Principles carried over from the QA docs

- **Order matters.** Run the pre-suite gate first, then Smoke. If Smoke
  fails, stop — don't run Targeted/Full against an untrustworthy build
  (`regression-suite.md` §1).
- **Mock mode first, live mode second.** Most cases assume the default mock
  data source; switch to `VITE_DATA_SOURCE=live` only for the cases in
  `test-cases.md` §8 that explicitly call for it, then switch back.
- **A P0 failure blocks the release verdict.** Don't average it away against
  passing P1/P2s — report it as a blocker per `regression-suite.md`'s
  Pass/Fail Criteria (§3).
- **Known gaps are not new bugs.** Check `regression-suite.md`'s "Known
  Non-Regressions" section before filing anything found during a run — e.g.
  TC-PROTO-006 is documented as non-reproducible with current mock fixtures;
  skip it with that note instead of failing it.
- **Cross-prototype/cross-version isolation is the highest-value check.**
  Findings, versions, and test status must never leak between prototypes or
  stale versions (`findingsFor`, `versionsFor`, `testStatus` in
  `web/src/data/data.ts`). Treat any leak as an automatic FAIL regardless of
  the case's stated priority.

## Prerequisites

1. Playwright MCP server available (`mcp__playwright__*` tools).
2. Dev server running at `localhost:5173` (AgentCast's SessionStart hook
   starts it automatically; if it's down, run `npm run dev -- --port 5173`
   in `web/`).
3. Run the pre-suite gate from `regression-suite.md` §0 in `web/` before any
   browser pass:
   ```
   npm run typecheck
   npm run check
   npm run build
   ```
   Stop and report if any of these fail rather than proceeding to browser
   testing on a broken build.
4. For live-mode cases (`TC-DATA-002` through `TC-DATA-004`), set
   `VITE_DATA_SOURCE=live` in `web/.env.local` and restart the dev server;
   restore mock mode afterward.

## Workflow

1. **Scope the run** from the request:
   - Named `TC-XXX-NNN` IDs → run exactly those.
   - "smoke" / no scope given → Smoke suite (`regression-suite.md` §1, 12 cases).
   - A changed source file mentioned → the matching Targeted section
     (`regression-suite.md` §2).
   - "full" / "before release" → Full Regression (`regression-suite.md` §3,
     all 64 cases).
2. **Open the app.** `browser_navigate` to `http://localhost:5173/`, appending
   the case's hash route (e.g. `#/prototype/landing-hero`). `browser_resize`
   first when the case specifies a viewport — see the pixel table in
   `references/playwright-mapping.md`.
3. **Execute each case's steps** using the action → tool mapping in
   `references/playwright-mapping.md`. Take a `browser_snapshot` before
   clicking anything by role/text so element refs are current — the app has
   no stable `data-testid`s.
4. **Verify the expected result.** Prefer `browser_snapshot` (accessibility
   tree) for text/ARIA assertions, `browser_evaluate` for computed-style/DOM
   assertions, and `browser_take_screenshot` for visual/responsive cases.
   Screenshot every FAIL as evidence even when the case doesn't otherwise
   require one.
5. **Watch for what the docs call out as always-relevant**, even outside the
   current scope: `browser_console_messages` after each view load (zero
   console errors is an entry criterion) and cross-prototype/version leaks
   (see Principles above).
6. **Record Pass/Fail/Blocked/Skip per case** as it happens, not just at the
   end — a Full run is 64 cases, and losing track mid-way defeats the point.
7. **Stop early on a P0 failure** inside a Smoke run (per §1's explicit
   rule). For Targeted/Full, keep going but flag every P0 failure
   prominently in the final summary.
8. **Report a summary**: counts by result (mirroring `test-cases.md`'s
   Priority Summary table), the verdict — PASS / FAIL-block / CONDITIONAL —
   per `regression-suite.md` §3's criteria, and full repro detail (steps,
   actual vs. expected, screenshot) for every failure.
9. **Restore state** before finishing: switch back to mock mode if live mode
   was toggled for §8, and revert any temporary source edit made to force a
   render error for `TC-ERR-*` (see Automation limits below).

## Automation limits (read before marking a case Fail)

Some cases can't be driven purely through page-level browser automation —
see `references/playwright-mapping.md` for full detail and workarounds. The
two most common:

- **`TC-A11Y-002` (reduced motion)** — `prefers-reduced-motion` is an
  OS/browser-level media emulation, not a page-JS-settable flag. If no MCP
  tool exposes CDP media emulation, mark this case "not automatable via
  current MCP tool surface" rather than Pass or Fail, and flag it for a
  manual OS-level check.
- **`TC-ERR-001`–`003` (error boundary)** — forcing a React render crash
  from outside the bundle isn't possible via page automation. Temporarily
  add a `throw` in the target view, reload, run the case, then revert the
  edit before finishing the run.

## Additional Resources

- **`references/playwright-mapping.md`** — viewport/breakpoint pixel table,
  per-action tool mapping, full automation-limit workarounds, and the
  fixture-drift check to run before trusting hardcoded expected counts.
