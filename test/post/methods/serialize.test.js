import assert from 'node:assert/strict';
import test from 'node:test';

import { setState } from '../../../src/post/internal.js';
import { serializeData, serializeForStorage } from '../../../src/post/lib/serialize.js';
import changes from '../../../src/post/methods/changes.js';
import toJSON from '../../../src/post/methods/to-json.js';
import { encodeInstant } from '../../../src/schemas/zod.js';

function makePost(data, pristine = null) {
  const post = {};

  setState(post, {
    yamb: { timeZone: 'UTC' },
    data,
    pristine,
    cache: {}
  });

  return post;
}

test('toJSON serializes Temporal to ISO strings', () => {
  const post = makePost({
    uri: '2026/04/hello',
    slug: 'hello',
    title: 'Hello',
    text: '...',
    status: 'published',
    tags: [],
    links: { related: [] },
    createdAt: Temporal.Instant.from('2026-04-26T10:00:00Z'),
    updatedAt: Temporal.Instant.from('2026-04-26T10:30:00Z'),
    publishedAt: Temporal.Instant.from('2026-04-26T12:00:00Z')
  });

  const raw = toJSON.fn(post);
  assert.equal(raw.createdAt, '2026-04-26T10:00:00Z');
  assert.equal(raw.updatedAt, '2026-04-26T10:30:00Z');
  assert.equal(raw.publishedAt, '2026-04-26T12:00:00Z');
  assert.equal(raw.title, 'Hello');
});

test('changes returns empty for pristine post', () => {
  const data = { title: 'X', tags: ['a'] };
  const post = makePost({ ...data }, { ...data });
  assert.deepEqual(changes.fn(post), {});
});

test('changes returns diff', () => {
  const post = makePost({ title: 'Updated', tags: ['a'] }, { title: 'Old', tags: ['a'] });
  assert.deepEqual(changes.fn(post), { title: 'Updated' });
});

test('changes for new post returns full data', () => {
  const post = makePost({ title: 'X' }, null);
  assert.deepEqual(changes.fn(post), { title: 'X' });
});

test('serializeData preserves id when present', () => {
  const out = serializeData({ id: 'abc-123', title: 'X' });
  assert.equal(out.id, 'abc-123');
  assert.equal(out.title, 'X');
});

test('serializeData omits id when undefined', () => {
  const out = serializeData({ title: 'X' });
  assert.equal('id' in out, false);
});

test('serializeForStorage encodes Instants to fixed 9-digit precision', () => {
  const out = serializeForStorage({
    title: 'X',
    publishedAt: Temporal.Instant.from('2026-04-26T12:00:00.5Z'),
    createdAt: Temporal.Instant.from('2026-04-26T12:00:00Z')
  });
  assert.equal(out.publishedAt, '2026-04-26T12:00:00.500000000Z');
  assert.equal(out.createdAt, '2026-04-26T12:00:00.000000000Z');
});

test('serializeData (toJSON form) keeps clean ISO, trailing zeros trimmed', () => {
  const out = serializeData({
    title: 'X',
    publishedAt: Temporal.Instant.from('2026-04-26T12:00:00Z')
  });
  assert.equal(out.publishedAt, '2026-04-26T12:00:00Z');
});

test('encodeInstant: fixed-width strings sort lexicographically == chronologically', () => {
  const early = encodeInstant(Temporal.Instant.from('2026-04-26T12:00:00Z'));
  const late = encodeInstant(Temporal.Instant.from('2026-04-26T12:00:00.5Z'));
  assert.ok(early < late, 'earlier instant must sort before later');
  assert.equal(early, '2026-04-26T12:00:00.000000000Z');
  assert.equal(late, '2026-04-26T12:00:00.500000000Z');
});
