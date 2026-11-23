import assert from 'node:assert/strict';
import test from 'node:test';

import { setState } from '../../../src/post/internal.js';
import createdAt from '../../../src/post/props/created-at.js';

function makePost(initial = {}) {
  const post = {};

  setState(post, {
    yamb: { timeZone: 'UTC' },
    data: { ...initial },
    pristine: null,
    cache: {}
  });

  return post;
}

test('createdAt accepts Instant/string/Date', () => {
  const p = makePost();
  createdAt.set(p, '2026-04-26T10:00:00Z');
  assert.ok(createdAt.get(p) instanceof Temporal.Instant);
  createdAt.set(p, new Date('2026-04-26T10:00:00Z'));
  assert.ok(createdAt.get(p) instanceof Temporal.Instant);
  createdAt.set(p, Temporal.Instant.from('2026-04-26T10:00:00Z'));
  assert.ok(createdAt.get(p) instanceof Temporal.Instant);
});

test('createdAt set with an unparsable string throws the typed PostDateError', () => {
  const p = makePost();

  assert.throws(() => createdAt.set(p, 'not-a-date'), {
    code: 'YAMB_POST_DATE_INVALID'
  });
});

test('createdAt set with a Symbol throws the typed PostDateError, not a raw TypeError', () => {
  const p = makePost();

  assert.throws(() => createdAt.set(p, Symbol('x')), {
    code: 'YAMB_POST_DATE_INVALID'
  });
});
