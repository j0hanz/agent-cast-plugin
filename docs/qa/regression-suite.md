# Regression Suite: AgentCast Dashboard

Companion to [test-plan.md](test-plan.md) and [test-cases.md](test-cases.md). There is no CI (per AGENTS.md) — this suite is run locally, by hand, at the cadence noted per tier.

## Suite Tiers

| Suite    | Duration   | When                                                                                     | Coverage                                                  |
| -------- | ---------- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| Smoke    | ~10 min    | Every change, before anything else                                                       | App boots, each view loads, core derived state is correct |
| Targeted | ~20–30 min | After a change scoped to one area                                                        | The touched view/module + its direct dependents           |
| Full     | ~45–60 min | Before a local "release" checkpoint, or after touching `data.ts`/`live.ts`/`state/ui.ts` | Every test case in test-cases.md                          |

Small app, no auth, no backend — even "Full" here is under an hour, so there's no separate hour-long tier beyond it.

---

## 0. Pre-suite gate (always run first)

Run before any manual pass. If this fails, stop and fix the build — do not proceed to manual testing.

```bash
cd web
npm run typecheck
npm run check      # data.check.mjs — pure-function regression gate
npm run build
```

**Pass:** all three exit 0. **Fail → block:** any non-zero exit; fix root cause before manual testing.

---

## 1. Smoke Suite (run every change)

Execution order matters: if step 1 fails, stop — nothing downstream is trustworthy.

1. `npm run dev` boots on `:5173` with zero console errors (TC-NAV-001 precondition)
2. **TC-NAV-001** — Default route loads Prototypes
3. **TC-NAV-002** — Sandbox / Tests / System nav links each load their view
4. **TC-NAV-003** — Detail route with a valid id loads
5. **TC-PROTO-001** — Prototypes list renders all 6 mock prototypes
6. **TC-PROTO-005** — Prototype card click navigates to Detail
7. **TC-SC-001** — Screenshots sub-tab renders 8 captures
8. **TC-DETAIL-003** — Versions are scoped per prototype (no cross-prototype leak)
9. **TC-DETAIL-006** — Findings scoped to latest version only
10. **TC-TESTS-001** — Tests summary stats (Passing/Failing/Suites) are correct
11. **TC-SYS-001** — System settings panel renders
12. **TC-DATA-005** — `npm run check` passes (re-confirm as part of the interactive pass, not just the pre-suite gate)

**Pass criteria:** all 12 pass. **Fail:** stop, file a bug, do not proceed to Targeted/Full until fixed.

---

## 2. Targeted Regression (run after a change scoped to one area)

Pick the section matching what changed. Each maps to a group in [test-cases.md](test-cases.md).

### Changed: `web/src/views/Prototypes.tsx` or `Prototypes.module.css`

Run: TC-PROTO-001 → TC-PROTO-006, TC-SC-001 → TC-SC-007, TC-RESP-002
Also re-run Smoke (Prototypes is the default/most-trafficked route).

### Changed: `web/src/views/Detail.tsx` or `Detail.module.css`

Run: TC-DETAIL-001 → TC-DETAIL-009, TC-NAV-003, TC-NAV-004
Integration point: `findingsFor`/`versionsFor`/`loopFor` in `data.ts` — if those changed instead, run this section too.

### Changed: `web/src/views/Sandbox.tsx`

Run: TC-SANDBOX-001 → TC-SANDBOX-006

### Changed: `web/src/views/Tests.tsx`

Run: TC-TESTS-001 → TC-TESTS-008
Integration point: `testStatus`/`testSummary` in `data.ts` — changes there require this full section, not a subset.

### Changed: `web/src/views/System.tsx`

Run: TC-SYS-001 → TC-SYS-005

### Changed: `web/src/data/data.ts`, `web/src/data/live.ts`, `web/src/data/mock.ts`, or `web/src/data/types.ts`

This is a shared dependency for every view — run the **full Smoke suite** plus:
TC-DATA-001 → TC-DATA-005, TC-DETAIL-003, TC-DETAIL-006, TC-TESTS-001, TC-TESTS-008
If `mock.ts`/`live.ts` key parity could be affected, confirm `npm run check` still passes (it asserts this explicitly).

### Changed: `web/src/state/ui.ts`

Run: TC-PROTO-002, TC-SC-007, TC-DETAIL-002, TC-SANDBOX-003 (state isolation between filter/seg groups is the thing most likely to regress here)

### Changed: `web/src/router.ts`

Run: TC-NAV-001 → TC-NAV-008

### Changed: `web/src/components/ui.tsx`, `web/src/components/ErrorBoundary.tsx`, or shared CSS (`styles.css`, `ui.module.css`)

Shared components — run **full Smoke** plus:
TC-A11Y-001 → TC-A11Y-003, TC-ERR-001 → TC-ERR-003, TC-RESP-001 → TC-RESP-004
(`Preview`, `Panel`, `Chips`, `Seg`, `AgentPill`, `EmptyState` are used across every view, so a regression here is wide-blast-radius.)

---

## 3. Full Regression (before a local release checkpoint)

Run every test case in [test-cases.md](test-cases.md) top to bottom, in mock mode first, then repeat the Data Source section (§8) and Smoke-equivalent cases in live mode:

1. §1 Routing & Navigation (8 cases)
2. §2 Prototypes tab (6 cases)
3. §3 Screenshots sub-tab (7 cases)
4. §4 Detail view (9 cases)
5. §5 Sandbox view (6 cases)
6. §6 Tests view (8 cases)
7. §7 System view (5 cases)
8. §8 Data source — **both mock and live mode** (5 cases)
9. §9 Responsive layout at all 4 breakpoints (4 cases)
10. §10 Accessibility (3 cases)
11. §11 Error handling (3 cases)

Total: 64 unique test cases, 69 executions (§8's 5 data-source cases run once in mock mode and once in live mode).

### Pass/Fail Criteria

**PASS:** all P0 cases pass, ≥90% of P1 cases pass, no open critical bug affecting navigation or data correctness.

**FAIL (block):** any P0 case fails, OR a cross-prototype/cross-version data leak is found (findings, versions, or test status bleeding between prototypes), OR the app crashes uncaught (ErrorBoundary itself failing).

**CONDITIONAL:** P2/P3 failures with a documented workaround.

---

## Known Non-Regressions

Do not re-file these as new bugs; they are documented, pre-existing gaps:

- **TC-PROTO-006** (empty filter-result state) is not reproducible with the current mock fixture set — every status chip has at least one match. Verify only via live mode with a sparse data set.

## Suite Maintenance

- Add a test case to §1–§11 whenever a bug is found that these cases didn't catch — regression suites decay if they aren't grown from real misses.
- Re-check the mock fixture counts referenced throughout (6 prototypes, 8 screenshots, 3 findings, 6 test runs, 4 MCP calls) whenever `mock.ts` changes — hardcoded counts in test-cases.md will silently go stale otherwise.
- Review this suite whenever a new view or nav item is added to `NAV`/`SYSTEM` in `data.ts`.
