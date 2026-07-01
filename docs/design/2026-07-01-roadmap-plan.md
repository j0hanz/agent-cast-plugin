[meta]
date: 2026-07-01
topic: Roadmap plan for the remaining AgentCast items (post P0 cleanup)
status: draft (proposed 2026-07-01, pending review)

## Where we are

Items 1–4 and 6 of the original roadmap shipped; item 5 (settings enforcement)
was deferred. P0 hygiene (gitignore log artifacts, dedupe `relativeTime`, drop
dead `SearchBox`, gate nav motion) landed in `018bb6a`.

| # | Item | State |
|---|------|-------|
| 1 | SessionStart auto-starts dev server | shipped |
| 2 | Real screenshot rendering (`screenshotSrc` + `<img>`) | shipped |
| 3 | `state.json` manifest contract for `live.js` | shipped |
| 4 | AGENT status derived from screenshot recency | shipped |
| 6 | MCP call logging (PostToolUse → `mcp-calls.jsonl`) | shipped |
| 5 | Settings enforcement (PreToolUse) | deferred, not designed |

What actually works: the dashboard **ingests** real agent activity. What's
missing: something reliably **produces** that activity. The dashboard observes
a loop that today runs by hand.

## The reframe (the constraint that sets the whole plan)

Claude Code hooks are `type: "command"` scripts that receive a tool's I/O on
stdin and may allow/deny/modify it. **They cannot initiate an MCP tool call.**
Every existing hook (`update-state.sh`, `log-mcp-call.sh`, `log-session.sh`)
only reacts. So "automated capture trigger" (the old framing of item 4-next)
*cannot* be a hook that fires `browser_take_screenshot`.

The only actor that can call the Playwright MCP is the agent (Claude) itself.
Therefore closing the loop = giving the agent a **skill/workflow** that runs
build → preview → screenshot-critique → refine → test and captures at each
stage. The ingest half is already built; the missing half is a producer the
agent drives. That single skill produces three of the remaining data streams:

- **captures** → already ingested by `update-state.sh` (zero new dashboard code)
- **critique findings** → new `findings.jsonl` + one `live.js` reader (item B)
- **test results** → new `tests.jsonl` + one `live.js` reader (item C)

## Sequence

Ordered by leverage. Each item is small once the loop skill exists, because the
dashboard ingest pattern (`fetch → parse jsonl → liveArray`) is already proven
by `mcp-calls.jsonl`.

**A. The loop skill (keystone).** New plugin skill that drives the
build/preview/critique/refine/test loop and captures screenshots with the
naming convention `update-state.sh` already parses. No dashboard change. Full
design: `2026-07-01-automated-capture-loop-design.md`. *Effort: M. Depends on
nothing. Do first.*

**B. Live critique findings.** The loop's critique step appends
`{protoId, ver, severity, text}` lines to `web/public/findings.jsonl`; `live.js`
reads it exactly like `mcp-calls.jsonl` and exposes `FINDINGS` (today a hardcoded
`[]`). Detail's critique panel goes live. *Effort: S. Depends on A (A produces
the findings). Gitignore + one live.js block + Detail already renders FINDINGS.*

**C. Live test results.** Replace `live.js`'s stubbed `TESTS` (hardcoded
`10/10` per prototype) with a real `tests.jsonl` producer. **Open decision:
what is a "test" here?** No test framework is wired in `web/`. Candidates:
(a) accessibility / web-guideline checks via existing skills, (b) Playwright
assertions the loop runs, (c) the critique findings rolled up to pass/fail.
Recommend (a)+(c): reuse what the agent already does, don't stand up a runner.
*Effort: S–M. Depends on A + the decision above.*

**D. Settings enforcement (original item 5).** A PreToolUse hook on
`mcp__playwright__.*` that reads a `settings.json` and can **deny/modify** a
call — the first hook to use PreToolUse's gate power (today's `log-session.sh`
only logs). Makes System → Settings real: the panel displays the same file the
hook enforces (allowed viewports, localhost-only navigation, capture on/off).
*Effort: M. Independent of A–C; can run in parallel. Own design doc when picked.*

**E. Polish.** PrototypeCard thumbnails via `latestScreenshot(protoId)` (now
exists in `data.js`); Preview `alt` text carrying stage. *Effort: S. Anytime.*

## Open decisions (need your steer)

1. **Loop mechanism for A** — agent-driven skill (recommended, native, no
   parallel system) vs an external headless Playwright driver (autonomous
   without an agent, but a second automation stack duplicating agent+MCP).
   Design doc assumes the skill; say so if you want the driver instead.
2. **"Test" definition for C** — see item C. Blocks only C, not A/B/D.
3. **Slice granularity** — ship A alone first (loop produces captures, dashboard
   already shows them), then B/C as fast follows? Recommended over one big PR.

## Non-goals (this plan)

No new runtime dependency, no backend, no test framework in `web/`, no second
accent color, nothing that breaks mock/live key parity (`data.check.mjs`).
