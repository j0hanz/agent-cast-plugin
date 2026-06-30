// Live content for the AgentCast dashboard — used when VITE_DATA_SOURCE=live.
// Most fields are still placeholders until their own roadmap item builds a
// real producer (see docs/design/2026-06-30-live-data-manifest-design.md).
// Every consumer already empty/falsy-guards, so empty values render correctly
// with no further view changes. Shape must match mock.js (data.check.mjs enforces it).
// AGENT isn't exported here — data.js derives it from SCREENSHOTS recency
// (see docs/design/2026-06-30-derived-agent-status-design.md).

// SCREENSHOTS is the one field with a real producer today (captures written to
// web/public/screenshots/, roadmap item 2) — sourced from a JSON manifest a
// future background process can write to without producing valid JS. Each
// entry needs a real `capturedAt` (ISO 8601) so relative time and AGENT's
// recency check stay honest, not a pre-formatted string that goes stale.
// data.js statically imports this module either way (so it can switch at
// runtime), which means this file's top-level code always evaluates — even
// in mock mode. Guard the fetch on the actual selected mode so mock mode
// stays 100% synchronous with zero network calls, as designed.
const warn = (msg, err) => { if (typeof window !== 'undefined') console.warn(msg, err); };

let state = {};
let mcpCalls = [];
if (import.meta.env?.VITE_DATA_SOURCE === 'live') {
  try {
    const res = await fetch('/state.json');
    if (res.ok) state = await res.json();
  } catch (err) {
    // Always taken under plain `node` (data.check.mjs) — only worth a warning
    // when a real browser session expected a manifest and didn't get one.
    warn('live.js: no usable state.json, falling back to empty state', err);
  }

  // hooks/log-mcp-call.mjs appends one JSON line per Playwright MCP call —
  // JSONL, not a shared array, so concurrent hook processes can't race each
  // other the way a read-modify-write of one big array would.
  try {
    const res = await fetch('/mcp-calls.jsonl');
    if (res.ok) {
      mcpCalls = (await res.text())
        .split('\n')
        .filter(Boolean)
        .flatMap(line => {
          try { return [JSON.parse(line)]; } catch { return []; } // skip malformed lines, don't crash the module
        });
    }
  } catch (err) {
    warn('live.js: no usable mcp-calls.jsonl, falling back to empty log', err);
  }
}

// Aggregate {name, calls} counts derived from the raw log — same "derive,
// don't separately track" pattern data.js uses for AGENT. Not exported:
// would break data.check.mjs's mock/live key-parity check (mock.js has no
// matching export), and importing it from data.js would be circular
// (data.js already imports this module). Verified via browser testing.
const deriveMcpTools = (calls) => {
  const counts = calls.reduce((acc, c) => (acc[c.tool] = (acc[c.tool] || 0) + 1, acc), {});
  return Object.entries(counts).map(([name, calls]) => ({ name, calls })).sort((a, b) => b.calls - a.calls);
};

export const PROTOTYPES = [];
export const VERSIONS = [];
export const LOOP = [];
export const FINDINGS = [];
export const SCREENSHOTS = Array.isArray(state.screenshots) ? state.screenshots : [];
export const SESSION = [];
export const LOG = [];
export const TESTS = [];
export const MCP = [];
export const MCP_CALLS = mcpCalls;
export const MCP_TOOLS = deriveMcpTools(mcpCalls);
export const SETTINGS = [];
