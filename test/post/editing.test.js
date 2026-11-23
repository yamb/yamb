import assert from 'node:assert/strict';
import test from 'node:test';

import { z } from 'zod';

import { Post } from '../../src/index.js';
import { blogWith, postData } from '../perf/fixture.js';

const EditingOptionsSchema = z.strictObject({
  items: z.json().optional(),
  nested: z.json().optional(),
  first: z.json().optional(),
  second: z.json().optional()
});
const context = await blogWith([], { options: EditingOptionsSchema });

function saved(extra = {}) {
  return new Post(context, {
    id: 'post-a',
    uri: 'drafts/first',
    title: 'First',
    slug: 'first',
    status: 'draft',
    text: '**source**',
    tags: ['js'],
    links: { related: ['unknown-id'] },
    meta: { description: 'Original' },
    createdAt: '2026-11-01T12:00:00Z',
    updatedAt: '2026-11-01T12:00:00Z',
    ...extra
  });
}

test('copying public data preserves live shallow references; export gives independent data', () => {
  const post = saved();
  assert.ok(Object.keys(post).includes('title'));
  assert.ok(!Object.keys(post).includes('save'));
  const shallow = { ...post };
  assert.equal(shallow.tags, post.tags);
  // oxlint-disable-next-line eslint/prefer-object-spread
  assert.equal(Object.assign({}, post).meta, post.meta);
  assert.equal(Object.fromEntries(Object.entries(post)).title, 'First');
  const snapshot = post.toJSON();
  snapshot.meta.description = 'External';
  snapshot.links.related.push('other');
  assert.equal(post.meta.description, 'Original');
  assert.deepEqual(post.links.related, ['unknown-id']);
  assert.equal(snapshot.createdAt, '2026-11-01T12:00:00Z');
  post.slug = 'renamed';
  assert.equal(post.uri, 'drafts/renamed');
  assert.equal(post.toJSON().uri, 'drafts/renamed');
});

test('edits and deletions are reported independently and reverting removes them', () => {
  const post = saved();
  post.title = 'Second';
  post.meta.description = 'Edited';
  post.tags.push('node');
  post.links.related.push('another-id');
  assert.deepEqual(post.changes(), {
    title: 'Second',
    meta: { description: 'Edited' },
    tags: ['js', 'node'],
    links: { related: ['unknown-id', 'another-id'] }
  });
  post.title = 'First';
  post.meta.description = 'Original';
  post.tags.pop();
  post.links.related.pop();
  assert.deepEqual(post.changes(), {});
  post.meta = undefined;
  assert.ok(Object.hasOwn(post.changes(), 'meta'));
  assert.equal(post.changes().meta, undefined);
  assert.ok(!Object.hasOwn(post.toJSON(), 'meta'));
  post.meta = { description: 'Original' };
  assert.deepEqual(post.changes(), {});
  post.changes().tags?.push('outside');
  assert.deepEqual(post.tags, ['js']);
});

test('input and assignments cannot mutate a post through external aliases', () => {
  const input = { tags: ['one'], meta: { keywords: ['a'] }, options: { items: [{ a: 1 }] } };
  const post = saved(input);
  input.tags.push('outside');
  input.meta.keywords[0] = 'outside';
  input.options.items[0].a = 2;
  assert.deepEqual(post.tags, ['one']);
  assert.deepEqual(post.meta.keywords, ['a']);
  assert.equal(post.options.items[0].a, 1);
  const replacement = ['new'];
  const previous = post.tags;
  post.tags = replacement;
  replacement.push('outside');
  previous.push('detached');
  assert.deepEqual(post.tags, ['new']);
  assert.equal(post.tags, post.tags);
});

test('read-only and unknown properties reject edits; optional missing objects stay absent', () => {
  const post = saved({ meta: undefined });
  for (const field of ['id', 'uri', 'updatedAt']) {
    assert.throws(() => {
      post[field] = 'changed';
    }, TypeError);
  }
  assert.throws(() => {
    delete post.title;
  }, TypeError);
  assert.throws(() => {
    post.mistypedTitle = 'lost';
  }, TypeError);
  assert.throws(
    () => new Post(context, { title: 'X', mistypedTitle: 'hidden' }, { pristine: false }),
    { code: 'YAMB_POST_VALIDATION' }
  );
  assert.throws(() => Object.defineProperty(post, 'title', { value: 'bypass' }), TypeError);
  assert.equal(post.meta, undefined);
  assert.deepEqual(post.changes(), {});
  post.meta = {};
  post.meta.description = 'New';
  assert.deepEqual(post.changes(), { meta: { description: 'New' } });
});

test('new posts report all pending data with no mutable aliases', () => {
  const post = new Post(context, { title: 'New', tags: ['js'] }, { pristine: false });
  const pending = post.changes();
  assert.deepEqual(pending, { title: 'New', tags: ['js'], options: {}, cover: {} });
  pending.tags.push('external');
  assert.deepEqual(post.tags, ['js']);
});

test('failed publication leaves the status edit visible to the editor', async () => {
  const blog = await blogWith();
  try {
    const post = await blog.create({ title: 'Saved draft' });
    post.links.related.push('missing-id');
    await assert.rejects(() => post.publish(), {
      code: 'YAMB_LINK_REF_NOT_FOUND',
      details: { unknownRefs: ['missing-id'] }
    });
    assert.equal(post.status, 'published');
    assert.equal(post.changes().status, 'published');
    assert.equal(post.publishedAt, undefined);
    assert.equal(post.toJSON().uri, 'drafts/saved-draft');
  } finally {
    await blog.close();
  }
});

test('renames expose the current URI consistently before persistence', () => {
  const post = saved();
  post.slug = 'new-slug';
  assert.equal(post.uri, 'drafts/new-slug');
  assert.equal(post.toJSON().uri, 'drafts/new-slug');
  assert.equal(post.changes().uri, 'drafts/new-slug');
  post.slug = 'first';
  assert.deepEqual(post.changes(), {});
  const pending = new Post(
    context,
    { title: 'New', slug: 'old', status: 'draft' },
    { pristine: false }
  );
  pending.slug = 'new';
  assert.equal(pending.changes().uri, 'drafts/new');
});

test('build and hydration own mutable fields independently even when input branches overlap', () => {
  for (const pristine of [false, true]) {
    const shared = Array.from({ length: 20 }, (_, i) => `tag-${i}`);
    const common = { count: 1 };
    const post = new Post(
      context,
      {
        ...postData(),
        id: 'post-separate',
        uri: '2026/11/baseline-0',
        title: 'Separate fields',
        tags: shared,
        meta: { keywords: shared },
        options: { first: common, second: common }
      },
      { pristine }
    );
    post.tags.push('tag-20');
    assert.equal(post.meta.keywords.length, 20);
    assert.equal(shared.length, 20);
    assert.throws(() => post.meta.keywords.push('too-many'), { code: 'YAMB_POST_VALIDATION' });
    assert.equal(post.meta.keywords.length, 20);
    if (pristine) {
      assert.deepEqual(post.changes(), { tags: [...shared, 'tag-20'] });
    }
    assert.equal(post.options.first, post.options.second);
    post.options.first.count = 2;
    assert.equal(post.options.second.count, 2);
  }
});

test('shared input fields stay independent through create, save and storage hydration', async () => {
  const shared = Array.from({ length: 20 }, (_, i) => `tag-${i}`);
  const blog = await blogWith([
    {
      id: 'seed-shared',
      uri: 'drafts/seed-shared',
      slug: 'seed-shared',
      title: 'Seed shared',
      status: 'draft',
      text: '',
      tags: shared,
      meta: { keywords: shared },
      links: { related: [] },
      createdAt: '2026-11-01T12:00:00Z',
      updatedAt: '2026-11-01T12:00:00Z'
    }
  ]);
  try {
    const created = await blog.create({
      title: 'Created shared',
      tags: shared,
      meta: { keywords: shared }
    });
    const hydrated = await blog.find('seed-shared');
    for (const post of [created, hydrated]) {
      post.tags.push('tag-20');
      assert.equal(post.meta.keywords.length, 20);
      assert.deepEqual(post.changes(), { tags: [...shared, 'tag-20'] });
      await post.save();
      const loaded = await blog.find(post.id);
      assert.equal(loaded.tags.length, 21);
      assert.equal(loaded.meta.keywords.length, 20);
      assert.deepEqual(loaded.changes(), {});
    }
  } finally {
    await blog.close();
  }
});

test('cleared and replaced fields leave held detached values usable without affecting current data', () => {
  const post = saved({ options: { items: [{ count: 1 }] } });
  const removed = post.options;
  post.options = undefined;
  removed.items[0].count = 2;
  assert.deepEqual(post.options, {});
  assert.deepEqual(post.changes().options, {});
  post.options = { items: [{ count: 3 }] };
  const replaced = post.options;
  post.options = { items: [{ count: 4 }] };
  replaced.items.push({ count: 5 });
  assert.deepEqual(post.options.items, [{ count: 4 }]);
  assert.deepEqual(post.changes().options, { items: [{ count: 4 }] });
});
