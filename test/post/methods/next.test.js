import assert from 'node:assert/strict';
import test from 'node:test';

import { setState } from '../../../src/post/internal.js';
import next from '../../../src/post/methods/next.js';

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
              ? p.publishedAt.epochMilliseconds > query.cursor.publishedAt.epochMilliseconds
              : true
          )
          .filter((p) =>
            query.before ? p.publishedAt.epochMilliseconds < query.before.epochMilliseconds : true
          )
          .toSorted((a, b) => a.publishedAt.epochMilliseconds - b.publishedAt.epochMilliseconds);

        for (const p of filtered.slice(0, 1)) {
          yield p;
        }
      }
    },
    _hydrate: (raw) => ({ _hydrated: true, ...raw })
  };
}

const t = (iso) => Temporal.Instant.from(iso);

test('next returns the next published post by publishedAt asc', async () => {
  const a = { id: 'a', status: 'published', publishedAt: t('2026-04-01T10:00:00Z') };
  const b = { id: 'b', status: 'published', publishedAt: t('2026-04-02T10:00:00Z') };
  const c = { id: 'c', status: 'published', publishedAt: t('2026-04-03T10:00:00Z') };

  const post = makePost({
    publishedAt: a.publishedAt,
    yamb: makeYamb({ posts: [a, b, c] })
  });

  const result = await next.fn(post);
  assert.equal(result?.id, 'b');
});

test('next returns null when no later published post exists', async () => {
  const a = { id: 'a', status: 'published', publishedAt: t('2026-04-01T10:00:00Z') };
  const post = makePost({
    publishedAt: a.publishedAt,
    yamb: makeYamb({ posts: [a] })
  });

  const result = await next.fn(post);
  assert.equal(result, null);
});

test('next skips drafts and scheduled posts', async () => {
  const a = { id: 'a', status: 'published', publishedAt: t('2026-04-01T10:00:00Z') };
  const draft = { id: 'd', status: 'draft', publishedAt: t('2026-04-02T10:00:00Z') };
  const scheduled = { id: 's', status: 'scheduled', publishedAt: t('2026-04-03T10:00:00Z') };
  const next2 = { id: 'n', status: 'published', publishedAt: t('2026-04-04T10:00:00Z') };

  const post = makePost({
    publishedAt: a.publishedAt,
    yamb: makeYamb({ posts: [a, draft, scheduled, next2] })
  });

  const result = await next.fn(post);
  assert.equal(result?.id, 'n');
});

test('next honors the global yamb.signal (composed via effectiveSignal)', async () => {
  const a = { id: 'a', status: 'published', publishedAt: t('2026-04-01T10:00:00Z') };
  const b = { id: 'b', status: 'published', publishedAt: t('2026-04-02T10:00:00Z') };
  const post = makePost({
    publishedAt: a.publishedAt,
    yamb: makeYamb({ posts: [a, b], signal: AbortSignal.abort() })
  });

  await assert.rejects(() => next.fn(post), { name: 'AbortError' });
});

test('next throws YambNotOpenError when the blog is closed', async () => {
  const a = { id: 'a', status: 'published', publishedAt: t('2026-04-01T10:00:00Z') };
  const post = makePost({
    publishedAt: a.publishedAt,
    yamb: makeYamb({ posts: [a], isOpen: false })
  });

  await assert.rejects(() => next.fn(post), { code: 'YAMB_NOT_OPEN' });
});

test('next returns null for a draft anchor (no publishedAt) without touching storage', async () => {
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

  const result = await next.fn(post);
  assert.equal(result, null);
});

test('next returns null for a non-public anchor that retained publishedAt', async () => {
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
  const post = makePost({ status: 'archived', publishedAt: t('2026-04-02T10:00:00Z'), yamb });

  assert.equal(await next.fn(post), null);
});

test('next hydrates the result via yamb._hydrate', async () => {
  const a = { id: 'a', status: 'published', publishedAt: t('2026-04-01T10:00:00Z') };
  const b = { id: 'b', status: 'published', publishedAt: t('2026-04-02T10:00:00Z') };

  const post = makePost({
    publishedAt: a.publishedAt,
    yamb: makeYamb({ posts: [a, b] })
  });

  const result = await next.fn(post);
  assert.equal(result?._hydrated, true);
  assert.equal(result?.id, 'b');
});
