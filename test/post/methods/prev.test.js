import assert from 'node:assert/strict';
import test from 'node:test';

import { setState } from '../../../src/post/internal.js';
import prev from '../../../src/post/methods/prev.js';

function makePost({ publishedAt, status = 'published', yamb }) {
  const post = {};
  setState(post, {
    yamb,
    data: { status, publishedAt },
    pristine: null,
    cache: {}
  });

  return post;
}

function makeYamb({ posts = [], signal = undefined, isOpen = true }) {
  return {
    isOpen,
    signal,
    clock: () => Temporal.Instant.from('2999-01-01T00:00:00Z'),
    storage: {
      async *all(query, options) {
        options?.signal?.throwIfAborted();
        const filtered = posts
          .filter((p) => p.status === query.status)
          .filter((p) =>
            query.cursor
              ? p.publishedAt.epochMilliseconds < query.cursor.publishedAt.epochMilliseconds
              : true
          )
          .toSorted((a, b) => b.publishedAt.epochMilliseconds - a.publishedAt.epochMilliseconds);

        for (const p of filtered.slice(0, 1)) {
          yield p;
        }
      }
    },
    _hydrate: (raw) => ({ _hydrated: true, ...raw })
  };
}

const t = (iso) => Temporal.Instant.from(iso);

test('prev returns the previous published post by publishedAt desc', async () => {
  const a = { id: 'a', status: 'published', publishedAt: t('2026-04-01T10:00:00Z') };
  const b = { id: 'b', status: 'published', publishedAt: t('2026-04-02T10:00:00Z') };
  const c = { id: 'c', status: 'published', publishedAt: t('2026-04-03T10:00:00Z') };

  const post = makePost({
    publishedAt: c.publishedAt,
    yamb: makeYamb({ posts: [a, b, c] })
  });

  const result = await prev.fn(post);
  assert.equal(result?.id, 'b');
});

test('prev returns null when no earlier published post exists', async () => {
  const a = { id: 'a', status: 'published', publishedAt: t('2026-04-01T10:00:00Z') };
  const post = makePost({
    publishedAt: a.publishedAt,
    yamb: makeYamb({ posts: [a] })
  });

  const result = await prev.fn(post);
  assert.equal(result, null);
});

test('prev skips drafts and scheduled posts', async () => {
  const a = { id: 'a', status: 'published', publishedAt: t('2026-04-01T10:00:00Z') };
  const draft = { id: 'd', status: 'draft', publishedAt: t('2026-04-02T10:00:00Z') };
  const scheduled = { id: 's', status: 'scheduled', publishedAt: t('2026-04-03T10:00:00Z') };
  const c = { id: 'c', status: 'published', publishedAt: t('2026-04-04T10:00:00Z') };

  const post = makePost({
    publishedAt: c.publishedAt,
    yamb: makeYamb({ posts: [a, draft, scheduled, c] })
  });

  const result = await prev.fn(post);
  assert.equal(result?.id, 'a');
});

test('prev honors the global yamb.signal (composed via effectiveSignal)', async () => {
  const a = { id: 'a', status: 'published', publishedAt: t('2026-04-01T10:00:00Z') };
  const b = { id: 'b', status: 'published', publishedAt: t('2026-04-02T10:00:00Z') };
  const post = makePost({
    publishedAt: b.publishedAt,
    yamb: makeYamb({ posts: [a, b], signal: AbortSignal.abort() })
  });

  await assert.rejects(() => prev.fn(post), { name: 'AbortError' });
});

test('prev throws YambNotOpenError when the blog is closed', async () => {
  const a = { id: 'a', status: 'published', publishedAt: t('2026-04-01T10:00:00Z') };
  const post = makePost({
    publishedAt: a.publishedAt,
    yamb: makeYamb({ posts: [a], isOpen: false })
  });

  await assert.rejects(() => prev.fn(post), { code: 'YAMB_NOT_OPEN' });
});

test('prev returns null for a draft anchor (no publishedAt) without touching storage', async () => {
  const yamb = {
    isOpen: true,
    clock: () => Temporal.Instant.from('2999-01-01T00:00:00Z'),
    storage: {
      all() {
        throw new Error('storage.all must not be called for a position-less draft');
      }
    },
    _hydrate: (raw) => raw
  };
  const post = makePost({ publishedAt: undefined, yamb });

  const result = await prev.fn(post);
  assert.equal(result, null);
});

test('prev returns null for a non-public anchor that retained publishedAt', async () => {
  const a = { id: 'a', status: 'published', publishedAt: t('2026-04-01T10:00:00Z') };
  const yamb = {
    isOpen: true,
    clock: () => Temporal.Instant.from('2999-01-01T00:00:00Z'),
    storage: {
      all() {
        throw new Error('storage.all must not be called for a non-public anchor');
      }
    },
    _hydrate: (raw) => raw
  };
  const post = makePost({
    status: 'draft',
    publishedAt: t('2026-04-02T10:00:00Z'),
    yamb: { ...yamb, posts: [a] }
  });

  assert.equal(await prev.fn(post), null);
});

test('prev hydrates the result via yamb._hydrate', async () => {
  const a = { id: 'a', status: 'published', publishedAt: t('2026-04-01T10:00:00Z') };
  const b = { id: 'b', status: 'published', publishedAt: t('2026-04-02T10:00:00Z') };

  const post = makePost({
    publishedAt: b.publishedAt,
    yamb: makeYamb({ posts: [a, b] })
  });

  const result = await prev.fn(post);
  assert.equal(result?._hydrated, true);
  assert.equal(result?.id, 'a');
});
