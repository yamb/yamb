import assert from 'node:assert/strict';
import test from 'node:test';

import { blogWith } from './perf/fixture.js';

for (const scope of ['post', 'collection']) {
  test(`${scope} rendering preserves primary failures when finally aborts`, async (t) => {
    const controller = new AbortController();
    const failure = new Error('render failed');
    const renderer = {
      name: 'article',
      version: '1',
      [scope]() {
        try {
          throw failure;
        } finally {
          controller.abort(0);
        }
      }
    };
    const blog = await blogWith([], { renderers: { article: renderer } });
    t.after(() => blog.close());
    const post = blog.build({ title: 'Post' });
    const render =
      scope === 'post'
        ? () => post.render('article', { signal: controller.signal })
        : () => blog.render('article', { posts: [] }, { signal: controller.signal });
    await assert.rejects(render, (error) => error.cause === failure);
  });
}
