import assert from 'node:assert/strict';
import { getEventListeners } from 'node:events';
import test from 'node:test';
import { setImmediate } from 'node:timers/promises';

import { z } from 'zod';

import { yamb } from '../src/index.js';
import { blogWith, storageWith } from './perf/fixture.js';

test('asynchronous diagnostics preserve a failed save and allow cleanup', async () => {
  const failure = new Error('write failed');
  const storage = storageWith();
  storage.save = () => {
    throw failure;
  };

  const blog = yamb({
    storage,
    async onError() {
      throw new Error('diagnostic failed');
    }
  });

  await blog.open();
  await assert.rejects(blog.create({ title: 'Failure' }), (error) => error === failure);
  await setImmediate();
  await blog.close();

  assert.equal(blog.isOpen, false);
});

test('close waits for an earlier open and concurrent closes release resources once', async () => {
  const entered = Promise.withResolvers();
  const release = Promise.withResolvers();
  let held = false;
  let closes = 0;
  const storage = storageWith();
  storage.open = async () => {
    held = true;
    entered.resolve();
    await release.promise;
  };
  storage.close = () => {
    held = false;
    closes++;
  };

  const blog = yamb({ storage });
  const opening = blog.open();
  await entered.promise;

  const closing = blog.close();
  const second = blog.close();

  release.resolve();
  await Promise.all([opening, closing, second]);

  assert.equal(held, false);
  assert.equal(blog.isOpen, false);
  assert.equal(closes, 1);
});

test('open called during close reacquires resources after cleanup', async () => {
  const storage = storageWith();
  const blog = yamb({ storage });
  await blog.open();

  const entered = Promise.withResolvers();
  const release = Promise.withResolvers();
  let held = true;
  storage.close = async () => {
    entered.resolve();
    await release.promise;
    held = false;
  };
  storage.open = () => {
    held = true;
  };

  const closing = blog.close();
  await entered.promise;
  const opening = blog.open();

  release.resolve();
  await Promise.all([closing, opening]);

  assert.equal(blog.isOpen, true);
  assert.equal(held, true);
  await blog.close();
});

for (const phase of ['open', 'index', 'prepare']) {
  test(`open cancellation after ${phase} rolls back before confirmation`, async () => {
    const ctrl = new AbortController();
    const reason = new Error('cancel open');
    const storage = storageWith();
    let held = false;
    let prepared = false;

    storage.open = () => {
      held = true;

      if (phase === 'open') {
        ctrl.abort(reason);
      }
    };
    storage.close = ({ signal } = {}) => {
      signal?.throwIfAborted();
      held = false;
    };
    storage.entries = () => {
      if (phase === 'index') {
        ctrl.abort(reason);
      }

      return [];
    };

    const renderer = {
      name: 'resource',
      version: '1',
      post() {},
      prepare() {
        prepared = true;

        if (phase === 'prepare') {
          ctrl.abort(reason);
        }
      },
      dispose({ signal } = {}) {
        signal?.throwIfAborted();
        prepared = false;
      }
    };

    const blog = yamb({ storage, signal: ctrl.signal, renderers: { resource: renderer } });
    await assert.rejects(blog.open(), (error) => error === reason);

    assert.equal(blog.isOpen, false);
    assert.equal(held, false);
    assert.equal(prepared, false);
  });
}

test('failed partial preparation is disposed without replacing its error', async () => {
  const failure = new Error('prepare failed');
  let held = false;
  let closed = false;
  const storage = storageWith();
  storage.close = () => {
    closed = true;
    throw new Error('close failed');
  };

  const renderer = {
    name: 'partial',
    version: '1',
    post() {},
    prepare() {
      held = true;
      throw failure;
    },
    dispose() {
      held = false;
      throw new Error('dispose failed');
    }
  };

  const blog = yamb({
    storage,
    renderers: { partial: renderer },
    async onError() {
      throw new Error('diagnostic failed');
    }
  });
  await assert.rejects(blog.open(), (error) => error === failure);
  await setImmediate();

  assert.equal(held, false);
  assert.equal(closed, true);
});

for (const method of ['save', 'remove']) {
  test(`queued ${method} cancellation settles before the active write`, async (t) => {
    const blog = await blogWith();
    t.after(() => blog.close());
    const post = await blog.create({ title: 'Initial' });
    const entered = Promise.withResolvers();
    const release = Promise.withResolvers();
    const save = blog.storage.save.bind(blog.storage);
    let writes = 0;

    blog.storage.save = async (...args) => {
      writes++;

      if (writes === 1) {
        entered.resolve();
        await release.promise;
      }

      return save(...args);
    };

    post.title = 'Active';
    const active = post.save();
    await entered.promise;

    const ctrl = new AbortController();
    const reason = new Error('cancel waiting');
    ctrl.signal.addEventListener('abort', (event) => event.stopImmediatePropagation(), {
      once: true
    });

    post.title = 'Cancelled';
    let error;
    const waiting = (async () => {
      try {
        await post[method]({ signal: ctrl.signal });
      } catch (cause) {
        error = cause;
      }
    })();
    post.title = 'Following';
    const following = post.save();

    ctrl.abort(reason);
    await setImmediate();

    try {
      assert.equal(error, reason);
      assert.equal(writes, 1);
      assert.equal(getEventListeners(ctrl.signal, 'abort').length, 0);
    } finally {
      release.resolve();
      await Promise.all([active, waiting, following]);
    }

    const stored = await blog.find(post.id);

    assert.equal(stored.title, 'Following');
    assert.equal(writes, 2);
  });
}

test('forbidden option names cannot disappear during query parsing', async (t) => {
  const blog = await blogWith();
  t.after(() => blog.close());
  const options = JSON.parse('{"__proto__":true}');
  assert.throws(() => blog.all({ options }), { code: 'YAMB_QUERY_VALIDATION' });
});

test('stored posts reject corrupt domain fields and missing required fields', async (t) => {
  const blog = await blogWith();
  t.after(() => blog.close());
  const post = await blog.create({ title: 'Stored' });
  const find = blog.storage.find.bind(blog.storage);
  const raw = await find(post.id);

  for (const change of [
    { status: 'unknown' },
    { tags: 'tag' },
    { text: 42 },
    { links: { related: 'id' } },
    { links: {} },
    { title: undefined },
    { id: undefined }
  ]) {
    blog.storage.find = () => ({ ...raw, ...change });
    await assert.rejects(blog.find(post.id), { code: 'YAMB_STORAGE_READ' });
  }

  blog.storage.find = find;
  const stored = await blog.find(post.id);

  assert.equal(stored.title, 'Stored');
  assert.equal(blog.build({}).title, undefined);
});

test('deep finite options fail at their owning boundary without a raw stack error', async (t) => {
  const blog = await blogWith([], { options: z.strictObject({ value: z.json().optional() }) });
  t.after(() => blog.close());
  let value = null;

  for (let n = 0; n < 8192; n++) {
    value = { next: value };
  }

  assert.throws(() => blog.build({ title: 'Deep', options: { value } }), {
    code: 'YAMB_POST_VALIDATION'
  });

  const post = await blog.create({ title: 'Shallow', options: { value: { leaf: 1 } } });
  assert.throws(
    () => {
      post.options.value = value;
    },
    { code: 'YAMB_POST_VALIDATION' }
  );
  assert.deepEqual(post.options.value, { leaf: 1 });

  const find = blog.storage.find.bind(blog.storage);
  const raw = await find(post.id);
  blog.storage.find = () => ({ ...raw, options: { value } });

  await assert.rejects(blog.find(post.id), { code: 'YAMB_STORAGE_READ' });

  blog.storage.find = find;
  const stored = await blog.find(post.id);

  assert.equal(stored.title, 'Shallow');
  assert.throws(() => blog.build({ title: 'Deep tag', tags: value }), {
    code: 'YAMB_POST_VALIDATION'
  });
});
