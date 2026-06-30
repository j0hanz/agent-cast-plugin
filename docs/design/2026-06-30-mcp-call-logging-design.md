[meta]
date: 2026-06-30
topic: Real MCP call logging via a PostToolUse hook (roadmap item 6)
status: approved (locked via interview + Phase 5 critique 2026-06-30)

## Approach
A `PostToolUse` hook (`hooks/log-mcp-call.mjs`, Node ESM) matching
`mcp__playwright__.*` appends one JSON line per call to
`web/public/mcp-calls.jsonl` (gitignored, append-only). `live.js` fetches and
parses it the same way it already fetches `state.json`. `MCP_TOOLS`
(aggregate `{name, calls}` counts) is derived from the log via group-by-count
— no separate hook-side bookkeeping, same pattern item 4 established for
`AGENT`. Display is generic: `tool_name` bolded + truncated
`JSON.stringify(tool_input)`, no per-tool formatting.

## Why
Item 5 established that anything meant to work for arbitrary marketplace
users needs a deterministic mechanism, not Claude's conversational memory.
`PostToolUse` hooks are exactly that — they fire on every matching tool call
regardless of which session or which user is running it. JSONL (not a shared
JSON array) avoids a real concurrency race: a single Claude turn can fire
multiple Playwright tool calls in parallel, each spawning its own hook
process: a shared-array read-modify-write would lose updates, an append-only
log doesn't. Generic display formatting was chosen over a per-tool formatter
map because the Playwright MCP server is a third-party package
(`npx @playwright/mcp@latest`) whose tool surface this repo doesn't control —
a formatter map would silently go stale as that package evolves.

## Scope
M, flagged for Phase 5 (first non-`SessionStart` hook, first non-JSON-object
manifest file, real concurrency consideration). Item 5 (settings
enforcement via `PreToolUse`) explicitly excluded — confirmed via interview
to stay its own future cycle, even though the same hook infrastructure could
plausibly cover it.

## Constraints
- `web/public/` doesn't exist on a fresh clone (everything written there so
  far is gitignored, nothing tracked creates it) — the hook script must
  `mkdir -p` the target directory before appending.
- `web/public/mcp-calls.jsonl` must be added to `.gitignore`.
- Each line must be `JSON.stringify(entry) + '\n'` (compact, single-line) —
  never pretty-printed, which would break the line-per-entry contract.
- The JSONL parser in `live.js`/`data.js` must defensively skip blank or
  malformed lines per-line, not crash the whole module on one bad entry.
- Full `tool_input` is logged (not trimmed) — local, gitignored, never
  transmitted, no privacy exposure. No size cap/rotation (revisit only if it
  becomes a real problem).
- Display truncates `JSON.stringify(input)` at render time; storage stays
  untruncated.

## Interface
```js
// hooks/log-mcp-call.mjs (PostToolUse, matcher: mcp__playwright__.*)
// reads hook input JSON from stdin, appends one line to mcp-calls.jsonl
import { mkdirSync, appendFileSync } from 'node:fs';
import { dirname } from 'node:path';

const input = JSON.parse(/* stdin */);
const entry = { ts: new Date().toISOString(), tool: input.tool_name, input: input.tool_input };
const logPath = `${process.env.CLAUDE_PLUGIN_ROOT}/web/public/mcp-calls.jsonl`;
mkdirSync(dirname(logPath), { recursive: true });
appendFileSync(logPath, JSON.stringify(entry) + '\n');
```
```js
// live.js — same try/catch/guard pattern as the state.json fetch
export const MCP_CALLS = parseJsonl(await fetchText('/mcp-calls.jsonl'));
```
```js
// data.js — new pure helper, alongside deriveAgent
export const deriveMcpTools = (calls) => {
  const counts = calls.reduce((acc, c) => (acc[c.tool] = (acc[c.tool] || 0) + 1, acc), {});
  return Object.entries(counts).map(([name, calls]) => ({ name, calls })).sort((a, b) => b.calls - a.calls);
};
export const MCP_TOOLS = deriveMcpTools(MCP_CALLS);
```
`System.jsx`'s `McpCallRow` renders `relativeTime(c.ts)` (reusing item 4's
helper) instead of a new time format, and `tool`/truncated `JSON.stringify(input)`
via the existing `RichText` component for bolding.

## Architecture
No new dependency (Node's built-in `fs`, matching `data.check.mjs`'s existing
plain-ESM-script convention). `MCP_CALLS` and `MCP_TOOLS` join `SCREENSHOTS`
as the third and fourth manifest-backed live fields; `AGENT`, `TESTS`,
`SETTINGS` remain hardcoded empty in `live.js`, deferred to their own future
items.

## Risks
- Concurrent `PostToolUse` processes appending simultaneously could
  theoretically interleave for unusually large `tool_input` payloads
  (>~4KB, e.g. a big `browser_evaluate` script) — POSIX `O_APPEND` atomicity
  covers typical Playwright call sizes (URLs, selectors, screenshot params).
  Accepted residual risk, mitigated by the defensive per-line parser already
  required above (a corrupted line is skipped, not a crash).
- None blocking otherwise.

## First Step
1. Add `web/public/mcp-calls.jsonl` to `web/.gitignore`.
2. Write `hooks/log-mcp-call.mjs` per the Interface above.
3. Add a `PostToolUse` entry to `hooks/hooks.json` matching `mcp__playwright__.*`.
4. Add JSONL fetch/parse for `MCP_CALLS` to `live.js`, with defensive
   per-line parsing.
5. Add `deriveMcpTools()` to `data.js`; wire `MCP_CALLS`/`MCP_TOOLS` through
   the existing switcher.
6. Update `System.jsx`'s `McpCallRow` to use `relativeTime()`.
