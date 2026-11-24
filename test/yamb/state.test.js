import assert from 'node:assert/strict';
import test from 'node:test';
import { setImmediate } from 'node:timers/promises';

import { yamb } from '../../src/index.js';
import { getState } from '../../src/yamb/internal.js';
import { record } from '../../src/yamb/lookups.js';

const fakeStorage = {
  open() {},

  close() {},

  find() {
    return null;
  },

  fetch() {
    return null;
  },

  save() {},

  count() {
    return 0;
  },
  all() {
    return { async *[Symbol.asyncIterator]() {} };
  },

  remove() {},
  fence() {},

  sync() {},

  async *entries() {}
};

test('yamb instance starts with an empty id index (locate/has report not-found)', () => {
  const blog = yamb({ storage: fakeStorage });
  assert.equal(blog.locate('anything'), undefined);
  assert.equal(blog.has('anything'), false);
});

test('yamb.close() clears the id index', async () => {
  const blog = yamb({ storage: fakeStorage });
  await blog.open();
  getState(blog).byId.set('1', 'a');
  getState(blog).byUri.set('a', '1');
  await blog.close();
  assert.equal(blog.locate('1'), undefined);
  assert.equal(blog.has('a'), false);
});

test('yamb.open() populates the id index from storage.entries', async () => {
  const entries = [
    ['id-1', '2026/04/a'],
    ['id-2', '2026/04/b']
  ];

  const storage = {
    ...fakeStorage,

    async open() {},

    async *entries() {
      for (const e of entries) {
        yield e;
      }
    }
  };

  const blog = yamb({ storage });
  await blog.open();
  assert.equal(blog.locate('id-1'), '2026/04/a');
  assert.equal(blog.locate('id-2'), '2026/04/b');
  await blog.close();
});

test('yamb.sync() rebuilds the id index after external storage changes', async () => {
  let entries = [['id-1', '2026/04/a']];

  const storage = {
    ...fakeStorage,

    async open() {},

    async sync() {},

    async *entries() {
      for (const e of entries) {
        yield e;
      }
    }
  };

  const blog = yamb({ storage });
  await blog.open();
  assert.equal(blog.locate('id-1'), '2026/04/a');
  assert.equal(blog.locate('id-2'), undefined);
  entries = [
    ['id-1', '2026/04/a'],
    ['id-2', '2026/04/b']
  ];

  await blog.sync();
  assert.equal(blog.locate('id-2'), '2026/04/b');
  await blog.close();
});

test('yamb keeps byId/byUri maps private', () => {
  const blog = yamb({ storage: fakeStorage });
  assert.equal(blog.byId, undefined);
  assert.equal(blog.byUri, undefined);
});

function gatedStorage() {
  const rows = new Map([['id-1', '2026/04/a']]);
  const gate = { current: null };

  const storage = {
    ...fakeStorage,

    async *entries() {
      for (const pair of rows) {
        yield pair;
        await gate.current?.promise;
      }
    }
  };

  return { storage, rows, gate };
}

test('yamb.sync() keeps lookup writes made during its walk', async () => {
  const { storage, gate } = gatedStorage();
  const blog = yamb({ storage });
  await blog.open();

  gate.current = Promise.withResolvers();
  const syncing = blog.sync();
  await setImmediate();

  record(getState(blog), 'id-1', '2026/04/renamed');
  record(getState(blog), 'id-2', '2026/04/b');
  gate.current.resolve();
  await syncing;

  assert.equal(blog.locate('id-1'), '2026/04/renamed');
  assert.equal(blog.has('2026/04/a'), false);
  assert.equal(blog.locate('id-2'), '2026/04/b');
  await blog.close();
});

test('yamb.sync() finishing after close leaves no stale lookups for the next open', async () => {
  const { storage, rows, gate } = gatedStorage();
  const blog = yamb({ storage });
  await blog.open();

  gate.current = Promise.withResolvers();
  const syncing = blog.sync();
  await setImmediate();

  await blog.close();
  rows.delete('id-1');
  gate.current.resolve();
  await syncing;

  assert.equal(blog.locate('id-1'), undefined);
  gate.current = null;
  await blog.open();
  assert.equal(blog.locate('id-1'), undefined);
  assert.equal(blog.has('2026/04/a'), false);
  await blog.close();
});

test('yamb.open() during a failing close reopens instead of rejecting', async () => {
  let fail = true;
  const storage = {
    ...fakeStorage,
    async close() {
      if (fail) {
        fail = false;
        throw new Error('close failed');
      }
    }
  };
  const blog = yamb({ storage });
  await blog.open();

  const closing = blog.close();
  const opening = blog.open();

  await assert.rejects(closing, /close failed/);
  assert.equal(await opening, blog);
  assert.equal(blog.isOpen, true);
  await blog.close();
});
