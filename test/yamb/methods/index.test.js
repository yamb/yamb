import assert from 'node:assert/strict';
import test from 'node:test';

import { blogWith, postData } from '../../perf/fixture.js';

async function blogWithPost(t) {
  const blog = await blogWith([{ ...postData(), id: 'id-1', uri: '2026/04/a', slug: 'a' }]);

  t.after(() => blog.close());

  return blog;
}

test('locate(id) returns the uri for a known id and undefined otherwise', async (t) => {
  const blog = await blogWithPost(t);

  assert.equal(blog.locate('id-1'), '2026/04/a');
  assert.equal(blog.locate('nope'), undefined);
});

test('identify(uri) returns the id for a known uri and undefined otherwise', async (t) => {
  const blog = await blogWithPost(t);

  assert.equal(blog.identify('2026/04/a'), 'id-1');
  assert.equal(blog.identify('2026/04/missing'), undefined);
});

test('has(uri) reports whether a uri is known', async (t) => {
  const blog = await blogWithPost(t);

  assert.equal(blog.has('2026/04/a'), true);
  assert.equal(blog.has('2026/04/missing'), false);
});
