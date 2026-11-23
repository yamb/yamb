import assert from 'node:assert/strict';
import test from 'node:test';

import { blogWith } from '../perf/fixture.js';

async function setup(t, renderer) {
  const blog = await blogWith([], { renderers: { article: renderer } });
  t.after(() => blog.close());
  return blog;
}

test('post render retains the launched revision across an asynchronous renderer', async (t) => {
  const gate = Promise.withResolvers();
  const blog = await setup(t, {
    name: 'article',
    version: '1',
    async post(data) {
      await gate.promise;
      return { title: data.title, text: data.text, tags: [...data.tags], date: data.createdAt };
    }
  });
  const post = await blog.create({ title: 'Before', text: '**original**\r\n', tags: ['before'] });
  const rendering = post.render('article');
  post.title = 'After';
  post.text = '**changed**';
  post.tags.push('after');
  gate.resolve();
  assert.deepEqual(await rendering, {
    title: 'Before',
    text: '**original**\r\n',
    tags: ['before'],
    date: '2026-11-10T09:00:00Z'
  });
  assert.equal(post.text, '**changed**');
  const loaded = await blog.find(post.id);
  assert.equal(loaded.text, '**original**\r\n');
});

test('blog renders a supplied revision even after its original Post changes', async (t) => {
  const blog = await setup(t, {
    name: 'article',
    version: '1',
    post: (data) => `${data.title}: ${data.text}`
  });
  const post = blog.build({ title: 'Before', text: 'source' });
  const data = post.toJSON();
  post.title = 'After';
  assert.equal(await blog.render('article', { post: data }), 'Before: source');
});

test('collection snapshots each yielded Post before the renderer waits', async (t) => {
  const entered = Promise.withResolvers();
  const release = Promise.withResolvers();
  const blog = await setup(t, {
    name: 'article',
    version: '1',
    async collection({ posts }) {
      const out = [];
      for await (const data of posts) {
        if (!out.length) {
          entered.resolve();
          await release.promise;
        }
        out.push(`${data.title}: ${data.text}`);
      }
      return out;
    }
  });
  const first = blog.build({ title: 'First', text: 'one' });
  const second = blog.build({ title: 'Second', text: 'two' });
  const rendering = blog.render('article', { posts: [first, second] });
  await entered.promise;
  first.title = 'Late first';
  second.title = 'Current second';
  release.resolve();
  assert.deepEqual(await rendering, ['First: one', 'Current second: two']);
});

test('a renderer cannot publish a value after cancellation, including primitive reasons', async (t) => {
  const release = Promise.withResolvers();
  const blog = await setup(t, {
    name: 'article',
    version: '1',
    async post() {
      await release.promise;
      return 'late';
    }
  });
  const signal = new AbortController();
  const rendering = blog.build({ title: 'T' }).render('article', { signal: signal.signal });
  signal.abort(false);
  release.resolve();
  await assert.rejects(rendering, (reason) => reason === false);
});
