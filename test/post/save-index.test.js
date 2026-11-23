import assert from 'node:assert/strict';
import test from 'node:test';

import { yamb } from '../../src/index.js';
import { storageWith } from '../perf/fixture.js';

async function setup(t) {
  const blog = yamb({ storage: storageWith() });
  await blog.open();
  t.after(() => blog.close());

  return blog;
}

async function check(blog, id, uri) {
  const stored = await blog.find(id);

  assert.equal(blog.locate(id), uri);
  assert.equal(stored?.uri, uri);

  if (uri) {
    const fetched = await blog.fetch(uri);

    assert.equal(blog.identify(uri), id);
    assert.equal(blog.has(uri), true);
    assert.equal(fetched?.id, id);
  }
}

async function absent(blog, uri) {
  assert.equal(blog.identify(uri), undefined);
  assert.equal(blog.has(uri), false);
  assert.equal(await blog.fetch(uri), null);
}

for (const mode of ['udpate', '', false, 0, {}, 'default']) {
  test(`invalid mode ${JSON.stringify(mode)} rejects before storage I/O`, async (t) => {
    const blog = await setup(t);
    const original = await blog.create({ title: 'Original', text: 'Keep body' });
    const supplied = blog.build({ id: original.id, slug: original.slug, title: 'Replacement' });
    const { fetch, save } = blog.storage;
    const unexpected = () => {
      assert.fail(`invalid mode ${JSON.stringify(mode)} must not reach storage`);
    };

    blog.storage.fetch = unexpected;
    blog.storage.save = unexpected;

    await assert.rejects(supplied.save({ mode }), { code: 'YAMB_POST_VALIDATION' });

    blog.storage.fetch = fetch;
    blog.storage.save = save;

    const stored = await blog.find(original.id);

    assert.equal(stored.text, 'Keep body');
    await check(blog, original.id, 'drafts/original');
  });
}

for (const options of [{}, { mode: null }, { mode: undefined }]) {
  test(`default mode ${JSON.stringify(options)} preserves insert and loaded update guards`, async (t) => {
    const blog = await setup(t);
    const post = blog.build({ title: 'Original' });

    await post.save(options);

    const supplied = blog.build({ id: post.id, title: 'Replacement' });
    await assert.rejects(supplied.save(options), { code: 'YAMB_POST_VALIDATION' });

    post.slug = 'changed';
    await post.save(options);
    await absent(blog, 'drafts/original');
    await check(blog, post.id, 'drafts/changed');

    await post.remove();
    await check(blog, post.id, undefined);
    await absent(blog, 'drafts/changed');
  });
}

test('explicit update through a fresh Post replaces the shared URI binding', async (t) => {
  const blog = await setup(t);
  const original = await blog.create({ title: 'Original' });
  const supplied = blog.build({ id: original.id, title: 'Replacement' });

  await supplied.save({ mode: 'update' });

  await absent(blog, 'drafts/original');
  await check(blog, original.id, 'drafts/replacement');
});

for (const operation of ['save', 'remove']) {
  test(`stale ${operation} clears the current binding and preserves the reused URI owner`, async (t) => {
    const blog = await setup(t);
    const stale = await blog.create({ title: 'Original' });
    const loaded = await blog.find(stale.id);

    loaded.slug = 'middle';
    await loaded.save();

    const owner = await blog.create({ title: 'New owner', slug: 'original' });
    stale.slug = 'latest';
    await stale[operation]();

    await check(blog, owner.id, 'drafts/original');
    await absent(blog, 'drafts/middle');

    if (operation === 'save') {
      await check(blog, stale.id, 'drafts/latest');
    } else {
      await check(blog, stale.id, undefined);
      await absent(blog, 'drafts/latest');
    }
  });
}

test('explicit update rejects another owner before sending a colliding write', async (t) => {
  const blog = await setup(t);
  const original = await blog.create({ title: 'Original' });
  const owner = await blog.create({ title: 'Occupied' });
  const supplied = blog.build({ id: original.id, slug: 'occupied', title: 'Replacement' });

  blog.storage.save = () => assert.fail('a colliding update must not reach storage.save');

  await assert.rejects(supplied.save({ mode: 'update' }), { code: 'YAMB_URI_TAKEN' });

  await check(blog, original.id, 'drafts/original');
  await check(blog, owner.id, 'drafts/occupied');
});

test('stale save checks a reused URI even when its local pristine URI has not changed', async (t) => {
  const blog = await setup(t);
  const stale = await blog.create({ title: 'Original' });
  const loaded = await blog.find(stale.id);
  loaded.slug = 'middle';
  await loaded.save();

  const owner = await blog.create({ title: 'New owner', slug: 'original' });

  stale.title = 'Edited';
  blog.storage.save = () => assert.fail('a colliding stale save must not reach storage.save');

  await assert.rejects(stale.save(), { code: 'YAMB_URI_TAKEN' });

  await check(blog, stale.id, 'drafts/middle');
  await check(blog, owner.id, 'drafts/original');
});

for (const operation of ['save', 'remove']) {
  for (const outcome of ['failure', 'cancel', 'ack']) {
    test(`${operation} changes shared lookups only on acknowledgement (${outcome})`, async (t) => {
      const blog = await setup(t);
      const stale = await blog.create({ title: 'Original' });
      const loaded = await blog.find(stale.id);
      loaded.slug = 'middle';
      await loaded.save();
      const owner = await blog.create({ title: 'New owner', slug: 'original' });
      const entered = Promise.withResolvers();
      const release = Promise.withResolvers();
      const original = blog.storage[operation].bind(blog.storage);

      blog.storage[operation] = async (...args) => {
        if (outcome === 'ack') {
          await original(...args);
        }

        entered.resolve();
        await release.promise;

        if (outcome !== 'ack') {
          return original(...args);
        }
      };

      stale.slug = 'latest';
      const controller = new AbortController();
      const pending = stale[operation]({ signal: controller.signal });

      await entered.promise;

      assert.equal(blog.locate(stale.id), 'drafts/middle');
      assert.equal(blog.identify('drafts/middle'), stale.id);
      assert.equal(blog.has('drafts/latest'), false);

      const settled = outcome === 'ack' ? pending : assert.rejects(pending);

      if (outcome === 'failure') {
        release.reject(new Error('offline'));
      } else {
        controller.abort();
        release.resolve();
      }

      await settled;

      await check(blog, owner.id, 'drafts/original');

      if (outcome === 'ack') {
        await absent(blog, 'drafts/middle');
        await check(blog, stale.id, operation === 'save' ? 'drafts/latest' : undefined);
      } else {
        await check(blog, stale.id, 'drafts/middle');
        await absent(blog, 'drafts/latest');
        assert.equal(stale.changes().slug, 'latest');
      }
    });
  }
}

for (const operation of ['save', 'remove']) {
  test(`${operation} confirmation removes the binding confirmed by another Post during its storage wait`, async (t) => {
    const blog = await setup(t);
    const post = await blog.create({ title: 'Original' });
    const loaded = await blog.find(post.id);
    const entered = Promise.withResolvers();
    const release = Promise.withResolvers();
    const original = blog.storage[operation].bind(blog.storage);

    blog.storage[operation] = async (...args) => {
      blog.storage[operation] = original;
      entered.resolve();
      await release.promise;

      return original(...args);
    };

    post.slug = 'latest';
    const pending = post[operation]();
    await entered.promise;

    loaded.slug = 'middle';
    await loaded.save();

    release.resolve();
    await pending;

    await absent(blog, 'drafts/original');
    await absent(blog, 'drafts/middle');
    await check(blog, post.id, operation === 'save' ? 'drafts/latest' : undefined);
  });
}
