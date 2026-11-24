import assert from 'node:assert/strict';
import test from 'node:test';

import { setState, getState } from '../../../src/post/internal.js';
import archive from '../../../src/post/methods/archive.js';
import publish from '../../../src/post/methods/publish.js';
import remove from '../../../src/post/methods/remove.js';
import schedule from '../../../src/post/methods/schedule.js';
import { setState as setYambState } from '../../../src/yamb/internal.js';

function makePost(initialStatus = 'draft') {
  const calls = [];
  const post = {};

  const yamb = {
    timeZone: 'UTC',
    base: 'https://example.com',
    isOpen: true,
    byId: new Map(),
    byUri: new Map(),
    storage: {
      find: async () => null,
      fetch: async () => null,
      save: async (data, options) => {
        calls.push({ kind: 'save', data, options });

        return { id: 'test-id' };
      },
      remove: async (id, options) => calls.push({ kind: 'remove', id, options }),
      fence: async () => {}
    },
    clock: () => Temporal.Instant.from('2026-04-26T12:00:00Z'),
    slugger: (t) => t.toLowerCase()
  };

  setYambState(yamb, { byId: yamb.byId, byUri: yamb.byUri, walks: new Set() });

  setState(post, {
    yamb,
    data: {
      title: 'Hello',
      slug: 'hello',
      text: '...',
      status: initialStatus,
      tags: [],
      links: { related: [] },
      createdAt: Temporal.Instant.from('2026-04-01T00:00:00Z'),
      updatedAt: Temporal.Instant.from('2026-04-01T00:00:00Z'),
      publishedAt: Temporal.Instant.from('2026-04-01T00:00:00Z')
    },
    pristine: null,
    cache: {}
  });

  return { post, calls };
}

test('publish sets status to published and saves', async () => {
  const { post, calls } = makePost();
  await publish.fn(post);
  assert.equal(getState(post).data.status, 'published');
  assert.equal(calls[0].kind, 'save');
});

test('archive sets status to archived AND invokes storage.save', async () => {
  const { post, calls } = makePost('published');
  await archive.fn(post);
  assert.equal(getState(post).data.status, 'archived');
  const saveCall = calls.find((c) => c.kind === 'save');
  assert.ok(saveCall, 'storage.save was not invoked');
});

test('archive preserves publishedAt (does not clear/reset on transition)', async () => {
  const { post } = makePost('published');
  const before = getState(post).data.publishedAt;
  await archive.fn(post);
  assert.equal(getState(post).data.publishedAt.toString(), before.toString());
});

test('schedule sets status and publishedAt', async () => {
  const { post } = makePost();
  const future = Temporal.Instant.from('2026-12-01T00:00:00Z');
  await schedule.fn(post, future);
  assert.equal(getState(post).data.status, 'scheduled');
  assert.equal(getState(post).data.publishedAt.toString(), '2026-12-01T00:00:00Z');
});

test('schedule accepts ISO string via InstantSchema transform', async () => {
  const { post } = makePost();
  await schedule.fn(post, '2026-12-01T00:00:00Z');
  assert.equal(getState(post).data.status, 'scheduled');
  assert.equal(getState(post).data.publishedAt.toString(), '2026-12-01T00:00:00Z');
});

test('schedule rejects a clock that does not return an instant', async () => {
  const { post } = makePost();
  getState(post).yamb.clock = () => '2026-04-26T12:00:00Z';
  await assert.rejects(() => schedule.fn(post, '2026-12-01T00:00:00Z'), {
    code: 'YAMB_POST_DATE_INVALID'
  });
  assert.equal(getState(post).data.status, 'draft');
});

test('schedule rejects invalid instant input with PostDateError', async () => {
  const { post } = makePost();
  await assert.rejects(() => schedule.fn(post, 'not-a-valid-instant'), {
    code: 'YAMB_POST_DATE_INVALID'
  });
  await assert.rejects(() => schedule.fn(post, null), {
    code: 'YAMB_POST_DATE_INVALID'
  });
  await assert.rejects(() => schedule.fn(post, 12345), {
    code: 'YAMB_POST_DATE_INVALID'
  });
});

test('schedule invokes storage.save with the new state', async () => {
  const { post, calls } = makePost();
  const future = Temporal.Instant.from('2026-12-01T00:00:00Z');
  await schedule.fn(post, future);
  const saveCall = calls.find((c) => c.kind === 'save');
  assert.ok(saveCall, 'storage.save was not invoked');
});

test('remove calls storage.remove with id', async () => {
  const { post, calls } = makePost('published');
  const state = getState(post);

  state.pristine = {
    ...state.data,
    id: 'remove-test-id',
    uri: '2026/04/hello'
  };

  state.data.id = 'remove-test-id';
  state.data.uri = '2026/04/hello';
  state.yamb.byId.set('remove-test-id', '2026/04/hello');
  await remove.fn(post);
  assert.equal(calls[0].kind, 'remove');
  assert.equal(calls[0].id, 'remove-test-id');
});
