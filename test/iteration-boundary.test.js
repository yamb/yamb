import assert from 'node:assert/strict';
import test from 'node:test';

import { AsyncIteratorHelper } from '../src/index.js';
import { blogWith } from './perf/fixture.js';

for (const mode of ['async next', 'sync next', 'rejected yield']) {
  for (const failedReturn of [false, true]) {
    test(`public helper and blog.render close ${mode}; failed return=${failedReturn}`, async (t) => {
      const primary = new Error(mode);
      const cleanup = new Error('cleanup');
      for (const throughBlog of [false, true]) {
        let closed = 0;
        const source = {
          [mode === 'async next' ? Symbol.asyncIterator : Symbol.iterator]() {
            return {
              next() {
                if (mode === 'async next') {
                  return Promise.reject(primary);
                }
                if (mode === 'sync next') {
                  throw primary;
                }
                return { value: Promise.reject(primary), done: false };
              },
              return() {
                closed++;
                if (failedReturn) {
                  throw cleanup;
                }
                return { done: true };
              }
            };
          }
        };
        let run;
        if (throughBlog) {
          const blog = await blogWith([], {
            renderers: {
              sample: {
                name: 'sample',
                version: '1',
                collection: ({ posts }) => Array.fromAsync(posts)
              }
            }
          });
          t.after(() => blog.close());
          run = () => blog.render('sample', { posts: source });
        } else {
          run = () => AsyncIteratorHelper.from(source).toArray();
        }
        await assert.rejects(run, (error) =>
          throughBlog ? error.cause === primary : error === primary
        );
        assert.equal(closed, 1);
      }
    });
  }
}

for (const async of [false, true]) {
  for (const mode of ['normal', 'early', 'abort', 'zero']) {
    test(`helper ${async ? 'async' : 'sync'} source cleanup on ${mode}`, async () => {
      const controller = new AbortController();
      const reason = new Error('stop');
      let started = 0;
      let pulled = 0;
      let closed = 0;
      function* values() {
        started++;
        try {
          for (let i = 0; i < 3; i++) {
            pulled++;
            yield i;
          }
        } finally {
          closed++;
        }
      }
      async function* asynchronous() {
        yield* values();
      }
      const source = async ? asynchronous() : values();
      const helper = AsyncIteratorHelper.from(source, { signal: controller.signal });
      if (mode === 'normal') {
        assert.deepEqual(await helper.toArray(), [0, 1, 2]);
      } else if (mode === 'early' || mode === 'zero') {
        assert.deepEqual(
          await helper.take(mode === 'zero' ? 0 : 1).toArray(),
          mode === 'zero' ? [] : [0]
        );
      } else {
        assert.deepEqual(await helper.next(), { value: 0, done: false });
        controller.abort(reason);
        await assert.rejects(
          () => helper.next(),
          (error) => error === reason
        );
      }
      assert.equal(started, mode === 'zero' ? 0 : 1);
      assert.equal(closed, mode === 'zero' ? 0 : 1);
      assert.equal(pulled, { normal: 3, zero: 0, early: 1, abort: 1 }[mode]);
    });
  }
}

test('public helper does not return an already exhausted async source', async () => {
  let next = 0;
  let closed = 0;
  const source = {
    [Symbol.asyncIterator]() {
      return this;
    },
    async next() {
      return next++ === 0 ? { value: 1, done: false } : { done: true };
    },
    async return() {
      closed++;
      throw new Error('already finished');
    }
  };
  assert.deepEqual(await AsyncIteratorHelper.from(source).toArray(), [1]);
  assert.equal(closed, 0);
});
