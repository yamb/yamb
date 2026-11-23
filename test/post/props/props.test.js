import assert from 'node:assert/strict';
import test from 'node:test';

import { setState } from '../../../src/post/internal.js';
import author from '../../../src/post/props/author.js';
import cover from '../../../src/post/props/cover.js';
import publishedAt from '../../../src/post/props/published-at.js';
import slug from '../../../src/post/props/slug.js';
import status from '../../../src/post/props/status.js';
import tags from '../../../src/post/props/tags.js';
import title from '../../../src/post/props/title.js';
import updatedAt from '../../../src/post/props/updated-at.js';
import uri from '../../../src/post/props/uri.js';

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

test('title get/set + validation', () => {
  const p = makePost();
  title.set(p, 'Hello World');
  assert.equal(title.get(p), 'Hello World');
  title.set(p, '  Trimmed  ');
  assert.equal(title.get(p), 'Trimmed');
  assert.throws(() => title.set(p, ''), { code: 'YAMB_POST_VALIDATION' });
});

test('slug get/set kebab-only', () => {
  const p = makePost();
  slug.set(p, 'hello-world');
  assert.equal(slug.get(p), 'hello-world');

  assert.throws(() => slug.set(p, 'Hello World'), {
    code: 'YAMB_POST_VALIDATION'
  });
});

test('status get/set enum', () => {
  const p = makePost();
  status.set(p, 'draft');
  assert.equal(status.get(p), 'draft');

  assert.throws(() => status.set(p, 'unknown'), {
    code: 'YAMB_POST_STATUS_INVALID'
  });
});

test('status set with a Symbol throws the typed PostStatusError, not a raw TypeError', () => {
  const p = makePost();

  assert.throws(() => status.set(p, Symbol('x')), {
    code: 'YAMB_POST_STATUS_INVALID'
  });
});

test('tags get/set array', () => {
  const p = makePost();
  tags.set(p, ['js', 'node']);
  assert.deepEqual(tags.get(p), ['js', 'node']);
  assert.throws(() => tags.set(p, ['']), { code: 'YAMB_POST_VALIDATION' });
});

test('cover URL allowlist', () => {
  const p = makePost();
  cover.set(p, { url: '/img.jpg' });
  assert.deepEqual(cover.get(p), { url: '/img.jpg' });
  cover.set(p, { url: 'https://example.com/img.jpg' });
  assert.deepEqual(cover.get(p), { url: 'https://example.com/img.jpg' });

  assert.throws(() => cover.set(p, { url: 'javascript:alert(1)' }), {
    code: 'YAMB_POST_VALIDATION'
  });
});

test('author POJO', () => {
  const p = makePost();
  author.set(p, { name: 'Alice' });
  assert.deepEqual(author.get(p), { name: 'Alice' });
});

test('publishedAt accepts Instant/string/Date', () => {
  const p = makePost();
  publishedAt.set(p, '2026-04-26T10:00:00Z');
  assert.ok(publishedAt.get(p) instanceof Temporal.Instant);
  publishedAt.set(p, new Date('2026-04-26T10:00:00Z'));
  assert.ok(publishedAt.get(p) instanceof Temporal.Instant);
  publishedAt.set(p, Temporal.Instant.from('2026-04-26T10:00:00Z'));
  assert.ok(publishedAt.get(p) instanceof Temporal.Instant);

  assert.throws(() => publishedAt.set(p, 'not-a-date'), {
    code: 'YAMB_POST_DATE_INVALID'
  });
});

test('publishedAt set with a Symbol throws the typed PostDateError, not a raw TypeError', () => {
  const p = makePost();

  assert.throws(() => publishedAt.set(p, Symbol('x')), {
    code: 'YAMB_POST_DATE_INVALID'
  });
});

test('updatedAt is read-only (set: false)', () => {
  assert.equal(updatedAt.set, false);
});

test('uri is computed read-only', () => {
  const p = makePost({
    slug: 'hello',
    publishedAt: Temporal.Instant.from('2026-04-26T10:00:00Z')
  });

  assert.equal(uri.get(p), '2026/04/hello');
  assert.equal(uri.set, false);
});
