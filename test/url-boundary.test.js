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
