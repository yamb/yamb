import assert from 'node:assert/strict';
import test from 'node:test';

import { yamb } from '../../src/index.js';
import { storageWith } from '../perf/fixture.js';

const conflict = { name: 'PostConflictError', code: 'YAMB_POST_CONFLICT' };
const notFound = { code: 'YAMB_POST_NOT_FOUND' };
const invalid = { code: 'YAMB_POST_VALIDATION' };

const legacy = {
  id: 'legacy',
  uri: 'drafts/legacy',
  slug: 'legacy',
  title: 'Legacy',
  status: 'draft',
  text: '',
  tags: [],
  links: { related: [] },
  createdAt: '2026-11-01T12:00:00.000000000Z',
  updatedAt: '2026-11-01T12:00:00.000000000Z'
};

async function setup(t, rows) {
  const blog = yamb({ storage: storageWith(rows) });
  await blog.open();
  t.after(() => blog.close());

  return blog;
}

test('every real write assigns a new hidden version', async (t) => {
  const blog = await setup(t);
  const post = await blog.create({ title: 'First' });
  const created = post.version;

  assert.match(created, /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  assert.equal(Object.hasOwn(post.toJSON(), 'version'), false);
  assert.equal(Object.keys(post).includes('version'), false);
  assert.equal('version' in { ...post }, false);

  await post.save();
  assert.equal(post.version, created, 'a no-op save does not write');

  post.title = 'Second';
  await post.save();
  assert.notEqual(post.version, created);

  const stored = await blog.find(post.id);
  assert.equal(stored.version, post.version);

  post.title = 'First';
  assert.deepEqual(Object.keys(post.changes()), ['title']);
});

test('an unsaved post and a record without a stored version have a null version', async (t) => {
  const blog = await setup(t, [legacy]);

  const stored = await blog.find('legacy');

  assert.equal(blog.build({ title: 'Draft' }).version, null);
  assert.equal(stored.version, null);
});

test('a stale save conflicts and leaves storage and the post unchanged', async (t) => {
  const blog = await setup(t);
  const post = await blog.create({ title: 'Original', text: 'Body' });
  const stale = await blog.find(post.id);
  const { version } = stale;

  post.text = 'Winner';
  await post.save();

  stale.text = 'Loser';
  await assert.rejects(stale.save(), conflict);

  const stored = await blog.find(post.id);
  assert.equal(stored.text, 'Winner');
  assert.equal(stale.version, version);
  assert.equal(stale.changes().text, 'Loser');
});

test('a queued save expects the version confirmed by the save before it', async (t) => {
  const blog = await setup(t);
  const post = await blog.create({ title: 'Original' });
  const expected = [];
  const { save } = blog.storage;

  blog.storage.save = (raw, options) => {
    expected.push(options.expected);

    return save.call(blog.storage, raw, options);
  };

  const created = post.version;
  post.title = 'First';
  const first = post.save();
  post.title = 'Second';
  await Promise.all([first, post.save()]);

  const stored = await blog.find(post.id);
  assert.equal(stored.title, 'Second');
  assert.equal(expected[0], created);
  assert.notEqual(expected[1], created);
  assert.equal(stored.version, post.version);
});

test('a stale remove conflicts and keeps the record', async (t) => {
  const blog = await setup(t);
  const post = await blog.create({ title: 'Original' });
  const stale = await blog.find(post.id);

  post.title = 'Edited';
  await post.save();

  await assert.rejects(stale.remove(), conflict);
  const stored = await blog.find(post.id);
  assert.equal(stored.title, 'Edited');
  assert.equal(blog.locate(post.id), 'drafts/original');
});

test('publish, schedule and archive pass an explicit expected version', async (t) => {
  const blog = await setup(t);
  const post = await blog.create({ title: 'Original' });
  const stale = await blog.find(post.id);

  post.title = 'Edited';
  await post.save();

  await assert.rejects(stale.archive({ expected: stale.version }), conflict);
  await stale.archive({ expected: post.version });
  const stored = await blog.find(post.id);
  assert.equal(stored.status, 'archived');
});

test('a mismatch on a missing record is not found, not a conflict', async (t) => {
  const blog = await setup(t);
  const post = await blog.create({ title: 'Original' });
  const stale = await blog.find(post.id);

  await post.remove();

  stale.title = 'Edited';
  await assert.rejects(stale.save(), notFound);
  await assert.rejects(stale.remove(), notFound);
});

test('a legacy record conflicts between two editors and gains a version on save', async (t) => {
  const blog = await setup(t, [legacy]);
  const first = await blog.find('legacy');
  const second = await blog.find('legacy');

  first.title = 'First';
  await first.save();
  assert.notEqual(first.version, null);

  second.title = 'Second';
  await assert.rejects(second.save(), conflict);
});

test('fence changes only the version and makes the previous one inapplicable', async (t) => {
  const blog = await setup(t);
  const post = await blog.create({ title: 'Original' });
  const loaded = await blog.find(post.id);
  const version = await blog.fence(post.id, post.version);

  const stored = await blog.find(post.id);
  assert.equal(stored.version, version);
  assert.notEqual(version, post.version);
  assert.deepEqual(stored.toJSON(), loaded.toJSON());
  assert.equal(stored.hash(), loaded.hash());

  post.title = 'Late';
  await assert.rejects(post.save(), conflict);
  await assert.rejects(post.remove(), conflict);
  await assert.rejects(blog.fence(post.id, post.version), conflict);
  await assert.rejects(blog.fence('missing', null), notFound);
});

test('fence on a legacy record expects null', async (t) => {
  const blog = await setup(t, [legacy]);
  const loaded = await blog.find('legacy');

  await blog.fence('legacy', null);
  await assert.rejects(blog.fence('legacy', null), conflict);

  loaded.title = 'Late';
  await assert.rejects(loaded.save(), conflict);
});

test('fence after an unknown save outcome resolves the race', async (t) => {
  const blog = await setup(t);
  const post = await blog.create({ title: 'Original' });
  const { save } = blog.storage;
  const entered = Promise.withResolvers();
  const release = Promise.withResolvers();
  let late;

  blog.storage.save = async (raw, options) => {
    entered.resolve();
    await release.promise;
    late = save.call(blog.storage, raw, { ...options, signal: undefined });

    return late;
  };

  const controller = new AbortController();
  const previous = post.version;

  post.title = 'Unknown outcome';
  const pending = post.save({ signal: controller.signal });

  await entered.promise;
  controller.abort();
  blog.storage.save = save;

  await blog.fence(post.id, previous);

  release.resolve();
  await assert.rejects(pending);
  await assert.rejects(late, conflict);
  const stored = await blog.find(post.id);
  assert.equal(stored.title, 'Original');
});

test('an explicit update of a built post is unconditional unless expected is given', async (t) => {
  const blog = await setup(t);
  const post = await blog.create({ title: 'Original' });
  const calls = [];
  const { save } = blog.storage;

  blog.storage.save = (raw, options) => {
    calls.push(options.expected);

    return save.call(blog.storage, raw, options);
  };

  await blog.build({ id: post.id, title: 'Replacement' }).save({ mode: 'update' });
  await assert.rejects(
    blog.build({ id: post.id, title: 'Stale' }).save({ mode: 'update', expected: post.version }),
    conflict
  );

  assert.deepEqual(calls, [undefined, post.version]);
});

test('invalid expected versions reject before storage I/O', async (t) => {
  const blog = await setup(t);
  const post = await blog.create({ title: 'Original' });

  blog.storage.save = () => assert.fail('must not reach storage.save');
  blog.storage.remove = () => assert.fail('must not reach storage.remove');
  blog.storage.fence = () => assert.fail('must not reach storage.fence');

  post.title = 'Edited';

  for (const expected of ['', 1, {}, 'x'.repeat(65)]) {
    await assert.rejects(post.save({ expected }), invalid);
    await assert.rejects(post.remove({ expected }), invalid);
    await assert.rejects(blog.fence(post.id, expected), invalid);
  }

  await assert.rejects(blog.fence(post.id), invalid);
  await assert.rejects(blog.fence('', null), invalid);
  await assert.rejects(blog.build({ title: 'New' }).save({ expected: null }), invalid);
});

test('version is not accepted as post data', async (t) => {
  const blog = await setup(t);

  assert.throws(() => blog.build({ title: 'New', version: 'forged' }), invalid);
});

test('an invalid stored version is a storage read error', async (t) => {
  const blog = await setup(t, [{ ...legacy, version: 42 }]);

  await assert.rejects(blog.find('legacy'), { code: 'YAMB_STORAGE_READ' });
});

test('a storage without fence is rejected at configuration', () => {
  const { fence: _fence, ...storage } = storageWith();

  assert.throws(() => yamb({ storage }), { code: 'YAMB_CONFIG_INVALID' });
});
