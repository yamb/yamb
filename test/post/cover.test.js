import assert from 'node:assert/strict';
import test from 'node:test';

import { blogWith } from '../perf/fixture.js';

async function setup(t) {
  const blog = await blogWith();
  t.after(() => blog.close());
  return blog;
}

test('cover defaults are owned on build, save and hydration', async (t) => {
  const blog = await setup(t);
  const first = blog.build({ title: 'First' });
  const second = blog.build({ title: 'Second', cover: undefined });
  assert.deepEqual(first.cover, {});
  assert.deepEqual(second.cover, {});
  first.cover.url = '/first.jpg';
  assert.deepEqual(second.cover, {});
  await second.save();
  const loaded = await blog.find(second.id);
  assert.deepEqual(loaded.cover, {});
  assert.deepEqual(loaded.changes(), {});
  loaded.cover.caption = 'Caption';
  assert.deepEqual(loaded.changes().cover, { caption: 'Caption' });
});

test('cover replacement, reset and snapshots isolate every owner', async (t) => {
  const blog = await setup(t);
  const source = {
    url: './photo.jpg',
    alt: '  Alt  ',
    caption: '  Caption  ',
    width: 1,
    height: 100000
  };
  const post = await blog.create({ title: 'Photo', cover: source });
  source.caption = 'Source';
  assert.equal(post.cover.caption, '  Caption  ');
  const snapshot = post.toJSON();
  snapshot.cover.caption = 'Snapshot';
  assert.equal(post.cover.caption, '  Caption  ');
  const old = post.cover;
  post.cover = { caption: 'New' };
  old.caption = 'Detached';
  assert.deepEqual(post.cover, { caption: 'New' });
  post.cover = undefined;
  assert.deepEqual(post.cover, {});
  post.cover.url = '';
  post.cover.url = undefined;
  assert.equal(Object.hasOwn(post.cover, 'url'), false);
  post.cover.caption = 'Delete';
  delete post.cover.caption;
  assert.deepEqual(post.cover, {});
  post.cover = { url: '/new.jpg' };
  post.cover = {};
  await post.save();
  const cleared = await blog.find(post.id);
  assert.deepEqual(cleared.cover, {});
  assert.deepEqual(post.changes(), {});
});

test('nested cover edits refresh export caches and equal edits stay clean', async (t) => {
  const blog = await setup(t);
  const post = await blog.create({ title: 'Photo', cover: { url: '/photo.jpg', caption: 'A' } });
  const original = post.toJSON();
  const key = post.hash();
  const cache = new Map([[key, original]]);
  post.cover.caption = 'B';
  assert.notEqual(post.hash(), key);
  assert.equal(cache.has(post.hash()), false);
  assert.equal(original.cover.caption, 'A');
  const changes = post.changes();
  changes.cover.caption = 'Changes';
  assert.equal(post.cover.caption, 'B');
  post.cover.caption = 'A';
  post.cover = { caption: 'A', url: '/photo.jpg' };
  assert.equal(post.hash(), key);
  assert.deepEqual(post.changes(), {});
  delete post.cover.url;
  assert.deepEqual(post.changes().cover, { caption: 'A' });
});

for (const value of [
  null,
  '',
  '/old.jpg',
  [],
  { unknown: 'x' },
  { width: 0 },
  { height: 100001 },
  { width: 1.5 },
  { width: NaN },
  { height: Infinity },
  { alt: 'x'.repeat(5001) },
  { caption: 'x'.repeat(5001) }
]) {
  test(`invalid cover rolls back creation and replacement ${JSON.stringify(value)?.slice(0, 70)}`, async (t) => {
    const blog = await setup(t);
    assert.throws(() => blog.build({ title: 'Photo', cover: value }), {
      code: 'YAMB_POST_VALIDATION'
    });
    const post = await blog.create({ title: 'Photo', cover: { url: '/photo.jpg' } });
    const key = post.hash();
    assert.throws(
      () => {
        post.cover = value;
      },
      { code: 'YAMB_POST_VALIDATION' }
    );
    assert.deepEqual(post.cover, { url: '/photo.jpg' });
    assert.equal(post.hash(), key);
    assert.deepEqual(post.changes(), {});
  });
}

for (const url of [
  '//cdn.example/a',
  'https://user:pass@example.com/a',
  'https://user@example.com/a',
  'javascript:alert(1)',
  'data:image/png,a',
  '../photo.jpg',
  'photo.jpg',
  '/a b',
  '/a\\b',
  '/a\n',
  '/a\u0000',
  '/a\u007f',
  `/${'x'.repeat(4096)}`
]) {
  test(`invalid nested cover URL rolls back atomically ${JSON.stringify(url).slice(0, 70)}`, async (t) => {
    const blog = await setup(t);
    const post = await blog.create({ title: 'Photo', cover: { url: '/photo.jpg', caption: 'A' } });
    const reference = post.cover;
    const key = post.hash();
    assert.throws(
      () => {
        post.cover.url = url;
      },
      { code: 'YAMB_POST_VALIDATION' }
    );
    assert.strictEqual(post.cover, reference);
    assert.deepEqual(post.cover, { url: '/photo.jpg', caption: 'A' });
    assert.deepEqual(post.changes(), {});
    assert.equal(post.hash(), key);
  });
}

test('cover accepts exact bounds and undefined fields are removed', async (t) => {
  const blog = await setup(t);
  for (const url of [
    '',
    '/',
    './',
    '/photo.jpg',
    './photo.jpg',
    'https://example.com/a',
    'http://example.com/a',
    `/${'x'.repeat(4095)}`
  ]) {
    const post = await blog.create({
      title: 'Photo',
      cover: { url, alt: 'x'.repeat(5000), caption: ' '.repeat(5000), width: 1, height: 100000 }
    });
    assert.equal(post.cover.url, url);
    assert.equal(post.cover.caption.length, 5000);
    post.cover = { alt: undefined, height: undefined };
    assert.deepEqual(post.cover, {});
  }
});

test('nested invalid dimensions and unknown keys leave every field unchanged', async (t) => {
  const blog = await setup(t);
  const post = await blog.create({ title: 'Photo', cover: { caption: 'A', width: 10 } });
  for (const [key, value] of [
    ['width', 0],
    ['height', Infinity],
    ['other', true],
    ['caption', null]
  ]) {
    assert.throws(
      () => {
        post.cover[key] = value;
      },
      { code: 'YAMB_POST_VALIDATION' }
    );
    assert.deepEqual(post.cover, { caption: 'A', width: 10 });
    assert.deepEqual(post.changes(), {});
  }
});

test('save captures cover before await and preserves later nested edits', async (t) => {
  const blog = await setup(t);
  const post = await blog.create({ title: 'Photo', cover: { caption: 'A' } });
  const entered = Promise.withResolvers();
  const release = Promise.withResolvers();
  const save = blog.storage.save.bind(blog.storage);
  blog.storage.save = async (...args) => {
    entered.resolve();
    await release.promise;
    return save(...args);
  };
  post.cover.caption = 'B';
  const saving = post.save();
  await entered.promise;
  post.cover.caption = 'C';
  const key = post.hash();
  release.resolve();
  await saving;
  assert.equal(post.cover.caption, 'C');
  assert.equal(post.hash(), key);
  const submitted = await blog.find(post.id);
  assert.equal(submitted.cover.caption, 'B');
  assert.deepEqual(post.changes().cover, { caption: 'C' });
  await post.save();
  const confirmed = await blog.find(post.id);
  assert.equal(confirmed.cover.caption, 'C');
  assert.deepEqual(post.changes(), {});
});

test('hydration supplies an editable empty cover and rejects invalid stored values', async (t) => {
  const blog = await setup(t);
  const post = await blog.create({ title: 'Stored' });
  const raw = await blog.storage.find(post.id);
  delete raw.cover;
  await blog.storage.save(raw);
  const loaded = await blog.find(post.id);
  const key = loaded.hash();
  assert.deepEqual(loaded.cover, {});
  assert.equal(loaded.hash(), key);
  assert.deepEqual(loaded.changes(), {});
  loaded.cover.url = '/stored.jpg';
  await loaded.save();
  const saved = await blog.find(post.id);
  assert.deepEqual(saved.cover, { url: '/stored.jpg' });
  for (const cover of [null, '/cover.jpg', [], { url: '//cdn.example/a' }]) {
    await blog.storage.save({ ...raw, cover });
    await assert.rejects(() => blog.find(post.id), { code: 'YAMB_STORAGE_READ' });
  }
});
