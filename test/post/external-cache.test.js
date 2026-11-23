import assert from 'node:assert/strict';
import test from 'node:test';

import { z } from 'zod';

import { blogWith } from '../perf/fixture.js';

async function setup(t, config = {}) {
  const blog = await blogWith([], {
    options: z.strictObject({ page: z.json().optional() }),
    ...config
  });
  t.after(() => blog.close());
  return blog;
}

function exported(post, cache) {
  const key = post.hash();
  if (!cache.has(key)) {
    cache.set(key, post.toJSON());
  }
  return cache.get(key);
}

function gateSave(storage) {
  const entered = Promise.withResolvers();
  const release = Promise.withResolvers();
  const save = storage.save.bind(storage);
  storage.save = async (...args) => {
    storage.save = save;
    entered.resolve();
    await release.promise;
    return save(...args);
  };
  return { entered: entered.promise, release };
}

test('an unchanged Post reuses the application export after ordinary reads', async (t) => {
  const blog = await setup(t);
  const post = await blog.create({ title: 'Guide', text: '**Source**', tags: ['node'] });
  const cache = new Map();
  const first = exported(post, cache);
  assert.equal(post.title, 'Guide');
  assert.equal(post.text, '**Source**');
  assert.deepEqual([...post.tags], ['node']);
  assert.deepEqual(post.changes(), {});
  assert.strictEqual(exported(post, cache), first);
  assert.equal(first.text, '**Source**');
});

test('object insertion order and equivalent ISO dates reuse one export', async (t) => {
  const blog = await setup(t);
  const first = blog.build({
    title: 'Guide',
    slug: 'guide',
    status: 'published',
    publishedAt: '2026-11-10T09:00:00Z',
    meta: { title: 'Search', description: 'Intro' },
    options: { page: { z: [1, { b: true, a: null }], a: 'one' } }
  });
  const second = blog.build({
    options: { page: { a: 'one', z: [1, { a: null, b: true }] } },
    meta: { description: 'Intro', title: 'Search' },
    publishedAt: '2026-11-10T12:00:00.000000000+03:00',
    status: 'published',
    slug: 'guide',
    title: 'Guide'
  });
  const cache = new Map();
  const result = exported(first, cache);
  assert.strictEqual(exported(second, cache), result);
  assert.equal(result.uri, '2026/11/guide');
  assert.equal(result.publishedAt, '2026-11-10T09:00:00Z');
});

test('nested edits, array reorder and their reverts select the appropriate exports', async (t) => {
  const blog = await setup(t);
  const post = blog.build({
    title: 'Guide',
    tags: ['node', 'javascript'],
    meta: { keywords: ['native', 'runtime'] },
    options: { page: { sections: [{ title: 'Intro' }, { title: 'API' }] } }
  });
  const cache = new Map();
  const original = exported(post, cache);
  post.options.page.sections[0].title = 'Start';
  const edited = exported(post, cache);
  assert.notStrictEqual(edited, original);
  assert.equal(edited.options.page.sections[0].title, 'Start');
  post.options.page.sections[0].title = 'Intro';
  assert.strictEqual(exported(post, cache), original);
  post.options.page.sections.reverse();
  assert.deepEqual(exported(post, cache).options.page.sections, [
    { title: 'API' },
    { title: 'Intro' }
  ]);
  post.options.page.sections.reverse();
  assert.strictEqual(exported(post, cache), original);
  post.tags.reverse();
  assert.deepEqual(exported(post, cache).tags, ['javascript', 'node']);
  post.tags.reverse();
  post.meta.keywords.push('cache');
  assert.deepEqual(exported(post, cache).meta.keywords, ['native', 'runtime', 'cache']);
  post.meta.keywords.pop();
  assert.strictEqual(exported(post, cache), original);
});

test('export cache distinguishes JSON values and escaped text without ambiguous concatenation', async (t) => {
  const blog = await setup(t);
  const post = blog.build({ title: 'Guide', options: { page: null } });
  const cache = new Map();
  const results = [null, false, 0, '', '0', 'false', '"},"a":1', ['a,b'], ['a', 'b']].map(
    (page) => {
      post.options.page = page;
      const result = exported(post, cache);
      assert.deepEqual(result.options.page, page);
      return result;
    }
  );
  assert.equal(new Set(results).size, results.length);
  post.options.page = null;
  assert.strictEqual(exported(post, cache), results[0]);
});

test('invalid unfinished builds cannot reuse a valid export through lossy JSON encoding', async (t) => {
  const blog = await setup(t);
  const cache = new Map();
  const empty = blog.build({});
  const partial = exported(empty, cache);
  const valid = exported(blog.build({ title: 'Guide' }), cache);
  for (const data of [
    { title: NaN },
    { text: Infinity },
    { preview: -Infinity },
    { meta: { keywords: [undefined] } },
    { meta: { title: Temporal.Instant.from('2026-11-10T09:00:00Z') } }
  ]) {
    const post = blog.build(data);
    assert.throws(() => exported(post, cache), { code: 'YAMB_POST_VALIDATION' });
    assert.strictEqual(exported(empty, cache), partial);
  }
  assert.strictEqual(exported(blog.build({ title: 'Guide' }), cache), valid);
});

test('exports refresh for scalar, optional, related ID and date edits', async (t) => {
  const blog = await setup(t);
  const post = blog.build({
    title: 'Guide',
    slug: 'guide',
    status: 'published',
    text: 'Source',
    publishedAt: '2026-11-10T09:00:00Z',
    createdAt: '2026-11-01T09:00:00Z',
    updatedAt: '2026-11-02T09:00:00Z',
    links: { related: ['related-a'] }
  });
  const cache = new Map();
  let previous = exported(post, cache);
  for (const [field, value, expected] of [
    ['title', 'Revised', 'Revised'],
    ['text', 'Revised source\r\n', 'Revised source\r\n'],
    ['preview', '', ''],
    ['cover', { url: '/cover.png' }, { url: '/cover.png' }],
    ['author', { name: 'Alexey' }, { name: 'Alexey' }],
    ['social', { title: 'Share' }, { title: 'Share' }],
    ['createdAt', '2026-11-01T10:00:00Z', '2026-11-01T10:00:00Z'],
    ['publishedAt', '2026-12-01T10:00:00Z', '2026-12-01T10:00:00Z'],
    ['slug', 'renamed', 'renamed'],
    ['status', 'draft', 'draft'],
    ['links', { related: ['related-b'] }, { related: ['related-b'] }]
  ]) {
    post[field] = value;
    const next = exported(post, cache);
    assert.notStrictEqual(next, previous);
    assert.deepEqual(next[field], expected);
    previous = next;
  }
  assert.equal(previous.uri, 'drafts/renamed');
  post.preview = undefined;
  assert.equal(Object.hasOwn(exported(post, cache), 'preview'), false);
  post.links.related.push('related-c');
  assert.deepEqual(exported(post, cache).links.related, ['related-b', 'related-c']);
});

test('a current derived URI shares the export with the same data carrying a fresh stored URI', async (t) => {
  const blog = await setup(t);
  const stale = blog.build({
    title: 'Guide',
    slug: 'renamed',
    uri: '2026/10/old',
    status: 'published',
    publishedAt: '2026-11-10T09:00:00Z'
  });
  const fresh = blog.build({ ...stale.toJSON(), uri: '2026/11/renamed' });
  const cache = new Map();
  const result = exported(stale, cache);
  assert.equal(result.uri, '2026/11/renamed');
  assert.strictEqual(exported(fresh, cache), result);
});

test('save, reload and a no-op reuse the saved export; distinct post IDs do not', async (t) => {
  const blog = await setup(t);
  const post = await blog.create({ title: 'Guide', options: { page: { size: 2 } } });
  const cache = new Map();
  const saved = exported(post, cache);
  const loaded = await blog.find(post.id);
  assert.strictEqual(exported(loaded, cache), saved);
  loaded.title = 'Temporary';
  loaded.title = 'Guide';
  await loaded.save();
  assert.strictEqual(exported(loaded, cache), saved);
  const other = blog.build({ ...post.toJSON(), id: 'other-post' });
  assert.notStrictEqual(exported(other, cache), saved);
  assert.equal(exported(other, cache).id, 'other-post');
});

test('mutating source and snapshots leaves the live export identity isolated', async (t) => {
  const blog = await setup(t);
  const source = { title: 'Guide', options: { page: { sections: ['intro'] } } };
  const post = blog.build(source);
  const cache = new Map();
  const result = exported(post, cache);
  const snapshot = post.toJSON();
  source.options.page.sections.push('source');
  snapshot.options.page.sections.push('snapshot');
  assert.strictEqual(exported(post, cache), result);
  assert.deepEqual(result.options.page.sections, ['intro']);
  post.options.page.sections.push('live');
  assert.deepEqual(exported(post, cache).options.page.sections, ['intro', 'live']);
  assert.deepEqual(result.options.page.sections, ['intro']);
});

test('late save acknowledgement cannot select an older export or change a reverted working identity', async (t) => {
  const blog = await setup(t);
  const post = await blog.create({ title: 'A', options: { page: { label: 'A' } } });
  const cache = new Map();
  const original = exported(post, cache);
  post.title = 'B';
  post.options.page.label = 'B';
  const submitted = exported(post, cache);
  const gate = gateSave(blog.storage);
  const saving = post.save();
  await gate.entered;
  post.title = 'A';
  post.options.page.label = 'A';
  assert.strictEqual(exported(post, cache), original);
  gate.release.resolve();
  await saving;
  assert.strictEqual(exported(post, cache), original);
  assert.deepEqual(post.changes().options, { page: { label: 'A' } });
  const loaded = await blog.find(post.id);
  assert.strictEqual(exported(loaded, cache), submitted);
  await post.save();
  assert.strictEqual(exported(post, cache), original);
  assert.deepEqual(post.changes(), {});
});

test('acknowledged generated dates refresh the export while retaining late edits', async (t) => {
  let now = '2026-11-10T09:00:00Z';
  const blog = await setup(t, { clock: () => Temporal.Instant.from(now) });
  const post = await blog.create({ title: 'A', text: 'Source' });
  const cache = new Map();
  const original = exported(post, cache);
  now = '2026-11-10T10:00:00Z';
  post.title = 'B';
  const gate = gateSave(blog.storage);
  const saving = post.save();
  await gate.entered;
  post.text = 'Late source';
  const pending = exported(post, cache);
  gate.release.resolve();
  await saving;
  const confirmed = exported(post, cache);
  assert.notStrictEqual(confirmed, original);
  assert.notStrictEqual(confirmed, pending);
  assert.equal(confirmed.text, 'Late source');
  assert.equal(confirmed.updatedAt, now);
  const loaded = await blog.find(post.id);
  assert.equal(exported(loaded, cache).text, 'Source');
  assert.equal(pending.updatedAt, '2026-11-10T09:00:00Z');
});
