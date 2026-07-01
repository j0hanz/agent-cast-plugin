# playwright-mcp adoption — design brief

Source: brainstorming session surveying <https://github.com/microsoft/playwright-mcp>
against AgentCast's current usage. Locked approach: **phased A → B → C**,
this brief specs **Approach A** in full; B and C are recorded as roadmap only.

## playwright-mcp tool survey (as of README @ `36ec986`)

### CORE tools (always on, no flag needed)

`browser_click`, `browser_close`, `browser_console_messages`, `browser_drag`,
`browser_drop`, `browser_evaluate`, `browser_file_upload`, `browser_fill_form`,
`browser_handle_dialog`, `browser_hover`, `browser_navigate`,
`browser_navigate_back`, `browser_network_request`, `browser_network_requests`,
`browser_press_key`, `browser_resize`, `browser_run_code_unsafe`,
`browser_select_option`, `browser_snapshot`, `browser_tabs`,
`browser_take_screenshot`, `browser_type`, `browser_wait_for`.

AgentCast currently only exercises: `browser_navigate`, `browser_resize`,
`browser_take_screenshot`, `browser_snapshot`, `browser_evaluate`,
`browser_click`, `browser_type` (per `skills/frontend-loop/SKILL.md` and the
`MCP_TOOLS` mock). `browser_console_messages` and `browser_network_requests`
are installed and unused today — cheapest opportunity, zero new `--caps`.

### Opt-in capability bundles (`--caps=<name>`, none enabled in `.mcp.json` today)

| Cap        | Tools                                                                                                                                                                                                                        | Fit for AgentCast                                                                                                                                                        |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `testing`  | `browser_verify_element_visible`, `browser_verify_text_visible`, `browser_verify_list_visible`, `browser_verify_value`, `browser_generate_locator`                                                                           | **High** — directly replaces self-reported Tests data. → Approach A                                                                                                      |
| `config`   | `browser_get_config`                                                                                                                                                                                                         | **High** — replaces hardcoded/mocked System "Server" panel with ground truth. → Approach A                                                                               |
| `devtools` | `browser_start_tracing`/`stop_tracing`, `browser_start_video`/`stop_video`, `browser_video_chapter`, `browser_video_show_actions`/`hide_actions`, `browser_highlight`/`hide_highlight`, `browser_annotate`, `browser_resume` | **High payoff, high cost** — full audit-trail artifacts (traces/video) and visual finding-highlighting. → Approach B (highlight only) / Approach C (full tracing+video)  |
| `network`  | `browser_route`, `browser_route_list`, `browser_unroute`, `browser_network_state_set`                                                                                                                                        | Low — request _mocking_, not observation (observation is already CORE via `browser_network_requests`). No current use case (no offline/error-state testing in the loop). |
| `storage`  | cookie/localStorage/sessionStorage get/set/list/delete/clear, `browser_storage_state`/`browser_set_storage_state`                                                                                                            | Low — no auth/session flows in the current prototype loop. Revisit if AgentCast ever tests logged-in states.                                                             |
| `vision`   | `browser_mouse_click_xy`/`move_xy`/`drag_xy`, `browser_mouse_down`/`up`, `browser_mouse_wheel`                                                                                                                               | Low — AgentCast interacts via accessibility snapshot/selector tools, not pixel coordinates.                                                                              |
| `pdf`      | `browser_pdf_save`                                                                                                                                                                                                           | Low — no PDF export use case.                                                                                                                                            |

## Roadmap

**Approach A — Real assertions + real config (this brief, locked, build now).**
See the Design Brief section below.

**Approach B — Console + network audit panels + highlight-annotated findings (next).**
Capture `browser_console_messages` (error-level) and `browser_network_requests`
(failed/4xx-5xx) at each critique step into new `console.jsonl`/`network.jsonl`,
rendered as new Detail/System panels via the existing hook-writes-jsonl /
panel-reads-it pattern (same shape as `findings.jsonl`/`tests.jsonl` today).
Enable `--caps=devtools` for `browser_highlight` only, so a finding's `loc`
selector gets a visible box drawn on the critique screenshot instead of a
bare text string. Risk: noise — needs error/failure-level filtering so console
warnings don't drown real findings.

**Approach C — Full trace/video audit trail (later, biggest lift).**
Enable `--caps=devtools` fully; record a Playwright trace
(`browser_start_tracing`/`stop_tracing`) and/or video per loop iteration;
store as a downloadable artifact linked from Detail view. The most literal
version of PRODUCT.md's "not just a live status glance, a deep traceable
record" mission. Risks flagged in Phase 5: unbounded artifact storage growth
under `web/public/` (gitignored, but disk fills over long sessions — needs a
retention/pruning policy before this ships), and a possible operational
dependency (Playwright Dashboard companion process for `browser_annotate`).
Not scoped in detail here — revisit when A and B are shipped and proven.

## Design Brief — Approach A (locked, build now)

```
Approach: Enable playwright-mcp's `testing` and `config` capability bundles
  (--caps=testing,config) and wire their output into AgentCast's existing
  Tests stage and System "Server" panel, replacing self-reported/mocked data
  with tool-verified data. First of a three-phase roadmap (A -> B -> C).

Why: PRODUCT.md's core principle is "audit trail over vanity metrics" - the
  Tests panel currently shows numbers the agent writes about itself with no
  ground truth, and the Server panel shows numbers that were never wired to
  the real MCP server at all. Both are the cheapest, lowest-risk fixes
  available in playwright-mcp's opt-in surface (7 capability bundles exist;
  vision/pdf/network/storage/devtools don't fit this product's mission or
  cost more than they're worth yet - see the survey above for the full
  catalog and the B/C roadmap this defers).

Scope: M - two `--caps` flags, one SKILL.md section rewrite (Test stage),
  one System.tsx/data.ts wiring change (Server panel). No new files, no new
  jsonl artifacts, no schema changes to TestRunInput or KV.

Constraints:
  - AGENTS.md: breaking changes OK, no legacy shims - replace outright,
    don't dual-path old vs new Server panel data.
  - `browser_verify_*` is one-assertion-per-call and fails/throws per call -
    SKILL.md must call it once per acceptance criterion and tally results
    itself; do not treat one failure as ending the test stage early.
  - `browser_get_config` reports server-merged config only (browser,
    headless, viewport, enabled caps, etc.) - it does NOT report live
    session/runtime state. Do not conflate it with `Status`/`Uptime`.

Interface:
  - `.mcp.json`: add `--caps=testing,config` to the playwright server args.
  - `skills/frontend-loop/SKILL.md` Test stage: replace "record the run"
    self-reported pass/total with a loop over `browser_verify_element_visible`
    / `browser_verify_text_visible` / `browser_verify_value` calls, one per
    acceptance criterion, tallying pass/total from actual call outcomes
    before writing the existing `tests.jsonl` line (schema unchanged).
    `browser_generate_locator` explicitly out of scope.
  - `web/src/views/System.tsx` "Server" panel: full replace - panel content
    becomes exactly the fields `browser_get_config` returns (browser,
    headless, viewport, caps list, etc.); `Status`/`Uptime`-style fields are
    dropped from this panel (liveness is already covered by `AgentPill`/
    `deriveAgent` elsewhere in the shell).
  - `web/src/data/live.ts`: add a `browser_get_config` call (or read its
    logged MCP call from `mcp-calls.jsonl`) to populate the new Server KV
    list; `mock.ts`'s `MCP` array updated to match the new field set for
    structural parity (enforced by `data.check.mjs`).

Architecture: No new artifact type, no new hook trigger - `browser_verify_*`
  and `browser_get_config` calls are already captured for free by the
  existing wildcard `mcp__playwright__.*` PostToolUse hook into
  `mcp-calls.jsonl`/System "Recent calls" and "Exposed tools" tally. Only
  the Test-stage SKILL.md instructions and the Server-panel data source
  change; the jsonl-write/panel-read pattern for findings/tests is untouched.

Risks:
  - Med (mitigated): assertion batching - browser_verify_* is one call per
    assertion and throws per call; SKILL.md must call it once per criterion,
    not assume batch semantics, or totals under-report.
  - Low: removing Status/Uptime from Server panel loses a redundant (not
    sole) liveness signal - accepted, no action needed (AgentPill covers it).

First Step: Add `--caps=testing,config` to `.mcp.json`'s playwright server
  args.
```

## Phase 5 persona critique (Approach A)

- **Skeptic (Med, resolved):** `browser_verify_*` fails/throws per call —
  SKILL.md must call it once per criterion and tally itself, not batch.
- **Constraint Guardian (none):** both caps are read-only/additive, no new
  attack surface (no cookies/storage/network-mocking touched).
- **User Advocate (Low, accepted):** dropping Status/Uptime from the Server
  panel removes a redundant liveness signal — `AgentPill`/`deriveAgent`
  (screenshot-timestamp-derived, see commit `c9968fd`) already covers it.

**Verdict: APPROVED.**
