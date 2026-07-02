// Mock content for the AgentCast dashboard — used when VITE_DATA_SOURCE isn't
// 'live' (data.ts picks this by default). Edit freely for CSS/layout work; the
// shape must stay in sync with live.ts (enforced structurally by shared types.ts,
// and at runtime by data.check.mjs).
import type {
  Prototype,
  Finding,
  Screenshot,
  KV,
  LogEntry,
  TestRun,
  McpTool,
  McpCall,
  ConsoleEntry,
  NetworkEntry,
  SessionQuestion,
} from './types.ts';

// Minutes-ago offsets so capturedAt (and anything derived from it, e.g.
// AGENT) stays freshly "2m ago" etc. every time this loads, instead of a
// frozen date that goes stale the day after it's written.
const ago = (mins: number): string => new Date(Date.now() - mins * 60_000).toISOString();

export const PROTOTYPES: Prototype[] = [
  { id: 'landing-hero', name: 'Landing hero', device: 'Desktop', status: 'live' },
  { id: 'pricing-page', name: 'Pricing page', device: 'Desktop', status: 'draft' },
  { id: 'checkout-flow', name: 'Checkout flow', device: 'Mobile', status: 'passed' },
  { id: 'onboarding', name: 'Onboarding', device: 'Mobile', status: 'draft' },
  { id: 'settings-panel', name: 'Settings panel', device: 'Desktop', status: 'failed' },
  { id: 'dashboard-shell', name: 'Dashboard shell', device: 'Desktop', status: 'live' },
];

// loc is a bare, unique CSS selector (or snapshot target) — it doubles as
// the browser_highlight target, so any measurement/detail lives in text
// instead (see 2026-07-01 design brief, Approach B).
export const FINDINGS: Finding[] = [
  {
    protoId: 'landing-hero',
    ver: 'v4',
    sev: 'high',
    text: 'Secondary button contrast below AA (3.1:1)',
    loc: '.btn-secondary',
  },
  {
    protoId: 'landing-hero',
    ver: 'v4',
    sev: 'med',
    text: 'Hero heading exceeds 65ch line length',
    loc: 'h1.hero',
  },
  {
    protoId: 'landing-hero',
    ver: 'v4',
    sev: 'low',
    text: 'CTA below the fold on mobile (390px)',
    loc: 'section.cta',
  },
];

export const SCREENSHOTS: Screenshot[] = [
  {
    protoId: 'landing-hero',
    proto: 'Landing hero',
    kind: 'desktop',
    stage: 'critique',
    ver: 'v4',
    capturedAt: ago(0),
  },
  {
    protoId: 'landing-hero',
    proto: 'Landing hero',
    kind: 'desktop',
    stage: 'preview',
    ver: 'v3',
    capturedAt: ago(2),
  },
  {
    protoId: 'checkout-flow',
    proto: 'Checkout flow',
    kind: 'mobile',
    stage: 'critique',
    ver: 'v5',
    capturedAt: ago(6),
  },
  {
    protoId: 'pricing-page',
    proto: 'Pricing page',
    kind: 'desktop',
    stage: 'preview',
    ver: 'v2',
    capturedAt: ago(11),
  },
  {
    protoId: 'onboarding',
    proto: 'Onboarding',
    kind: 'mobile',
    stage: 'preview',
    ver: 'v1',
    capturedAt: ago(14),
  },
  {
    protoId: 'checkout-flow',
    proto: 'Checkout flow',
    kind: 'mobile',
    stage: 'preview',
    ver: 'v4',
    capturedAt: ago(18),
  },
  {
    protoId: 'settings-panel',
    proto: 'Settings panel',
    kind: 'desktop',
    stage: 'critique',
    ver: 'v2',
    capturedAt: ago(22),
  },
  {
    protoId: 'dashboard-shell',
    proto: 'Dashboard shell',
    kind: 'desktop',
    stage: 'preview',
    ver: 'v3',
    capturedAt: ago(27),
  },
];

export const SESSION: KV[] = [
  { k: 'Prototype', v: 'Landing hero' },
  { k: 'Viewport', v: '1440 × 900' },
  { k: 'URL', v: '/landing-hero' },
  { k: 'Dev server', v: ':5173' },
  { k: 'Started', v: 'just now' },
];
export const LOG: LogEntry[] = [
  { id: 'l1', ts: '00:00', msg: 'Navigated to <b>/landing-hero</b>' },
  { id: 'l2', ts: '00:01', msg: 'DOM content loaded' },
  { id: 'l3', ts: '00:03', msg: 'Captured screenshot <b>v4</b>' },
  { id: 'l4', ts: '00:03', msg: 'Running screenshot-critique…', cur: true },
];

export const TESTS: TestRun[] = [
  {
    protoId: 'checkout-flow',
    ver: 'v5',
    name: 'Checkout flow',
    checks: 24,
    pass: 24,
    total: 24,
    status: 'passed',
  },
  {
    protoId: 'dashboard-shell',
    ver: 'v3',
    name: 'Dashboard shell',
    checks: 18,
    pass: 18,
    total: 18,
    status: 'passed',
  },
  {
    protoId: 'pricing-page',
    ver: 'v2',
    name: 'Pricing page',
    checks: 16,
    pass: 14,
    total: 16,
    status: 'failed',
  },
  {
    protoId: 'settings-panel',
    ver: 'v2',
    name: 'Settings panel',
    checks: 20,
    pass: 17,
    total: 20,
    status: 'failed',
  },
  {
    protoId: 'landing-hero',
    ver: 'v4',
    name: 'Landing hero',
    checks: 22,
    pass: 0,
    total: 22,
    status: 'running',
  },
  {
    protoId: 'onboarding',
    ver: 'v1',
    name: 'Onboarding',
    checks: 12,
    pass: 0,
    total: 12,
    status: 'queued',
  },
];

// Shaped to match live.ts's browser_get_config-derived fields exactly (full
// replace, no hand-maintained Status/Uptime — see 2026-07-01 design brief).
export const MCP: KV[] = [
  { k: 'Browser', v: 'chromium' },
  { k: 'Headless', v: 'No' },
  { k: 'Viewport', v: '1440 × 900' },
  { k: 'Capabilities', v: 'core, testing, config, devtools' },
  { k: 'Output dir', v: '/tmp/playwright-mcp-output' },
];
export const MCP_TOOLS: McpTool[] = [
  { name: 'browser_navigate', calls: 42 },
  { name: 'browser_take_screenshot', calls: 38 },
  { name: 'browser_snapshot', calls: 24 },
  { name: 'browser_evaluate', calls: 12 },
  { name: 'browser_click', calls: 9 },
  { name: 'browser_type', calls: 7 },
];
export const MCP_CALLS: McpCall[] = [
  { ts: ago(0), tool: 'browser_take_screenshot', input: { filename: 'landing-hero-v4.png' } },
  { ts: ago(1), tool: 'browser_evaluate', input: { viewport: '1440x900' } },
  { ts: ago(2), tool: 'browser_navigate', input: { url: '/landing-hero' } },
  { ts: ago(3), tool: 'browser_snapshot', input: {} },
];

// Session-wide audit rows — see live.ts's linesFromCalls for how these are
// really derived (one row per console error / failed request line).
export const CONSOLE: ConsoleEntry[] = [
  { ts: ago(0), text: '[error] Failed to load resource: 404 (Not Found) @ /api/pricing' },
  {
    ts: ago(4),
    text: "[error] Uncaught TypeError: Cannot read properties of undefined (reading 'map')",
  },
];
export const NETWORK: NetworkEntry[] = [
  { ts: ago(0), text: '3. [GET] /api/pricing => [404] Not Found' },
  { ts: ago(9), text: '7. [POST] /api/checkout => [FAILED] net::ERR_CONNECTION_REFUSED' },
];

// Agent-asked questions, rendered as Zod-validated forms (an extended
// AskUserQuestion — see sessionSchema.ts). Covers every field type at least
// once, plus a multi-field question, so every renderer gets exercised.
export const SESSIONS: SessionQuestion[] = [
  {
    id: 'q1',
    header: 'CTA color',
    prompt: 'Which accent should the primary CTA use on the pricing page?',
    ts: ago(1),
    status: 'pending',
    fields: [
      {
        id: 'accent',
        type: 'select',
        label: 'Accent color',
        options: ['Amber (current)', 'Green', 'Keep as-is'],
      },
    ],
  },
  {
    id: 'q2',
    header: 'Card grid',
    prompt:
      'How should the pricing cards lay out on desktop, and which tiers should be highlighted?',
    ts: ago(3),
    status: 'pending',
    fields: [
      { id: 'columns', type: 'number', label: 'Cards per row', min: 1, max: 6, step: 1 },
      {
        id: 'highlighted',
        type: 'multiselect',
        label: 'Highlighted tiers',
        options: ['Starter', 'Pro', 'Team', 'Enterprise'],
      },
    ],
  },
  {
    id: 'q3',
    header: 'Dark mode',
    prompt: 'Should the settings panel support a light theme toggle, or stay graphite-only?',
    ts: ago(40),
    status: 'answered',
    answeredAt: ago(39),
    fields: [{ id: 'lightTheme', type: 'boolean', label: 'Add light theme toggle', answer: false }],
  },
  {
    id: 'q4',
    header: 'Ship target',
    prompt: "What's the target date to mark checkout-flow ready for release?",
    ts: ago(95),
    status: 'answered',
    answeredAt: ago(94),
    fields: [{ id: 'shipDate', type: 'date', label: 'Target date', answer: '2026-07-15' }],
  },
  {
    id: 'q5',
    header: 'Empty copy',
    prompt: 'Draft the empty-state description for a Sessions feed with nothing asked yet.',
    ts: ago(140),
    status: 'answered',
    answeredAt: ago(138),
    fields: [
      {
        id: 'copy',
        type: 'textarea',
        label: 'Empty-state description',
        minLength: 10,
        maxLength: 200,
        answer: "The agent hasn't asked anything this session.",
      },
    ],
  },
  {
    id: 'q6',
    header: 'Headline tone',
    prompt: 'What tone should the pricing page headline use?',
    ts: ago(180),
    status: 'answered',
    answeredAt: ago(179),
    fields: [
      {
        id: 'tone',
        type: 'text',
        label: 'Tone',
        minLength: 3,
        maxLength: 80,
        answer: 'Confident, plain, no hype',
      },
    ],
  },
];

// SETTINGS lives in data.ts — identical in mock and live, so one copy covers both.
