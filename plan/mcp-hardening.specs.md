# mcp-hardening — specs

Status: APPROVED

Source: 2026-07-02 research session comparing Playwright MCP vs
vercel-labs/agent-browser. Verdict: stay on Playwright MCP; harden the
existing integration. agent-browser adoption, microsoft/playwright-cli, and
any migration are explicitly out of scope (watch-only).

## Requirements

### REQ-001: Pinned MCP server version

`.mcp.json` must run an exact `@playwright/mcp` version, not `@latest`.
The dashboard regex-parses tool response formats (`### Result` sections,
console/network line shapes); `@latest` drift breaks panels silently — it
already happened once (`parseConfig`, fixed in `f405e17`), and upstream
v0.0.72 changed the network-requests format. Version bumps must be
deliberate edits reviewed against the parsers.

### REQ-002: Retest trigger keyed to deliberate bumps

`plan/video-recording.plan.md`'s "Retest trigger (upstream watch)" section
currently arms on `@playwright/mcp@latest` drift. With REQ-001 in place,
`@latest` never drifts — the trigger must instead fire on each deliberate
pin bump whose bundled `playwright-core` exceeds 1.61.1.

### REQ-003: Hooks fire in a plain checkout

The dashboard's core promise (PRODUCT.md: "the developer never has to
wonder what the agent actually just did") depends on the four hook
bindings in `hooks/hooks.json` firing. The post-video-roadmap TASK-006
live run (2026-07-02) proved they do NOT fire in a plain (non-marketplace)
git checkout — `CLAUDE_PLUGIN_ROOT` unset, no registration. A plain
checkout of this repo must register the same four hooks. Known accepted
risk: if the plugin is ALSO installed while the repo is open, hooks may
double-fire (duplicate jsonl lines) — documented, not guarded against
(solo-operator tool; developing and installing the same plugin
simultaneously is an unlikely, self-inflicted state).

### REQ-004: No React key collision on same-second MCP calls

`web/src/views/System.tsx` keys "Recent calls" rows by `${ts}-${tool}`;
hook timestamps have 1-second resolution, so two same-tool calls within a
second collide (reproduced live: "two children with the same key" console
error). Same-second same-tool calls must render without React errors.

### REQ-005: Loop panel reflects real Test completion

`deriveLoop` (`web/src/data/data.ts`) only reads the screenshot `stage`
(preview|critique|final), so at `stage=final` the Test step shows
"running…" forever and Refine never completes — even when `tests.jsonl`
recorded a pass (confirmed misleading with real data). When a prototype's
latest version has a recorded test run and its stage is `final`, the Loop
panel must show Refine and Test as completed, not perpetually running.

### REQ-006: Video retest executed against the pinned version

`@playwright/mcp@0.0.77` bundles `playwright-core` 1.62.0-alpha-2026-06-29
(> the broken 1.61.1), so the upstream 0-byte-webm bug may be fixed. The
already-documented retest procedure (one recording via the frontend-loop
Preview stage; `test -s` the webm; scan repo root for the multi-tab leak)
must be executed once against the pin, and the outcome recorded — success
closes video-recording TASK-001; failure files/links the upstream issue
and keeps the trigger armed.

### REQ-007: Parsers verified against the pinned version

The three response parsers in `web/src/data/live.ts` (`parseConfig`,
`CONSOLE_HEADER_REGEX`, `NETWORK_FAILURE_REGEX`) must be verified against
real 0.0.77 output in a live session: System view's Server/Console/Network
panels populate from hook-captured `mcp-calls.jsonl`, with raw jsonl
entries spot-checked against the regexes. Any format mismatch is fixed in
the parsers as part of this work, not deferred.

### REQ-008: Regression run recorded

The code changes touch `views/System.tsx` and `data/data.ts` — both have
existing "Changed:" mappings in `docs/qa/regression-suite.md`. A
`/qa-runner` mock-mode run (Smoke + those Targeted mappings) must be
executed and recorded as a dated `- Run 2026-MM-DD:` bullet with pass/fail
counts and named blockers.
