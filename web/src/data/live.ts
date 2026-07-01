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
// relativeTime/latestScreenshot/versionNum are pure helpers owned by data.ts
// (single source of truth). This import is circular (data.ts imports this
// module) but safe: each is only ever *called* lazily inside the
// liveArray/PROTOTYPES/SESSION/TESTS computes at render time, never during
// module eval, so the binding is always resolved.
import { relativeTime, latestScreenshot, versionNum } from './data.ts';
import type {
  Prototype,
  Screenshot,
  Finding,
  KV,
  LogEntry,
  TestRunInput,
  TestRun,
  McpTool,
  McpCall,
} from './types.ts';

const warn = (msg: string, err: unknown): void => {
  if (typeof window !== 'undefined') console.warn(msg, err);
};

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

// Every *.jsonl producer here is our own loop's output, not third-party input —
// a cast at this one seam is the honest type, not a gap a validation lib should fill.
const parseJsonLines = <T>(text: string): T[] =>
  text
    .split('\n')
    .filter(Boolean)
    .flatMap((line) => {
      try {
        return [JSON.parse(line) as T];
      } catch {
        return [];
      }
    });

const loadState = async (): Promise<boolean> => {
  let changed = false;

  const urls = [
    '/state.json',
    '/mcp-calls.jsonl',
    '/log.jsonl',
    '/findings.jsonl',
    '/tests.jsonl',
  ] as const;

  const responses = await Promise.allSettled(urls.map((url) => fetch(url)));

  const [stateRes, mcpRes, logRes, findingsRes, testsRes] = responses;

  // state.json
  if (stateRes?.status === 'fulfilled') {
    const res = stateRes.value;
    if (res.ok) {
      try {
        const newState = (await res.json()) as LiveState;
        if (Array.isArray(newState.screenshots)) {
          state = newState;
          changed = true;
        }
      } catch (err) {
        warn('live.ts: no usable state.json, falling back to empty state', err);
      }
    }
  } else if (stateRes?.status === 'rejected') {
    warn('live.ts: no usable state.json, falling back to empty state', stateRes.reason);
  }

  const updateStore = async <T>(
    resResult: PromiseSettledResult<Response> | undefined,
    name: string,
    apply: (data: T[]) => void,
  ) => {
    if (resResult?.status === 'fulfilled') {
      const res = resResult.value;
      if (res.ok) {
        try {
          const text = await res.text();
          apply(parseJsonLines<T>(text));
          changed = true;
        } catch (err) {
          warn(`live.ts: no usable ${name}, falling back to empty`, err);
        }
      }
    } else if (resResult?.status === 'rejected') {
      warn(`live.ts: no usable ${name}, falling back to empty`, resResult.reason);
    }
  };

  await Promise.all([
    updateStore<McpCall>(mcpRes, 'mcp-calls.jsonl', (data) => {
      mcpCalls = data;
    }),
    updateStore<LogEntry>(logRes, 'log.jsonl', (data) => {
      logStore = data;
    }),
    updateStore<Finding>(findingsRes, 'findings.jsonl', (data) => {
      findingsStore = data;
    }),
    updateStore<TestRunInput>(testsRes, 'tests.jsonl', (data) => {
      testsStore = data;
    }),
  ]);

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
const PLAYWRIGHT_PREFIX_REGEX = /^mcp__playwright__/;
const shortTool = (t: string | undefined): string => (t ?? '').replace(PLAYWRIGHT_PREFIX_REGEX, '');
const deriveMcpTools = (calls: McpCall[]): McpTool[] => {
  const counts = calls.reduce(
    (acc: Record<string, number>, c) => (
      (acc[shortTool(c.tool)] = (acc[shortTool(c.tool)] ?? 0) + 1),
      acc
    ),
    {},
  );
  return Object.entries(counts)
    .map(([name, calls]) => ({ name, calls }))
    .sort((a, b) => b.calls - a.calls);
};

// Wraps a fresh-computed-array getter in a Proxy whose contents stay live
// across polling without callers ever re-importing. The `has` trap matters:
// without it, `k in target` falls back to the real (always-empty) backing
// array, which silently breaks every bulk Array method (map/filter/reduce/
// forEach all internally check HasProperty before reading an index).
const liveArray = <T>(compute: () => T[]): T[] =>
  new Proxy([] as T[], {
    get(_target, prop) {
      const arr = compute();
      return Reflect.get(arr, prop) as (typeof arr)[keyof typeof arr];
    },
    has(_target, prop) {
      return Reflect.has(compute(), prop);
    },
  });

// Derived PROTOTYPES
export const PROTOTYPES: Prototype[] = liveArray(() => {
  const arr = Array.isArray(state.screenshots) ? state.screenshots : [];
  const map = new Map<string, Prototype>();
  for (const s of arr) {
    if (!map.has(s.protoId)) {
      const recent = Date.now() - new Date(s.capturedAt).getTime() < 5 * 60_000;
      map.set(s.protoId, {
        id: s.protoId,
        name: s.proto,
        device: s.kind === 'mobile' ? 'Mobile' : s.kind === 'tablet' ? 'Tablet' : 'Desktop',
        status: recent ? 'live' : 'draft',
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

  const navCall = mcpCalls.find((c) => c.tool === 'mcp__playwright__browser_navigate');
  const url = (navCall?.input?.url as string | undefined) ?? `/${latest.protoId}`;

  return [
    { k: 'Prototype', v: latest.proto },
    {
      k: 'Viewport',
      v:
        latest.kind === 'mobile'
          ? '390 × 844'
          : latest.kind === 'tablet'
            ? '834 × 1112'
            : '1440 × 900',
    },
    { k: 'URL', v: url },
    { k: 'Dev server', v: ':5173' },
    { k: 'Latest capture', v: relativeTime(latest.capturedAt) },
  ];
});

// Real test runs the loop appends to web/public/tests.jsonl (item C). One row
// per prototype — its latest-version run — with pass/fail gated by findings via
// testStatus (a high-severity finding fails the suite even if the checks passed).
export const TESTS: TestRun[] = liveArray(() => {
  const latest = new Map<string, TestRunInput>();
  for (const t of testsStore) {
    const cur = latest.get(t.protoId);
    if (!cur || versionNum(t.ver) > versionNum(cur.ver)) latest.set(t.protoId, t);
  }
  const highFindings = new Set(
    findingsStore.filter((f) => f.sev === 'high').map((f) => `${f.protoId}:${f.ver}`),
  );
  return [...latest.values()].map((t) => ({
    name: t.name,
    checks: t.total,
    pass: t.pass,
    total: t.total,
    status: t.pass === t.total && !highFindings.has(`${t.protoId}:${t.ver}`) ? 'passed' : 'failed',
  }));
});

// Subset of playwright-mcp's Config shape (config.d.ts) this panel reads —
// not the full type, just the fields worth surfacing.
interface PlaywrightMcpConfig {
  browser?: {
    browserName?: string;
    launchOptions?: { headless?: boolean };
    contextOptions?: { viewport?: { width?: number; height?: number } | null };
  };
  capabilities?: string[];
  outputDir?: string;
}

const GET_CONFIG_TOOL = 'mcp__playwright__browser_get_config';

// playwright-mcp wraps every text result in "### <Section>" markdown headers
// (browser_get_config's JSON lands under "### Result", sometimes followed by
// "### Page" if the tab changed) — never bare text. Pull one section's raw
// content out before parsing it. Falls back to the whole string if no
// section header is found, in case a future server version stops wrapping.
const extractSection = (text: string, name: string): string => {
  const parts = text.split(/^### /m).slice(1);
  for (const part of parts) {
    const nl = part.indexOf('\n');
    if (nl !== -1 && part.slice(0, nl).trim() === name) return part.slice(nl + 1).trim();
  }
  return text;
};

// Ground-truth resolved config, from the loop's own browser_get_config call
// (see skills/frontend-loop/SKILL.md) — not the CLI/config-file source, which
// this dashboard has no other way to observe. Picks the true latest call by
// timestamp, not array position (position isn't guaranteed chronological —
// same reasoning as data.ts's latestScreenshot).
const parseConfig = (calls: McpCall[]): PlaywrightMcpConfig | null => {
  const call = calls.reduce<McpCall | null>((latest, c) => {
    if (c.tool !== GET_CONFIG_TOOL || !c.output) return latest;
    return !latest || c.ts > latest.ts ? c : latest;
  }, null);
  if (!call) return null;
  try {
    return typeof call.output === 'string'
      ? (JSON.parse(extractSection(call.output, 'Result')) as PlaywrightMcpConfig)
      : (call.output as PlaywrightMcpConfig);
  } catch {
    return null;
  }
};

// Derived MCP server info — full replace from browser_get_config's real
// response; only fields the config actually reports are shown (no more
// hand-maintained Status/Uptime — session liveness is AgentPill's job).
export const MCP: KV[] = liveArray(() => {
  const config = parseConfig(mcpCalls);
  if (!config) return [];
  const rows: KV[] = [];
  if (config.browser?.browserName) rows.push({ k: 'Browser', v: config.browser.browserName });
  if (config.browser?.launchOptions?.headless !== undefined) {
    rows.push({ k: 'Headless', v: config.browser.launchOptions.headless ? 'Yes' : 'No' });
  }
  const vp = config.browser?.contextOptions?.viewport;
  if (vp?.width && vp?.height) rows.push({ k: 'Viewport', v: `${vp.width} × ${vp.height}` });
  if (config.capabilities?.length)
    rows.push({ k: 'Capabilities', v: config.capabilities.join(', ') });
  if (config.outputDir) rows.push({ k: 'Output dir', v: config.outputDir });
  return rows;
});

// Exports that need to update on poll
export const LOG: LogEntry[] = liveArray(() => logStore);

// Exports that need to update on poll
export const SCREENSHOTS: Screenshot[] = liveArray(() =>
  Array.isArray(state.screenshots) ? state.screenshots : [],
);

export const MCP_CALLS: McpCall[] = liveArray(() =>
  mcpCalls.map((c) => ({ ...c, tool: shortTool(c.tool) })),
);

export const MCP_TOOLS: McpTool[] = liveArray(() => deriveMcpTools(mcpCalls));
