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

**Approach B — Console + network audit panels + highlight-annotated findings
(locked, build next).** See the Design Brief section below.

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

## Correction found while preparing Approach B (2026-07-01)

Approach A's `parseConfig` (`web/src/data/live.ts`) assumed
`browser_get_config`'s response was bare JSON. Reading the actual tool
source (`microsoft/playwright`'s `tools/backend/response.ts`) showed every
text result is wrapped in `### <Section>` markdown headers before being
returned (`### Result\n<content>`, sometimes followed by `### Page` if the
tab changed) — never bare text. `JSON.parse` was throwing on the header,
silently caught by the existing try/catch, leaving the Server panel
permanently empty in a live session. Fixed in commit `f405e17` by adding
`extractSection(text, 'Result')`, which strips the markdown wrapper before
parsing. Approach B's console/network capture depends on this same
unwrapping, so the fix was made a shared helper rather than duplicated.

## Design Brief — Approach B (locked, build next)

Interview-resolved scope (this session): captured entries are a
**session-wide, untagged stream** (no per-prototype correlation — console
and network tool calls carry no protoId/ver, unlike screenshots' filename
convention, so tagging would require fragile last-navigate inference).
Highlight-annotation is **bundled into this phase**, which requires
tightening `findings.jsonl`'s `loc` field to a bare CSS selector/target
(today it mixes selector + measurement, e.g. `.btn-secondary · 3.1:1`,
which `browser_highlight`'s `target` param can't consume directly).

```
Approach: Enable browser_console_messages(level:"error") and
  browser_network_requests() at the critique step, deriving new "Console"
  and "Network" System panels from their responses (already captured for
  free by the existing wildcard mcp-calls.jsonl hook, once that hook is
  told to also keep output for these two tools). Add --caps=devtools and
  call browser_highlight on each open finding's loc before the critique
  screenshot, so findings are visually boxed in the capture instead of only
  described in text.

Why: playwright-mcp's CORE tools already return console errors and failed
  network requests for free (no --caps needed for those two) - the only
  missing piece is capturing and rendering what's already available.
  Highlighting closes the gap between findings.jsonl's plain-text `loc` and
  an actual visual pointer at the flagged element, continuing Approach A's
  "replace self-reported/decorative data with real data" principle.

Scope: M - one hook edit (widen the existing output-capture allowlist from
  browser_get_config to three tools), two new derived exports + two new
  System panels, one --caps flag, one findings.jsonl convention change
  (loc tightened, detail moves to text), one SKILL.md critique-step rewrite.
  No new jsonl files - console/network entries are derived from
  mcp-calls.jsonl the same way MCP_TOOLS/MCP already are.

Constraints:
  - Every playwright-mcp text result is markdown-wrapped in "### <Section>"
    headers (see the correction above) - any new parsing must go through
    the shared extractSection('Result') helper, not raw JSON.parse or raw
    line-splitting on the unwrapped blob.
  - browser_network_requests has no server-side status filter (unlike
    console's `level` param) - failure detection is a regex on rendered
    lines: `=> \[(FAILED|[45]\d\d)\]`. Default params (`static:false`)
    already surface all failures regardless of resource type, only hiding
    successful non-fetch/xhr assets, so no extra params are needed.
  - browser_highlight's `target` accepts a plain CSS selector (not only a
    snapshot ref) per playwright-mcp's own elementSchema - loc values just
    need to stay valid, unique selectors, not human-readable compound text.
  - Output capture for console/network calls adds one markdown blob to
    mcp-calls.jsonl per critique-step call (not per line/event) - bounded
    growth, same shape as Approach A's browser_get_config capture, not the
    unbounded per-frame growth Approach C was flagged for.

Interface:
  - `.mcp.json`: --caps=testing,config,devtools.
  - `hooks/log-mcp-call.sh`: widen the tool-name allowlist that captures
    `output` from just browser_get_config to also
    mcp__playwright__browser_console_messages and
    mcp__playwright__browser_network_requests.
  - `web/src/data/types.ts`: add ConsoleEntry {ts, text} and
    NetworkEntry {ts, text}.
  - `web/src/data/live.ts`: export extractSection (currently private to
    parseConfig) for reuse; add parseConsoleEntries/parseNetworkEntries
    that scan all mcpCalls (not just the latest, unlike parseConfig) for
    the matching tool, extract the Result section, split lines, drop the
    header/empty lines, and (network only) keep lines matching the failure
    regex. Export CONSOLE/NETWORK arrays built from these.
  - `web/src/data/mock.ts`: matching CONSOLE/NETWORK arrays (data.check.mjs
    parity).
  - `web/src/views/System.tsx`: two new Panels ("Console", "Network") in
    the existing grid, same EmptyState-guarded list pattern as "Recent
    calls" - no new component, reuse the row-rendering style already there.
  - `skills/frontend-loop/SKILL.md` critique step (3): call
    browser_console_messages(level:"error") and browser_network_requests()
    right after the preview screenshot (results flow into the dashboard
    automatically, nothing to hand-write). Before the optional
    -critique-{ver} capture, call browser_highlight(target: <loc>) once per
    open finding, then browser_hide_highlight() before moving to Refine.
    loc must be a bare selector valid as a highlight target; any
    measurement/detail (e.g. contrast ratio) goes in `text` instead.
  - `web/src/data/mock.ts` FINDINGS: update existing entries to the
    tightened convention (e.g. loc: '.btn-secondary', text: 'Secondary
    button contrast below AA (3.1:1)') so mock and live agree on shape.

Architecture: No new hook trigger, no new jsonl file - console/network are
  derived views over the same mcp-calls.jsonl stream Approach A's Server
  panel and System's existing "Recent calls"/"Exposed tools" already read,
  parsed with the shared extractSection helper. Only the capture allowlist
  in log-mcp-call.sh and the findings.jsonl loc convention change.

Risks:
  - Med: findings.jsonl's loc convention change is a breaking change to the
    critique-step contract - any in-flight findings written under the old
    mixed-text convention won't resolve as a valid highlight target. No
    migration needed (findings are append-only and superseded per version
    already, per findingsFor's latest-version-only read), but the SKILL.md
    change must ship atomically with the loc-tightening instruction, not
    partially.
  - Low: console/network noise - level:"error" and the failure regex
    already filter at the source, but a chatty page could still produce
    many rows per critique step. No cap added now; revisit if it proves
    noisy in practice.

First Step: Widen hooks/log-mcp-call.sh's output-capture condition to
  include mcp__playwright__browser_console_messages and
  mcp__playwright__browser_network_requests alongside browser_get_config.
```

### Phase 5 persona critique (Approach B)

- **Skeptic (Med, resolved):** loc tightening changes what the critique step
  must write - flagged as a Risk above; mitigation is shipping the SKILL.md
  instruction and the convention change together, not staggered.
- **Constraint Guardian (none):** devtools cap adds `browser_highlight`/
  `browser_resume`/tracing/video tools to the surface, but SKILL.md only
  instructs highlight/hide_highlight use - no tracing or video capture is
  wired up in this phase (that's Approach C). Read-only, no new attack
  surface.
- **User Advocate (Low, accepted):** a session-wide (untagged) Console/
  Network stream can't be filtered to "just this prototype" from the
  System view - acceptable per the locked scope decision; revisit only if
  it proves hard to use in practice once built.

**Verdict: APPROVED.**
