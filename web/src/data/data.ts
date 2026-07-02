// Single source of truth — pure (no DOM, no JSX), so the views import it AND
// the node check (data.check.mjs) can too. Presentational icon JSX lives in
// components/icons.tsx; this file is config + pure helpers + the data switch.
//
// Content lives in mock.ts / live.ts, picked here by VITE_DATA_SOURCE — set it
// in web/.env.local (VITE_DATA_SOURCE=live) and restart `npm run dev` to test
// against live (empty) data instead of design-time mock content.
import * as mock from './mock.ts';
import * as live from './live.ts';
import type {
  Device,
  Status,
  Finding,
  Screenshot,
  Stage,
  TestStatus,
  TestRunInput,
  LoopStep,
  SettingsGroup,
  McpCall,
} from './types.ts';
import type { IconName } from '../components/icons.tsx';

// ponytail: optional chaining — import.meta.env only exists under Vite, not
// when data.check.mjs runs this file via plain `node`.
const SRC = import.meta.env?.VITE_DATA_SOURCE === 'live' ? live : mock;
export const {
  PROTOTYPES,
  FINDINGS,
  SCREENSHOTS,
  SESSION,
  LOG,
  TESTS,
  MCP,
  MCP_TOOLS,
  MCP_CALLS,
  CONSOLE,
  NETWORK,
} = SRC;

// Identical in mock and live (never actually varies by data source) — one
// copy here instead of duplicating the literal in both. Switches were removed
// (along with their labels) — nothing here is actually configurable, so
// showing disabled toggles implying otherwise was dishonest. One card, not
// three near-empty ones — these are five flat facts with no functional
// distinction between them now that none are toggleable.
export const SETTINGS: SettingsGroup[] = [
  {
    group: 'Environment',
    items: [
      { k: 'Default viewport', v: '1440 × 900' },
      { k: 'Image format', v: 'PNG' },
      { k: 'Dev server port', v: ':5173' },
      { k: 'Theme', v: 'Graphite' },
      { k: 'Accent', v: 'Amber' },
    ],
  },
];

export const cap = (s: string): string => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');
export const deviceIcon = (d: Device): IconName => (d === 'Mobile' ? 'mobile' : 'monitor');
// Captures live in web/public/screenshots/ (gitignored, served by Vite as static
// files) — write one there with this exact name and it renders, nothing to register.
export const screenshotSrc = (protoId: string, ver: string): string =>
  `/screenshots/${protoId}-${ver}.png`;
// Same convention, web/public/artifacts/ (also gitignored, also Vite-served) —
// existence isn't tracked anywhere; the Preview toggle just tries to load it.
export const videoSrc = (protoId: string, ver: string): string =>
  `/artifacts/${protoId}-${ver}.webm`;

// Relative time computed at render/load time from a real timestamp, not a
// pre-formatted string — so it can't go stale.
export const relativeTime = (iso: string | null | undefined): string => {
  if (!iso) return '';
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h`;
  return `${Math.floor(mins / 1440)}d`;
};

// AGENT isn't tracked as its own field — Claude Code is turn-based, not
// continuously running, so a hand-toggled flag would be theatrical and could
// get stuck stale. Derive it from the most recent real capture instead:
// can't drift because nothing has to remember to reset it.
const AGENT_FRESH_MS = 5 * 60_000;
// Position-based shortcuts (SCREENSHOTS[0]/.at(-1)) are wrong — array order
// isn't guaranteed chronological, so "latest" must compare capturedAt.
export const latestScreenshot = (screenshots: Screenshot[]): Screenshot | null =>
  screenshots.reduce(
    (latest: Screenshot | null, s) => (!latest || s.capturedAt > latest.capturedAt ? s : latest),
    null,
  );
// Shared numeric version comparator ('v10' > 'v9') — the one place this parses
// a `ver` string, so findingsFor/versionsFor/live.ts's TESTS all agree.
export const versionNum = (v: string): number => parseInt(String(v).slice(1), 10) || 0;
// Screenshots alone under-report activity: most loop steps (navigate, evaluate,
// snapshot) call the MCP server without capturing, so a long non-visual stretch
// used to read as idle. Fold in the latest MCP call timestamp too — stage still
// comes from the latest screenshot (the only stage-bearing signal) since calls
// don't carry one.
export const deriveAgent = (
  screenshots: Screenshot[],
  mcpCalls: McpCall[] = [],
): { running: boolean; stage: string } => {
  const latest = latestScreenshot(screenshots);
  const latestCallTs = mcpCalls.reduce((max, c) => (c.ts > max ? c.ts : max), '');
  const latestTs = (latest?.capturedAt ?? '') > latestCallTs ? latest?.capturedAt : latestCallTs;
  const fresh = !!latestTs && Date.now() - new Date(latestTs).getTime() < AGENT_FRESH_MS;
  return fresh ? { running: true, stage: latest?.stage ?? '' } : { running: false, stage: '' };
};
export const STATUS_OF: Record<string, Status | null> = {
  All: null,
  Live: 'live',
  Drafts: 'draft',
  Passed: 'passed',
  Failed: 'failed',
};
export const VIEWPORTS: Record<Device, string> = {
  Desktop: '1440×900',
  Tablet: '834×1112',
  Mobile: '390×844',
};

export const NAV: { id: string; label: string; icon: IconName }[] = [
  { id: 'prototypes', label: 'Prototypes', icon: 'prototypes' },
  { id: 'sandbox', label: 'Sandbox', icon: 'sandbox' },
  { id: 'tests', label: 'Tests', icon: 'tests' },
];
export const SYSTEM: { id: string; label: string; icon: IconName }[] = [
  { id: 'system', label: 'System', icon: 'server' },
];

// Pure filters — shared by the views and the node check.
export const filterPrototypes = (filter = 'All'): typeof PROTOTYPES => {
  const want = STATUS_OF[filter];
  return PROTOTYPES.filter((p) => !want || p.status === want);
};
export const filterScreenshots = (filter = 'All'): typeof SCREENSHOTS =>
  SCREENSHOTS.filter((s) => filter === 'All' || s.proto === filter);
// Findings accumulate append-only (no "resolved" mechanism yet), so a Detail
// page shows only the active prototype's *latest* version — a fresh critique
// supersedes the prior one instead of piling stale findings on top. Optional
// `list` arg keeps the numeric-version logic testable in isolation.
export const findingsFor = (id: string, list: Finding[] = FINDINGS): Finding[] => {
  const mine = list.filter((f) => f.protoId === id);
  if (!mine.length) return [];
  const latest = mine.reduce((m, f) => (versionNum(f.ver) > versionNum(m.ver) ? f : m)).ver;
  return mine.filter((f) => f.ver === latest);
};

// Live test status (item C): a recorded run passes only if every check the loop
// ran passed AND the critique left no high-severity finding for that prototype+
// version — a high finding fails the suite even when the agent's own checks
// looked clean. Pure so data.check can exercise it.
export const testStatus = (run: TestRunInput, findings: Finding[] = FINDINGS): TestStatus =>
  run.pass === run.total &&
  !findings.some((f) => f.protoId === run.protoId && f.ver === run.ver && f.sev === 'high')
    ? 'passed'
    : 'failed';

// Summary counts suites by status, not checks (Cause B). Counting failing
// *checks* (total - pass) hid findings-gated failures — a suite with 10/10
// checks but a high finding reads "Failed" per-row yet added 0 to "Failing".
// Suite-status counts keep the header consistent with the rows: passing +
// failing + in-flight = suites.
export const testSummary = (
  tests: { status: TestStatus }[],
): { passing: number; failing: number; suites: number } => {
  let passing = 0;
  let failing = 0;
  for (const t of tests) {
    if (t.status === 'passed') {
      passing++;
    } else if (t.status === 'failed') {
      failing++;
    }
  }
  return { passing, failing, suites: tests.length };
};

// LOOP + VERSIONS are per-prototype, not global — a Detail page must show only
// the viewed prototype's captures, or a sibling on a higher version leaks in
// (Cause A). deriveLoop maps a stage to the 5 loop steps; loopFor/versionsFor
// scope it to one prototype. Numeric version sort so v10 > v9. Optional `list`
// arg keeps them testable in isolation, same pattern as findingsFor.
export const deriveLoop = (stage?: Stage, hasRun = false): LoopStep[] => [
  { name: 'Build', state: 'done', t: 'completed' },
  {
    name: 'Preview',
    state: stage === 'preview' ? 'live' : 'done',
    t: stage === 'preview' ? 'running…' : 'completed',
  },
  {
    name: 'Screenshot-critique',
    state: stage === 'critique' ? 'live' : stage === 'final' ? 'done' : '',
    t: stage === 'critique' ? 'running…' : stage === 'final' ? 'completed' : 'queued',
  },
  {
    name: 'Refine',
    state: stage === 'final' && hasRun ? 'done' : '',
    t: stage === 'final' && hasRun ? 'completed' : 'queued',
  },
  {
    name: 'Test',
    state: stage === 'final' ? (hasRun ? 'done' : 'live') : '',
    t: stage === 'final' ? (hasRun ? 'completed' : 'running…') : 'queued',
  },
];
export const versionsFor = (id: string, list: Screenshot[] = SCREENSHOTS): string[] =>
  [...new Set(list.filter((s) => s.protoId === id).map((s) => s.ver))].sort(
    (a, b) => versionNum(a) - versionNum(b),
  );
export const loopFor = (id: string, list: Screenshot[] = SCREENSHOTS): LoopStep[] => {
  const latest = latestScreenshot(list.filter((s) => s.protoId === id));
  const hasRun = TESTS.some((t) => t.protoId === id && t.ver === latest?.ver);
  return deriveLoop(latest?.stage, hasRun);
};

// M2: derived from data so filter stays in sync when prototypes are renamed.
export const screenshotProtos = (): string[] => [
  'All',
  ...new Set(SCREENSHOTS.map((s) => s.proto)),
];
