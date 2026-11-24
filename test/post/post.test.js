import assert from 'node:assert/strict';
import test from 'node:test';

import { Post } from '../../src/post/index.js';

const makeYamb = () => ({
  timeZone: 'UTC',
  base: 'https://example.com',
  isOpen: true,
  storage: {
    find: async () => null,
    save: async () => {},
    remove: async () => {},
    fence: async () => {}
  },
  renderers: {},
  clock: () => Temporal.Instant.from('2026-04-26T10:00:00Z'),
  slugger: (t) => t.toLowerCase().replace(/\s+/g, '-')
});

test('Post constructor with raw data', () => {
  const post = new Post(makeYamb(), {
    id: 'post-hello',
    uri: '2026/04/hello',
    slug: 'hello',
    title: 'Hello',
    text: '...',
    status: 'published',
    tags: [],
    links: { related: [] },
    createdAt: '2026-04-26T10:00:00Z',
    updatedAt: '2026-04-26T10:00:00Z',
    publishedAt: '2026-04-26T10:00:00Z'
  });

  assert.equal(post.title, 'Hello');
  assert.equal(post.uri, '2026/04/hello');
  assert.ok(post.publishedAt instanceof Temporal.Instant);
});

test('Post setters validate', () => {
  const post = new Post(makeYamb(), {
    id: 'post-x',
    uri: 'drafts/x',
    text: '',
    title: 'X',
    slug: 'x',
    status: 'draft',
    tags: [],
    links: { related: [] },
    createdAt: Temporal.Instant.from('2026-04-26T10:00:00Z'),
    updatedAt: Temporal.Instant.from('2026-04-26T10:00:00Z'),
    publishedAt: Temporal.Instant.from('2026-04-26T10:00:00Z')
  });

  post.title = 'Y';
  assert.equal(post.title, 'Y');

  assert.throws(
    () => {
      post.title = '';
    },
    { code: 'YAMB_POST_VALIDATION' }
  );
});

test('Post.toJSON returns RawPost', () => {
  const post = new Post(makeYamb(), {
    id: 'post-x',
    uri: '2026/04/x',
    slug: 'x',
    title: 'X',
    text: '...',
    status: 'published',
    tags: [],
    links: { related: [] },
    createdAt: Temporal.Instant.from('2026-04-26T10:00:00Z'),
    updatedAt: Temporal.Instant.from('2026-04-26T10:00:00Z'),
    publishedAt: Temporal.Instant.from('2026-04-26T10:00:00Z')
  });

  const raw = post.toJSON();
  assert.equal(raw.title, 'X');
  assert.equal(raw.createdAt, '2026-04-26T10:00:00Z');
});
