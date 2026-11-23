import assert from 'node:assert/strict';
import test from 'node:test';

import { defaultSlugger } from '../../src/slug/slugger.js';

test('slugger ASCII basic', () => {
  assert.equal(defaultSlugger('Hello World'), 'hello-world');
  assert.equal(defaultSlugger('Hello, World!'), 'hello-world');
  assert.equal(defaultSlugger('Multiple   spaces'), 'multiple-spaces');
});

test('slugger Russian transliteration', () => {
  assert.equal(defaultSlugger('Привет мир'), 'privet-mir');
  assert.equal(defaultSlugger('Архитектура yamb'), 'arhitektura-yamb');
  assert.equal(defaultSlugger('ёлка'), 'elka');
});

test('slugger is Unicode-normalization stable (NFC === NFD) and degrades accented latin to its ASCII base', () => {
  const nfc = defaultSlugger('Café');
  const nfd = defaultSlugger('Café');
  assert.equal(nfc, nfd);
  assert.equal(nfc, 'cafe');
});

test('slugger trims and lowercases', () => {
  assert.equal(defaultSlugger('  HELLO  '), 'hello');
});

test('slugger drops empty', () => {
  assert.equal(defaultSlugger(''), '');
  assert.equal(defaultSlugger('!!!'), '');
});
