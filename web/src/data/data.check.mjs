// Runnable check for the non-trivial bits (filtering, mock/live parity, derived AGENT). `npm run check`.
import assert from 'node:assert';
import { filterPrototypes, filterScreenshots, findingsFor, relativeTime, deriveAgent, AGENT } from './data.js';
import * as mock from './mock.js';
import * as live from './live.js';

assert.deepStrictEqual(Object.keys(mock).sort(), Object.keys(live).sort(), 'mock.js and live.js must export the same keys');

assert(filterPrototypes('Live', '').every(p => p.status === 'live'), 'Live → only live');
assert(filterPrototypes('All', 'dash').length === 1, 'query "dash" → 1 match');
assert(filterPrototypes('Live', 'pricing').length === 0, 'Live + non-live query → none');
assert(filterScreenshots('Checkout flow', '').every(s => s.proto === 'Checkout flow'), 'screenshot filter by proto');
assert(filterScreenshots('All', '').length === 8, 'no filter → all captures');

assert(findingsFor('landing-hero').length === 3, 'mock findings for landing-hero → 3');
assert(findingsFor('nope').length === 0, 'unknown prototype → no findings');
assert.deepStrictEqual(
  findingsFor('a', [
    { protoId: 'a', ver: 'v9', sev: 'low', text: 'old', loc: 'x' },
    { protoId: 'a', ver: 'v10', sev: 'high', text: 'new', loc: 'y' },
    { protoId: 'b', ver: 'v10', sev: 'high', text: 'other', loc: 'z' },
  ]).map(f => f.ver),
  ['v10'],
  'latest version only, numeric (v10 > v9), scoped to the prototype',
);

assert.strictEqual(relativeTime(null), '', 'missing timestamp → empty string, no throw');
assert.strictEqual(relativeTime(new Date().toISOString()), 'just now', 'fresh timestamp → "just now"');

assert.deepStrictEqual(deriveAgent([]), { running: false, stage: '' }, 'empty screenshots → idle, no throw');
assert.deepStrictEqual(deriveAgent([{ capturedAt: undefined, stage: 'x' }]), { running: false, stage: '' }, 'missing capturedAt → idle, no throw');
assert.deepStrictEqual(
  deriveAgent([
    { capturedAt: new Date(Date.now() - 60_000).toISOString(), stage: 'old' },
    { capturedAt: new Date().toISOString(), stage: 'newest' },
  ]),
  { running: true, stage: 'newest' },
  'picks the most recent by capturedAt value, not array position',
);
assert.strictEqual(AGENT.running, true, 'mock SCREENSHOTS has a "just now" entry → AGENT.running true by default');

console.log('data check: ok');
