// Single source of truth — pure (no DOM, no JSX), so the views import it AND
// the node check (data.check.mjs) can too. Presentational icon JSX lives in
// components/icons.jsx; this file is data + pure helpers only.

export const cap = s => s ? s[0].toUpperCase() + s.slice(1) : '';
export const deviceIcon = d => (d === 'Mobile' ? 'mobile' : 'monitor');
export const STATUS_OF = { All: null, Live: 'live', Drafts: 'draft', Passed: 'passed', Failed: 'failed' };
export const VIEWPORTS = { Desktop: '1440×900', Tablet: '834×1112', Mobile: '390×844' };

// Static — nothing in the app currently flips this, so it's a constant, not store state.
export const AGENT = { running: true, stage: 'screenshot-critique' };

export const NAV = [
  { id: 'prototypes', label: 'Prototypes', icon: 'prototypes' },
  { id: 'sandbox', label: 'Sandbox', icon: 'sandbox' },
  { id: 'tests', label: 'Tests', icon: 'tests' },
];
export const SYSTEM = [
  { id: 'system', label: 'System', icon: 'server' },
];

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
  { sev: 'high', text: 'Secondary button contrast below AA', loc: '.btn-secondary · 3.1:1' },
  { sev: 'med', text: 'Hero heading exceeds 65ch line length', loc: 'h1.hero' },
  { sev: 'low', text: 'CTA below the fold on mobile', loc: 'section.cta · 390px' },
];

export const SCREENSHOTS = [
  { protoId: 'landing-hero', proto: 'Landing hero', kind: 'desktop', stage: 'critique', ver: 'v4', time: 'just now' },
  { protoId: 'landing-hero', proto: 'Landing hero', kind: 'desktop', stage: 'preview', ver: 'v3', time: '2m' },
  { protoId: 'checkout-flow', proto: 'Checkout flow', kind: 'mobile', stage: 'critique', ver: 'v5', time: '6m' },
  { protoId: 'pricing-page', proto: 'Pricing page', kind: 'desktop', stage: 'preview', ver: 'v2', time: '11m' },
  { protoId: 'onboarding', proto: 'Onboarding', kind: 'mobile', stage: 'preview', ver: 'v1', time: '14m' },
  { protoId: 'checkout-flow', proto: 'Checkout flow', kind: 'mobile', stage: 'preview', ver: 'v4', time: '18m' },
  { protoId: 'settings-panel', proto: 'Settings panel', kind: 'desktop', stage: 'critique', ver: 'v2', time: '22m' },
  { protoId: 'dashboard-shell', proto: 'Dashboard shell', kind: 'desktop', stage: 'preview', ver: 'v3', time: '27m' },
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
  { k: 'Server', v: 'agent-browser MCP' },
  { k: 'Transport', v: 'stdio' },
  { k: 'Status', v: 'Connected', pill: 'live' },
  { k: 'Uptime', v: '17m' },
  { k: 'Browser', v: 'Chrome for Testing' },
];
export const MCP_TOOLS = [
  { name: 'agent_browser_open', calls: 42 },
  { name: 'agent_browser_screenshot', calls: 38 },
  { name: 'agent_browser_snapshot', calls: 24 },
  { name: 'agent_browser_eval', calls: 12 },
  { name: 'agent_browser_click', calls: 9 },
  { name: 'agent_browser_fill', calls: 7 },
];
export const MCP_CALLS = [
  { id: 'mc1', ts: '00:03', msg: '<b>agent_browser_screenshot</b> → landing-hero / v4' },
  { id: 'mc2', ts: '00:02', msg: '<b>agent_browser_eval</b> → set viewport 1440 × 900' },
  { id: 'mc3', ts: '00:01', msg: '<b>agent_browser_open</b> → /landing-hero' },
  { id: 'mc4', ts: '00:00', msg: '<b>agent_browser_snapshot</b> → dom' },
];

export const SETTINGS = [
  { group: 'Capture', items: [
    { k: 'Default viewport', v: '1440 × 900' },
    { k: 'Image format', v: 'PNG' },
    { k: 'Full-page capture', on: false },
  ] },
  { group: 'Loop', items: [
    { k: 'Auto-refine on critique', on: true },
    { k: 'Stop after', v: '4 iterations' },
    { k: 'Run tests after refine', on: true },
  ] },
  { group: 'Sandbox', items: [
    { k: 'Dev server port', v: ':5173' },
    { k: 'Reuse browser session', on: true },
  ] },
  { group: 'Appearance', items: [
    { k: 'Theme', v: 'Graphite' },
    { k: 'Accent', v: 'Amber' },
  ] },
];

// Pure filters — shared by the views and the node check.
export const filterPrototypes = (filter = 'All', query = '') => {
  const want = STATUS_OF[filter];
  const q = query.trim().toLowerCase();
  return PROTOTYPES.filter(p => (!want || p.status === want) && (!q || p.name.toLowerCase().includes(q)));
};
export const filterScreenshots = (filter = 'All', query = '') => {
  const q = query.trim().toLowerCase();
  return SCREENSHOTS.filter(s => (filter === 'All' || s.proto === filter) && (!q || s.proto.toLowerCase().includes(q)));
};
// M2: derived from data so filter stays in sync when prototypes are renamed.
export const SCREENSHOT_PROTOS = ['All', ...new Set(SCREENSHOTS.map(s => s.proto))];
