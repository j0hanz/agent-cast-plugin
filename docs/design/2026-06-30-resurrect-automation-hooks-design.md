[meta]
date: 2026-06-30
topic: Resurrect AgentCast's SessionStart automation hook (roadmap item 1)
status: approved (locked via interview 2026-06-30)

## Approach

Restore `hooks/hooks.json` and `hooks/start-web.sh` byte-for-byte from commit
`a681cc8~1`, the commit immediately before they were deleted.

## Why

Both files were deleted as collateral damage in `a681cc8` ("Replace agent-browser
to playwright") — a commit whose actual purpose was swapping the MCP browser
server (`.mcp.json`, `plugin.json`, `marketplace.json`, a sidebar status badge in
`Shell.jsx`). Neither hook file ever referenced `agent-browser`; their only job —
auto-start the Vite dev server on `SessionStart`, write `AGENTCAST_URL` to the
session env — is unrelated to which MCP server drives the browser. Direct
file inspection (`git show a681cc8~1:hooks/...`) confirmed nothing in either
file is stale relative to the current repo. No redesign needed.

## Scope

S. Two files restored unmodified. No other files touched.

## Constraints

- Hooks load at Claude Code session start; this restore won't take effect until
  the session restarts.
- Out of scope (deliberately, confirmed via interview): making the hook aware of
  `VITE_DATA_SOURCE` (the mock/live toggle shipped earlier today). Switching data
  source already requires a manual dev-server restart with an explicit env var —
  a `SessionStart` hook auto-detecting it would require restarting the whole
  Claude Code session, which is a heavier action than the existing manual flow
  already asks for. Auto-starting in mock mode (today's default) is correct.
- Out of scope: wiring any part of the real build/critique/test loop (roadmap
  items 2-6) — this hook only ever started the dashboard's dev server.

## Interface

No new exports or APIs. Restores:

- `hooks/hooks.json` — `SessionStart` → `bash ${CLAUDE_PLUGIN_ROOT}/hooks/start-web.sh`
- `hooks/start-web.sh` — probes `localhost:5173` via `/dev/tcp`; if free, installs
  deps if needed and backgrounds `npm run dev -- --port 5173 --strictPort`,
  logging to `web/.dev-server.log`; always exports `AGENTCAST_URL` to
  `$CLAUDE_ENV_FILE`.

## Architecture

No architectural change — this is a restore of previously-working scaffolding,
not new design.

## Risks

- None material. Same script ran successfully on this machine before deletion.
  `set -euo pipefail` and the `/dev/tcp` port probe (rather than a pidfile) were
  already an accepted, documented (`ponytail:` comment) tradeoff in the original.

## First Step

`git checkout a681cc8~1 -- hooks/hooks.json hooks/start-web.sh`
