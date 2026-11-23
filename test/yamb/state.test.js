import assert from 'node:assert/strict';
import test from 'node:test';

import { yamb } from '../../src/index.js';
import { getState } from '../../src/yamb/internal.js';

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
