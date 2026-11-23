import assert from 'node:assert/strict';
import test from 'node:test';

import { PostCollection } from '../../src/post-collection/index.js';

function makeYamb({ signal, captured } = {}) {
  return {
    signal,
    storage: {
      all(_query, options) {
        return {
          async *[Symbol.asyncIterator]() {
            captured.signal = options.signal;
            yield { id: '1', uri: '2026/04/x', status: 'published' };
          }
        };
      }
    },
    _hydrate: (raw) => raw
  };
}

test('PostCollection iterator forwards options.signal to storage.all', async () => {
  const captured = {};
  const ac = new AbortController();
  const yamb = makeYamb({ captured });
  const coll = new PostCollection(yamb, {}, { signal: ac.signal });

  for await (const _ of coll) {
    break;
  }

  assert.equal(captured.signal, ac.signal);
});

test('PostCollection iterator forwards yamb.signal (global) to storage.all', async () => {
  const captured = {};
  const ac = new AbortController();
  const yamb = makeYamb({ signal: ac.signal, captured });
  const coll = new PostCollection(yamb, {}, {});

  for await (const _ of coll) {
    break;
  }

  assert.equal(captured.signal, ac.signal);
});

test('PostCollection iterator combines yamb.signal + options.signal via AbortSignal.any', async () => {
  const captured = {};
  const yambSignal = new AbortController().signal;
  const optsSignal = new AbortController().signal;
  const yamb = makeYamb({ signal: yambSignal, captured });
  const coll = new PostCollection(yamb, {}, { signal: optsSignal });

  for await (const _ of coll) {
    break;
  }

  assert.ok(captured.signal instanceof AbortSignal);
  assert.notEqual(captured.signal, yambSignal);
  assert.notEqual(captured.signal, optsSignal);
});

test('PostCollection iterator passes undefined when neither signal is set', async () => {
  const captured = {};
  const yamb = makeYamb({ captured });
  const coll = new PostCollection(yamb, {}, {});

  for await (const _ of coll) {
    break;
  }

  assert.equal(captured.signal, undefined);
});

function makeInertStorage(items) {
  return {
    all(_query, _options) {
      return {
        async *[Symbol.asyncIterator]() {
          for (const item of items) {
            yield item;
          }
        }
      };
    }
  };
}

test('PostCollection direct iteration throws AbortError when signal aborts mid-iteration, even if storage ignores signal', async () => {
  const items = [
    { id: '1', uri: '2026/04/a', status: 'published' },
    { id: '2', uri: '2026/04/b', status: 'published' },
    { id: '3', uri: '2026/04/c', status: 'published' }
  ];

  const ac = new AbortController();

  const yamb = {
    signal: undefined,
    storage: makeInertStorage(items),
    _hydrate: (raw) => raw
  };

  const coll = new PostCollection(yamb, {}, { signal: ac.signal });

  await assert.rejects(
    async () => {
      let count = 0;

      for await (const _ of coll) {
        count++;

        if (count === 1) {
          ac.abort();
        }
      }
    },
    (err) => err.name === 'AbortError'
  );
});
