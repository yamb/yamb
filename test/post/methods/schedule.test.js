import assert from 'node:assert/strict';
import test from 'node:test';

import { setState, getState } from '../../../src/post/internal.js';
import schedule from '../../../src/post/methods/schedule.js';
import { setState as setYambState } from '../../../src/yamb/internal.js';

const NOW = Temporal.Instant.from('2026-04-26T12:00:00Z');

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
      remove: async (id, options) => calls.push({ kind: 'remove', id, options })
    },
    clock: () => NOW,
    slugger: (t) => t.toLowerCase()
  };

  setYambState(yamb, { byId: yamb.byId, byUri: yamb.byUri });

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

test('schedule accepts a future publishedAt and persists it', async () => {
  const { post, calls } = makePost();
  const future = NOW.add({ hours: 1 });

  await schedule.fn(post, future);

  assert.equal(getState(post).data.status, 'scheduled');
  assert.equal(getState(post).data.publishedAt.toString(), future.toString());
  assert.ok(
    calls.some((c) => c.kind === 'save'),
    'storage.save was not invoked'
  );
});

test('schedule rejects a past publishedAt with PostDateError', async () => {
  const { post, calls } = makePost();
  const past = NOW.subtract({ hours: 1 });

  await assert.rejects(() => schedule.fn(post, past), { code: 'YAMB_POST_DATE_INVALID' });

  assert.equal(getState(post).data.status, 'draft');
  assert.equal(calls.length, 0, 'storage.save must not run for a rejected schedule');
});

test('schedule rejects a publishedAt exactly equal to now with PostDateError', async () => {
  const { post } = makePost();

  await assert.rejects(() => schedule.fn(post, NOW), { code: 'YAMB_POST_DATE_INVALID' });
});
