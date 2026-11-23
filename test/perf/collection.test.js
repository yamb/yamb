import assert from 'node:assert/strict';
import test from 'node:test';

import { blogWith, postData } from './fixture.js';
import { conditions, measure, retained } from './measure.js';

test('PostCollection: lazy construction, first page, streaming and materialization', async (t) => {
  conditions(t);
  for (const size of [1000, 10_000]) {
    const data = postData();
    const rows = Array.from({ length: size }, (_, i) => ({
      ...data,
      id: `seed-${i}`,
      title: `Post ${i}`,
      slug: `post-${i}`,
      uri: `2026/11/post-${i}`
    }));
    const blog = await blogWith(rows);
    try {
      const prefix = `collection/${size}`;
      const collection = await measure(
        t,
        `${prefix}/construct`,
        () => {
          let current;
          for (let i = 0; i < 1000; i++) {
            current = blog.all({}, { limit: null });
          }
          return current;
        },
        1000
      );
      const first = await measure(t, `${prefix}/first`, () => collection.first());
      assert.equal(first.title, 'Post 0');
      const page = await measure(t, `${prefix}/page-10`, () =>
        Array.fromAsync(collection.limit(10))
      );
      assert.equal(page.length, 10);
      assert.equal(page[9].title, 'Post 9');
      const visited = await measure(
        t,
        `${prefix}/iterate`,
        async () => {
          let count = 0;
          let textBytes = 0;
          for await (const post of collection) {
            count++;
            textBytes += post.text.length;
          }
          return { count, textBytes };
        },
        size
      );
      assert.equal(visited.count, size);
      assert.equal(visited.textBytes, size * 1024);
      const posts = await measure(
        t,
        `${prefix}/materialize`,
        () => Array.fromAsync(collection),
        size
      );
      assert.equal(posts.length, size);
      assert.equal(posts.at(-1).title, `Post ${size - 1}`);
      const count = await measure(t, `${prefix}/count`, () => collection.count());
      assert.equal(count, size);
      retained(t, `${prefix}/collection-only`, () => blog.all({}, { limit: null }), size);
    } finally {
      await blog.close();
    }
  }
});
