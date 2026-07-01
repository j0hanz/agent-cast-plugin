---
name: frontend-loop
description: Run AgentCast's closed-loop frontend workflow — build, preview, screenshot-critique, refine, test a UI prototype via the Playwright MCP, capturing screenshots the AgentCast dashboard ingests. Use when building or iterating on a frontend prototype, page, or component and you want each iteration tracked in the AgentCast mission-control dashboard.
---

# Frontend loop

Drives the build → preview → screenshot-critique → refine → test loop that the
AgentCast dashboard was built to observe. You (the agent) are the loop: hooks
already ingest every screenshot and MCP call, so your only job is to run the
stages and **capture with the exact filename convention below**. Skip the
convention and the capture is silently dropped or renders blank.

## Prerequisites

- Dev server at `localhost:5173` — auto-started by AgentCast's SessionStart
  hook. If it's down, run `npm run dev -- --port 5173` in `web/`.
- Playwright MCP server available (`mcp__playwright__*` tools).
- Once per session, call `mcp__playwright__browser_get_config` — the hook
  captures its response so the dashboard's System → Server panel shows the
  real resolved config instead of sitting empty.

## Screenshot naming convention (non-negotiable)

Capture to:

    web/public/screenshots/{protoId}-{kind}-{stage}-{ver}.png

- `protoId` — kebab-case id, e.g. `landing-hero`. Becomes the display name
  ("Landing hero") automatically.
- `kind` — `desktop` | `tablet` | `mobile`. Optional, defaults `desktop`.
- `stage` — `preview` | `critique` | `final`. Optional, defaults `preview`.
  Drives the dashboard's LOOP panel; use `final` only when the version passes.
- `ver` — `v1`, `v2`, … **Required.** Bump it every build/refine iteration.
- PNG only. A name that doesn't match this pattern is ignored by the ingest hook.

The hook parses `kind`/`stage` into the dashboard state and serves the image at
`/screenshots/{protoId}-{ver}.png`, so one image shows per prototype+version
(the latest capture of that version wins). Bump `ver` per iteration, not per
stage, to keep the capture grid one-card-per-iteration.

## The loop

For each prototype, one pass = one `ver`:

1. **Build** — write/edit the prototype so it renders at a `localhost:5173`
   route.
2. **Preview** — `mcp__playwright__browser_navigate` to
   `http://localhost:5173/{route}`. Set the viewport with
   `mcp__playwright__browser_resize` to match `kind` (desktop 1440×900,
   tablet 834×1112, mobile 390×844).
3. **Screenshot-critique** — `mcp__playwright__browser_take_screenshot` with
   `filename: web/public/screenshots/{protoId}-{kind}-preview-{ver}.png`, then
   read that image back and critique it against the design intent in
   `DESIGN.md` / `PRODUCT.md` (hierarchy, spacing, the single-amber-signal rule,
   contrast, responsive behaviour). Also call
   `mcp__playwright__browser_console_messages` with `level: "error"` and
   `mcp__playwright__browser_network_requests` (no special params needed —
   both flow straight into the dashboard's System → Console/Network panels,
   nothing to hand-write).

   For each issue found, append one JSON line to `web/public/findings.jsonl`:

       {"protoId":"landing-hero","ver":"v3","sev":"high","text":"Secondary button contrast below AA (3.1:1)","loc":".btn-secondary"}

   `sev` ∈ `high` | `med` | `low`. `loc` must be a bare, unique CSS selector
   (or snapshot target) — nothing else — since it also doubles as the
   `browser_highlight` target below; put any measurement/detail (like a
   contrast ratio) in `text` instead. The dashboard's Detail → Critique
   findings panel shows the active prototype's latest-version findings from
   this file, so bump `ver` per iteration and the old findings drop off
   automatically.

   If the review state is worth recording, highlight what you found before
   capturing it: call `mcp__playwright__browser_highlight` once per open
   finding (`target: <its loc>`), capture `-critique-{ver}`, then
   `mcp__playwright__browser_hide_highlight` (omit `target` to hide all)
   before moving on.

4. **Refine** — apply the fixes the critique surfaced.
5. **Test** — verify the fixes with real assertions, then record the run. For
   each acceptance criterion (e.g. "CTA button visible", "heading text
   correct"), call one `mcp__playwright__browser_verify_element_visible`,
   `browser_verify_text_visible`, `browser_verify_list_visible`, or
   `browser_verify_value` — one call per criterion, since each call asserts
   exactly one thing and fails on its own. Catch each result individually (a
   failed assertion doesn't stop you from running the rest) and tally
   `pass`/`total` from what actually passed, not a self-estimate. Then append
   one JSON line to `web/public/tests.jsonl` —

       {"protoId":"landing-hero","ver":"v3","name":"Landing hero","pass":9,"total":10}

   `total` = assertions you ran, `pass` = how many actually passed. The
   dashboard marks the suite **failed** if any check failed OR any
   high-severity finding is open for that version, else passed. When the
   version passes, capture a final frame as `{protoId}-{kind}-final-{ver}.png`
   (`stage=final` advances the dashboard's loop). Then bump `ver` and loop, or
   move to the next prototype.

## Notes

- Everything under `web/public/` is gitignored — captures are artifacts, don't
  commit them.
- Critique findings (item B) and test runs (item C) are both live: write
  `findings.jsonl` / `tests.jsonl` and they render in Detail and the Tests view.
