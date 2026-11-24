import assert from 'node:assert/strict';
import test from 'node:test';

import { yamb } from '../../../src/yamb/index.js';

function makeStorage() {
  return {
    open: async () => {},
    find: async () => null,
    fetch: async () => null,
    count: async () => 0,
    all: () => ({ async *[Symbol.asyncIterator]() {} }),
    save: async () => {},
    remove: async () => {},
    fence: async () => {},
    sync: async () => {},
    close: async () => {},

    async *entries() {}
  };
}

test('concurrent open() calls only run storage.open() once', async () => {
  let openCalls = 0;
  const storage = makeStorage();

  storage.open = async () => {
    openCalls += 1;
    await Promise.resolve();
  };

  const blog = yamb({ storage });

  await Promise.all([blog.open(), blog.open()]);

  assert.equal(openCalls, 1, 'storage.open() must run exactly once for concurrent open() calls');
  assert.equal(blog.isOpen, true);

  await blog.close();
});

test('concurrent open() calls only prepare renderers once', async () => {
  let prepareCalls = 0;
  const storage = makeStorage();

  storage.open = async () => {
    await Promise.resolve();
  };

  const renderer = {
    name: 'x',
    version: '0.1.0',
    collection: () => '',
    prepare: async () => {
      prepareCalls += 1;
    }
  };

  const blog = yamb({ storage, renderers: { x: renderer }, base: 'https://example.com' });

  await Promise.all([blog.open(), blog.open()]);

  assert.equal(
    prepareCalls,
    1,
    'renderer.prepare() must run exactly once for concurrent open() calls'
  );

  await blog.close();
});

test('concurrent open() calls all reject with the same failure when open fails', async () => {
  const storage = makeStorage();

  storage.open = async () => {
    await Promise.resolve();
    throw new Error('open boom');
  };

  const blog = yamb({ storage });

  const results = await Promise.allSettled([blog.open(), blog.open(), blog.open()]);

  assert.ok(
    results.every((r) => r.status === 'rejected' && r.reason.message === 'open boom'),
    'every concurrent caller must observe the same rejection'
  );
  assert.equal(blog.isOpen, false);
});

test('open() called after a completed open still fast-returns (no re-open)', async () => {
  let openCalls = 0;
  const storage = makeStorage();

  storage.open = async () => {
    openCalls += 1;
  };

  const blog = yamb({ storage });

  await blog.open();
  await blog.open();

  assert.equal(openCalls, 1);
  assert.equal(blog.isOpen, true);

  await blog.close();
});
