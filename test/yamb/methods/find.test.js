import assert from 'node:assert/strict';
import test from 'node:test';

import { setState } from '../../../src/yamb/internal.js';
import find from '../../../src/yamb/methods/find.js';

function makeYamb({ storageFind = async () => null } = {}) {
  const yamb = { isOpen: true };

  const storage = {
    find: storageFind
  };

  setState(yamb, {
    isOpen: true,
    storage,
    byId: new Map(),
    _hydrate: (raw) => ({ _hydrated: true, ...raw })
  });

  return yamb;
}

test('find(id) returns hydrated post when storage returns raw', async () => {
  const raw = { id: 'abc', uri: '2026/04/x', title: 'X', status: 'published' };

  const yamb = makeYamb({
    storageFind: async (id) => (id === 'abc' ? raw : null)
  });

  const result = await find.fn(yamb, 'abc');
  assert.deepEqual(result, { _hydrated: true, ...raw });
});

test('find(unknownId) returns null', async () => {
  const yamb = makeYamb({ storageFind: async () => null });
  const result = await find.fn(yamb, 'nonexistent');
  assert.equal(result, null);
});

test('find throws YambNotOpenError when not open', async () => {
  const yamb = makeYamb();
  yamb.isOpen = false;
  await assert.rejects(() => find.fn(yamb, 'any'), { code: 'YAMB_NOT_OPEN' });
});

test('find rejects NoSQL operator object as id', async () => {
  const yamb = makeYamb({
    storageFind: async () => {
      throw new Error('storage.find must not be reached');
    }
  });

  await assert.rejects(() => find.fn(yamb, { $ne: null }), {
    code: 'YAMB_QUERY_VALIDATION'
  });
});

test('find rejects null/undefined/non-string id', async () => {
  const yamb = makeYamb({
    storageFind: async () => {
      throw new Error('storage.find must not be reached');
    }
  });

  await assert.rejects(() => find.fn(yamb, null), { code: 'YAMB_QUERY_VALIDATION' });
  await assert.rejects(() => find.fn(yamb, undefined), { code: 'YAMB_QUERY_VALIDATION' });
  await assert.rejects(() => find.fn(yamb, 42), { code: 'YAMB_QUERY_VALIDATION' });
  await assert.rejects(() => find.fn(yamb, []), { code: 'YAMB_QUERY_VALIDATION' });
});

test('find rejects empty and oversized id strings', async () => {
  const yamb = makeYamb({
    storageFind: async () => {
      throw new Error('storage.find must not be reached');
    }
  });

  await assert.rejects(() => find.fn(yamb, ''), { code: 'YAMB_QUERY_VALIDATION' });
  await assert.rejects(() => find.fn(yamb, 'a'.repeat(65)), { code: 'YAMB_QUERY_VALIDATION' });
});

test('find accepts valid id strings up to 64 chars', async () => {
  const raw = { id: 'a'.repeat(64), uri: '2026/04/x', title: 'X', status: 'published' };

  const yamb = makeYamb({
    storageFind: async (id) => (id === 'a'.repeat(64) ? raw : null)
  });

  const result = await find.fn(yamb, 'a'.repeat(64));
  assert.deepEqual(result, { _hydrated: true, ...raw });
});
