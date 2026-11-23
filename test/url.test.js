import assert from 'node:assert/strict';
import test from 'node:test';

import { url } from '@yamb/core/url';

import { Status } from '../src/constants/index.js';
import { UriOriginError } from '../src/errors/index.js';
import { buildUri, normalizeUri } from '../src/uri.js';

test('buildUri composes YYYY/MM/slug for published post', () => {
  const data = {
    status: Status.Published,
    slug: 'hello-world',
    publishedAt: Temporal.Instant.from('2026-04-26T10:00:00Z')
  };

  assert.equal(buildUri(data, 'UTC'), '2026/04/hello-world');
});

test('buildUri uses timeZone for date prefix', () => {
  const data = {
    status: Status.Published,
    slug: 'new-year',
    publishedAt: Temporal.Instant.from('2026-12-31T23:00:00Z')
  };

  assert.equal(buildUri(data, 'Europe/Moscow'), '2027/01/new-year');
});

test('buildUri returns drafts/{slug} for draft status', () => {
  const data = {
    status: Status.Draft,
    slug: 'my-idea',
    publishedAt: Temporal.Instant.from('2026-04-26T10:00:00Z')
  };

  assert.equal(buildUri(data, 'UTC'), 'drafts/my-idea');
});

test('buildUri returns drafts/{slug} when publishedAt missing', () => {
  const data = { status: Status.Scheduled, slug: 'pending' };

  assert.equal(buildUri(data, 'UTC'), 'drafts/pending');
});

test('buildUri throws a typed PostDateError when the zoned year overflows past 9999', () => {
  const data = {
    status: Status.Published,
    slug: 'far-future',
    publishedAt: Temporal.Instant.from('9999-12-31T23:59:59Z')
  };

  assert.throws(() => buildUri(data, 'Etc/GMT-12'), {
    code: 'YAMB_POST_DATE_INVALID'
  });
});

test('buildUri throws a typed PostDateError when the zoned year underflows to 0000', () => {
  const data = {
    status: Status.Published,
    slug: 'ancient',
    publishedAt: Temporal.Instant.from('0001-01-01T00:00:01Z')
  };

  assert.throws(() => buildUri(data, 'Etc/GMT+11'), {
    code: 'YAMB_POST_DATE_INVALID'
  });
});

test('normalizeUri accepts canonical uri', () => {
  assert.equal(normalizeUri('2026/04/hello', 'https://nko.io'), '2026/04/hello');
});

test('normalizeUri strips leading slash', () => {
  assert.equal(normalizeUri('/2026/04/hello', 'https://nko.io'), '2026/04/hello');
});

test('normalizeUri extracts path from full URL', () => {
  assert.equal(
    normalizeUri('https://nko.io/2026/04/hello?ref=feed', 'https://nko.io'),
    '2026/04/hello'
  );
});

test('normalizeUri rejects mismatching origin', () => {
  const href = 'https://example.com/2026/04/hello';

  for (const input of [href, new URL(href)]) {
    assert.throws(
      () => normalizeUri(input, 'https://nko.io'),
      (err) => err instanceof UriOriginError && err.code === 'YAMB_URI_ORIGIN_MISMATCH'
    );
  }
});

test('url returns URL with base', () => {
  const result = url('2026/04/hello', 'https://nko.io');
  assert.ok(result instanceof URL);
  assert.equal(result.href, 'https://nko.io/2026/04/hello');
});

test('url applies query params', () => {
  const result = url('2026/04/hello', 'https://nko.io', { ref: 'rss' });
  assert.equal(result.searchParams.get('ref'), 'rss');
});

test('url supports base with path', () => {
  const result = url('2026/04/hello', 'https://nko.io/blog/');
  assert.equal(result.href, 'https://nko.io/blog/2026/04/hello');
});

test('normalizeUri strips the base path only on a segment boundary', () => {
  assert.equal(
    normalizeUri('https://nko.io/blog/2026/04/hello', 'https://nko.io/blog/'),
    '2026/04/hello'
  );
  assert.equal(
    normalizeUri('https://nko.io/blogroll/2026/04/hello', 'https://nko.io/blog/'),
    'blogroll/2026/04/hello',
    'a sibling path sharing the prefix must not become "roll/..."'
  );
});

test('normalizeUri rejects a URL-like object with YAMB_QUERY_VALIDATION', () => {
  assert.throws(() => normalizeUri({ href: '/x' }, 'https://nko.io'), {
    code: 'YAMB_QUERY_VALIDATION'
  });
});

test('url preserves native references, params and URL arguments', () => {
  const base = new URL('https://example.com/blog?view=1#section');
  const input = new URL('https://other.example/post?ref=old#part');
  const original = [input.href, base.href];
  const result = url(input, base, { ref: 'new value', count: 2, enabled: false });
  assert.equal(result.href, 'https://other.example/post?ref=new+value&count=2&enabled=false#part');
  assert.deepEqual([input.href, base.href], original);
  assert.notEqual(result, input);
  for (const [reference, expected] of [
    ['./about', 'https://example.com/blog/about'],
    ['/about', 'https://example.com/about'],
    ['//cdn.example.com/about', 'https://cdn.example.com/about'],
    ['?new=1', 'https://example.com/blog/?new=1'],
    ['#part', 'https://example.com/blog/?view=1#part']
  ]) {
    assert.equal(url(reference, base).href, expected);
    assert.equal(base.href, original[1]);
  }
});
