import assert from 'node:assert/strict';
import test from 'node:test';

import { RendererInputError } from '../../../src/errors/index.js';
import { yamb } from '../../../src/index.js';
import { Post } from '../../../src/post/index.js';

function makeYamb(renderers = {}) {
  return yamb({
    timeZone: 'UTC',
    base: 'https://example.com',
    storage: {
      open: async () => {},
      close: async () => {},
      sync: async () => {},
      count: async () => 0,
      async *all() {},
      async *entries() {},
      fetch: async () => null,
      find: async () => null,
      save: async () => {},
      remove: async () => {}
    },
    renderers,
    clock: () => Temporal.Instant.from('2026-04-26T10:00:00Z'),
    slugger: (t) => t.toLowerCase().replace(/\s+/g, '-')
  });
}

function makePost(blog) {
  return new Post(blog, {
    id: 'post-x',
    uri: '2026/04/x',
    slug: 'x',
    title: 'X',
    text: '...',
    status: 'published',
    tags: [],
    links: { related: [] },
    createdAt: '2026-04-26T10:00:00Z',
    updatedAt: '2026-04-26T10:00:00Z',
    publishedAt: '2026-04-26T10:00:00Z'
  });
}

test('post.render() without format throws YAMB_RENDERER_MISSING about format, not html', async () => {
  const post = makePost(makeYamb({ json: { name: 'json', version: '0.1.0', post: () => ({}) } }));

  await assert.rejects(
    () => post.render(),
    (err) =>
      err.code === 'YAMB_RENDERER_MISSING' &&
      /format/i.test(err.message) &&
      !/"html"/.test(err.message)
  );
});

test('post.render() with explicit format dispatches to that renderer', async () => {
  const calls = [];

  const renderer = {
    name: 'json',
    version: '0.1.0',
    post: (p, ctx) => {
      calls.push({ uri: p.uri, scope: ctx.scope, format: ctx.format });

      return { ok: true };
    }
  };

  const post = makePost(makeYamb({ json: renderer }));
  const out = await post.render('json');
  assert.deepEqual(out, { ok: true });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].scope, 'post');
  assert.equal(calls[0].format, 'json');
});

test('post.render() normalizes a non-yamb renderer throw to YAMB_RENDERER_FAILED', async () => {
  const renderer = {
    name: 'json',
    version: '0.1.0',
    post: () => {
      throw new Error('boom');
    }
  };

  const post = makePost(makeYamb({ json: renderer }));
  await assert.rejects(() => post.render('json'), { code: 'YAMB_RENDERER_FAILED' });
});

test('post.render() preserves falsy renderer failures for diagnosis', async () => {
  for (const cause of [null, false, 0, '']) {
    const renderer = {
      name: 'json',
      version: '1',
      post() {
        throw cause;
      }
    };

    const post = makePost(makeYamb({ json: renderer }));
    await assert.rejects(
      () => post.render('json'),
      (error) => error.code === 'YAMB_RENDERER_FAILED' && error.cause === cause
    );
  }
});

test('post.render() passes a typed renderer error (YAMB_*) through unchanged', async () => {
  const renderer = {
    name: 'json',
    version: '0.1.0',
    post: () => {
      throw new RendererInputError('bad input');
    }
  };

  const post = makePost(makeYamb({ json: renderer }));
  await assert.rejects(() => post.render('json'), { code: 'YAMB_RENDERER_INPUT' });
});

test('post.render() passes an AbortError through unchanged', async () => {
  const renderer = {
    name: 'json',
    version: '0.1.0',
    post: () => {
      const err = new Error('aborted');
      err.name = 'AbortError';
      throw err;
    }
  };

  const post = makePost(makeYamb({ json: renderer }));
  await assert.rejects(
    () => post.render('json'),
    (err) => err.name === 'AbortError'
  );
});
