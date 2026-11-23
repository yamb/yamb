import assert from 'node:assert/strict';
import test from 'node:test';

import { setState } from '../../../src/post/internal.js';
import related from '../../../src/post/methods/related.js';

function makePost({ relatedIds = [], yamb }) {
  const post = {};
  setState(post, {
    yamb,
    data: { links: { related: relatedIds } },
    pristine: null,
    cache: {}
  });

  return post;
}

function makeYamb({ store = {}, signal = undefined, findCalls = null }) {
  return {
    signal,
    storage: {
      async find(id, options) {
        findCalls?.push({ id, options });

        return store[id] ?? null;
      }
    },
    _hydrate: (raw) => ({ _hydrated: true, ...raw })
  };
}

test('related returns iterator that resolves ids in order', async () => {
  const post = makePost({
    relatedIds: ['a', 'b', 'c'],
    yamb: makeYamb({
      store: {
        a: { id: 'a', status: 'published' },
        b: { id: 'b', status: 'published' },
        c: { id: 'c', status: 'published' }
      }
    })
  });

  const out = await related.fn(post).toArray();
  assert.deepEqual(
    out.map((p) => p.id),
    ['a', 'b', 'c']
  );
});

test('related skips unknown (stale) ids without throwing', async () => {
  const post = makePost({
    relatedIds: ['a', 'missing', 'c'],
    yamb: makeYamb({
      store: {
        a: { id: 'a', status: 'published' },
        c: { id: 'c', status: 'published' }
      }
    })
  });

  const out = await related.fn(post).toArray();
  assert.deepEqual(
    out.map((p) => p.id),
    ['a', 'c']
  );
});

test('related skips non-published posts (drafts, scheduled, archived)', async () => {
  const post = makePost({
    relatedIds: ['draft', 'scheduled', 'archived', 'pub'],
    yamb: makeYamb({
      store: {
        draft: { id: 'draft', status: 'draft' },
        scheduled: { id: 'scheduled', status: 'scheduled' },
        archived: { id: 'archived', status: 'archived' },
        pub: { id: 'pub', status: 'published' }
      }
    })
  });

  const out = await related.fn(post).toArray();
  assert.deepEqual(
    out.map((p) => p.id),
    ['pub']
  );
});

test('related returns empty array when no related ids', async () => {
  const post = makePost({
    relatedIds: [],
    yamb: makeYamb({ store: {} })
  });

  const out = await related.fn(post).toArray();
  assert.deepEqual(out, []);
});

test('related returns empty array when links.related is missing entirely', async () => {
  const post = {};
  setState(post, {
    yamb: makeYamb({ store: {} }),
    data: {},
    pristine: null,
    cache: {}
  });

  const out = await related.fn(post).toArray();
  assert.deepEqual(out, []);
});

test('related.take(n) limits to n results', async () => {
  const post = makePost({
    relatedIds: ['a', 'b', 'c', 'd', 'e'],
    yamb: makeYamb({
      store: {
        a: { id: 'a', status: 'published' },
        b: { id: 'b', status: 'published' },
        c: { id: 'c', status: 'published' },
        d: { id: 'd', status: 'published' },
        e: { id: 'e', status: 'published' }
      }
    })
  });

  const taken = related.fn(post).take(2);
  const out = [];

  for await (const item of taken) {
    out.push(item.id);
  }

  assert.deepEqual(out, ['a', 'b']);
});

test('related hydrates each result via yamb._hydrate', async () => {
  const post = makePost({
    relatedIds: ['a'],
    yamb: makeYamb({
      store: { a: { id: 'a', status: 'published' } }
    })
  });

  const out = await related.fn(post).toArray();
  assert.equal(out[0]._hydrated, true);
});

test('related supports full helper chain: filter().take().toArray()', async () => {
  const post = makePost({
    relatedIds: ['a', 'b', 'c', 'd'],
    yamb: makeYamb({
      store: {
        a: { id: 'a', status: 'published', kind: 'note' },
        b: { id: 'b', status: 'published', kind: 'article' },
        c: { id: 'c', status: 'published', kind: 'note' },
        d: { id: 'd', status: 'published', kind: 'note' }
      }
    })
  });

  const out = await related
    .fn(post)
    .filter((p) => p.kind === 'note')
    .take(2)
    .toArray();

  assert.deepEqual(
    out.map((p) => p.id),
    ['a', 'c']
  );
});

test('related forwards the effective signal to storage.find (cancellable reads)', async () => {
  const findCalls = [];
  const controller = new AbortController();
  const post = makePost({
    relatedIds: ['a'],
    yamb: makeYamb({
      store: { a: { id: 'a', status: 'published' } },
      signal: controller.signal,
      findCalls
    })
  });

  await related.fn(post).toArray();
  assert.equal(findCalls.length, 1);
  assert.equal(findCalls[0].options?.signal, controller.signal, 'signal reaches storage.find');
});

test('related can be iterated with for-await directly', async () => {
  const post = makePost({
    relatedIds: ['a', 'b'],
    yamb: makeYamb({
      store: {
        a: { id: 'a', status: 'published' },
        b: { id: 'b', status: 'published' }
      }
    })
  });

  const ids = [];
  for await (const item of related.fn(post)) {
    ids.push(item.id);
  }

  assert.deepEqual(ids, ['a', 'b']);
});
