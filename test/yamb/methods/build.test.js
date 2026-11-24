import assert from 'node:assert/strict';
import test from 'node:test';

import { yamb } from '../../../src/yamb/index.js';
import { getState } from '../../../src/yamb/internal.js';

function makeStorage() {
  const calls = [];

  return {
    open: async () => {},
    find: async () => null,
    fetch: async () => null,
    count: async () => 0,
    all: () => ({ async *[Symbol.asyncIterator]() {} }),
    save: async (data) => {
      calls.push(data);

      return { id: data.id ?? 'generated-id-1' };
    },
    remove: async () => {},
    fence: async () => {},
    sync: async () => {},
    close: async () => {},

    async *entries() {},

    _calls: calls
  };
}

test('build().save() with no mode and no id still inserts normally', async () => {
  const storage = makeStorage();
  const blog = yamb({ storage });
  await blog.open();

  const post = blog.build({ title: 'New post', text: 'body', status: 'draft' });

  await assert.doesNotReject(() => post.save());
  assert.equal(storage._calls.length, 1, 'storage.save must run for a normal insert');
  await blog.close();
});

test('build({ id }).save() with explicit mode:"update" still works', async () => {
  const storage = makeStorage();
  const blog = yamb({ storage });
  await blog.open();

  getState(blog).byId.set('existing-id', '2026/04/old-title');
  getState(blog).byUri.set('2026/04/old-title', 'existing-id');

  const post = blog.build({
    id: 'existing-id',
    title: 'Legit update',
    text: 'body',
    status: 'draft'
  });

  await assert.doesNotReject(() => post.save({ mode: 'update' }));
  assert.equal(storage._calls.length, 1, 'explicit update intent must be honored');
  assert.equal(storage._calls[0].id, 'existing-id');
  await blog.close();
});

test('build({ id }).save() with NO mode must NOT silently overwrite the existing post', async () => {
  const storage = makeStorage();
  const blog = yamb({ storage });
  await blog.open();

  getState(blog).byId.set('existing-id', '2026/04/old-title');
  getState(blog).byUri.set('2026/04/old-title', 'existing-id');

  const post = blog.build({
    id: 'existing-id',
    title: 'pwned',
    text: 'attacker body',
    status: 'draft'
  });

  await assert.rejects(() => post.save(), { code: 'YAMB_POST_VALIDATION' });
  assert.equal(storage._calls.length, 0, 'storage.save must not run for the unintended overwrite');
  await blog.close();
});

test('build() with a dangling links.related id is rejected at save()', async () => {
  const storage = makeStorage();
  const blog = yamb({ storage });
  await blog.open();

  const post = blog.build({
    title: 'Has a dangling ref',
    text: 'body',
    status: 'draft',
    links: { related: ['nonexistent-id'] }
  });

  await assert.rejects(() => post.save(), { code: 'YAMB_LINK_REF_NOT_FOUND' });
  assert.equal(
    storage._calls.length,
    0,
    'storage.save must not run when a related ref is dangling'
  );
  await blog.close();
});
