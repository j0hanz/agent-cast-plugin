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

**Approach C — Per-iteration video recording, embedded in Preview
(locked, prepared 2026-07-01, not yet built).** See the Design Brief section
below. Scoped down from the original "trace and/or video" sketch after
research: tracing is Chromium-only, has no filename param (can't be given a
predictable name), and has no in-dashboard viewer (`npx playwright
show-trace` only) — video alone covers the audit-trail need at far lower
cost, and `browser_annotate` is hard-excluded (blocks forever waiting for a
human, unusable by an autonomous loop).

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

## Design Brief — Approach C (locked, prepared, not yet built)

Research (three parallel subagents fetching playwright-mcp/playwright monorepo
source) reshaped this approach from the original "trace and/or video" sketch:

- `browser_start_tracing`/`browser_stop_tracing` take **no parameters** -
  the output filename is always auto-generated (`trace-<timestamp>.trace` +
  `.network` + a `resources/` dir), Chromium-only, and replay requires an
  external tool (`npx playwright show-trace` or trace.playwright.dev) - no
  in-dashboard viewer is realistic. Dropped from this round's scope.
- `browser_start_video` takes an optional `filename` - it _can_ be given a
  predictable name, and finalizes to **webm**, natively playable in an
  HTML `<video>` element. This is the one artifact type worth building now.
- `browser_annotate` spawns a Dashboard UI process and blocks indefinitely
  waiting for a human to draw annotations and close the window - it must
  never be called by the autonomous frontend-loop skill.
- `--output-max-size`'s automatic eviction (oldest-mtime-first, single
  shared budget across all output types) only covers files written to the
  tool's _default_ output directory with auto-generated names. It does
  **not** cover files written with an explicit `filename`/`suggestedFilename`
  param - which is exactly how screenshots already get their predictable,
  dashboard-servable names, and how video will too. "Storage growth solved
  for free" does not apply to this design; see Risks.

Interview-resolved scope (this session): video recording is **optional per
iteration** (mirrors the existing optional `-critique-{ver}` screenshot
language, not mandatory every pass), and it surfaces as a **toggle inside
the existing Preview component** (screenshot/video switch in place), not a
separate panel.

```
Approach: Add optional per-iteration screen recording via
  browser_start_video/browser_stop_video (already available under
  --caps=devtools, enabled since Approach B). Capture uses the exact same
  explicit-filename convention screenshots already use, landing directly at
  web/public/artifacts/{protoId}-{ver}.webm with zero new hook, jsonl file,
  or data-layer plumbing. A toggle inside the existing Preview component
  switches between screenshot and video, using the same onError-fallback
  pattern the screenshot <img> already uses to detect a missing capture.

Why: Video is the one artifact type that's both name-able (predictable,
  servable path) and embeddable (webm plays natively) - tracing is neither.
  Reusing the explicit-filename + client-side-existence-probing pattern
  that screenshots already prove out is the smallest genuinely useful
  integration, not a new architecture. It also covers something a static
  screenshot structurally can't: load animations and transitions that only
  happen once, right as a page opens - a screenshot taken after the fact
  never shows them.

Scope: S/M - no .mcp.json change (devtools cap already on), one SKILL.md
  addition, one new data.ts helper, one new toggle in an existing
  component. No new hook trigger, no new jsonl file, no new exported type.

Constraints:
  - browser_annotate must never appear in SKILL.md - it hangs an autonomous
    loop forever waiting for a human.
  - Video recording is continuous while active (real CPU/disk cost for its
    duration, unlike a one-shot screenshot) - every browser_start_video
    must be unconditionally paired with a browser_stop_video before moving
    to Refine, not left running past the critique step.
  - Video capture is optional per iteration, not mandatory every pass.
  - browser_start_video has no duration param, so bounding a capture is the
    agent's job, not the tool's: recording must start *before*
    browser_navigate (Preview step), not before the critique screenshot -
    starting after navigate misses the page-load animation entirely, since
    the page has already settled by the time recording begins. No
    browser_wait_for pacing is needed to "hold" the animation on camera -
    the recording keeps rolling in real time through the rest of the
    critique step's tool calls and reasoning regardless of how fast those
    calls happen, so the animation plays out on camera naturally.
  - browser_start_video has no duration cap or auto-stop timer - it calls
    Playwright's native page.screencast.start() and records until
    browser_stop_video is called, however long that takes. Two partial
    safety nets exist, confirmed by reading context.ts directly:
    Context.dispose() (session teardown) calls stopVideoRecording()
    automatically, so a clean session end won't orphan a recording, though
    a hard crash still could; and startVideoRecording() throws
    ("Video recording has already been started.") if called twice without
    a stop in between, so a stuck recording surfaces as a visible error
    instead of failing silently.
  - If a new tab opens while a recording is active, that tab is recorded
    too and its filename gets a `-1`/`-2` suffix (confirmed in
    context.ts's _startPageVideo). Low-probability for AgentCast's
    single-page loop, not worth guarding against explicitly.

Interface:
  - No .mcp.json change.
  - skills/frontend-loop/SKILL.md Preview step: optionally, right before
    browser_navigate (not after - see Constraints), call browser_start_video
    with filename: web/public/artifacts/{protoId}-{ver}.webm, so any
    load/transition animation is captured from its first frame. Screenshot-
    critique step: right after the critique screenshot+highlight (before
    moving to Refine), call browser_stop_video unconditionally if a
    recording was started. Never call browser_annotate.
  - web/src/data/data.ts: add videoSrc(protoId, ver): string mirroring
    screenshotSrc, returning /artifacts/{protoId}-{ver}.webm.
  - web/src/components/ui.tsx Preview component: add a two-option toggle
    (Screenshot | Video, defaulting to Screenshot) using the existing
    Seg/SingleToggle pattern; Video mode renders
    <video src={videoSrc(id, ver)} controls> with an onError fallback to an
    inline "No recording for this version" message - not a silent revert
    to Screenshot mode, so the toggle's own state stays honest about what
    was actually chosen.

Architecture: Client-side existence probing (the same pattern screenshots
  already use for a missing capture) replaces any need for a hook, jsonl
  file, or mock/live data-layer addition - the dashboard doesn't need to
  know ahead of render time whether a video exists, it just tries to load
  one and shows an empty state if there isn't one.

Risks:
  - Med (mitigated in SKILL.md wording, partially self-healing): no
    duration cap on recording - an interrupted turn between start_video
    and stop_video leaves it running until either SKILL.md's unconditional
    stop_video pairing runs, or the session ends cleanly (dispose() stops
    it automatically). A hard crash (not a clean session end) can still
    orphan a recording.
  - Low (accepted): no storage cap - consistent with existing screenshot
    behavior (also uncapped), and video's optional-per-iteration cadence
    naturally throttles growth versus mandatory-every-iteration screenshots.
  - Low (accepted): a new tab opening mid-recording produces a suffixed
    extra file (-1, -2, ...) instead of overwriting the canonical name -
    not guarded against, low-probability for this loop's single-page usage.

First Step: Add the optional browser_start_video/browser_stop_video pairing
  (with the canonical filename) to SKILL.md's Screenshot-critique step,
  then verify the resulting file's actual path before building the Preview
  toggle.
```

### Phase 5 persona critique (Approach C)

- **Skeptic (resolved, confirmed by direct read):** video's file-resolution
  behavior was originally inferred by analogy; `context.ts`'s
  `startVideoRecording`/`outputFile`/`workspaceFile` were read directly on
  2026-07-01 and confirm `suggestedFilename` (our `filename` param) resolves
  workspace-relative, bypassing `--output-dir`, exactly like screenshots.
  No longer a risk.
- **Constraint Guardian (Med, resolved):** no duration cap exists on
  recording - confirmed by reading `startVideoRecording`/`stopVideoRecording`
  directly, which wrap Playwright's native `page.screencast.start()`/`stop()`
  with no timer. Mitigation is layered: SKILL.md's unconditional
  stop_video pairing (primary), plus `Context.dispose()`'s automatic
  `stopVideoRecording()` on clean session end (secondary, confirmed in
  source) - accepted as sufficient for a solo-operator local dev tool; a
  hard crash bypassing both is not worth building a watchdog for at this
  scope.
- **User Advocate (Low, accepted):** no storage cap on accumulated video
  files - accepted, matches existing (also-uncapped) screenshot behavior,
  and optional-per-iteration cadence keeps growth proportional to how often
  recording is actually worth doing.

**Verdict: APPROVED.**
