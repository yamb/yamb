import assert from 'node:assert/strict';
import test from 'node:test';

import { z } from 'zod';

import { yamb } from '../../src/index.js';
import { blogWith, postData } from '../perf/fixture.js';

const rows = Array.from({ length: 12 }, (_, i) => ({
  ...postData(128, i),
  id: `post-${i}`,
  uri: `2026/11/baseline-${i}`,
  status: ['published', 'draft', 'scheduled', 'archived'][i % 4]
}));

test('all covers every status without a hidden page and published is explicit', async (t) => {
  const blog = await blogWith(rows);
  t.after(() => blog.close());
  const all = await Array.fromAsync(blog.all());
  assert.equal(all.length, 12);
  const published = await blog.published.toArray();
  assert.deepEqual(
    published.map((p) => p.id),
    ['post-0', 'post-4', 'post-8']
  );
  const page = await blog.all().offset(10).toArray();
  assert.equal(page.length, 2);
  const first = await blog.all().offset(10).first();
  assert.equal(first.id, 'post-10');
  assert.equal(await blog.all().offset(10).limit(1).count(), 12);
  assert.equal(await blog.all().offset(20).limit(0).count(), 12);
});

test('zero first does not request a record from storage', async (t) => {
  const blog = await blogWith(rows);
  t.after(() => blog.close());
  blog.storage.all = () => {
    throw new Error('record read is unavailable');
  };
  assert.equal(await blog.all().limit(0).first(), null);
});

test('collection traversals are independent and callbacks run only during consumption', async (t) => {
  const blog = await blogWith(rows);
  t.after(() => blog.close());
  const selection = blog.all();
  const a = selection[Symbol.asyncIterator]();
  const b = selection[Symbol.asyncIterator]();
  t.after(async () => {
    await a.return();
    await b.return();
  });
  const a0 = await a.next();
  assert.equal(a0.value.id, 'post-0');
  const a1 = await a.next();
  assert.equal(a1.value.id, 'post-1');
  const b0 = await b.next();
  assert.equal(b0.value.id, 'post-0');
  const seen = [];
  const titles = selection
    .filter((p) => {
      seen.push(p.id);
      return p.status === 'draft';
    })
    .map((p) => p.title)
    .take(1);
  assert.deepEqual(seen, []);
  assert.deepEqual(await titles.toArray(), ['Baseline 1']);
  assert.deepEqual(seen, ['post-0', 'post-1']);
});

test('composed selections can be manually advanced and returned with the native iterator protocol', async (t) => {
  const blog = await blogWith(rows);
  t.after(() => blog.close());
  const titles = blog.all().map((p) => p.title);
  assert.deepEqual(await titles.next(), { value: 'Baseline 0', done: false });
  await titles.return();
  assert.deepEqual(await titles.next(), { value: undefined, done: true });
});

test('partial option filters validate declared scalars without whole-Post constraints', async (t) => {
  const blog = await blogWith([], {
    options: z
      .strictObject({
        required: z.string(),
        homepage: z.boolean().nullable().default(false),
        category: z.string().optional(),
        score: z.number().optional(),
        nested: z.object({ x: z.number() }).optional(),
        'a.b': z.boolean().optional(),
        $where: z.boolean().optional()
      })
      .refine((value) => value.required === 'post-only')
  });
  t.after(() => blog.close());
  for (const options of [{ homepage: false }, { homepage: null }, { category: '' }, { score: 0 }]) {
    assert.equal(await blog.all({ options }).count(), 0);
  }
  for (const options of [
    { unknown: false },
    { homepage: 'false' },
    { nested: { x: 1 } },
    { 'a.b': true },
    { $where: true },
    { score: Infinity },
    { homepage: undefined }
  ]) {
    assert.throws(() => blog.all({ options }), { code: 'YAMB_QUERY_VALIDATION' });
  }
  assert.throws(() => yamb({ storage: { ...blog.storage, count: undefined } }), {
    code: 'YAMB_CONFIG_INVALID'
  });
});

test('a default cannot make a value-changing field usable in queries', async () => {
  await assert.rejects(
    () =>
      blogWith([], {
        options: z.strictObject({
          flag: z
            .boolean()
            .transform(() => undefined)
            .default(false)
        })
      }),
    { code: 'YAMB_CONFIG_INVALID' }
  );
});

test('query validation preserves optional/default refinements with an unavailable default source', async (t) => {
  let configured = false;
  const blog = await blogWith([], {
    options: z.strictObject({
      flag: z
        .boolean()
        .default(() => {
          if (configured) {
            throw new Error('default source unavailable');
          }
          return false;
        })
        .optional(),
      visible: z
        .boolean()
        .default(true)
        .optional()
        .refine((value) => value === true)
    })
  });
  t.after(() => blog.close());
  configured = true;
  assert.throws(() => blog.all({ options: { visible: false } }), { code: 'YAMB_QUERY_VALIDATION' });
  assert.equal(await blog.all({ options: { visible: true } }).count(), 0);
  assert.equal(await blog.all({ options: { flag: false } }).count(), 0);
  assert.deepEqual(blog.build({ title: 'Default' }).options, { flag: false, visible: true });
});
