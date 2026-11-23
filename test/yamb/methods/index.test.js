import assert from 'node:assert/strict';
import test from 'node:test';

import { setState } from '../../../src/yamb/internal.js';
import has from '../../../src/yamb/methods/has.js';
import identify from '../../../src/yamb/methods/identify.js';
import locate from '../../../src/yamb/methods/locate.js';

function makeYamb() {
  const yamb = {};
  const byId = new Map([['id-1', '2026/04/a']]);
  const byUri = new Map([['2026/04/a', 'id-1']]);

  setState(yamb, { byId, byUri });

  return yamb;
}

test('locate(id) returns the uri for a known id', () => {
  const yamb = makeYamb();
  assert.equal(locate.fn(yamb, 'id-1'), '2026/04/a');
});

test('locate(id) returns undefined for an unknown id', () => {
  const yamb = makeYamb();
  assert.equal(locate.fn(yamb, 'nope'), undefined);
});

test('identify(uri) returns the id for a known uri', () => {
  const yamb = makeYamb();
  assert.equal(identify.fn(yamb, '2026/04/a'), 'id-1');
});

test('identify(uri) returns undefined for an unknown uri', () => {
  const yamb = makeYamb();
  assert.equal(identify.fn(yamb, '2026/04/missing'), undefined);
});

test('has(uri) returns true for a known uri', () => {
  const yamb = makeYamb();
  assert.equal(has.fn(yamb, '2026/04/a'), true);
});

test('has(uri) returns false for an unknown uri', () => {
  const yamb = makeYamb();
  assert.equal(has.fn(yamb, '2026/04/missing'), false);
});
