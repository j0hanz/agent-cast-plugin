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
const loadState = async () => {
  let changed = false;
  try {
    const res = await fetch('/state.json');
    if (res.ok) {
      const newState = await res.json();
      if (Array.isArray(newState.screenshots)) {
        state = newState;
        changed = true;
      }
    }
  } catch (err) {
    warn('live.js: no usable state.json, falling back to empty state', err);
  }

  try {
    const res = await fetch('/mcp-calls.jsonl');
    if (res.ok) {
      const newCalls = (await res.text())
        .split('\n')
        .filter(Boolean)
        .flatMap(line => {
          try { return [JSON.parse(line)]; } catch { return []; }
        });
      mcpCalls = newCalls;
      changed = true;
    }
  } catch (err) {
    warn('live.js: no usable mcp-calls.jsonl, falling back to empty log', err);
  }

  try {
    const res = await fetch('/log.jsonl');
    if (res.ok) {
      const newLogs = (await res.text())
        .split('\n')
        .filter(Boolean)
        .flatMap(line => {
          try { return [JSON.parse(line)]; } catch { return []; }
        });
      logStore = newLogs;
      changed = true;
    }
  } catch (err) {
    warn('live.js: no usable log.jsonl, falling back to empty agent log', err);
  }

  return changed;
};

if (import.meta.env?.VITE_DATA_SOURCE === 'live') {
  await loadState();
  if (typeof window !== 'undefined') {
    setInterval(async () => {
      if (await loadState()) {
        window.dispatchEvent(new Event('live-data-update'));
      }
    }, 2000);
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

let logStore = [];

export const PROTOTYPES = [];
export const VERSIONS = [];
export const LOOP = [];
export const FINDINGS = [];
export const SESSION = [];
export const TESTS = [];
export const SETTINGS = [];
export const MCP = [];

// Exports that need to update on poll
export const LOG = new Proxy([], {
  get(target, prop) {
    return Reflect.get(logStore, prop);
  }
});

// Exports that need to update on poll
export const SCREENSHOTS = new Proxy([], {
  get(target, prop) {
    const arr = Array.isArray(state.screenshots) ? state.screenshots : [];
    return Reflect.get(arr, prop);
  }
});
export const MCP_CALLS = new Proxy([], {
  get(target, prop) {
    return Reflect.get(mcpCalls, prop);
  }
});
export const MCP_TOOLS = new Proxy([], {
  get(target, prop) {
    return Reflect.get(deriveMcpTools(mcpCalls), prop);
  }
});
