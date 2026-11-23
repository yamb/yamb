import assert from 'node:assert/strict';
import test from 'node:test';

import { AsyncIteratorHelper } from '../../src/async-iterator/index.js';

async function* twiceAsync(v) {
  yield v;
  yield v * 10;
}

const helper = (source, options) => AsyncIteratorHelper.from(source, options);
const range5 = () => helper([1, 2, 3, 4, 5]);
const empty = () => helper([]);

test(`map transforms each value with sync fn`, async () => {
  const out = await helper([1, 2, 3])
    .map((v) => v * 2)
    .toArray();
  assert.deepEqual(out, [2, 4, 6]);
});

test(`map awaits async mapper`, async () => {
  const out = await helper([1, 2, 3])
    .map(async (v) => v + 1)
    .toArray();
  assert.deepEqual(out, [2, 3, 4]);
});

test(`map provides 0-based index`, async () => {
  const out = await helper(['a', 'b', 'c'])
    .map((v, i) => `${i}:${v}`)
    .toArray();
  assert.deepEqual(out, ['0:a', '1:b', '2:c']);
});

test(`filter keeps values where predicate is truthy`, async () => {
  const out = await range5()
    .filter((v) => v % 2 === 0)
    .toArray();
  assert.deepEqual(out, [2, 4]);
});

test(`filter awaits async predicate`, async () => {
  const out = await range5()
    .filter(async (v) => v > 2)
    .toArray();
  assert.deepEqual(out, [3, 4, 5]);
});

test(`take(n) yields first n values`, async () => {
  const out = await range5().take(2).toArray();
  assert.deepEqual(out, [1, 2]);
});

test(`take(0) yields nothing`, async () => {
  const out = await range5().take(0).toArray();
  assert.deepEqual(out, []);
});

test(`take(n > length) yields everything`, async () => {
  const out = await range5().take(99).toArray();
  assert.deepEqual(out, [1, 2, 3, 4, 5]);
});

test(`take rejects negative n with RangeError`, () => {
  assert.throws(() => range5().take(-1), RangeError);
});

test(`drop(n) skips first n values`, async () => {
  const out = await range5().drop(2).toArray();
  assert.deepEqual(out, [3, 4, 5]);
});

test(`drop(n > length) yields empty`, async () => {
  const out = await range5().drop(99).toArray();
  assert.deepEqual(out, []);
});

test(`flatMap flattens sync iterables`, async () => {
  const out = await helper([1, 2, 3])
    .flatMap((v) => [v, v * 10])
    .toArray();
  assert.deepEqual(out, [1, 10, 2, 20, 3, 30]);
});

test(`flatMap flattens async iterables`, async () => {
  const out = await helper([1, 2])
    .flatMap((v) => twiceAsync(v))
    .toArray();
  assert.deepEqual(out, [1, 10, 2, 20]);
});

test(`flatMap throws TypeError on non-iterable result`, async () => {
  await assert.rejects(
    () =>
      helper([1])
        .flatMap(() => 42)
        .toArray(),
    TypeError
  );
});

test(`toArray collects all values`, async () => {
  assert.deepEqual(await range5().toArray(), [1, 2, 3, 4, 5]);
});

test(`toArray on empty returns []`, async () => {
  assert.deepEqual(await empty().toArray(), []);
});

test(`forEach invokes callback for each value with index`, async () => {
  const seen = [];
  await range5().forEach((v, i) => {
    seen.push([v, i]);
  });
  assert.deepEqual(seen, [
    [1, 0],
    [2, 1],
    [3, 2],
    [4, 3],
    [5, 4]
  ]);
});

test(`forEach awaits async callback`, async () => {
  let total = 0;
  await helper([1, 2, 3]).forEach(async (v) => {
    total += v;
  });
  assert.equal(total, 6);
});

test(`reduce with initial accumulates`, async () => {
  const sum = await range5().reduce((acc, v) => acc + v, 0);
  assert.equal(sum, 15);
});

test(`reduce without initial uses first value as seed`, async () => {
  const sum = await range5().reduce((acc, v) => acc + v);
  assert.equal(sum, 15);
});

test(`reduce on empty without initial throws TypeError`, async () => {
  await assert.rejects(() => empty().reduce((a, b) => a + b), TypeError);
});

test(`reduce on empty with initial returns initial`, async () => {
  assert.equal(await empty().reduce((a, b) => a + b, 7), 7);
});

test(`some returns true on first match`, async () => {
  assert.equal(await range5().some((v) => v === 3), true);
});

test(`some returns false when no match`, async () => {
  assert.equal(await range5().some((v) => v > 99), false);
});

test(`every returns false on first miss`, async () => {
  assert.equal(await range5().every((v) => v < 3), false);
});

test(`every returns true on empty`, async () => {
  assert.equal(await empty().every(() => false), true);
});

test(`find returns first matching value`, async () => {
  assert.equal(await range5().find((v) => v > 2), 3);
});

test(`find returns undefined when no match`, async () => {
  assert.equal(await range5().find((v) => v > 99), undefined);
});

test(`chain: filter → map → take → toArray`, async () => {
  const out = await range5()
    .filter((v) => v % 2 === 1)
    .map((v) => v * v)
    .take(2)
    .toArray();
  assert.deepEqual(out, [1, 9]);
});

test(`exhausted iterator stays exhausted`, async () => {
  const h = range5();
  await h.toArray();
  assert.deepEqual(await h.toArray(), []);
});

test(`pre-aborted signal throws AbortError immediately`, async () => {
  const ac = new AbortController();
  ac.abort();
  const h = helper([1, 2, 3], { signal: ac.signal });
  await assert.rejects(() => h.toArray(), { name: 'AbortError' });
});

test(`signal aborted mid-iteration stops further pulls`, async () => {
  const ac = new AbortController();
  async function* slow() {
    yield 1;
    yield 2;
    ac.abort();
    yield 3;
  }

  const h = helper(slow(), { signal: ac.signal });
  const seen = [];
  await assert.rejects(async () => {
    for await (const v of h) {
      seen.push(v);
    }
  });
  assert.deepEqual(seen, [1, 2]);
});
