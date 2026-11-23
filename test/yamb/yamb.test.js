import assert from 'node:assert/strict';
import test from 'node:test';

import { yamb, Yamb } from '../../src/yamb/index.js';

function makeStorage() {
  return {
    open: async () => {},
    find: async () => null,
    fetch: async () => null,
    count: async () => 0,
    all: () => ({ async *[Symbol.asyncIterator]() {} }),
    save: async () => {},
    remove: async () => {},
    sync: async () => {},
    close: async () => {},

    async *entries() {}
  };
}

test('yamb() returns Yamb instance', () => {
  const blog = yamb({ storage: makeStorage() });
  assert.ok(blog instanceof Yamb);
});

test('yamb() validates config', () => {
  assert.throws(() => yamb({}), { code: 'YAMB_CONFIG_INVALID' });
});

test('yamb() default base is http://localhost', () => {
  const blog = yamb({ storage: makeStorage() });
  assert.ok(blog);
});

test('blog.open() and blog.close() are idempotent', async () => {
  const blog = yamb({ storage: makeStorage() });
  await blog.open();
  await blog.open();
  await blog.close();
  await blog.close();
});

test('blog.published returns PostCollection', () => {
  const blog = yamb({ storage: makeStorage() });
  const c = blog.published;
  assert.ok(c);
});

test('blog.open() rolls back storage when index build fails', async () => {
  let closed = false;
  const storage = makeStorage();
  storage.entries = () => {
    throw new Error('index boom');
  };
  storage.close = async () => {
    closed = true;
  };

  const blog = yamb({ storage });
  await assert.rejects(() => blog.open(), /index boom/);

  assert.equal(closed, true, 'storage.close must be called to roll back a failed open');
});

test('blog.open() disposes already-prepared renderers when a later prepare fails', async () => {
  let closed = false;
  let disposed = false;
  const storage = makeStorage();
  storage.close = async () => {
    closed = true;
  };

  const good = {
    name: 'a',
    version: '0.1.0',
    collection: () => '',
    prepare: async () => {},
    dispose: async () => {
      disposed = true;
    }
  };

  const bad = {
    name: 'b',
    version: '0.1.0',
    collection: () => '',
    prepare: async () => {
      throw new Error('prepare boom');
    }
  };

  const blog = yamb({ storage, renderers: { a: good, b: bad }, base: 'https://example.com' });
  await assert.rejects(() => blog.open(), /prepare boom/);

  assert.equal(disposed, true, 'a prepared renderer must be disposed on rollback');
  assert.equal(closed, true, 'storage must be closed on rollback');
});

test('yamb config rejects unknown `renderer` key (use renderers map)', () => {
  const rss = { name: 'rss', version: '0.1.0', collection: () => '' };
  assert.throws(() => yamb({ storage: makeStorage(), renderer: rss }), {
    code: 'YAMB_CONFIG_INVALID'
  });
});

test('blog.render() normalizes a non-yamb collection renderer throw to YAMB_RENDERER_FAILED', async () => {
  const rss = {
    name: 'rss',
    version: '0.1.0',
    collection: () => {
      throw new Error('boom');
    }
  };

  const blog = yamb({ storage: makeStorage(), renderers: { rss }, base: 'https://example.com' });
  await blog.open();

  try {
    await assert.rejects(() => blog.render('rss', { posts: [] }), { code: 'YAMB_RENDERER_FAILED' });
  } finally {
    await blog.close();
  }
});

test('await using calls close', async () => {
  let closed = false;
  const storage = makeStorage();
  const origClose = storage.close;

  storage.close = async () => {
    closed = true;
    await origClose();
  };
  const blog = yamb({ storage });

  try {
    await blog.open();
  } finally {
    await blog[Symbol.asyncDispose]();
  }

  assert.equal(closed, true);
});

test('default slugger transliterates Cyrillic titles', async () => {
  const blog = yamb({ storage: makeStorage() });
  await blog.open();
  const post = blog.build({ title: 'Привет, мир', text: '...' });
  await post.save();
  assert.equal(post.slug, 'privet-mir');
  await blog.close();
});

test('for await iterates blog like blog.all()', async () => {
  const storage = makeStorage();

  storage.all = (_query, _options) => ({
    async *[Symbol.asyncIterator]() {
      yield {
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
      };
    }
  });

  const blog = yamb({ storage });
  await blog.open();
  const titles = [];

  for await (const post of blog) {
    titles.push(post.title);
  }

  assert.deepEqual(titles, ['X']);
  await blog.close();
});
