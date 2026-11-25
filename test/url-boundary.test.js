import assert from 'node:assert/strict';
import test from 'node:test';

import { blogWith } from './perf/fixture.js';

for (const base of [
  'https://example.com/',
  'https://example.com/blog',
  'https://example.com/blog/',
  'https://example.com/blog?view=1#section'
]) {
  test(`Post.url preserves the directory prefix of ${base}`, async (t) => {
    const blog = await blogWith([], { base });
    t.after(() => blog.close());
    const post = blog.build({ title: 'Post', slug: 'post' });
    await post.publish();
    const prefix = new URL(base).pathname === '/' ? '' : '/blog';
    const found = await blog.fetch(post.url());

    assert.equal(post.url().href, `https://example.com${prefix}/2026/11/post`);
    assert.equal(found.id, post.id);
    assert.equal(
      post.url({ ref: 'a b', page: 2 }).href,
      `https://example.com${prefix}/2026/11/post?ref=a+b&page=2`
    );
  });
}

for (const patch of [
  { cover: { url: '//[' } },
  { author: { name: 'A', url: '//[' } },
  { social: { image: '//[' } }
]) {
  test(`Post rejects malformed URL on create and assignment ${JSON.stringify(patch)}`, async (t) => {
    const blog = await blogWith();
    t.after(() => blog.close());
    await assert.rejects(() => blog.create({ title: 'Post', ...patch }), {
      code: 'YAMB_POST_VALIDATION'
    });
    const post = blog.build({ title: 'Post' });
    const [field, value] = Object.entries(patch)[0];
    assert.throws(
      () => {
        post[field] = value;
      },
      { code: 'YAMB_POST_VALIDATION' }
    );
  });
}

for (const value of [
  '',
  '/cover.jpg',
  './cover.jpg',
  '//cdn.example.com/cover.jpg',
  'http://example.com/cover.jpg',
  'https://example.com/cover.jpg'
]) {
  test(`Post retains allowed URL ${value}`, async (t) => {
    const blog = await blogWith();
    t.after(() => blog.close());
    const post = await blog.create({
      title: 'Post',
      author: { name: 'A', url: value }
    });
    assert.equal(post.author.url, value);
  });
}

for (const value of ['//user:pass@evil.example/', '/\\evil.example', '/a\tb']) {
  test(`Post rejects unsafe relative URL ${JSON.stringify(value)}`, async (t) => {
    const blog = await blogWith();
    t.after(() => blog.close());
    await assert.rejects(() => blog.create({ title: 'Post', author: { name: 'A', url: value } }), {
      code: 'YAMB_POST_VALIDATION'
    });
    await assert.rejects(() => blog.create({ title: 'Post', social: { image: value } }), {
      code: 'YAMB_POST_VALIDATION'
    });
  });
}

test('blog.uri rejects a same-origin URL outside the base path', async (t) => {
  const blog = await blogWith([], { base: 'https://example.com/blog/' });
  t.after(() => blog.close());
  assert.equal(blog.uri('https://example.com/blog/2026/11/post'), '2026/11/post');
  assert.equal(blog.uri('https://example.com/blog'), '');
  assert.throws(() => blog.uri('https://example.com/2026/11/post'), {
    code: 'YAMB_URI_ORIGIN_MISMATCH'
  });
  assert.throws(() => blog.uri('https://example.com/blogger/2026/11/post'), {
    code: 'YAMB_URI_ORIGIN_MISMATCH'
  });
});

test('blog.fetch returns null for paths that are not post uris without asking storage', async (t) => {
  const blog = await blogWith();
  t.after(() => blog.close());
  const fetches = [];
  const fetch = blog.storage.fetch.bind(blog.storage);
  blog.storage.fetch = (uri, options) => {
    fetches.push(uri);
    return fetch(uri, options);
  };

  for (const input of ['../../x', '/about', 'http://localhost/2026/11/a.b']) {
    assert.equal(await blog.fetch(input), null);
  }

  assert.deepEqual(fetches, []);
});

test('queries accept at most 50 tags', async (t) => {
  const blog = await blogWith();
  t.after(() => blog.close());
  const tags = Array.from({ length: 51 }, (_, i) => `tag-${i}`);

  assert.throws(() => blog.all({ tags }), { code: 'YAMB_QUERY_VALIDATION' });
  assert.throws(() => blog.all().tagged(...tags), { code: 'YAMB_QUERY_VALIDATION' });
});

test('a title longer than the slug limit derives a slug within it', async (t) => {
  const blog = await blogWith();
  t.after(() => blog.close());
  const post = await blog.create({ title: 'word '.repeat(60) });
  assert.equal(post.slug.length <= 200, true);
  assert.match(post.slug, /^word(-word)*$/);
});
