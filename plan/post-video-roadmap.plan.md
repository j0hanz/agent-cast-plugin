# post-video-roadmap — plan

Status: APPROVED

<!-- receive-plan (contract): REVISE round 1 — 1 High + 2 Med fixed inline.
     TASK-006 Validate rewritten as explicit ESM (--input-type=module) to
     remove node -e module-type ambiguity across Node versions; TASK-003/004
     Validate now also assert the Priority Summary counts (P1=36, P2=17) and
     the test-plan.md scope note. Low finding actioned too: TASK-005's run
     record given a greppable `- Run 2026-` bullet format. -->

Depth: contract (2 blind ideators — Conventional, Risk-First — merged by
main-thread synthesis below). See `post-video-roadmap.specs.md` for the
requirements each task satisfies.

## Synthesis

Both ideators converged on the same five-item shape and independently cut
finding-highlight test cases as out of dashboard QA scope — kept as
high-confidence. Kept from Conventional: new cases live inside the existing
Detail/Sandbox/System sections, Priority Summary update, regression-suite
"Changed:" mapping updates. Kept from Risk-First: ordering (cheap
fixes/docs → QA cases → suite run → live spot-check), the suite run framed
as verify-and-name-blockers rather than force-green, the multi-tab
repo-root leak scan in the retest procedure, and jsonl-parse + export
cross-check rigor in the live spot-check. Discarded from Conventional:
Console/Network filter-toggle cases (no such UI control exists — panels are
inherently filtered) and its invented runner command (the real runner is
the `/qa-runner` skill). Discarded from Risk-First: a standalone
scope-decision task (decided at synthesis, one line in test-plan.md), a
separate optional edge-case task (its cheap checks folded into TASK-006),
and the punt deferring the execution items (all five roadmap items stay).

## Tasks

### TASK-001: Gitignore video artifacts

Depends on: none
Files: [web/.gitignore](../web/.gitignore)
Symbols: none
Satisfies: REQ-001
Action: Append a `public/artifacts` line to web/.gitignore alongside the existing `public/screenshots` entry.
Validate: `git check-ignore web/public/artifacts/x.webm`
Expected result: Exit 0, path echoed — the directory's contents are ignored.

### TASK-002: Document the upstream video-bug retest procedure

Depends on: none
Files: [plan/video-recording.plan.md](video-recording.plan.md)
Symbols: none
Satisfies: REQ-002
Action: Append a "Retest trigger (upstream watch)" section to the video-recording plan: trigger = `@playwright/mcp@latest` bundles playwright-core > 1.61.1; steps = run one recording via the frontend-loop Preview stage, assert `web/public/artifacts/{protoId}-{ver}.webm` > 0 bytes, scan the repo root for leaked `*.webm` (multi-tab leak); success closes that plan's TASK-001; failure links/files the upstream Playwright issue and keeps the trigger armed.
Validate: `grep -n "Retest trigger" plan/video-recording.plan.md`
Expected result: Section header found; body names the trigger, three steps, and both outcome paths.

### TASK-003: Add QA cases for the shipped features

Depends on: none
Files: [docs/qa/test-cases.md](../docs/qa/test-cases.md)
Symbols: [Preview](../web/src/components/ui.tsx), [System](../web/src/views/System.tsx)
Satisfies: REQ-003, REQ-004
Action: Add six cases in existing format and ID sequences — TC-DETAIL-010 (P1, toggle switches Screenshot↔Video, video element with controls renders), TC-DETAIL-011 (P1, missing .webm shows "No recording for this version" fallback, behavior is per-version), TC-SANDBOX-007 (P1, toggle present and functional for the latest capture), TC-SYS-006 (P1, Console panel lists only error-level entries per mock fixtures), TC-SYS-007 (P1, Network panel lists only failed/4xx–5xx requests), TC-SYS-008 (P2, Console/Network empty states render panel fallback; flag live-only if mock always populates) — and update the Priority Summary counts to match.
Validate: `grep -c -E 'TC-DETAIL-01[01]|TC-SANDBOX-007|TC-SYS-00[678]' docs/qa/test-cases.md && grep -E '\| P1 +\| 36' docs/qa/test-cases.md && grep -E '\| P2 +\| 17' docs/qa/test-cases.md`
Expected result: Case count ≥ 6 and the Priority Summary rows read P1 = 36 and P2 = 17 (was 31/16; five P1 + one P2 cases added).

### TASK-004: Fold new cases into the regression suite and set scope boundaries

Depends on: [TASK-003](#task-003-add-qa-cases-for-the-shipped-features)
Files: [docs/qa/regression-suite.md](../docs/qa/regression-suite.md), [docs/qa/test-plan.md](../docs/qa/test-plan.md)
Symbols: none
Satisfies: REQ-005
Action: Add the six new case IDs to the Targeted tier's existing "Changed:" mappings (`components/ui.tsx` → toggle cases, `views/System.tsx` → panel cases, data files → TC-SYS-006/007); flag live-only cases (TC-PROTO-006, TC-SYS-008 if applicable) under Known Non-Regressions so mock-mode runs skip rather than fail them; add one scope note to test-plan.md stating finding-highlight screenshots are agent-side content, outside dashboard QA.
Validate: `grep -c -E 'TC-DETAIL-01[01]|TC-SANDBOX-007|TC-SYS-00[678]' docs/qa/regression-suite.md && grep -ci 'highlight' docs/qa/test-plan.md`
Expected result: Both greps return non-zero — the six case IDs are mapped in the suite and test-plan.md carries the finding-highlights scope note.

### TASK-005: Execute the regression suite against the current build

Depends on: [TASK-004](#task-004-fold-new-cases-into-the-regression-suite-and-set-scope-boundaries)
Files: [docs/qa/regression-suite.md](../docs/qa/regression-suite.md)
Symbols: none
Satisfies: REQ-006
Action: Run the `/qa-runner` skill in mock mode against the current build — Smoke tier plus the Targeted mappings touched by commits e4ff78c, 9894dc7, 1521f2c — and record the run as a `- Run 2026-MM-DD: ...` bullet (tier, pass/fail counts, blockers named by case ID + reason) in the suite doc's maintenance section. Triage any genuine failure before proceeding; live-only skips are not failures.
Validate: `grep -nE '^- Run 2026-' docs/qa/regression-suite.md`
Expected result: A dated run record exists with pass/fail counts and zero untriaged failures.

### TASK-006: Live-mode end-to-end loop spot-check

Depends on: [TASK-005](#task-005-execute-the-regression-suite-against-the-current-build)
Files: [web/src/data/live.ts](../web/src/data/live.ts), [skills/frontend-loop/SKILL.md](../skills/frontend-loop/SKILL.md)
Symbols: [liveArray](../web/src/data/live.ts)
Satisfies: REQ-007, REQ-008
Action: Run one real frontend-loop iteration on a throwaway prototype with `VITE_DATA_SOURCE=live`, then in the dashboard: confirm all five views render without browser console errors; cross-check ≥2 derived values against their sources (Network panel entries vs. failed lines in mcp-calls.jsonl, Tests view counts vs. tests.jsonl); exercise TC-PROTO-006 and the Console/Network empty states while data is sparse; record findings as an execution note in this plan.
Validate: `node --input-type=module -e "import{readFileSync}from'node:fs';for(const f of['mcp-calls','log','findings','tests']){try{readFileSync('web/public/'+f+'.jsonl','utf8').split(/\r?\n/).filter(Boolean).forEach(l=>JSON.parse(l))}catch(e){if(e.code!=='ENOENT'){console.error(f,e.message);process.exitCode=1}}}console.log('jsonl ok')"`
Expected result: `jsonl ok` — every produced jsonl line parses; execution note records the two cross-checks matching and TC-PROTO-006 finally verified.
