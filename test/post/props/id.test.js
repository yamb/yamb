import assert from 'node:assert/strict';
import test from 'node:test';

import { Post } from '../../../src/post/index.js';

test('post.id returns null for posts without id in raw', () => {
  const p = new Post({}, { title: 'X' }, { pristine: false });
  assert.equal(p.id, null);
});

test('post.id returns the id when set in raw', () => {
  const p = new Post({}, { id: '670fab12cd34', title: 'X' }, { pristine: false });
  assert.equal(p.id, '670fab12cd34');
});

test('post.id setter throws (read-only)', () => {
  const p = new Post({}, { id: 'abc', title: 'X' }, { pristine: false });

  assert.throws(() => {
    p.id = 'new';
  }, TypeError);
});
