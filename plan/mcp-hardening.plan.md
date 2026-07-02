# mcp-hardening — plan

Status: APPROVED

<!-- receive-plan (contract): REVISE round 1 — 1 High + 1 Med fixed inline.
     TASK-005 rewritten with the real data path (TestRun lacks protoId/ver;
     testsStore is private to live.ts — fix extends TestRun with both fields
     across types/mock/live and updates data.check.mjs's deriveLoop('final')
     assertion). TASK-006's parseConfig anchor corrected L306→L298. Low
     findings actioned too: TASK-003 comment wording specified, TASK-006
     execution note now requires one pass/fail line per sub-check, TASK-007
     clarified to append a new bullet even on a same-day run. -->

Depth: contract (2 blind ideators — Conventional, Risk-First — merged by
main-thread synthesis below). See `mcp-hardening.specs.md` for the
requirements each task satisfies.

## Synthesis

Both ideators converged on the same seven-item shape, the same key-collision
fix (mirror the `${ts}-${i}` pattern the Console/Network panels already
use), the same retest-trigger rewrite, and the same tests.jsonl-derived
Test-completion direction — kept as high-confidence. Kept from Risk-First:
the ordering (hook registration lands before any live verification, since
the prior QA run's parser checks were blocked by dead hooks and had to
hand-write jsonl), the pin⇄parser-verify coupling, and the session-restart
constraint — folded into a single batched fresh-session verification task
(TASK-006) instead of per-task live checks. Kept from Conventional: the
concrete one-line fixes and validate commands, and the regression run as
its own recorded task reusing the suite's existing "Changed:" mappings.
Discarded from Conventional: live validation sprinkled across every task
(each would need its own fresh session — one batch session covers all).
Discarded from Risk-First: the "escalate to agent-platform change" abort
path for hooks (a repo-level `.claude/settings.json` using
`$CLAUDE_PROJECT_DIR` is the standard mechanism for project-scoped hooks;
no platform change is plausible) and a hook double-fire guard (accepted,
documented risk per REQ-003 — guard code for a solo-operator edge case is
not worth its complexity).

## Tasks

### TASK-001: Pin @playwright/mcp to 0.0.77

Depends on: none
Files: [.mcp.json](../.mcp.json)
Symbols: none
Satisfies: REQ-001
Action: Replace `@playwright/mcp@latest` with `@playwright/mcp@0.0.77` in the playwright server's npx args, keeping `--caps=testing,config,devtools` unchanged.
Validate: `grep -n '@playwright/mcp@0.0.77' .mcp.json && ! grep -n '@latest' .mcp.json`
Expected result: First grep hits the pinned version; second finds no remaining `@latest`.

### TASK-002: Rekey the video retest trigger to deliberate pin bumps

Depends on: [TASK-001](#task-001-pin-playwrightmcp-to-0077)
Files: [plan/video-recording.plan.md](video-recording.plan.md)
Symbols: none
Satisfies: REQ-002
Action: Rewrite the "Retest trigger (upstream watch)" section's **Trigger** paragraph: the trigger is now "the `@playwright/mcp` pin in `.mcp.json` is bumped to a version bundling `playwright-core` > 1.61.1" (check via `npm view @playwright/mcp@<pin> dependencies`), replacing the `@latest`-drift wording; note that the 0.0.77 pin itself satisfies the condition and TASK-006 of plan/mcp-hardening.plan.md executes it. Steps and success/failure paths stay unchanged.
Validate: `grep -n 'pin' plan/video-recording.plan.md | grep -i 'trigger\|bump' && ! grep -n '@playwright/mcp@latest.*bundles' plan/video-recording.plan.md`
Expected result: Trigger paragraph names the pin bump; the old `@latest`-drift wording is gone.

### TASK-003: Register hooks for plain checkouts

Depends on: none
Files: [.claude/settings.json](../.claude/settings.json) (new), [hooks/hooks.json](../hooks/hooks.json)
Symbols: none
Satisfies: REQ-003
Action: Create `.claude/settings.json` registering the same four hook bindings as `hooks/hooks.json` (SessionStart → start-web.sh; PreToolUse `mcp__playwright__.*` → log-session.sh; PostToolUse `mcp__playwright__.*` → log-mcp-call.sh; PostToolUse `mcp__playwright__browser_take_screenshot` → update-state.sh), each command as `bash "$CLAUDE_PROJECT_DIR"/hooks/<script>.sh` with the same timeouts. Extend `hooks/hooks.json`'s `description` field with: "Mirrored in .claude/settings.json for plain checkouts ($CLAUDE_PROJECT_DIR-anchored); if the plugin is also installed while this repo is open, hooks double-fire — accepted, don't run both."
Validate: `jq -e '[.hooks.SessionStart, .hooks.PreToolUse, .hooks.PostToolUse] | flatten | length >= 4' .claude/settings.json && grep -c CLAUDE_PROJECT_DIR .claude/settings.json`
Expected result: jq exits 0 confirming all four bindings parse; every command path is `$CLAUDE_PROJECT_DIR`-anchored. (Hook firing itself is only observable in a fresh session — verified in TASK-006.)

### TASK-004: Fix the Recent-calls React key collision

Depends on: none
Files: [web/src/views/System.tsx](../web/src/views/System.tsx)
Symbols: [McpCallRow usage](../web/src/views/System.tsx#L138)
Satisfies: REQ-004
Action: Change `MCP_CALLS.map((c) => <McpCallRow key={`${c.ts}-${c.tool}`} ... />)` to the index-suffixed pattern the adjacent Console/Network panels already use: `MCP_CALLS.map((c, i) => <McpCallRow key={`${c.ts}-${i}`} ... />)`.
Validate: `cd web && npm run check`
Expected result: typecheck + data parity pass; System.tsx no longer keys rows by tool name (live duplicate-key console check happens in TASK-006).

### TASK-005: Derive Loop-panel Test completion from recorded runs

Depends on: none
Files: [web/src/data/types.ts](../web/src/data/types.ts), [web/src/data/mock.ts](../web/src/data/mock.ts), [web/src/data/live.ts](../web/src/data/live.ts), [web/src/data/data.ts](../web/src/data/data.ts), [web/src/data/data.check.mjs](../web/src/data/data.check.mjs)
Symbols: [TestRun](../web/src/data/types.ts#L35), [TESTS (live)](../web/src/data/live.ts#L245), [deriveLoop](../web/src/data/data.ts#L187), [loopFor](../web/src/data/data.ts#L211)
Satisfies: REQ-005
Action: `TestRun` today carries no `protoId`/`ver`, so no caller can match a run to a prototype version — extend it with both fields: types.ts adds them to `TestRun`; live.ts's `TESTS` compute copies them from the `TestRunInput` it already selects per prototype (latest version); mock.ts's static `TESTS` fixtures gain matching values. Then extend `deriveLoop` with a `hasRun: boolean` argument — at `stage === 'final'` with `hasRun`, mark Refine `done`/`completed` and Test `done`/`completed` instead of Test's perpetual `live`/`running…`; without `hasRun`, current behavior stands. `loopFor` (the only production caller) computes `hasRun` as: some `TESTS` entry has this `protoId` and the same `ver` as the latest screenshot it already reads. Update data.check.mjs: its `deriveLoop('final').at(-1).state === 'live'` assertion (L48) keeps covering the no-run case, and one new assertion covers `deriveLoop('final', true).at(-1)` being `done`/`completed`.
Validate: `cd web && npm run check && npm run lint`
Expected result: typecheck, mock/live parity, the extended deriveLoop assertions, and lint all pass (visual confirmation of a completed Test step happens in TASK-006).

### TASK-006: Fresh-session live verification batch

Depends on: [TASK-001](#task-001-pin-playwrightmcp-to-0077), [TASK-002](#task-002-rekey-the-video-retest-trigger-to-deliberate-pin-bumps), [TASK-003](#task-003-register-hooks-for-plain-checkouts), [TASK-004](#task-004-fix-the-recent-calls-react-key-collision), [TASK-005](#task-005-derive-loop-panel-test-completion-from-recorded-runs)
Files: [plan/video-recording.plan.md](video-recording.plan.md), [web/src/data/live.ts](../web/src/data/live.ts)
Symbols: [parseConfig](../web/src/data/live.ts#L298), [CONSOLE_HEADER_REGEX](../web/src/data/live.ts#L353), [NETWORK_FAILURE_REGEX](../web/src/data/live.ts#L362)
Satisfies: REQ-003, REQ-006, REQ-007 (and live confirmation of REQ-004/005)
Action: In ONE fresh Claude Code session (required — the pinned MCP server and new hook registration only load at session start), run one frontend-loop iteration on a throwaway prototype with `VITE_DATA_SOURCE=live`, covering: (a) hook-fire proof — `web/public/mcp-calls.jsonl` gains entries with no hand-writing; (b) the armed video retest — recording started before navigate, `test -s web/public/artifacts/{protoId}-{ver}.webm`, repo-root `*.webm` leak scan; on success append the closing execution note to video-recording.plan.md TASK-001, on failure search/file the upstream Playwright issue and record it; (c) parser verification — System's Server/Console/Network panels populate, spot-check raw jsonl lines against the three regexes, fixing any 0.0.77 format mismatch in live.ts inline; (d) two same-second same-tool calls produce no duplicate-key console error; (e) the Loop panel shows Refine/Test completed after a passing run with a final capture. Record the outcome as an execution note in this plan with one explicit pass/fail line per sub-check (a)–(e); clean up the throwaway prototype and restore mock mode.
Validate: `bash -c 'test -s web/public/mcp-calls.jsonl && ! ls *.webm 2>/dev/null && echo LIVE-BATCH-ARTIFACTS-OK'`
Expected result: `LIVE-BATCH-ARTIFACTS-OK` — hook-written jsonl exists and no webm leaked to the repo root; the execution note records (a)–(e) outcomes including the video retest verdict.

### TASK-007: Regression run and record

Depends on: [TASK-006](#task-006-fresh-session-live-verification-batch)
Files: [docs/qa/regression-suite.md](../docs/qa/regression-suite.md)
Symbols: none
Satisfies: REQ-008
Action: Run the `/qa-runner` skill in mock mode — Smoke tier plus the Targeted "Changed:" mappings for `web/src/views/System.tsx` and `web/src/data/data.ts` — and record the run as a new `- Run 2026-MM-DD:` bullet (tier, pass/fail counts, blockers by case ID + reason) in the suite doc's maintenance section — always a new bullet, even if one already exists for the same date. Live-only skips are not failures; triage any genuine failure before closing the plan.
Validate: `grep -nE '^- Run 2026-' docs/qa/regression-suite.md | tail -1`
Expected result: A new dated run record exists with pass/fail counts and zero untriaged failures.
