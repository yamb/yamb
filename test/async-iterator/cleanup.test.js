import assert from 'node:assert/strict';
import test from 'node:test';

import { AsyncIteratorHelper } from '../../src/async-iterator/index.js';

test('bare AsyncIterator source: early break calls source.return()', async () => {
  let returned = false;
  let i = 0;
  const bare = {
    async next() {
      return { value: ++i, done: false };
    },
    async return() {
      returned = true;

      return { value: undefined, done: true };
    }
  };

  const helper = AsyncIteratorHelper.from(bare);

  for await (const v of helper) {
    if (v === 2) {
      break;
    }
  }

  assert.equal(returned, true, 'source.return() must fire on early termination');
});

test('asyncDispose closes a source whose iteration already started', async () => {
  let returned = false;
  async function* gen() {
    try {
      yield 1;
      yield 2;
      yield 3;
    } finally {
      returned = true;
    }
  }

  const helper = AsyncIteratorHelper.from(gen());
  const it = helper[Symbol.asyncIterator]();
  await it.next();

  await helper[Symbol.asyncDispose]();

  assert.equal(returned, true, 'asyncDispose must close the running source iterator');
});

test('asyncDispose before iteration is a harmless no-op', async () => {
  let started = false;
  async function* gen() {
    started = true;
    yield 1;
  }

  const helper = AsyncIteratorHelper.from(gen());
  await helper[Symbol.asyncDispose]();

  assert.equal(started, false, 'source must not be started by dispose');
  assert.deepEqual(await helper.toArray(), []);
});

test('reduce drives the iterator by hand, so a throwing reducer must still close the source iterator', async () => {
  let returned = false;
  async function* gen() {
    try {
      yield 1;
      yield 2;
      yield 3;
    } finally {
      returned = true;
    }
  }

  const helper = AsyncIteratorHelper.from(gen());

  await assert.rejects(
    () =>
      helper.reduce(() => {
        throw new Error('boom');
      }, 0),
    { message: 'boom' }
  );

  assert.equal(returned, true, 'reduce must close the source iterator on a reducer throw');
});

function failingCursor(closeError, ...nextErrors) {
  return {
    async next() {
      if (nextErrors.length) {
        throw nextErrors[0];
      }
      return { value: 'post', done: false };
    },
    async return() {
      throw closeError;
    }
  };
}

test('ordinary return and asyncDispose report failure to close a composed cursor', async () => {
  for (const dispose of [false, true]) {
    const error = new Error('cursor close failed');
    const selection = AsyncIteratorHelper.from(failingCursor(error)).map((value) => value);
    assert.deepEqual(await selection.next(), { value: 'post', done: false });
    await assert.rejects(
      () => (dispose ? selection[Symbol.asyncDispose]() : selection.return()),
      (reason) => reason === error
    );
  }
});

test('break and take report cursor close failures', async () => {
  const error = new Error('cursor close failed');
  await assert.rejects(
    async () => {
      for await (const post of AsyncIteratorHelper.from(failingCursor(error)).filter(Boolean)) {
        assert.equal(post, 'post');
        break;
      }
    },
    (reason) => reason === error
  );
  await assert.rejects(
    () => AsyncIteratorHelper.from(failingCursor(error)).take(1).toArray(),
    (reason) => reason === error
  );
});

test('callback and iteration failures retain their original identity when closing also fails', async () => {
  const primary = new Error('primary failure');
  const closing = new Error('cursor close failed');
  await assert.rejects(
    () =>
      AsyncIteratorHelper.from(failingCursor(closing))
        .map(() => {
          throw primary;
        })
        .toArray(),
    (reason) => reason === primary
  );
  await assert.rejects(
    () =>
      AsyncIteratorHelper.from(failingCursor(closing)).reduce(() => {
        throw primary;
      }, ''),
    (reason) => reason === primary
  );
  await assert.rejects(
    () => AsyncIteratorHelper.from(failingCursor(closing, primary)).toArray(),
    (reason) => reason === primary
  );
});

test('undefined primary errors are preserved when closing also fails', async () => {
  const primary = undefined;
  const closing = new Error('cursor close failed');
  await assert.rejects(
    () => AsyncIteratorHelper.from(failingCursor(closing, undefined)).toArray(),
    (reason) => reason === undefined
  );
  await assert.rejects(
    () =>
      AsyncIteratorHelper.from(failingCursor(closing)).reduce(() => {
        throw primary;
      }, ''),
    (reason) => reason === undefined
  );
});

test('abort retains arbitrary native reason when cursor close also fails', async () => {
  for (const reason of [{ stop: 'post selection' }, 'cancelled', false, null, 0, undefined]) {
    const ac = new AbortController();
    const selection = AsyncIteratorHelper.from(failingCursor(new Error('cursor close failed')), {
      signal: ac.signal
    }).map((value) => value);
    await selection.next();
    ac.abort(reason);
    await assert.rejects(
      () => selection.next(),
      (error) => error === ac.signal.reason
    );
  }
});
