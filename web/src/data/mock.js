// Mock content for the AgentCast dashboard — used when VITE_DATA_SOURCE isn't
// 'live' (data.js picks this by default). Edit freely for CSS/layout work; the
// shape must stay in sync with live.js (enforced by data.check.mjs).

// Minutes-ago offsets so capturedAt (and anything derived from it, e.g.
// AGENT) stays freshly "2m ago" etc. every time this loads, instead of a
// frozen date that goes stale the day after it's written.
const ago = (mins) => new Date(Date.now() - mins * 60_000).toISOString();

export const PROTOTYPES = [
  { id: 'landing-hero', name: 'Landing hero', device: 'Desktop', status: 'live' },
  { id: 'pricing-page', name: 'Pricing page', device: 'Desktop', status: 'draft' },
  { id: 'checkout-flow', name: 'Checkout flow', device: 'Mobile', status: 'passed' },
  { id: 'onboarding', name: 'Onboarding', device: 'Mobile', status: 'draft' },
  { id: 'settings-panel', name: 'Settings panel', device: 'Desktop', status: 'failed' },
  { id: 'dashboard-shell', name: 'Dashboard shell', device: 'Desktop', status: 'live' },
];

export const VERSIONS = ['v1', 'v2', 'v3', 'v4'];
export const LOOP = [
  { name: 'Build', state: 'done', t: 'completed' },
  { name: 'Preview', state: 'done', t: 'completed' },
  { name: 'Screenshot-critique', state: 'live', t: 'running…' },
  { name: 'Refine', state: '', t: 'queued' },
  { name: 'Test', state: '', t: 'queued' },
];
export const FINDINGS = [
  { protoId: 'landing-hero', ver: 'v4', sev: 'high', text: 'Secondary button contrast below AA', loc: '.btn-secondary · 3.1:1' },
  { protoId: 'landing-hero', ver: 'v4', sev: 'med', text: 'Hero heading exceeds 65ch line length', loc: 'h1.hero' },
  { protoId: 'landing-hero', ver: 'v4', sev: 'low', text: 'CTA below the fold on mobile', loc: 'section.cta · 390px' },
];

export const SCREENSHOTS = [
  { protoId: 'landing-hero', proto: 'Landing hero', kind: 'desktop', stage: 'critique', ver: 'v4', capturedAt: ago(0) },
  { protoId: 'landing-hero', proto: 'Landing hero', kind: 'desktop', stage: 'preview', ver: 'v3', capturedAt: ago(2) },
  { protoId: 'checkout-flow', proto: 'Checkout flow', kind: 'mobile', stage: 'critique', ver: 'v5', capturedAt: ago(6) },
  { protoId: 'pricing-page', proto: 'Pricing page', kind: 'desktop', stage: 'preview', ver: 'v2', capturedAt: ago(11) },
  { protoId: 'onboarding', proto: 'Onboarding', kind: 'mobile', stage: 'preview', ver: 'v1', capturedAt: ago(14) },
  { protoId: 'checkout-flow', proto: 'Checkout flow', kind: 'mobile', stage: 'preview', ver: 'v4', capturedAt: ago(18) },
  { protoId: 'settings-panel', proto: 'Settings panel', kind: 'desktop', stage: 'critique', ver: 'v2', capturedAt: ago(22) },
  { protoId: 'dashboard-shell', proto: 'Dashboard shell', kind: 'desktop', stage: 'preview', ver: 'v3', capturedAt: ago(27) },
];

export const SESSION = [
  { k: 'Prototype', v: 'Landing hero' },
  { k: 'Viewport', v: '1440 × 900' },
  { k: 'URL', v: '/landing-hero' },
  { k: 'Dev server', v: ':5173' },
  { k: 'Started', v: 'just now' },
];
export const LOG = [
  { id: 'l1', ts: '00:00', msg: 'Navigated to <b>/landing-hero</b>' },
  { id: 'l2', ts: '00:01', msg: 'DOM content loaded' },
  { id: 'l3', ts: '00:03', msg: 'Captured screenshot <b>v4</b>' },
  { id: 'l4', ts: '00:03', msg: 'Running screenshot-critique…', cur: true },
];

export const TESTS = [
  { name: 'Checkout flow', checks: 24, pass: 24, total: 24, status: 'passed' },
  { name: 'Dashboard shell', checks: 18, pass: 18, total: 18, status: 'passed' },
  { name: 'Pricing page', checks: 16, pass: 14, total: 16, status: 'failed' },
  { name: 'Settings panel', checks: 20, pass: 17, total: 20, status: 'failed' },
  { name: 'Landing hero', checks: 22, pass: 0, total: 22, status: 'running' },
  { name: 'Onboarding', checks: 12, pass: 0, total: 12, status: 'queued' },
];

export const MCP = [
  { k: 'Server', v: 'Playwright MCP' },
  { k: 'Transport', v: 'stdio' },
  { k: 'Status', v: 'Connected', pill: 'live' },
  { k: 'Uptime', v: '17m' },
  { k: 'Browser', v: 'Chrome for Testing' },
];
export const MCP_TOOLS = [
  { name: 'browser_navigate', calls: 42 },
  { name: 'browser_take_screenshot', calls: 38 },
  { name: 'browser_snapshot', calls: 24 },
  { name: 'browser_evaluate', calls: 12 },
  { name: 'browser_click', calls: 9 },
  { name: 'browser_type', calls: 7 },
];
export const MCP_CALLS = [
  { ts: ago(0), tool: 'browser_take_screenshot', input: { filename: 'landing-hero-v4.png' } },
  { ts: ago(1), tool: 'browser_evaluate', input: { viewport: '1440x900' } },
  { ts: ago(2), tool: 'browser_navigate', input: { url: '/landing-hero' } },
  { ts: ago(3), tool: 'browser_snapshot', input: {} },
];

// Switches were removed (along with their labels) — nothing here is actually
// configurable, so showing disabled toggles implying otherwise was dishonest.
// One card, not three near-empty ones — these are five flat facts with no
// functional distinction between them now that none are toggleable.
export const SETTINGS = [
  { group: 'Environment', items: [
    { k: 'Default viewport', v: '1440 × 900' },
    { k: 'Image format', v: 'PNG' },
    { k: 'Dev server port', v: ':5173' },
    { k: 'Theme', v: 'Graphite' },
    { k: 'Accent', v: 'Amber' },
  ] },
];
