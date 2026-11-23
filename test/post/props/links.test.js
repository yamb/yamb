import assert from 'node:assert/strict';
import test from 'node:test';

import { Post } from '../../../src/post/index.js';
import { postData } from '../../perf/fixture.js';

test('links reads live ids and retains unknown ids independently of URI indexes', () => {
  const post = new Post(
    {
      timeZone: 'UTC',
      locate: (id) => (id === 'id-A' ? '2026/04/a' : undefined),
      identify: () => 'id-A'
    },
    {
      ...postData(),
      id: 'post-links',
      uri: '2026/11/baseline-0',
      title: 'X',
      links: { related: ['id-A', 'id-stale'] }
    }
  );
  assert.deepEqual(post.links.related, ['id-A', 'id-stale']);
  assert.equal(post.links.related, post.links.related);
  post.links.related.push('id-future');
  assert.deepEqual(post.changes().links, { related: ['id-A', 'id-stale', 'id-future'] });
  assert.deepEqual(post.toJSON().links.related, ['id-A', 'id-stale', 'id-future']);
});

test('links assignments validate ids without URI normalization', () => {
  const post = new Post({}, { title: 'X' }, { pristine: false });
  post.links = { related: ['unknown-id', 'drafts/opaque-id'] };
  assert.deepEqual(post.links.related, ['unknown-id', 'drafts/opaque-id']);
  assert.throws(
    () => {
      post.links = { related: [''] };
    },
    { code: 'YAMB_POST_VALIDATION' }
  );
  assert.throws(
    () => {
      post.links.related.push(123);
    },
    { code: 'YAMB_POST_VALIDATION' }
  );
  assert.deepEqual(post.toJSON().links.related, ['unknown-id', 'drafts/opaque-id']);
});
