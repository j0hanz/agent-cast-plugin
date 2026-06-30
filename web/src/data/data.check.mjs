// Runnable check for the non-trivial bits (filtering, mock/live parity). `npm run check`.
import assert from 'node:assert';
import { filterPrototypes, filterScreenshots } from './data.js';
import * as mock from './mock.js';
import * as live from './live.js';

assert.deepStrictEqual(Object.keys(mock).sort(), Object.keys(live).sort(), 'mock.js and live.js must export the same keys');

assert(filterPrototypes('Live', '').every(p => p.status === 'live'), 'Live → only live');
assert(filterPrototypes('All', 'dash').length === 1, 'query "dash" → 1 match');
assert(filterPrototypes('Live', 'pricing').length === 0, 'Live + non-live query → none');
assert(filterScreenshots('Checkout flow', '').every(s => s.proto === 'Checkout flow'), 'screenshot filter by proto');
assert(filterScreenshots('All', '').length === 8, 'no filter → all captures');

console.log('data check: ok');
