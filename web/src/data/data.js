// Single source of truth — pure (no DOM, no JSX), so the views import it AND
// the node check (data.check.mjs) can too. Presentational icon JSX lives in
// components/icons.jsx; this file is config + pure helpers + the data switch.
//
// Content lives in mock.js / live.js, picked here by VITE_DATA_SOURCE — set it
// in web/.env.local (VITE_DATA_SOURCE=live) and restart `npm run dev` to test
// against live (empty) data instead of design-time mock content.
import * as mock from './mock.js';
import * as live from './live.js';

// ponytail: optional chaining — import.meta.env only exists under Vite, not
// when data.check.mjs runs this file via plain `node`.
const SRC = import.meta.env?.VITE_DATA_SOURCE === 'live' ? live : mock;
export const {
  PROTOTYPES, VERSIONS, LOOP, FINDINGS, SCREENSHOTS,
  SESSION, LOG, TESTS, MCP, MCP_TOOLS, MCP_CALLS, SETTINGS,
} = SRC;

export const cap = s => s ? s[0].toUpperCase() + s.slice(1) : '';
export const deviceIcon = d => (d === 'Mobile' ? 'mobile' : 'monitor');
// Captures live in web/public/screenshots/ (gitignored, served by Vite as static
// files) — write one there with this exact name and it renders, nothing to register.
export const screenshotSrc = (protoId, ver) => `/screenshots/${protoId}-${ver}.png`;

// Relative time computed at render/load time from a real timestamp, not a
// pre-formatted string — so it can't go stale.
export const relativeTime = (iso) => {
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
export const deriveAgent = (screenshots) => {
  const latest = screenshots.reduce((latest, s) => (!latest || s.capturedAt > latest.capturedAt) ? s : latest, null);
  const fresh = latest?.capturedAt && (Date.now() - new Date(latest.capturedAt).getTime() < AGENT_FRESH_MS);
  return fresh ? { running: true, stage: latest.stage } : { running: false, stage: '' };
};
export const AGENT = deriveAgent(SCREENSHOTS);
export const STATUS_OF = { All: null, Live: 'live', Drafts: 'draft', Passed: 'passed', Failed: 'failed' };
export const VIEWPORTS = { Desktop: '1440×900', Tablet: '834×1112', Mobile: '390×844' };

export const NAV = [
  { id: 'prototypes', label: 'Prototypes', icon: 'prototypes' },
  { id: 'sandbox', label: 'Sandbox', icon: 'sandbox' },
  { id: 'tests', label: 'Tests', icon: 'tests' },
];
export const SYSTEM = [
  { id: 'system', label: 'System', icon: 'server' },
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
