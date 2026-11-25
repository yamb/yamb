import assert from 'node:assert/strict';
import test from 'node:test';

import { PostCollection } from '../../src/post-collection/index.js';

function makeYamb(rawPosts = []) {
  const calls = [];

  return {
    calls,
    isOpen: true,
    timeZone: 'UTC',
    base: 'https://example.com',
    storage: {
      async count(query) {
        return rawPosts.filter((p) => !query.status || p.status === query.status).length;
      },
      all(query, options) {
        calls.push({ query, options });

        const filtered = rawPosts.filter((p) => {
          if (query.status && p.status !== query.status) {
            return false;
          }

          if (Array.isArray(query.tags) && !query.tags.every((t) => p.tags?.includes(t))) {
            return false;
          }

          return true;
        });

        const sorted =
          options.order === 'publishedAt'
            ? filtered.toSorted((a, b) => a.publishedAt.localeCompare(b.publishedAt))
            : filtered.toSorted((a, b) => b.publishedAt.localeCompare(a.publishedAt));

        const limited = options.limit != null ? sorted.slice(0, options.limit) : sorted;

        return {
          async *[Symbol.asyncIterator]() {
            for (const r of limited) {
              yield r;
            }
          }
        };
      }
    },
    _hydrate: (raw) => raw
  };
}

test('PostCollection iterates with default query/options', async () => {
  const yamb = makeYamb([
    {
      uri: '2026/04/a',
      title: 'A',
      status: 'published',
      publishedAt: '2026-04-01T00:00:00Z'
    },
    {
      uri: '2026/04/b',
      title: 'B',
      status: 'draft',
      publishedAt: '2026-04-02T00:00:00Z'
    }
  ]);

  const c = new PostCollection(yamb, { status: 'published' }, { order: '-publishedAt', limit: 10 });
  const titles = [];

  for await (const p of c) {
    titles.push(p.title);
  }

  assert.deepEqual(titles, ['A']);
});

test('PostCollection scope chain produces new collection', () => {
  const yamb = makeYamb();
  const c = new PostCollection(yamb, {}, {});
  const c2 = c.published().tagged('js').recent(5);
  assert.notEqual(c, c2);
});

test('recent()/oldest() validate the limit like limit() (reject NaN/negative)', () => {
  const yamb = makeYamb();
  const c = new PostCollection(yamb, {}, {});

  assert.throws(() => c.recent(Number.NaN));
  assert.throws(() => c.recent(-1));
  assert.throws(() => c.oldest(1.5));
  assert.throws(() => c.oldest(-3));
});

test('recent()/oldest() pass a valid non-negative limit to storage', async () => {
  const yamb = makeYamb();
  const c = new PostCollection(yamb, {}, {});

  await c.recent(5).toArray();
  await c.oldest(1).toArray();

  assert.equal(yamb.calls[0].options.limit, 5);
  assert.equal(yamb.calls[1].options.limit, 1);
});

test('tagged() accumulates a deduplicated AND-set of tags', async () => {
  const yamb = makeYamb();

  await new PostCollection(yamb, {}, {}).tagged('a').toArray();
  await new PostCollection(yamb, {}, {}).tagged('a', 'b').tagged('a').toArray();

  assert.deepEqual(yamb.calls[0].query, { tags: ['a'] });
  assert.deepEqual(yamb.calls[1].query, { tags: ['a', 'b'] });
});

test('tagged(): chained tags AND end-to-end (only posts with all tags)', async () => {
  const yamb = makeYamb([
    {
      uri: '2026/04/a',
      title: 'A',
      status: 'published',
      tags: ['js', 'node'],
      publishedAt: '2026-04-03T00:00:00Z'
    },
    {
      uri: '2026/04/b',
      title: 'B',
      status: 'published',
      tags: ['js'],
      publishedAt: '2026-04-02T00:00:00Z'
    },
    {
      uri: '2026/04/c',
      title: 'C',
      status: 'published',
      tags: ['node'],
      publishedAt: '2026-04-01T00:00:00Z'
    }
  ]);

  const c = new PostCollection(yamb, {}, { order: '-publishedAt', limit: 10 });
  const out = await c.published().tagged('js').tagged('node').toArray();
  assert.deepEqual(
    out.map((p) => p.title),
    ['A']
  );
});

test('PostCollection with limit:0 yields nothing without touching storage', async () => {
  let called = false;
  const yamb = {
    isOpen: true,
    storage: {
      all() {
        called = true;

        return { async *[Symbol.asyncIterator]() {} };
      }
    },
    _hydrate: (raw) => raw
  };

  const c = new PostCollection(yamb, { status: 'published' }, { order: '-publishedAt', limit: 0 });
  assert.deepEqual(await c.toArray(), []);
  assert.equal(called, false, 'storage.all must not be called for limit:0');
});

test('PostCollection toArray', async () => {
  const yamb = makeYamb([
    {
      uri: '2026/04/a',
      title: 'A',
      status: 'published',
      tags: ['js'],
      publishedAt: '2026-04-01T00:00:00Z'
    }
  ]);

  const c = new PostCollection(yamb, { status: 'published' }, { order: '-publishedAt', limit: 10 });
  const arr = await c.toArray();
  assert.equal(arr.length, 1);
});

test('PostCollection.first returns first or null', async () => {
  const yamb = makeYamb([
    {
      uri: '2026/04/a',
      title: 'A',
      status: 'published',
      publishedAt: '2026-04-01T00:00:00Z'
    }
  ]);

  const c = new PostCollection(yamb, { status: 'published' }, { order: '-publishedAt', limit: 10 });
  const first = await c.first();
  assert.equal(first.title, 'A');

  const empty = new PostCollection(
    makeYamb(),
    { status: 'draft' },
    { order: '-publishedAt', limit: 10 }
  );

  assert.equal(await empty.first(), null);
});

test('PostCollection.filter().take().map().toArray() chains via AsyncIterator helpers', async () => {
  const yamb = makeYamb([
    {
      uri: '2026/04/a',
      title: 'A',
      status: 'published',
      tags: ['js'],
      publishedAt: '2026-04-01T00:00:00Z'
    },
    {
      uri: '2026/04/b',
      title: 'B',
      status: 'published',
      tags: ['rust'],
      publishedAt: '2026-04-02T00:00:00Z'
    },
    {
      uri: '2026/04/c',
      title: 'C',
      status: 'published',
      tags: ['js'],
      publishedAt: '2026-04-03T00:00:00Z'
    }
  ]);

  const c = new PostCollection(yamb, { status: 'published' }, { order: '-publishedAt', limit: 10 });
  const out = await c
    .filter((p) => p.tags.includes('js'))
    .take(5)
    .map((p) => p.title)
    .toArray();

  assert.deepEqual(out, ['C', 'A']);
});

test('PostCollection.count', async () => {
  const yamb = makeYamb([
    {
      uri: '2026/04/a',
      title: 'A',
      status: 'published',
      publishedAt: '2026-04-01T00:00:00Z'
    },
    {
      uri: '2026/04/b',
      title: 'B',
      status: 'published',
      publishedAt: '2026-04-02T00:00:00Z'
    }
  ]);

  const c = new PostCollection(
    yamb,
    { status: 'published' },
    { order: '-publishedAt', limit: null }
  );

  assert.equal(await c.count(), 2);
});

test('PostCollection.count ignores limit (counts full matching set)', async () => {
  const yamb = makeYamb([
    { uri: '2026/04/a', title: 'A', status: 'published', publishedAt: '2026-04-01T00:00:00Z' },
    { uri: '2026/04/b', title: 'B', status: 'published', publishedAt: '2026-04-02T00:00:00Z' },
    { uri: '2026/04/c', title: 'C', status: 'published', publishedAt: '2026-04-03T00:00:00Z' }
  ]);

  const c = new PostCollection(yamb, { status: 'published' }, { order: '-publishedAt', limit: 1 });
  assert.equal(await c.count(), 3);
});

test('PostCollection.count delegates to storage.count when present (ignores limit)', async () => {
  let received;
  const yamb = {
    isOpen: true,
    storage: {
      count(query, _options) {
        received = query;

        return 42;
      },
      all() {
        throw new Error('count must not iterate when storage.count exists');
      }
    },
    _hydrate: (raw) => raw
  };

  const c = new PostCollection(yamb, { status: 'published' }, { order: '-publishedAt', limit: 10 });
  assert.equal(await c.count(), 42);
  assert.deepEqual(received, { status: 'published' });
});

test('PostCollection.count throws YambNotOpenError when the blog is closed', async () => {
  const yamb = {
    isOpen: false,
    storage: {
      count() {
        throw new Error('count must not reach storage when closed');
      }
    }
  };
  const c = new PostCollection(yamb, { status: 'published' }, {});

  await assert.rejects(() => c.count(), { code: 'YAMB_NOT_OPEN' });
});

test('PostCollection.count honours the global yamb.signal (composed)', async () => {
  const yamb = {
    isOpen: true,
    signal: AbortSignal.abort(),
    storage: {
      count() {
        throw new Error('count must not reach storage once aborted');
      }
    }
  };
  const c = new PostCollection(yamb, { status: 'published' }, {});

  await assert.rejects(() => c.count(), { name: 'AbortError' });
});

test('PostCollection.order rejects an invalid value with YAMB_QUERY_VALIDATION', () => {
  const c = new PostCollection({}, {}, {});

  assert.throws(() => c.order('bogus'), { code: 'YAMB_QUERY_VALIDATION' });
  assert.doesNotThrow(() => c.order('title'));
});

test('PostCollection.before/after reject invalid instants with YAMB_QUERY_VALIDATION', () => {
  const c = new PostCollection({}, {}, {});

  assert.throws(() => c.before('not-an-instant'), { code: 'YAMB_QUERY_VALIDATION' });
  assert.throws(() => c.after('not-an-instant'), { code: 'YAMB_QUERY_VALIDATION' });
  assert.doesNotThrow(() => c.before(Temporal.Instant.from('2026-04-01T00:00:00Z')));
});
