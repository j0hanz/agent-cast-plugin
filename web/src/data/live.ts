// Live content for the AgentCast dashboard — used when VITE_DATA_SOURCE=live.
// Most fields are still placeholders until their own roadmap item builds a
// real producer (see docs/design/2026-06-30-live-data-manifest-design.md).
// Every consumer already empty/falsy-guards, so empty values render correctly
// with no further view changes. Shape must match mock.ts (data.check.mjs enforces it).
// AGENT isn't exported here — data.ts derives it from SCREENSHOTS recency
// (see docs/design/2026-06-30-derived-agent-status-design.md).

// SCREENSHOTS is the one field with a real producer today (captures written to
// web/public/screenshots/, roadmap item 2) — sourced from a JSON manifest a
// future background process can write to without producing valid JS. Each
// entry needs a real `capturedAt` (ISO 8601) so relative time and AGENT's
// recency check stay honest, not a pre-formatted string that goes stale.
// data.ts statically imports this module either way (so it can switch at
// runtime), which means this file's top-level code always evaluates — even
// in mock mode. Guard the fetch on the actual selected mode so mock mode
// stays 100% synchronous with zero network calls, as designed.
// relativeTime is a pure helper owned by data.ts (single source of truth).
// This import is circular (data.ts imports this module) but safe: relativeTime
// is only ever *called* lazily inside the liveArray/SESSION/MCP computes at
// render time, never during module eval, so the binding is always resolved.
import { relativeTime, testStatus } from './data.ts';
import type { Prototype, Screenshot, Finding, KV, LogEntry, TestRunInput, TestRun, McpTool, McpCall, SettingsGroup } from './types.ts';

const warn = (msg: string, err: unknown): void => { if (typeof window !== 'undefined') console.warn(msg, err); };

interface LiveState {
  screenshots?: Screenshot[];
}

let state: LiveState = {};
let mcpCalls: McpCall[] = [];
// Declared here, above loadState, not next to the exports below: loadState runs
// at top-level await before those later `let`s would initialize, so assigning
// them from inside the first fetch would hit the temporal dead zone.
let logStore: LogEntry[] = [];
let findingsStore: Finding[] = [];
let testsStore: TestRunInput[] = [];
const loadState = async (): Promise<boolean> => {
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
    warn('live.ts: no usable state.json, falling back to empty state', err);
  }

  try {
    const res = await fetch('/mcp-calls.jsonl');
    if (res.ok) {
      const newCalls: McpCall[] = (await res.text())
        .split('\n')
        .filter(Boolean)
        .flatMap(line => {
          try { return [JSON.parse(line)]; } catch { return []; }
        });
      mcpCalls = newCalls;
      changed = true;
    }
  } catch (err) {
    warn('live.ts: no usable mcp-calls.jsonl, falling back to empty log', err);
  }

  try {
    const res = await fetch('/log.jsonl');
    if (res.ok) {
      const newLogs: LogEntry[] = (await res.text())
        .split('\n')
        .filter(Boolean)
        .flatMap(line => {
          try { return [JSON.parse(line)]; } catch { return []; }
        });
      logStore = newLogs;
      changed = true;
    }
  } catch (err) {
    warn('live.ts: no usable log.jsonl, falling back to empty agent log', err);
  }

  try {
    const res = await fetch('/findings.jsonl');
    if (res.ok) {
      findingsStore = (await res.text())
        .split('\n')
        .filter(Boolean)
        .flatMap(line => {
          try { return [JSON.parse(line)]; } catch { return []; }
        });
      changed = true;
    }
  } catch (err) {
    warn('live.ts: no usable findings.jsonl, falling back to empty findings', err);
  }

  try {
    const res = await fetch('/tests.jsonl');
    if (res.ok) {
      testsStore = (await res.text())
        .split('\n')
        .filter(Boolean)
        .flatMap(line => {
          try { return [JSON.parse(line)]; } catch { return []; }
        });
      changed = true;
    }
  } catch (err) {
    warn('live.ts: no usable tests.jsonl, falling back to empty tests', err);
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
// don't separately track" pattern data.ts uses for AGENT. Not exported:
// would break data.check.mjs's mock/live key-parity check (mock.ts has no
// matching export), and importing it from data.ts would be circular
// (data.ts already imports this module). Verified via browser testing.
// log-mcp-call.sh records the raw tool_name (mcp__playwright__browser_*). Strip
// the server prefix so live matches mock's short names in System (Cause C).
const shortTool = (t: string | undefined): string => (t || '').replace(/^mcp__playwright__/, '');
const deriveMcpTools = (calls: McpCall[]): McpTool[] => {
  const counts = calls.reduce((acc: Record<string, number>, c) => (acc[shortTool(c.tool)] = (acc[shortTool(c.tool)] || 0) + 1, acc), {});
  return Object.entries(counts).map(([name, calls]) => ({ name, calls })).sort((a, b) => b.calls - a.calls);
};

// Wraps a fresh-computed-array getter in a Proxy whose contents stay live
// across polling without callers ever re-importing. The `has` trap matters:
// without it, `k in target` falls back to the real (always-empty) backing
// array, which silently breaks every bulk Array method (map/filter/reduce/
// forEach all internally check HasProperty before reading an index).
const liveArray = <T,>(compute: () => T[]): T[] => new Proxy([] as T[], {
  get(_target, prop) { return Reflect.get(compute(), prop); },
  has(_target, prop) { return Reflect.has(compute(), prop); }
});

const latestScreenshot = (arr: Screenshot[]): Screenshot | null =>
  arr.reduce((latest: Screenshot | null, s) => (!latest || s.capturedAt > latest.capturedAt) ? s : latest, null);

// Derived PROTOTYPES
export const PROTOTYPES: Prototype[] = liveArray(() => {
  const arr = Array.isArray(state.screenshots) ? state.screenshots : [];
  const map = new Map<string, Prototype>();
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

// VERSIONS + LOOP are no longer exported here — they're per-prototype and
// derived in data.ts (versionsFor/loopFor) so Detail scopes them to the viewed
// prototype instead of the whole session (Cause A).

// Critique findings the loop appends to web/public/findings.jsonl (item B).
// Detail filters these to the active prototype's latest version via findingsFor.
export const FINDINGS: Finding[] = liveArray(() => findingsStore);

// Derived SESSION data
export const SESSION: KV[] = liveArray(() => {
  const arr = Array.isArray(state.screenshots) ? state.screenshots : [];
  const latest = latestScreenshot(arr);
  if (!latest) return [];

  const navCall = mcpCalls.find(c => c.tool === 'mcp__playwright__browser_navigate');
  const url = (navCall?.input?.url as string | undefined) || `/${latest.protoId}`;

  return [
    { k: 'Prototype', v: latest.proto },
    { k: 'Viewport', v: latest.kind === 'mobile' ? '390 × 844' : (latest.kind === 'tablet' ? '834 × 1112' : '1440 × 900') },
    { k: 'URL', v: url },
    { k: 'Dev server', v: ':5173' },
    { k: 'Latest capture', v: relativeTime(latest.capturedAt) }
  ];
});

// Real test runs the loop appends to web/public/tests.jsonl (item C). One row
// per prototype — its latest-version run — with pass/fail gated by findings via
// testStatus (a high-severity finding fails the suite even if the checks passed).
export const TESTS: TestRun[] = liveArray(() => {
  const verNum = (v: string) => parseInt(String(v).slice(1), 10) || 0;
  const latest = new Map<string, TestRunInput>();
  for (const t of testsStore) {
    const cur = latest.get(t.protoId);
    if (!cur || verNum(t.ver) > verNum(cur.ver)) latest.set(t.protoId, t);
  }
  return [...latest.values()].map(t => ({
    name: t.name,
    checks: t.total,
    pass: t.pass,
    total: t.total,
    status: testStatus(t, findingsStore),
  }));
});

export const SETTINGS: SettingsGroup[] = [
  { group: 'Environment', items: [
    { k: 'Default viewport', v: '1440 × 900' },
    { k: 'Image format', v: 'PNG' },
    { k: 'Dev server port', v: ':5173' },
    { k: 'Theme', v: 'Graphite' },
    { k: 'Accent', v: 'Amber' },
  ] },
];

// Derived MCP server info
export const MCP: KV[] = liveArray(() => {
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
export const LOG: LogEntry[] = liveArray(() => logStore);

// Exports that need to update on poll
export const SCREENSHOTS: Screenshot[] = liveArray(() => Array.isArray(state.screenshots) ? state.screenshots : []);

export const MCP_CALLS: McpCall[] = liveArray(() => mcpCalls.map(c => ({ ...c, tool: shortTool(c.tool) })));

export const MCP_TOOLS: McpTool[] = liveArray(() => deriveMcpTools(mcpCalls));
