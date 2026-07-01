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
  SETTINGS,
} = SRC;

export const cap = (s: string): string => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');
export const deviceIcon = (d: Device): IconName => (d === 'Mobile' ? 'mobile' : 'monitor');
// Captures live in web/public/screenshots/ (gitignored, served by Vite as static
// files) — write one there with this exact name and it renders, nothing to register.
export const screenshotSrc = (protoId: string, ver: string): string =>
  `/screenshots/${protoId}-${ver}.png`;

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
export const deriveAgent = (screenshots: Screenshot[]): { running: boolean; stage: string } => {
  const latest = latestScreenshot(screenshots);
  const fresh =
    latest?.capturedAt && Date.now() - new Date(latest.capturedAt).getTime() < AGENT_FRESH_MS;
  return fresh ? { running: true, stage: latest.stage } : { running: false, stage: '' };
};
export const AGENT: { running: boolean; stage: string } = new Proxy(
  { running: false, stage: '' },
  {
    get(_target, prop) {
      const agent = deriveAgent(SCREENSHOTS);
      return agent[prop as keyof typeof agent];
    },
  },
);
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
export const filterPrototypes = (filter = 'All', query = ''): typeof PROTOTYPES => {
  const want = STATUS_OF[filter];
  const q = query.trim().toLowerCase();
  return PROTOTYPES.filter(
    (p) => (!want || p.status === want) && (!q || p.name.toLowerCase().includes(q)),
  );
};
export const filterScreenshots = (filter = 'All', query = ''): typeof SCREENSHOTS => {
  const q = query.trim().toLowerCase();
  return SCREENSHOTS.filter(
    (s) => (filter === 'All' || s.proto === filter) && (!q || s.proto.toLowerCase().includes(q)),
  );
};
// Findings accumulate append-only (no "resolved" mechanism yet), so a Detail
// page shows only the active prototype's *latest* version — a fresh critique
// supersedes the prior one instead of piling stale findings on top. Optional
// `list` arg keeps the numeric-version logic testable in isolation.
export const findingsFor = (id: string, list: Finding[] = FINDINGS): Finding[] => {
  const mine = list.filter((f) => f.protoId === id);
  if (!mine.length) return [];
  const n = (v: string) => parseInt(String(v).slice(1), 10) || 0; // 'v10' > 'v9', numeric
  const latest = mine.reduce((m, f) => (n(f.ver) > n(m.ver) ? f : m)).ver;
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
): { passing: number; failing: number; suites: number } => ({
  passing: tests.filter((t) => t.status === 'passed').length,
  failing: tests.filter((t) => t.status === 'failed').length,
  suites: tests.length,
});

// LOOP + VERSIONS are per-prototype, not global — a Detail page must show only
// the viewed prototype's captures, or a sibling on a higher version leaks in
// (Cause A). deriveLoop maps a stage to the 5 loop steps; loopFor/versionsFor
// scope it to one prototype. Numeric version sort so v10 > v9. Optional `list`
// arg keeps them testable in isolation, same pattern as findingsFor.
export const deriveLoop = (stage?: Stage): LoopStep[] => [
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
  { name: 'Refine', state: '', t: 'queued' },
  {
    name: 'Test',
    state: stage === 'final' ? 'live' : '',
    t: stage === 'final' ? 'running…' : 'queued',
  },
];
export const versionsFor = (id: string, list: Screenshot[] = SCREENSHOTS): string[] => {
  const n = (v: string) => parseInt(String(v).slice(1), 10) || 0;
  return [...new Set(list.filter((s) => s.protoId === id).map((s) => s.ver))].sort(
    (a, b) => n(a) - n(b),
  );
};
export const loopFor = (id: string, list: Screenshot[] = SCREENSHOTS): LoopStep[] =>
  deriveLoop(latestScreenshot(list.filter((s) => s.protoId === id))?.stage);

// M2: derived from data so filter stays in sync when prototypes are renamed.
const screenshotProtos = (): string[] => ['All', ...new Set(SCREENSHOTS.map((s) => s.proto))];
export const SCREENSHOT_PROTOS: string[] = new Proxy([] as string[], {
  get(_target, prop) {
    const arr = screenshotProtos();
    return Reflect.get(arr, prop) as (typeof arr)[keyof typeof arr];
  },
  has(_target, prop) {
    return Reflect.has(screenshotProtos(), prop);
  },
});
