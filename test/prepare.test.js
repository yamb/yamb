import assert from 'node:assert/strict';
import { test } from 'node:test';

import { prepare, transform } from '../src/transform.js';

test('preparation owns its source before awaiting a stage', async () => {
  const source = {
    title: 'First',
    text: 'Body',
    cover: { caption: 'Caption' },
    options: { a: [1] }
  };
  let resume;
  const wait = new Promise((resolve) => {
    resume = resolve;
  });
  const pending = prepare(source, [
    {
      name: 'wait',
      async transform(value) {
        assert.ok(Object.isFrozen(value.cover));
        await wait;
        return Object.freeze({ source: value, derived: { words: ['ready'] } });
      }
    }
  ]);
  source.title = 'Second';
  source.cover.caption = 'Edited';
  resume();
  const result = await pending;
  assert.equal(result.source.title, 'First');
  assert.equal(result.source.cover.caption, 'Caption');
  assert.ok(Object.isFrozen(result.derived.words));
  assert.throws(() => result.derived.words.push('edit'), TypeError);
  assert.ok(!Object.isFrozen(source));
});

test('preparation rejects live values and accessors without invoking them', async () => {
  let reads = 0;
  const accessor = {
    get text() {
      reads++;
      return 'text';
    }
  };
  for (const value of [accessor, { date: new Date() }, { fn() {} }, new Map(), new Proxy({}, {})]) {
    await assert.rejects(prepare(value, []), TypeError);
  }
  assert.equal(reads, 0);
});

test('preparation preserves cancellation reason and does not publish partial results', async () => {
  const controller = new AbortController();
  const reason = new Error('reader left');
  await assert.rejects(
    prepare(
      {},
      [
        {
          name: 'abort',
          transform() {
            controller.abort(reason);
            return { partial: true };
          }
        }
      ],
      { signal: controller.signal }
    ),
    (error) => error === reason
  );
});

test('the generic executor still accepts live JavaScript values', async () => {
  const value = new Map([['a', 1]]);
  assert.equal(await transform(value, [{ name: 'identity', transform: (input) => input }]), value);
});

test('preparation rejects source values that JSON cannot preserve', async () => {
  const cycle = {};
  cycle.self = cycle;
  const hidden = Object.defineProperty({}, 'hidden', { value: 1 });
  const extra = Object.assign([1], { extra: 2 });
  const leading = [1, 2];
  delete leading[0];
  const trailing = [1, 2];
  delete trailing[1];
  for (const bad of [
    cycle,
    hidden,
    { values: leading },
    { values: trailing },
    { values: extra },
    { value: NaN },
    { value: Infinity },
    { value: undefined }
  ]) {
    await assert.rejects(prepare(bad, []), TypeError);
  }
});

test('prepared results reject mutable live values and accessors without invoking them', async () => {
  let reads = 0;
  const getter = Object.freeze({
    get value() {
      reads++;
      return {};
    }
  });
  const cycle = {};
  cycle.self = cycle;
  for (const bad of [
    new Date(),
    new Map(),
    getter,
    new Proxy({}, {}),
    cycle,
    { value: Infinity },
    { fn() {} }
  ]) {
    await assert.rejects(
      prepare({}, [{ name: 'custom', transform: () => Object.freeze({ child: bad }) }]),
      TypeError
    );
  }
  assert.equal(reads, 0);
});
