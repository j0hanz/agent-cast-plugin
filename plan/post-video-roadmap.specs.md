# post-video-roadmap — specs

Status: APPROVED

Scope: verification and hardening after the playwright-mcp adoption phases
(A/B/C) all shipped. No new features. Five roadmap items: artifacts
gitignore, QA-doc extension for shipped features, regression-suite
execution, live-mode end-to-end validation, upstream video-bug retest
procedure.

Out of scope (decided at synthesis, both ideators concurred): QA test cases
for finding-highlight screenshots — highlights are agent-side content baked
into the screenshot by `browser_highlight` before capture; dashboard QA
covers rendering of screenshots regardless of content. Recorded as a scope
note in `docs/qa/test-plan.md` (REQ-005).

## Requirements

### REQ-001: Video artifacts never committable

`web/public/artifacts/` contents must be ignored by git, matching the
existing treatment of `public/screenshots` and the jsonl outputs in
[web/.gitignore](../web/.gitignore).

### REQ-002: Upstream video-bug retest procedure documented

[plan/video-recording.plan.md](video-recording.plan.md) must contain a
retest procedure for the playwright-core 0-byte recording bug with:
(a) trigger condition — `@playwright/mcp@latest` bundling a playwright-core
newer than 1.61.1; (b) steps — run one recording via the frontend-loop
Preview stage, assert `web/public/artifacts/{protoId}-{ver}.webm` is
non-zero bytes, scan the repo root for leaked `*.webm` (the empirically
confirmed multi-tab leak); (c) success path — closes that plan's TASK-001;
(d) failure path — link/file the upstream issue and keep the trigger armed.

### REQ-003: QA coverage for the Preview Screenshot/Video toggle

[docs/qa/test-cases.md](../docs/qa/test-cases.md) must cover: mode switch
renders a `<video controls>` element (Detail); missing `.webm` shows the
"No recording for this version" fallback and behavior is per-version
(Detail); the toggle also works in Sandbox for the latest capture. IDs
continue existing sequences: TC-DETAIL-010, TC-DETAIL-011, TC-SANDBOX-007.

### REQ-004: QA coverage for System Console/Network panels

[docs/qa/test-cases.md](../docs/qa/test-cases.md) must cover: Console panel
shows only error-level entries; Network panel shows only failed/4xx–5xx
requests; both panels render their empty states cleanly. The filtering is
data derivation, not a UI control — cases assert what appears, not a
toggle. IDs: TC-SYS-006, TC-SYS-007, TC-SYS-008. Empty-state case flagged
live-only if mock fixtures always populate the panels.

### REQ-005: Suite integration and scope boundaries

[docs/qa/regression-suite.md](../docs/qa/regression-suite.md) must map the
new cases into the Targeted tier's existing "Changed:" entries
(`components/ui.tsx`, `views/System.tsx`, data files) and flag live-only
cases (TC-PROTO-006, TC-SYS-008 if applicable) so a mock-mode run does not
report them as failures. [docs/qa/test-plan.md](../docs/qa/test-plan.md)
gains the finding-highlights scope note. The Priority Summary counts in
test-cases.md must match the new totals.

### REQ-006: Regression suite executed against the current build

The suite (Smoke + Targeted tiers relevant to commits e4ff78c, 9894dc7,
1521f2c) has been run via the `/qa-runner` skill against the current build,
with pass/fail results and named blockers recorded in the suite doc. Goal
is verified-and-triaged, not forced-green: live-only blockers are named by
case ID + reason, not counted as failures.

### REQ-007: Live-mode loop renders real derived state

One real frontend-loop iteration executed with `VITE_DATA_SOURCE=live`
renders all five views without browser console errors, every produced
jsonl file parses line-by-line, and at least two derived export values are
cross-checked against their source lines (e.g., Network panel entries vs.
failed lines in `mcp-calls.jsonl`; Tests view counts vs. `tests.jsonl`).

### REQ-008: Graceful empty/sparse rendering in live mode

While in the live session, empty/missing data sources render fallbacks
without crashes — including the previously unverifiable TC-PROTO-006
(empty filter state with sparse data) and the Console/Network empty states.
