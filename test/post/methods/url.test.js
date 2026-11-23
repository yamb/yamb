import assert from 'node:assert/strict';
import test from 'node:test';

import { Status } from '../../../src/constants/index.js';
import { setState } from '../../../src/post/internal.js';
import url from '../../../src/post/methods/url.js';

function makePost(data, base = 'https://nko.io') {
  const post = {};

  setState(post, {
    yamb: { timeZone: 'UTC', base },
    data,
    pristine: null,
    cache: {}
  });

  return post;
}

test('url returns absolute URL for published post', () => {
  const post = makePost({
    status: Status.Published,
    slug: 'hello',
    publishedAt: Temporal.Instant.from('2026-04-26T10:00:00Z')
  });

  const u = url.fn(post);
  assert.ok(u instanceof URL);
  assert.equal(u.href, 'https://nko.io/2026/04/hello');
});

test('url with params', () => {
  const post = makePost({
    status: Status.Published,
    slug: 'hello',
    publishedAt: Temporal.Instant.from('2026-04-26T10:00:00Z')
  });

  const u = url.fn(post, { ref: 'rss' });
  assert.equal(u.searchParams.get('ref'), 'rss');
});

test('url returns drafts URL for draft post', () => {
  const post = makePost({
    status: Status.Draft,
    slug: 'idea'
  });

  const u = url.fn(post);
  assert.equal(u.href, 'https://nko.io/drafts/idea');
});
