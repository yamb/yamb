import assert from 'node:assert/strict';
import test from 'node:test';

import { blogWith } from '../perf/fixture.js';

for (const [field, limit] of [
  ['title', 500],
  ['preview', 5000],
  ['tags', 64],
  ['text', 1048576]
]) {
  test(`Post preserves the UTF-16 boundary and rejects overflow in ${field}`, async (t) => {
    const blog = await blogWith();
    t.after(() => blog.close());
    const text = '😀'.repeat(limit / 2);
    const valid = field === 'tags' ? [text] : text;
    const overflow = field === 'tags' ? [`${text}a`] : `${text}a`;
    const source = { title: 'Bounds', slug: `bounds-${field}`, [field]: valid };
    const post = blog.build(source);
    assert.deepEqual(post.toJSON()[field], valid);
    await post.save();
    const loaded = await blog.find(post.id);
    assert.deepEqual(loaded[field], valid);
    const key = post.hash();
    assert.throws(
      () => {
        post[field] = overflow;
      },
      { code: 'YAMB_POST_VALIDATION' }
    );
    if (field === 'tags') {
      assert.throws(
        () => {
          post.tags[0] = `${text}a`;
        },
        { code: 'YAMB_POST_VALIDATION' }
      );
    }
    assert.deepEqual(post[field], valid);
    assert.equal(post.hash(), key);
    assert.deepEqual(post.changes(), {});
    assert.throws(() => blog.build({ ...source, [field]: overflow }), {
      code: 'YAMB_POST_VALIDATION'
    });
    await assert.rejects(() => blog.create({ ...source, [field]: overflow }), {
      code: 'YAMB_POST_VALIDATION'
    });
    assert.equal(await blog.storage.count({}), 1);
  });
}

for (const [field, valid] of [
  ['url', `/${'😀'.repeat(2047)}a`],
  ['alt', '😀'.repeat(2500)],
  ['caption', '😀'.repeat(2500)]
]) {
  test(`Post preserves the UTF-16 boundary and rolls back nested ${field} overflow`, async (t) => {
    const blog = await blogWith();
    t.after(() => blog.close());
    const cover = { [field]: valid };
    const post = blog.build({ title: 'Bounds', cover });
    await post.save();
    const loaded = await blog.find(post.id);
    assert.deepEqual(loaded.cover, cover);
    const reference = post.cover;
    const key = post.hash();
    const overflow = `${valid}a`;
    assert.throws(
      () => {
        post.cover[field] = overflow;
      },
      { code: 'YAMB_POST_VALIDATION' }
    );
    assert.strictEqual(post.cover, reference);
    assert.deepEqual(post.cover, cover);
    assert.equal(post.hash(), key);
    assert.deepEqual(post.changes(), {});
    assert.throws(
      () => {
        post.cover = { [field]: overflow };
      },
      { code: 'YAMB_POST_VALIDATION' }
    );
    assert.throws(() => blog.build({ title: 'Bounds', cover: { [field]: overflow } }), {
      code: 'YAMB_POST_VALIDATION'
    });
    await assert.rejects(() => blog.create({ title: 'Bounds', cover: { [field]: overflow } }), {
      code: 'YAMB_POST_VALIDATION'
    });
    assert.equal(await blog.storage.count({}), 1);
  });
}

test('title trims before its UTF-16 boundary while other text preserves whitespace', async (t) => {
  const blog = await blogWith();
  t.after(() => blog.close());
  const title = '😀'.repeat(250);
  const post = await blog.create({
    title: `  ${title}\n`,
    slug: 'trimmed',
    preview: '  😀\n',
    cover: { caption: '  😀\n' }
  });
  assert.equal(post.title, title);
  assert.equal(post.preview, '  😀\n');
  assert.equal(post.cover.caption, '  😀\n');
});
