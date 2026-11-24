import assert from 'node:assert/strict';
import test from 'node:test';

import { yamb } from '../../src/index.js';
import { getState } from '../../src/yamb/internal.js';

function stream(list) {
  return {
    async *[Symbol.asyncIterator]() {
      for (const e of list) {
        yield e;
      }
    }
  };
}

test('close() releases storage even when the global signal is already aborted', async () => {
  const ac = new AbortController();
  const storage = {
    closed: false,
    open() {},
    close({ signal } = {}) {
      signal?.throwIfAborted();
      this.closed = true;
    },
    entries() {
      return stream([]);
    },
    find() {},
    fetch() {},
    count() {
      return 0;
    },
    all() {},
    save() {},
    remove() {},
    fence() {},
    sync() {}
  };

  const blog = yamb({ storage, signal: ac.signal });
  await blog.open();
  ac.abort();

  await assert.doesNotReject(() => blog.close());
  assert.equal(blog.isOpen, false, 'blog must end up closed');
  assert.equal(storage.closed, true, 'storage handle must be released');
});

test('open() rolls back storage when storage.open() throws', async () => {
  let closeCalls = 0;
  const storage = {
    open() {
      throw new Error('open boom');
    },
    close() {
      closeCalls += 1;
    },
    entries() {
      return stream([]);
    },
    find() {},
    fetch() {},
    count() {
      return 0;
    },
    all() {},
    save() {},
    remove() {},
    fence() {},
    sync() {}
  };

  const blog = yamb({ storage });
  await assert.rejects(() => blog.open(), { message: 'open boom' });
  assert.equal(blog.isOpen, false);
  assert.equal(closeCalls, 1, 'core must reclaim the half-acquired adapter via storage.close()');
});

test('sync() leaves the index intact when the rebuild walk fails (rebuilds into temp maps, swaps only on full success)', async () => {
  let phase = 'open';
  const storage = {
    open() {},
    close() {},
    sync() {},
    entries() {
      if (phase === 'open') {
        return stream([
          ['a', '2026/04/a'],
          ['b', '2026/04/b']
        ]);
      }

      return {
        async *[Symbol.asyncIterator]() {
          yield ['c', '2026/04/c'];
          throw new Error('walk boom');
        }
      };
    },
    find() {},
    fetch() {},
    count() {
      return 0;
    },
    all() {},
    save() {},
    remove() {},
    fence() {}
  };

  const blog = yamb({ storage });
  await blog.open();
  assert.deepEqual([...getState(blog).byId.keys()].toSorted(), ['a', 'b']);

  phase = 'sync';
  await assert.rejects(() => blog.sync(), { message: 'walk boom' });

  assert.deepEqual(
    [...getState(blog).byId.keys()].toSorted(),
    ['a', 'b'],
    'live index must survive a failed sync'
  );
  assert.equal(
    blog.identify('2026/04/c'),
    undefined,
    'partial rebuild must not leak into the live index'
  );
});

test('close() completes even when both a renderer dispose() and the onError hook itself throw', async () => {
  let storageClosed = false;
  const storage = {
    open() {},
    close() {
      storageClosed = true;
    },
    entries() {
      return stream([]);
    },
    find() {},
    fetch() {},
    count() {
      return 0;
    },
    all() {},
    save() {},
    remove() {},
    fence() {},
    sync() {}
  };
  const renderer = {
    name: 'x',
    version: '1',
    post() {},
    dispose() {
      throw new Error('dispose boom');
    }
  };
  const blog = yamb({
    storage,
    renderers: { x: renderer },
    onError: () => {
      throw new Error('logger boom');
    }
  });
  await blog.open();

  await assert.doesNotReject(() => blog.close());
  assert.equal(blog.isOpen, false, 'blog must end up closed');
  assert.equal(storageClosed, true, 'storage must be released despite the throwing hook');
});

test('onError receives op context on a save failure and the original error rethrows', async () => {
  const calls = [];
  const storage = {
    open() {},
    close() {},
    entries() {
      return stream([]);
    },
    fetch: async () => null,
    count: async () => 0,
    find() {},
    all() {},
    remove() {},
    fence() {},
    sync() {},
    save() {
      throw new Error('write boom');
    }
  };
  const blog = yamb({
    storage,
    base: 'https://e.com',
    timeZone: 'UTC',
    clock: () => Temporal.Instant.from('2026-04-01T00:00:00Z'),
    onError: (err, ctx) => calls.push(ctx)
  });
  await blog.open();

  const post = blog.build({
    title: 'X',
    text: '.',
    status: 'published',
    publishedAt: Temporal.Instant.from('2026-04-01T00:00:00Z')
  });

  await assert.rejects(() => post.save(), { message: 'write boom' });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].op, 'save');
});
