import assert from 'node:assert/strict';
import test from 'node:test';

import { effectiveSignal } from '../src/signal.js';

test('returns undefined if neither signal', () => {
  assert.equal(effectiveSignal({}, {}), undefined);
  assert.equal(effectiveSignal({}, undefined), undefined);
});

test('returns yamb.signal when only it is set', () => {
  const ac = new AbortController();
  assert.equal(effectiveSignal({ signal: ac.signal }, {}), ac.signal);
});

test('returns options.signal when only it is set', () => {
  const ac = new AbortController();
  assert.equal(effectiveSignal({}, { signal: ac.signal }), ac.signal);
});

test('combines both via AbortSignal.any', () => {
  const a = new AbortController();
  const b = new AbortController();
  const combined = effectiveSignal({ signal: a.signal }, { signal: b.signal });
  assert.ok(combined instanceof AbortSignal);
  a.abort('reason a');
  assert.equal(combined.aborted, true);
});
