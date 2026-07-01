[meta]
date: 2026-07-01
topic: Close the build→preview→critique→refine→test loop via a plugin skill (roadmap item A / keystone)
status: draft (proposed 2026-07-01, pending review)

## Approach

Ship a plugin **skill** (`skills/frontend-loop/SKILL.md`) that encodes the loop
the dashboard was built to observe. For each prototype/version the agent:

1. **Build** — make/refine the prototype.
2. **Preview** — `browser_navigate` to `localhost:5173/{route}`.
3. **Screenshot-critique** — `browser_take_screenshot` with a name matching the
   convention below, then critique that image against the design intent.
4. **Refine** — apply fixes from the critique, re-capture.
5. **Test** — run the check step; capture a final-stage screenshot.

The agent writes each screenshot to `web/public/screenshots/` (or any path
`update-state.sh`'s three fallbacks resolve) using the filename convention the
existing hook already parses:

    {protoId}-{kind}-{stage}-{ver}.png
    kind  ∈ desktop | tablet | mobile   (optional, defaults desktop)
    stage ∈ preview  | critique | final (optional, defaults preview)
    ver   = v[0-9]+

Because `update-state.sh` (PostToolUse on `browser_take_screenshot`) already
ingests every capture into `state.json`, and `log-mcp-call.sh` already logs the
navigate/screenshot calls, **this item needs zero dashboard or data-layer code.**
The skill only makes the agent reliably emit the captures the pipeline already
consumes. `stage=final` is what drives `live.js`'s LOOP derivation to show
Test as running, so the naming convention alone lights up the loop panel.

## Why

The dashboard **ingests** real activity but nothing **produces** it — capture is
manual today (confirmed in `2026-06-30-real-screenshot-rendering-design.md`:
"No automated capture trigger exists yet"). The obvious "make it automatic" move
— a hook that fires the screenshot — is impossible: Claude Code hooks are
`type: "command"` scripts that receive tool I/O on stdin and may allow/deny/
modify it, but **cannot initiate an MCP tool call**. Every existing hook only
reacts. The sole actor that can call the Playwright MCP is the agent, so the
loop must be an agent-driven workflow. A plugin skill is Claude Code's native
mechanism for "make the agent reliably run X" — no new process, no second
automation stack, and it inherits the ingest pipeline for free.

The mcp-logging design distrusted "Claude's conversational memory" for _logging_
and chose a deterministic hook — correct, because logging is a reaction. Here
the requirement is _initiation_, which by the platform's design only the agent
can do. A skill is the strongest determinism available for an initiate step;
that is a platform ceiling, not a shortcut. (ponytail: skill-as-driver, upgrade
to an external headless runner only if agent-less autonomy is ever required.)

## Scope

M. New: `skills/frontend-loop/SKILL.md` — auto-discovered (like `hooks/`, no
manifest wiring). One required hook fix: `update-state.sh` normalizes the served
file to `{protoId}-{ver}.png` (see Constraints) — kind/stage-named captures
otherwise 404. No changes to `web/`. Explicitly deferred to their own items:

- **FINDINGS producer** (item B) — the critique step _runs_ here but the
  dashboard's `FINDINGS` stays `[]` until B adds the `findings.jsonl` reader.
- **TESTS producer** (item C) — same; the Test step runs but `TESTS` stays a
  stub until C.
  So after this item alone: Prototypes, Detail preview, Sandbox, System, and the
  LOOP/AGENT derivations go live; the critique-findings list and Tests table do
  not yet. That is an intentional, shippable slice.

## Constraints

- **Filenames must match `update-state.sh`'s regex or the capture is silently
  dropped** (`?// empty` yields nothing on a non-match). The skill must state the
  convention explicitly and never rely on Playwright's default filename.
- File format PNG only (matches `browser_take_screenshot`'s `type` and the
  derived `screenshotSrc` path). Don't mix formats.
- Determinism ceiling: this is a workflow, not a guarantee — it depends on agent
  compliance. That is the only option given the hook constraint; do not pretend a
  hook could enforce it.
- Dev server must be up (`localhost:5173`) — already handled by the SessionStart
  `start-web.sh` hook (item 1), so preview navigation just works.
- No new runtime dependency; no change to `mock.js`/`live.js` key sets
  (`data.check.mjs` parity must stay green).

## Interface

No new code exports. New artifact:

- `skills/frontend-loop/SKILL.md` — describes the five-stage loop, the screenshot
  naming convention, and the per-stage capture points. Triggers when the user
  asks to build/iterate on a frontend prototype under AgentCast.

Data contract touched: none new — reuses `state.json`'s existing
`{protoId, proto, kind, stage, ver, capturedAt}` screenshot entry, produced
entirely by the existing hook from the filename.

## Alternative considered (the fork)

**External headless Playwright driver** — a Node script, run outside Claude, that
loops build→screenshot autonomously. Rejected as the default: it's a second
automation system duplicating what agent+MCP already do, needs its own process
lifecycle and error handling, and contradicts the product framing ("mission
control for _an AI coding agent's_ loop" — the agent is the actor, not a
sidecar script). Choose it only if capture must happen with no agent in the loop.
