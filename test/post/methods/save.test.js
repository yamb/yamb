import assert from 'node:assert/strict';
import test from 'node:test';

import { setState } from '../../../src/post/internal.js';
import save from '../../../src/post/methods/save.js';
import { setState as setYambState } from '../../../src/yamb/internal.js';

function makeStorage() {
  const calls = [];

  return {
    open: async () => {},
    find: async () => null,
    fetch: async () => null,
    all: () => ({ async *[Symbol.asyncIterator]() {} }),
    save: async (data, options) => {
      calls.push({ data, options });

      return { id: 'generated-id-1' };
    },
    remove: async () => {},
    sync: async () => {},
    close: async () => {},
    _calls: calls
  };
}

function makePost({ data, pristine = null, storage }) {
  const post = {};
  const byId = new Map();
  const byUri = new Map();

  const yamb = {
    timeZone: 'UTC',
    base: 'https://example.com',
    isOpen: true,
    storage,
    byId,
    byUri,
    locate: (id) => byId.get(id),
    identify: (uri) => byUri.get(uri),
    clock: () => Temporal.Instant.from('2026-04-26T12:00:00Z'),
    slugger: (title) =>
      title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
  };

  setYambState(yamb, { byId, byUri });

  setState(post, {
    yamb,
    data: { ...data },
    pristine: pristine ? { ...pristine } : null,
    cache: {}
  });

  return post;
}

test('save is an insert when post has no id', async () => {
  const storage = makeStorage();

  const post = makePost({
    data: {
      title: 'Hello',
      text: '...',
      status: 'draft',
      tags: [],
      links: { related: [] }
    },
    storage
  });

  await save.fn(post);
  assert.equal(storage._calls.length, 1);
  assert.ok(storage._calls[0].data, 'raw data passed');
});

test('save is an update when post has id (pristine set)', async () => {
  const storage = makeStorage();

  const pristine = {
    id: 'abc-123',
    uri: '2026/04/hello',
    slug: 'hello',
    title: 'Old',
    text: '...',
    status: 'published',
    tags: [],
    links: { related: [] },
    createdAt: Temporal.Instant.from('2026-04-01T00:00:00Z'),
    updatedAt: Temporal.Instant.from('2026-04-01T00:00:00Z'),
    publishedAt: Temporal.Instant.from('2026-04-26T10:00:00Z')
  };

  const post = makePost({
    data: { ...pristine, title: 'New' },
    pristine,
    storage
  });

  await save.fn(post);
  assert.equal(storage._calls.length, 1);
});

test('save({ mode: insert }) rejects a post that already has an id', async () => {
  const storage = makeStorage();

  const post = makePost({
    data: {
      id: 'existing-id',
      title: 'X',
      text: '...',
      status: 'draft',
      tags: [],
      links: { related: [] }
    },
    storage
  });

  await assert.rejects(() => save.fn(post, { mode: 'insert' }), {
    code: 'YAMB_POST_VALIDATION'
  });
  assert.equal(storage._calls.length, 0, 'storage.save must not run for a rejected insert');
});

test('save({ mode: update }) rejects a post without an id', async () => {
  const storage = makeStorage();

  const post = makePost({
    data: { title: 'X', text: '...', status: 'draft', tags: [], links: { related: [] } },
    storage
  });

  await assert.rejects(() => save.fn(post, { mode: 'update' }), {
    code: 'YAMB_POST_VALIDATION'
  });
  assert.equal(storage._calls.length, 0);
});

test('save() with no mode rejects a non-pristine post that already has an id', async () => {
  const storage = makeStorage();

  const post = makePost({
    data: {
      id: 'existing-id',
      title: 'pwned',
      text: '...',
      status: 'draft',
      tags: [],
      links: { related: [] }
    },
    pristine: null,
    storage
  });

  await assert.rejects(() => save.fn(post), { code: 'YAMB_POST_VALIDATION' });
  assert.equal(
    storage._calls.length,
    0,
    'storage.save must not run for an unintended default-mode overwrite'
  );
});

test('save({ mode: update }) still updates a non-pristine post with an explicit id', async () => {
  const storage = makeStorage();

  const post = makePost({
    data: {
      id: 'existing-id',
      title: 'Legit update',
      text: '...',
      status: 'draft',
      tags: [],
      links: { related: [] }
    },
    pristine: null,
    storage
  });

  await save.fn(post, { mode: 'update' });
  assert.equal(storage._calls.length, 1, 'explicit update intent must be honored');
});

test('save rejects a links.related ref that resolves to no known post', async () => {
  const storage = makeStorage();

  const post = makePost({
    data: {
      title: 'X',
      text: '...',
      status: 'draft',
      tags: [],
      links: { related: ['nonexistent-id'] }
    },
    storage
  });

  await assert.rejects(() => save.fn(post), { code: 'YAMB_LINK_REF_NOT_FOUND' });
  assert.equal(storage._calls.length, 0, 'storage.save must not run for a dangling related ref');
});

test('save preserves a supplied related id before persisting', async () => {
  const storage = makeStorage();

  const post = makePost({
    data: {
      title: 'X',
      text: '...',
      status: 'draft',
      tags: [],
      links: { related: ['target-id'] }
    },
    storage
  });

  const { getState: gs } = await import('../../../src/post/internal.js');
  gs(post).yamb.byId.set('target-id', '2026/04/target');
  gs(post).yamb.byUri.set('2026/04/target', 'target-id');

  await save.fn(post);
  assert.deepEqual(storage._calls[0].data.links.related, ['target-id']);
});

test('save validates the whole object: invalid status is rejected before storage', async () => {
  const storage = makeStorage();

  const post = makePost({
    data: {
      title: 'X',
      text: '...',
      status: 'TOTALLY_INVALID',
      tags: [],
      links: { related: [] }
    },
    storage
  });

  await assert.rejects(() => save.fn(post), { code: 'YAMB_POST_VALIDATION' });
  assert.equal(storage._calls.length, 0, 'invalid post must not reach storage');
});

test('save rejects an unknown top-level field (strict object)', async () => {
  const storage = makeStorage();

  const post = makePost({
    data: {
      title: 'X',
      text: '...',
      status: 'draft',
      tags: [],
      links: { related: [] },
      bogus: 'nope'
    },
    storage
  });

  await assert.rejects(() => save.fn(post), { code: 'YAMB_POST_VALIDATION' });
  assert.equal(storage._calls.length, 0);
});

test('save throws YambNotOpenError if yamb not open', async () => {
  const storage = makeStorage();

  const post = makePost({
    data: {
      title: 'X',
      text: '...',
      status: 'draft',
      tags: [],
      links: { related: [] }
    },
    storage
  });

  const { getState: gs } = await import('../../../src/post/internal.js');
  const state = gs(post);
  state.yamb.isOpen = false;
  await assert.rejects(() => save.fn(post), { code: 'YAMB_NOT_OPEN' });
});

test('save preserves source fields on insert', async () => {
  const storage = makeStorage();

  const post = makePost({
    data: {
      title: 'X',
      text: 'body',
      preview: 'short',
      status: 'draft',
      tags: [],
      links: { related: [] },
      social: { title: 'st' }
    },
    storage
  });

  await save.fn(post);
  const sent = storage._calls[0].data;
  assert.equal(sent.title, 'X');
  assert.equal(sent.text, 'body');
  assert.equal(sent.preview, 'short');
  assert.equal(sent.social.title, 'st');
});

test('save on update preserves both edited and unchanged source', async () => {
  const storage = makeStorage();

  const pristine = {
    id: 'abc-xyz',
    uri: '2026/04/x',
    slug: 'x',
    title: 'OLD',
    text: 'body',
    status: 'published',
    tags: [],
    links: { related: [] },
    createdAt: Temporal.Instant.from('2026-04-01T00:00:00Z'),
    updatedAt: Temporal.Instant.from('2026-04-01T00:00:00Z'),
    publishedAt: Temporal.Instant.from('2026-04-01T00:00:00Z')
  };

  const post = makePost({
    data: { ...pristine, title: 'NEW' },
    pristine,
    storage
  });

  await save.fn(post);
  assert.equal(storage._calls[0].data.title, 'NEW');
  assert.equal(storage._calls[0].data.text, 'body');
});

test('save assigns id from storage result on first save', async () => {
  const storage = makeStorage();

  const post = makePost({
    data: {
      title: 'Hello',
      text: '...',
      status: 'published',
      tags: [],
      links: { related: [] }
    },
    storage
  });

  const { getState: gs } = await import('../../../src/post/internal.js');
  assert.equal(gs(post).data.id, undefined);
  await save.fn(post);
  assert.equal(gs(post).data.id, 'generated-id-1');
});

test('save id remains stable on second save', async () => {
  let callCount = 0;

  const storage = {
    find: async () => null,
    fetch: async () => null,
    save: async (_data) => {
      callCount++;

      return { id: callCount === 1 ? 'stable-id' : undefined };
    },
    remove: async () => {}
  };

  const post = makePost({
    data: {
      title: 'Hello',
      text: '...',
      status: 'published',
      tags: [],
      links: { related: [] }
    },
    storage
  });

  const { getState: gs } = await import('../../../src/post/internal.js');
  await save.fn(post);
  assert.equal(gs(post).data.id, 'stable-id');
  gs(post).data.title = 'Hello again';
  await save.fn(post);
  assert.equal(gs(post).data.id, 'stable-id', 'id must remain stable across saves');
});

test('save updates yamb.byId map', async () => {
  const storage = makeStorage();

  const post = makePost({
    data: {
      title: 'A',
      text: '...',
      status: 'published',
      tags: [],
      links: { related: [] }
    },
    storage
  });

  const { getState: gs } = await import('../../../src/post/internal.js');
  await save.fn(post);
  const state = gs(post);
  const { uri, id } = state.data;
  assert.equal(state.yamb.byId.get(id), uri);
});

test('rename: save updates byId to new uri; id stable', async () => {
  const storage = {
    find: async () => null,
    fetch: async () => null,
    save: async (data) => ({ id: data.id ?? 'rename-id' }),
    remove: async () => {}
  };

  const pristine = {
    id: 'rename-id',
    uri: '2026/04/original',
    slug: 'original',
    title: 'Original',
    text: '...',
    status: 'published',
    tags: [],
    links: { related: [] },
    createdAt: Temporal.Instant.from('2026-04-01T00:00:00Z'),
    updatedAt: Temporal.Instant.from('2026-04-01T00:00:00Z'),
    publishedAt: Temporal.Instant.from('2026-04-26T10:00:00Z')
  };

  const post = makePost({
    data: { ...pristine, slug: 'renamed' },
    pristine,
    storage
  });

  const { getState: gs } = await import('../../../src/post/internal.js');
  gs(post).yamb.byId.set('rename-id', '2026/04/original');

  await save.fn(post);

  const state = gs(post);
  assert.equal(state.data.id, 'rename-id', 'id stable');
  assert.equal(state.yamb.byId.get('rename-id'), state.data.uri, 'byId points to new uri');
});

test('save with a clock returning a Date publishes without crashing, publishedAt is a Temporal.Instant', async () => {
  const storage = makeStorage();

  const post = makePost({
    data: {
      title: 'Hello',
      text: '...',
      status: 'published',
      tags: [],
      links: { related: [] }
    },
    storage
  });

  const { getState: gs } = await import('../../../src/post/internal.js');
  gs(post).yamb.clock = () => new Date('2026-04-26T12:00:00.000Z');

  await save.fn(post);
  assert.equal(storage._calls.length, 1);
  assert.equal(gs(post).data.publishedAt.toString(), '2026-04-26T12:00:00Z');
  assert.equal(storage._calls[0].data.uri, '2026/04/hello');
});

test('remove deletes by id and clears byId entry', async () => {
  const removeCalls = [];

  const storage = {
    find: async () => null,
    fetch: async () => null,
    save: async () => ({ id: 'del-id' }),
    remove: async (id, opts) => removeCalls.push({ id, opts })
  };

  const pristine = {
    id: 'del-id',
    uri: '2026/04/bye',
    slug: 'bye',
    title: 'Bye',
    text: '...',
    status: 'published',
    tags: [],
    links: { related: [] },
    createdAt: Temporal.Instant.from('2026-04-01T00:00:00Z'),
    updatedAt: Temporal.Instant.from('2026-04-01T00:00:00Z'),
    publishedAt: Temporal.Instant.from('2026-04-26T10:00:00Z')
  };

  const post = makePost({ data: { ...pristine }, pristine, storage });
  const { getState: gs } = await import('../../../src/post/internal.js');
  gs(post).yamb.byId.set('del-id', '2026/04/bye');

  const { default: remove } = await import('../../../src/post/methods/remove.js');
  await remove.fn(post);

  assert.equal(removeCalls[0].id, 'del-id', 'storage.remove called with id');
  assert.equal(gs(post).yamb.byId.has('del-id'), false);
  assert.equal(gs(post).pristine, null);
});
