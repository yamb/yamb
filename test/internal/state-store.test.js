import assert from 'node:assert/strict';
import test from 'node:test';

import { store } from '../../src/internal/index.js';

test('set/get round-trip', () => {
  const { set, get } = store('Foo');
  const instance = {};

  for (const value of [{ value: 42 }, false, null, 0, -0, 0n, '', NaN, undefined]) {
    set(instance, value);
    assert.equal(get(instance), value);
  }
});

test('get throws labelled error before set', () => {
  const { get } = store('Foo');
  assert.throws(() => get({}), /Foo state not initialized/);
});

test('stores are isolated across calls', () => {
  const a = store('A');
  const b = store('B');
  const instance = {};
  a.set(instance, { from: 'a' });
  assert.deepEqual(a.get(instance), { from: 'a' });
  assert.throws(() => b.get(instance), /B state not initialized/);
});

test('state can be replaced', () => {
  const { set, get } = store('Bar');
  const instance = {};
  set(instance, { v: 1 });
  set(instance, { v: 2 });
  assert.equal(get(instance).v, 2);
});
