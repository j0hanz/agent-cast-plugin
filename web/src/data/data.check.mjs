// Runnable check for the non-trivial bits (filtering, mock/live parity, derived AGENT). `npm run check`.
import assert from 'node:assert';
import {
  filterPrototypes,
  filterScreenshots,
  findingsFor,
  testStatus,
  testSummary,
  deriveLoop,
  versionsFor,
  loopFor,
  relativeTime,
  deriveAgent,
  AGENT,
} from './data.ts';
import * as mock from './mock.ts';
import * as live from './live.ts';

assert.deepStrictEqual(
  Object.keys(mock).sort(),
  Object.keys(live).sort(),
  'mock.js and live.js must export the same keys',
);

assert(
  filterPrototypes('Live', '').every((p) => p.status === 'live'),
  'Live → only live',
);
assert(filterPrototypes('All', 'dash').length === 1, 'query "dash" → 1 match');
assert(filterPrototypes('Live', 'pricing').length === 0, 'Live + non-live query → none');
assert(
  filterScreenshots('Checkout flow', '').every((s) => s.proto === 'Checkout flow'),
  'screenshot filter by proto',
);
assert(filterScreenshots('All', '').length === 8, 'no filter → all captures');

assert(findingsFor('landing-hero').length === 3, 'mock findings for landing-hero → 3');
assert(findingsFor('nope').length === 0, 'unknown prototype → no findings');
assert.deepStrictEqual(
  findingsFor('a', [
    { protoId: 'a', ver: 'v9', sev: 'low', text: 'old', loc: 'x' },
    { protoId: 'a', ver: 'v10', sev: 'high', text: 'new', loc: 'y' },
    { protoId: 'b', ver: 'v10', sev: 'high', text: 'other', loc: 'z' },
  ]).map((f) => f.ver),
  ['v10'],
  'latest version only, numeric (v10 > v9), scoped to the prototype',
);

// Cause A: LOOP + VERSIONS are per-prototype, never global.
assert.strictEqual(deriveLoop('final').at(-1).state, 'live', 'final stage → Test step live');
assert.strictEqual(deriveLoop('critique')[2].state, 'live', 'critique stage → critique step live');
assert.strictEqual(deriveLoop('preview')[1].state, 'live', 'preview stage → Preview step live');
const scoped = [
  { protoId: 'a', ver: 'v9', stage: 'preview', capturedAt: '2026-01-01T00:00:00Z' },
  { protoId: 'a', ver: 'v10', stage: 'final', capturedAt: '2026-01-01T00:02:00Z' },
  { protoId: 'b', ver: 'v3', stage: 'critique', capturedAt: '2026-01-01T00:01:00Z' },
];
assert.deepStrictEqual(
  versionsFor('a', scoped),
  ['v9', 'v10'],
  'scoped to a, numeric sort (v10 > v9)',
);
assert.deepStrictEqual(versionsFor('b', scoped), ['v3'], "sibling a's versions never leak into b");
assert.strictEqual(loopFor('a', scoped).at(-1).state, 'live', "a's latest (final) → Test live");
assert.strictEqual(
  loopFor('b', scoped)[2].state,
  'live',
  "b's own latest (critique) drives its loop, not a's global final",
);
assert.deepStrictEqual(
  versionsFor('landing-hero'),
  ['v3', 'v4'],
  'mock landing-hero versions, scoped',
);

const run = { protoId: 'a', ver: 'v1', pass: 10, total: 10 };
assert.strictEqual(testStatus(run, []), 'passed', 'all checks pass, no findings → passed');
assert.strictEqual(testStatus({ ...run, pass: 9 }, []), 'failed', 'a failing check → failed');
assert.strictEqual(
  testStatus(run, [{ protoId: 'a', ver: 'v1', sev: 'high' }]),
  'failed',
  'clean checks but a high finding → failed',
);
assert.strictEqual(
  testStatus(run, [{ protoId: 'a', ver: 'v2', sev: 'high' }]),
  'passed',
  'high finding on another version does not fail this run',
);
assert.strictEqual(
  testStatus(run, [{ protoId: 'a', ver: 'v1', sev: 'low' }]),
  'passed',
  'a low finding does not fail the suite',
);

// Cause B: summary counts suites by status, not checks — a findings-gated
// failure (10/10 checks, status failed) must count as 1 Failing, not 0.
assert.deepStrictEqual(
  testSummary([
    { status: 'passed', pass: 12, total: 12 },
    { status: 'failed', pass: 10, total: 10 },
    { status: 'running', pass: 0, total: 8 },
    { status: 'queued', pass: 0, total: 5 },
  ]),
  { passing: 1, failing: 1, suites: 4 },
  'suite-status counts; a clean-checks findings-gated failure still counts as failing',
);

assert.strictEqual(relativeTime(null), '', 'missing timestamp → empty string, no throw');
assert.strictEqual(
  relativeTime(new Date().toISOString()),
  'just now',
  'fresh timestamp → "just now"',
);

assert.deepStrictEqual(
  deriveAgent([]),
  { running: false, stage: '' },
  'empty screenshots → idle, no throw',
);
assert.deepStrictEqual(
  deriveAgent([{ capturedAt: undefined, stage: 'x' }]),
  { running: false, stage: '' },
  'missing capturedAt → idle, no throw',
);
assert.deepStrictEqual(
  deriveAgent([
    { capturedAt: new Date(Date.now() - 60_000).toISOString(), stage: 'old' },
    { capturedAt: new Date().toISOString(), stage: 'newest' },
  ]),
  { running: true, stage: 'newest' },
  'picks the most recent by capturedAt value, not array position',
);
assert.strictEqual(
  AGENT.running,
  true,
  'mock SCREENSHOTS has a "just now" entry → AGENT.running true by default',
);

console.log('data check: ok');
