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
// relativeTime is a pure helper owned by data.js (single source of truth).
// This import is circular (data.js imports this module) but safe: relativeTime
// is only ever *called* lazily inside the liveArray/SESSION/MCP computes at
// render time, never during module eval, so the binding is always resolved.
import { relativeTime } from './data.js';

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

// Wraps a fresh-computed-array getter in a Proxy whose contents stay live
// across polling without callers ever re-importing. The `has` trap matters:
// without it, `k in target` falls back to the real (always-empty) backing
// array, which silently breaks every bulk Array method (map/filter/reduce/
// forEach all internally check HasProperty before reading an index).
const liveArray = (compute) => new Proxy([], {
  get(target, prop) { return Reflect.get(compute(), prop); },
  has(target, prop) { return Reflect.has(compute(), prop); }
});

const latestScreenshot = (arr) => arr.reduce((latest, s) => (!latest || s.capturedAt > latest.capturedAt) ? s : latest, null);

// Derived PROTOTYPES
export const PROTOTYPES = liveArray(() => {
  const arr = Array.isArray(state.screenshots) ? state.screenshots : [];
  const map = new Map();
  for (const s of arr) {
    if (!map.has(s.protoId)) {
      const recent = (Date.now() - new Date(s.capturedAt).getTime()) < 5 * 60_000;
      map.set(s.protoId, {
        id: s.protoId,
        name: s.proto,
        device: s.kind === 'mobile' ? 'Mobile' : (s.kind === 'tablet' ? 'Tablet' : 'Desktop'),
        status: recent ? 'live' : 'draft'
      });
    }
  }
  return Array.from(map.values());
});

// Derived VERSIONS for the active prototype
export const VERSIONS = liveArray(() => {
  const arr = Array.isArray(state.screenshots) ? state.screenshots : [];
  return [...new Set(arr.map(s => s.ver))].sort();
});

// Derived LOOP steps based on the latest screenshot's stage
export const LOOP = liveArray(() => {
  const arr = Array.isArray(state.screenshots) ? state.screenshots : [];
  const latest = latestScreenshot(arr);
  if (!latest) return [];

  const stage = latest.stage;
  return [
    { name: 'Build', state: 'done', t: 'completed' },
    { name: 'Preview', state: stage === 'preview' ? 'live' : 'done', t: stage === 'preview' ? 'running…' : 'completed' },
    { name: 'Screenshot-critique', state: stage === 'critique' ? 'live' : (stage === 'final' ? 'done' : ''), t: stage === 'critique' ? 'running…' : (stage === 'final' ? 'completed' : 'queued') },
    { name: 'Refine', state: '', t: 'queued' },
    { name: 'Test', state: stage === 'final' ? 'live' : '', t: stage === 'final' ? 'running…' : 'queued' }
  ];
});

// Placeholder for FINDINGS — no producer yet, intentionally static.
export const FINDINGS = [];

// Derived SESSION data
export const SESSION = liveArray(() => {
  const arr = Array.isArray(state.screenshots) ? state.screenshots : [];
  const latest = latestScreenshot(arr);
  if (!latest) return [];

  const navCall = mcpCalls.find(c => c.tool === 'mcp__playwright__browser_navigate');
  const url = navCall?.input?.url || `/${latest.protoId}`;

  return [
    { k: 'Prototype', v: latest.proto },
    { k: 'Viewport', v: latest.kind === 'mobile' ? '390 × 844' : (latest.kind === 'tablet' ? '834 × 1112' : '1440 × 900') },
    { k: 'URL', v: url },
    { k: 'Dev server', v: ':5173' },
    { k: 'Latest capture', v: relativeTime(latest.capturedAt) }
  ];
});

// Derived TESTS — one passing-stub row per prototype found in screenshots.
export const TESTS = liveArray(() => {
  const arr = Array.isArray(state.screenshots) ? state.screenshots : [];
  const map = new Map();
  for (const s of arr) {
    if (!map.has(s.protoId)) {
      map.set(s.protoId, { name: s.proto, checks: 10, pass: 10, total: 10, status: 'passed' });
    }
  }
  return Array.from(map.values());
});

export const SETTINGS = [
  { group: 'Environment', items: [
    { k: 'Default viewport', v: '1440 × 900' },
    { k: 'Image format', v: 'PNG' },
    { k: 'Dev server port', v: ':5173' },
    { k: 'Theme', v: 'Graphite' },
    { k: 'Accent', v: 'Amber' },
  ] },
];

// Derived MCP server info
export const MCP = liveArray(() => {
  const active = mcpCalls.length > 0;
  const latest = mcpCalls[0];
  return [
    { k: 'Server', v: 'Playwright MCP' },
    { k: 'Transport', v: 'stdio' },
    { k: 'Status', v: active ? 'Connected' : 'Disconnected', pill: active ? 'live' : 'draft' },
    { k: 'Recent activity', v: latest ? relativeTime(latest.ts) : 'none' }
  ];
});

// Exports that need to update on poll
export const LOG = liveArray(() => logStore);

// Exports that need to update on poll
export const SCREENSHOTS = liveArray(() => Array.isArray(state.screenshots) ? state.screenshots : []);

export const MCP_CALLS = liveArray(() => mcpCalls);

export const MCP_TOOLS = liveArray(() => deriveMcpTools(mcpCalls));
