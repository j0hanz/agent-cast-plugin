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
let state = {};
if (import.meta.env?.VITE_DATA_SOURCE === 'live') {
  try {
    const res = await fetch('/state.json');
    if (res.ok) state = await res.json();
  } catch (err) {
    // Always taken under plain `node` (data.check.mjs) — only worth a warning
    // when a real browser session expected a manifest and didn't get one.
    if (typeof window !== 'undefined') console.warn('live.js: no usable state.json, falling back to empty state', err);
  }
}

export const PROTOTYPES = [];
export const VERSIONS = [];
export const LOOP = [];
export const FINDINGS = [];
export const SCREENSHOTS = Array.isArray(state.screenshots) ? state.screenshots : [];
export const SESSION = [];
export const LOG = [];
export const TESTS = [];
export const MCP = [];
export const MCP_TOOLS = [];
export const MCP_CALLS = [];
export const SETTINGS = [];
