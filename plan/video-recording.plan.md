Status: APPROVED
<!-- receive-plan (contract): 1 critic pass. 1 Med finding fixed inline
     (TASK-001 now mkdir's web/public/artifacts/ before writing — playwright-mcp's
     explicit-filename resolution doesn't auto-create parent dirs). Low findings
     noted, not actioned: TASK-005's toggle-vs-.calibrationText overlap is a
     plausible-but-unsimulated CSS layout call, verified visually by TASK-007
     instead; REQ-007 wording tightened for clarity, no functional change. -->
<!-- TASK-001 execution note (2026-07-02): REQ-007 (path resolution) CONFIRMED
     true via a real capture — files land at exactly web/public/artifacts/{name}.webm.
     BUT the actual recording is a 0-byte file every time (5/5 attempts, via both
     the MCP tool and raw page.screencast calls, on fresh and existing tabs).
     Root-caused: CDP Page.startScreencast delivers real frames (198 confirmed via
     a direct test), and playwright-core's bundled ffmpeg-1011 works standalone
     (correct webm/vp8 muxer/encoder) — so both halves work independently, but
     playwright-core@1.61.1's internal glue piping CDP frames into ffmpeg produces
     no output. This is an upstream Playwright bug in this specific build/platform,
     not fixable in AgentCast's code. Decision: ship TASK-003-007 anyway — the
     toggle's onError fallback already treats "no video" as a normal state, so the
     UI is correct and forward-compatible; real captures will start working
     automatically once the upstream bug is fixed. Multi-tab recording was also
     confirmed to leak a second file to the repo root (not web/public/artifacts/)
     when another tab is open while recording starts — matches the low-probability
     risk already flagged in the design brief, now empirically confirmed rather
     than just inferred from source. -->

# video-recording — plan

Depth: contract (2 blind ideators — Conventional, Risk-First — merged by
main-thread synthesis below). See `video-recording.specs.md` for the
requirements each task satisfies.

## Synthesis

Both ideators converged independently on the same core shape: a
`videoSrc` helper mirroring `screenshotSrc`, a self-contained toggle inside
`Preview` using the existing `Seg`/`SingleToggle` pattern, and the same two
`SKILL.md` edit locations. That agreement is treated as high-confidence and
kept as-is from both.

**Kept from Conventional**: the exact `videoSrc` implementation; the
concrete `Preview` state shape (`mode` + a load-error flag); the literal
`SKILL.md` insertion points (immediately before the `browser_navigate` line
in Preview, immediately after the highlight/hide_highlight sequence in
Screenshot-critique); "No changes needed" list (confirms REQ-006's
boundary). Its flagged ambiguities (toggle DOM placement, error-message
copy, instruction tone) are resolved directly below rather than carried
forward as open questions — sourcing `ui.module.css` showed the `.chrome`
bar's flex row (dots/url/viewport-indicator) has no spare room for a 3rd
interactive control, so the toggle is placed as an absolutely-positioned
overlay in `.shot` instead (TASK-005), and "No recording for this version"
(already the design brief's own wording) is locked as the exact copy.

**Kept from Risk-First**: the ordering principle — verify the one unproven
technical assumption (REQ-007) before writing UI code that would silently
depend on it — is kept and made TASK-001, ahead of everything else. The
final validation-suite and manual-smoke-test tasks are also kept
(TASK-006/007).

**Discarded**: Risk-First's dedicated "confirm WebM codec/browser support"
task is downgraded to a one-line note inside TASK-007 rather than its own
task — webm is natively supported by Chromium (what both playwright-mcp and
this dashboard's target browser use), and AGENTS.md frames this as a
solo-operator local dev tool (`maturity=development`), so a dedicated
cross-browser compatibility investigation is more ceremony than the risk
justifies here.

## Tasks

### TASK-001: Verify browser_start_video/stop_video file-path resolution

Depends on: none
Files: [web/public/artifacts/](web/public/artifacts/)
Symbols: none (manual MCP tool verification, no code)
Satisfies: REQ-007
Action: First run `mkdir -p web/public/artifacts` — `web/public/artifacts/`
does not exist yet, and playwright-mcp's explicit-`filename` resolution path
(`Context.workspaceFile()`) does not auto-create parent directories, unlike
its auto-named-artifact path (`Context.outputFile()`), which does. Without
this, a failure here would be a missing directory, not a signal about path
_convention_ correctness — the thing this task actually verifies. Then,
using the already-connected `mcp__playwright__` tools, call
`browser_start_video` with `filename: web/public/artifacts/verify-task001.webm`,
perform any trivial page action (e.g. a navigate), then call
`browser_stop_video`. Confirm the file lands at exactly that path, not
`.playwright-mcp/` or elsewhere.
Validate: `test -f web/public/artifacts/verify-task001.webm && echo FOUND`
Expected result: `FOUND` is printed. If not found at that path, stop and
re-scope TASK-005 (the assumption REQ-003/REQ-004 depend on is wrong) before
proceeding — do not build the toggle against an unverified path.

### TASK-002: Clean up the verification artifact

Depends on: [TASK-001](#task-001-verify-browser_start_videostop_video-file-path-resolution)
Files: [web/public/artifacts/](web/public/artifacts/)
Symbols: none
Satisfies: none (hygiene only)
Action: Delete `web/public/artifacts/verify-task001.webm` — it was only
proof-of-path, not a real capture (`web/public/` is gitignored, but no
reason to leave test debris in a live dev environment).
Validate: `test ! -f web/public/artifacts/verify-task001.webm && echo CLEAN`
Expected result: `CLEAN` is printed.

### TASK-003: Add videoSrc helper to data.ts

Depends on: [TASK-001](#task-001-verify-browser_start_videostop_video-file-path-resolution)
Files: [web/src/data/data.ts](web/src/data/data.ts)
Symbols: [screenshotSrc](web/src/data/data.ts#L64)
Satisfies: REQ-003
Action: Immediately after the existing `screenshotSrc` export, add a
one-line pure function in the same shape: `videoSrc(protoId, ver)` returning
the template string `/artifacts/${protoId}-${ver}.webm`. Same file, no new
imports.
Validate: `cd web && npm run typecheck`
Expected result: Exits 0, no new type errors.

### TASK-004: Update SKILL.md — start_video before navigate, stop_video after critique, never annotate

Depends on: [TASK-001](#task-001-verify-browser_start_videostop_video-file-path-resolution)
Files: [skills/frontend-loop/SKILL.md](skills/frontend-loop/SKILL.md)
Symbols: none (Markdown instructions, not code)
Satisfies: REQ-001, REQ-002
Action: In step 2 (Preview), insert immediately before the existing
`browser_navigate` line: "Optionally — mirroring the optional
`-critique-{ver}` screenshot below — call `mcp__playwright__browser_start_video`
with `filename: web/public/artifacts/{protoId}-{ver}.webm` _before_
navigating, so any load/transition animation is captured from its first
frame. Starting it after navigating misses the animation entirely." In step
3 (Screenshot-critique), insert immediately after the existing
highlight/`browser_hide_highlight` paragraph, before step 4 (Refine): "If a
recording was started, call `mcp__playwright__browser_stop_video`
unconditionally here, whether or not one was actually captured worth
keeping. Never call `mcp__playwright__browser_annotate` from this skill —
it blocks indefinitely waiting for a human to interact with a Dashboard UI,
which will hang an autonomous loop forever."
Validate: `grep -n "browser_start_video\|browser_stop_video\|browser_annotate" skills/frontend-loop/SKILL.md`
Expected result: Shows `browser_start_video` appearing before the
`browser_navigate` line's position in the file, `browser_stop_video`
appearing after the highlight paragraph, and `browser_annotate` appearing
only in the "never call" sentence (not as an instruction to call it).

### TASK-005: Add Screenshot/Video toggle to the Preview component

Depends on: [TASK-003](#task-003-add-videosrc-helper-to-datats)
Files: [web/src/components/ui.tsx](web/src/components/ui.tsx), [web/src/components/ui.module.css](web/src/components/ui.module.css)
Symbols: [Preview](web/src/components/ui.tsx#L102), [Seg](web/src/components/ui.tsx#L70), [SingleToggle](web/src/components/ui.tsx#L37)
Satisfies: REQ-004, REQ-005, REQ-006
Action: Import `videoSrc` alongside `screenshotSrc`. Add
`const [mode, setMode] = useState<'Screenshot' | 'Video'>('Screenshot')` and
`const [videoBroken, setVideoBroken] = useState(false)` inside `Preview`.
Render a `<Seg opts={['Screenshot', 'Video'] as const} value={mode} onChange={setMode} aria-label="Preview mode" />`
as an absolutely-positioned overlay control in the top-right of `.shot`
(the `.chrome` bar's flex row has no spare room for a 3rd control — confirmed
by reading `ui.module.css`'s `.chrome`/`.url`/`.viewportIndicator` rules).
Gate the existing `<img>` block on `mode === 'Screenshot'`. Add a sibling
block gated on `mode === 'Video' && ver`: if `!videoBroken`, render
`<video className={styles.shotImg} src={videoSrc(id, ver)} controls onError={() => setVideoBroken(true)} />`;
if `videoBroken`, render an inline message "No recording for this version"
(reuse `.calibrationText`'s styling as the visual pattern, add a small
`.videoEmpty` class in `ui.module.css` only if `.calibrationText` can't be
reused directly due to its `position: absolute; bottom: 12px` placement
conflicting with the toggle overlay). Reset `videoBroken` to `false` when
`id`/`ver` change (new version selected) so a stale error doesn't persist
across navigations — mirrors how `broken` already isn't reset today only
because `Preview` is remounted via a `key={...}` prop at both call sites,
which already covers this; confirm no extra effect is needed.
Validate: `cd web && npm run typecheck && npm run lint`
Expected result: Both exit 0.

### TASK-006: Run full validation suite

Depends on: [TASK-004](#task-004-update-skillmd--start_video-before-navigate-stop_video-after-critique-never-annotate), [TASK-005](#task-005-add-screenshotvideo-toggle-to-the-preview-component)
Files: [web/src/data/data.check.mjs](web/src/data/data.check.mjs)
Symbols: none
Satisfies: REQ-003, REQ-004, REQ-006 (regression check)
Action: Run the project's full local validation chain in order: `npm run
format` (root), `npm run check` (web/), `npm run typecheck` (web/), `npm run
lint` (root), `npm run build` (web/).
Validate: `npm run format && cd web && npm run check && npm run typecheck && npm run build && cd .. && npm run lint`
Expected result: All five commands exit 0. `npm run check` specifically
must still print `data check: ok` (confirms mock/live key parity wasn't
broken — REQ-006).

### TASK-007: Manual browser smoke test

Depends on: [TASK-006](#task-006-run-full-validation-suite)
Files: [web/src/views/Detail.tsx](web/src/views/Detail.tsx)
Symbols: [Preview](web/src/components/ui.tsx#L102)
Satisfies: REQ-004, REQ-005
Action: Start the dev server, navigate to a Detail page with mock data,
screenshot the toggle in both states. Confirm: (a) Screenshot mode is the
default on load, (b) clicking Video shows the "No recording for this
version" message (mock data has no `.webm` files) without reverting the
toggle back to Screenshot, (c) clicking back to Screenshot restores the
image. Note only: webm playback itself (once a real file exists) only needs
verifying in a Chromium-based browser — this is a solo-operator local dev
tool per AGENTS.md, not a cross-browser support matrix.
Validate: `cd web && npm run dev -- --port 5175` (manual browser check, not
scriptable)
Expected result: All three behaviors in Action confirmed visually; no
console errors logged during the toggle interaction.

## Retest trigger (upstream watch)

TASK-001's execution note above root-caused the 0-byte recording bug to
playwright-core@1.61.1's internal CDP→ffmpeg glue — an upstream Playwright
bug, not something fixable in this codebase. This section documents when
and how to retest it once upstream may have shipped a fix.

**Trigger**: `@playwright/mcp@latest` bundles a `playwright-core` version
newer than 1.61.1 (check via `npm view @playwright/mcp dependencies` or the
installed package's `node_modules/playwright-core/package.json`).

**Steps**:

1. Run one recording via the frontend-loop Preview stage (per TASK-004's
   `browser_start_video`/`browser_stop_video` sequence) against any
   prototype.
2. Assert the resulting `web/public/artifacts/{protoId}-{ver}.webm` is
   non-zero bytes (e.g. `test -s web/public/artifacts/{protoId}-{ver}.webm && echo NONZERO`).
3. Scan the repo root for leaked `*.webm` files — the empirically confirmed
   multi-tab leak (a second tab open while recording starts writes an extra
   file to the repo root instead of `web/public/artifacts/`).

**Success path**: If the file is non-zero bytes and no `*.webm` leaked to
the repo root, the upstream bug is fixed — this closes TASK-001 as fully
resolved (both REQ-007 path resolution and real frame capture now confirmed
working).

**Failure path**: If the file is still 0-byte or a leak is still observed,
link/file the upstream Playwright issue (search first — this may already be
tracked) and keep this trigger armed for the next `@playwright/mcp`
version bump.
