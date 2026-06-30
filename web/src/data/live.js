// Live content for the AgentCast dashboard — used when VITE_DATA_SOURCE=live.
// Placeholder until a real automation loop exists to populate these (see
// docs/design/2026-06-30-mock-live-data-toggle-design.md, Roadmap item 3).
// Every consumer already empty/falsy-guards, so empty values render correctly
// with no further view changes. Shape must match mock.js (data.check.mjs enforces it).

export const AGENT = { running: false, stage: '' };

export const PROTOTYPES = [];
export const VERSIONS = [];
export const LOOP = [];
export const FINDINGS = [];
export const SCREENSHOTS = [];
export const SESSION = [];
export const LOG = [];
export const TESTS = [];
export const MCP = [];
export const MCP_TOOLS = [];
export const MCP_CALLS = [];
export const SETTINGS = [];
