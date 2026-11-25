import assert from 'node:assert/strict';
import test from 'node:test';

import { Post } from '../../../src/post/index.js';

const makePost = (data = {}) => new Post({ timeZone: 'UTC' }, data, { pristine: false });

test('title trims and validates', () => {
  const p = makePost();
  p.title = 'Hello World';
  assert.equal(p.title, 'Hello World');
  p.title = '  Trimmed  ';
  assert.equal(p.title, 'Trimmed');
  assert.throws(() => (p.title = ''), { code: 'YAMB_POST_VALIDATION' });
});

test('slug accepts kebab case only', () => {
  const p = makePost();
  p.slug = 'hello-world';
  assert.equal(p.slug, 'hello-world');
  assert.throws(() => (p.slug = 'Hello World'), { code: 'YAMB_POST_VALIDATION' });
});

test('status accepts known values and throws PostStatusError otherwise', () => {
  const p = makePost();
  p.status = 'draft';
  assert.equal(p.status, 'draft');

  for (const value of ['unknown', Symbol('x')]) {
    assert.throws(() => (p.status = value), { code: 'YAMB_POST_STATUS_INVALID' });
  }
});

test('tags validate each item', () => {
  const p = makePost();
  p.tags = ['js', 'node'];
  assert.deepEqual(p.tags, ['js', 'node']);
  assert.throws(() => (p.tags = ['']), { code: 'YAMB_POST_VALIDATION' });
});

test('cover allows relative and HTTP URLs and defaults to an empty object', () => {
  const p = makePost();
  assert.deepEqual(p.cover, {});
  p.cover = { url: '/img.jpg' };
  assert.deepEqual(p.cover, { url: '/img.jpg' });
  p.cover = { url: 'https://example.com/img.jpg' };
  assert.deepEqual(p.cover, { url: 'https://example.com/img.jpg' });
  p.cover = undefined;
  assert.deepEqual(p.cover, {});
  assert.throws(() => (p.cover = { url: 'javascript:alert(1)' }), {
    code: 'YAMB_POST_VALIDATION'
  });
});

test('author is a plain record', () => {
  const p = makePost();
  p.author = { name: 'Alice' };
  assert.deepEqual(p.author, { name: 'Alice' });
});

for (const field of ['createdAt', 'publishedAt']) {
  test(`${field} accepts an Instant or ISO string and throws PostDateError otherwise`, () => {
    const p = makePost();
    p[field] = '2026-04-26T10:00:00Z';
    assert.ok(p[field] instanceof Temporal.Instant);
    p[field] = Temporal.Instant.from('2026-04-26T10:00:00Z');
    assert.ok(p[field] instanceof Temporal.Instant);

    for (const value of ['not-a-date', Symbol('x')]) {
      assert.throws(() => (p[field] = value), { code: 'YAMB_POST_DATE_INVALID' });
    }
  });
}

test('id, uri and updatedAt are read-only', () => {
  const p = makePost({ slug: 'hello', publishedAt: '2026-04-26T10:00:00Z', status: 'published' });

  assert.equal(p.uri, '2026/04/hello');

  for (const field of ['id', 'uri', 'updatedAt']) {
    assert.throws(() => (p[field] = 'x'), TypeError);
  }
});
