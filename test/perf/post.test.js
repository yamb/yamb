import assert from 'node:assert/strict';
import test from 'node:test';

import { Post } from '../../src/index.js';
import { blogWith, postData } from './fixture.js';
import { conditions, measure, retained } from './measure.js';

test('Post: build, load, read, edit, diff and persist Markdown', async (t) => {
  conditions(t);
  const blog = await blogWith();
  t.after(() => blog.close());

  for (const kib of [1, 16, 256]) {
    const data = postData(kib * 1024, kib);
    const prefix = `post/${kib}KiB`;
    const built = await measure(
      t,
      `${prefix}/build`,
      () => {
        let post;
        for (let i = 0; i < 100; i++) {
          post = blog.build(data);
        }
        return post;
      },
      100
    );
    assert.equal(built.text, data.text);
    const post = await blog.create(data);
    const loaded = await measure(t, `${prefix}/load`, () => blog.find(post.id));
    assert.equal(loaded.text, data.text);
    assert.deepEqual(loaded.changes(), {});

    const reads = 100_000;
    const length = await measure(
      t,
      `${prefix}/read-title-text`,
      () => {
        let total = 0;
        for (let i = 0; i < reads; i++) {
          total += loaded.title.length + loaded.text.length;
        }
        return total;
      },
      reads
    );
    assert.equal(length, reads * (loaded.title.length + data.text.length));

    let revision = 0;
    const edits = 1000;
    await measure(
      t,
      `${prefix}/replace-title`,
      () => {
        for (let i = 0; i < edits; i++) {
          loaded.title = `Edited ${++revision}`;
        }
        return loaded.title;
      },
      edits
    );
    assert.equal(loaded.changes().title, loaded.title);
    await loaded.save();
    await measure(
      t,
      `${prefix}/nested-edit`,
      () => {
        for (let i = 0; i < edits; i++) {
          loaded.meta.keywords[0] = `keyword-${++revision}`;
        }
        return loaded.meta.keywords[0];
      },
      edits
    );
    const nestedChanges = loaded.changes();
    t.diagnostic(
      JSON.stringify({
        kind: 'observation',
        name: `${prefix}/nested-changes`,
        reported: Object.hasOwn(nestedChanges, 'meta'),
        liveKeyword: loaded.meta.keywords[0]
      })
    );
    const expectedKeyword = loaded.meta.keywords[0];
    await measure(t, `${prefix}/changes-nested`, () => loaded.changes());
    loaded.title = 'Saved edit';
    const diff = await measure(t, `${prefix}/changes-title`, () => loaded.changes());
    assert.equal(diff.title, 'Saved edit');
    await measure(t, `${prefix}/save`, async () => {
      loaded.title = `Saved ${++revision}`;
      await loaded.save();
      return loaded.id;
    });
    const reloaded = await blog.find(loaded.id);
    assert.equal(reloaded.title, loaded.title);
    assert.equal(reloaded.meta.keywords[0], expectedKeyword);
    assert.deepEqual(reloaded.meta, loaded.meta);
    assert.equal(reloaded.text, data.text);
    assert.deepEqual(loaded.changes(), {});
    const firstHash = await measure(t, `${prefix}/first-hash-after-edit`, () => {
      loaded.title = `Hash ${++revision}`;
      return loaded.hash();
    });
    const repeatedHash = await measure(
      t,
      `${prefix}/repeated-hash`,
      () => {
        let key;
        for (let i = 0; i < reads; i++) {
          key = loaded.hash();
        }
        return key;
      },
      reads
    );
    assert.equal(repeatedHash, firstHash);
    retained(
      t,
      `${prefix}/hydrated-shared-text`,
      (i) =>
        new Post(blog, {
          ...data,
          uri: post.uri,
          tags: ['javascript'],
          meta: { keywords: ['node'] },
          id: `retained-${i}`
        })
    );
  }
});
