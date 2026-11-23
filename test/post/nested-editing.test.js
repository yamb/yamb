import assert from 'node:assert/strict';
import test from 'node:test';

import { z } from 'zod';

import { Post } from '../../src/index.js';
import { blogWith, postData } from '../perf/fixture.js';

const context = await blogWith([], {
  options: z.strictObject({
    a: z.json().optional(),
    b: z.json().optional(),
    items: z.json().optional()
  })
});

function saved(extra = {}) {
  return new Post(context, {
    ...postData(),
    id: 'post-nested',
    uri: '2026/11/baseline-0',
    title: 'Post',
    tags: ['c', 'a', 'b'],
    meta: { keywords: ['node'], description: 'Text' },
    links: { related: [] },
    ...extra
  });
}

test('array methods edit once and keep previously read arrays live', () => {
  const post = saved();
  const { tags } = post;
  assert.equal(tags.push('d'), 4);
  assert.equal(tags.push('e'), 5);
  assert.equal(tags.pop(), 'e');
  assert.deepEqual(tags.splice(1, 1, 'z'), ['a']);
  assert.equal(tags.sort(), tags);
  assert.deepEqual(tags, ['b', 'c', 'd', 'z']);
  assert.equal(tags.reverse(), tags);
  assert.deepEqual(post.changes().tags, ['z', 'd', 'c', 'b']);
  tags[0] = 'first';
  tags.length = 2;
  assert.deepEqual(post.tags, ['first', 'd']);
  tags.fill('same');
  assert.deepEqual(post.tags, ['same', 'same']);
  tags.copyWithin(1, 0);
});

test('invalid arrays and throwing sort never leave half an edit', () => {
  const post = saved();
  const { tags } = post;
  for (const edit of [
    () => tags.push('valid', ''),
    () => tags.splice(1, 1, 'valid', 123),
    () => {
      tags[6] = 'hole';
    },
    () => {
      tags.length = 5;
    },
    () => {
      delete tags[0];
    },
    () => tags.fill(''),
    () =>
      tags.sort(() => {
        throw new Error('comparator failed');
      })
  ]) {
    assert.throws(edit);
    assert.deepEqual(tags, ['c', 'a', 'b']);
    assert.deepEqual(post.changes(), {});
  }
  assert.throws(() =>
    tags.sort(() => {
      tags.push('side effect');
      return 0;
    })
  );
  assert.deepEqual(tags, ['c', 'a', 'b']);
});

test('nested delete validates the field and preserves sibling references', () => {
  const post = saved({ author: { name: 'Alice', email: 'alice@example.com' } });
  const { meta } = post;
  const { keywords } = meta;
  delete meta.description;
  keywords.push('js');
  assert.equal(post.meta, meta);
  assert.equal(post.meta.keywords, keywords);
  assert.deepEqual(post.changes().meta, { keywords: ['node', 'js'] });
  assert.throws(() => {
    delete post.author.name;
  });
  assert.equal(post.author.name, 'Alice');
  post.meta.keywords = ['new'];
  keywords.push('detached');
  assert.deepEqual(post.meta.keywords, ['new']);
});

test('reflection cannot leak unobserved values or change the data structure', () => {
  const post = saved();
  const keywords = Object.getOwnPropertyDescriptor(post.meta, 'keywords').value;
  keywords.push('reflected');
  assert.deepEqual(post.changes().meta.keywords, ['node', 'reflected']);
  Object.defineProperty(post.meta, 'description', { value: 'Defined' });
  assert.equal(post.changes().meta.description, 'Defined');
  for (const edit of [
    () => Object.defineProperty(post.meta, 'description', { get: () => 'hidden' }),
    () => Object.defineProperty(post.tags, '0', { value: 'locked', writable: false }),
    () => Object.setPrototypeOf(post.meta, { description: 'inherited' }),
    () => Object.preventExtensions(post.meta),
    () => {
      post.tags.extra = 'hidden';
    },
    () => {
      post.meta[Symbol('hidden')] = 1;
    }
  ]) {
    assert.throws(edit);
  }
  assert.equal(post.meta.description, 'Defined');
  assert.deepEqual(post.tags, ['c', 'a', 'b']);
});

test('JSON input rejects cycles and exotic structure; repeated references stay safe', () => {
  const post = saved();
  const cycle = {};
  cycle.self = cycle;
  assert.throws(
    () => {
      post.options = cycle;
    },
    { code: 'YAMB_POST_VALIDATION' }
  );
  assert.throws(() => saved({ options: cycle }), { code: 'YAMB_STORAGE_READ' });
  const common = { value: 1 };
  post.options = { a: common, b: common };
  common.value = 9;
  post.options.a.value = 2;
  assert.equal(post.options.b.value, 2);
  assert.deepEqual(post.changes().options, { a: { value: 2 }, b: { value: 2 } });
  assert.throws(() => {
    post.options.a.self = cycle;
  });
  assert.equal(post.options.a.self, undefined);
});

test('array result objects remain observed and sorting preserves item identity', () => {
  const post = saved({ options: { items: [{ n: 2 }, { n: 1 }] } });
  const { items } = post.options;
  const first = items[0];
  const second = items[1];
  items.sort((a, b) => a.n - b.n);
  assert.equal(items[1], first);
  assert.equal(items[0], second);
  first.n = 3;
  assert.equal(post.changes().options.items[1].n, 3);
  const removed = items.pop();
  assert.equal(removed, first);
  removed.n = 4;
  assert.deepEqual(post.options.items, [{ n: 1 }]);
});

test('sort uses previously observed object identities through edit, save and reload', async (t) => {
  for (const Lookup of [Map, WeakMap]) {
    const blog = await blogWith([], {
      options: z.strictObject({ items: z.array(z.strictObject({ label: z.string() })) })
    });
    t.after(() => blog.close());
    const input = [{ label: 'first' }, { label: 'second' }];
    const post = await blog.create({ title: 'Identity sorting', options: { items: input } });
    const { items } = post.options;
    const [first, second] = items;
    const ranks = new Lookup([
      [first, 2],
      [second, 1]
    ]);
    const cache = new Map([[post.hash(), 'original order']]);
    let retained;
    assert.equal(
      items.sort(function (a, b) {
        assert.equal(this, undefined);
        retained = a;
        return ranks.get(a) - ranks.get(b);
      }),
      items
    );
    assert.equal(items[0], second);
    assert.equal(items[1], first);
    assert.deepEqual(input, [{ label: 'first' }, { label: 'second' }]);
    assert.deepEqual(post.changes().options.items, [{ label: 'second' }, { label: 'first' }]);
    assert.equal(cache.has(post.hash()), false);
    retained.label = 'edited';
    assert.equal(items.includes(retained), true);
    await post.save();
    assert.deepEqual(post.changes(), {});
    const loaded = await blog.find(post.id);
    assert.deepEqual(loaded.options.items, post.toJSON().options.items);
    assert.equal(items[0], second);
    assert.equal(items[1], first);
  }
});

test('shared array values remain live through subsequent edits and exports stay isolated', () => {
  const post = saved({ options: { items: [{ n: 1 }, { n: 2 }] } });
  const { items } = post.options;
  // oxlint-disable-next-line unicorn/no-array-fill-with-reference-type
  items.fill({ n: 3 });
  assert.equal(items[0], items[1]);
  const item = items[0];
  item.n = 4;
  assert.equal(items[0], item);
  assert.equal(items[1], item);
  assert.equal(items[1].n, 4);
  const snapshot = post.toJSON();
  snapshot.options.items[0].n = 9;
  assert.equal(item.n, 4);
});

test('nested numbers preserve signed zero through assignment and array edits', () => {
  const post = saved({ options: { a: { n: 0 }, items: [0, -0] } });
  const { a, items } = post.options;
  a.n = -0;
  assert.ok(Object.is(a.n, -0));
  assert.ok(Object.is(post.changes().options.a.n, -0));
  items.reverse();
  assert.ok(Object.is(items[0], -0));
  assert.ok(Object.is(items[1], 0));
  a.n = 0;
  items.reverse();
  assert.deepEqual(post.changes(), {});
  assert.deepEqual(post.toJSON().options, { a: { n: 0 }, items: [0, -0] });
});

test('borrowed mutators and Object.assign validate sequential writes without corruption', () => {
  const post = saved();
  assert.throws(() => Array.prototype.push.call(post.tags, 'valid', ''));
  assert.deepEqual(post.tags, ['c', 'a', 'b', 'valid']);
  assert.deepEqual(post.changes().tags, ['c', 'a', 'b', 'valid']);
  assert.throws(() => Object.assign(post, { title: 'Edited', tags: [''] }));
  assert.equal(post.title, 'Edited');
  assert.deepEqual(post.tags, ['c', 'a', 'b', 'valid']);
});

test('array descriptors and hostile input cannot bypass nested validation', () => {
  const post = saved();
  const { tags } = post;
  Object.defineProperty(tags, '0', { value: 'defined' });
  Object.defineProperty(tags, 'length', { value: 1 });
  assert.deepEqual(post.changes().tags, ['defined']);
  for (const input of [
    {
      get title() {
        return 'accessor';
      }
    },
    { hidden: new Map() },
    { hidden: Symbol('value') }
  ]) {
    assert.throws(
      () => {
        post.options = input;
      },
      { code: 'YAMB_POST_VALIDATION' }
    );
  }
  const input = JSON.parse('{"__proto__":{"safe":"value"},"constructor":{"safe":true}}');
  assert.throws(
    () => {
      post.options = input;
    },
    { code: 'YAMB_POST_VALIDATION' }
  );
  assert.equal({}.safe, undefined);
  assert.deepEqual(post.options, {});
});

test('incompatible array length descriptors reject before losing elements', () => {
  for (const flag of ['configurable', 'enumerable', 'writable']) {
    const post = saved();
    const { tags } = post;
    assert.throws(() =>
      Object.defineProperty(tags, 'length', {
        value: 1,
        [flag]: flag !== 'writable'
      })
    );
    assert.deepEqual(tags, ['c', 'a', 'b']);
    assert.deepEqual(post.changes(), {});
  }
  const post = saved();
  Object.defineProperty(post.tags, 'length', { value: 1, configurable: false, enumerable: false });
  assert.deepEqual(post.tags, ['c']);
  assert.deepEqual(post.changes(), { tags: ['c'] });
});

test('sort callback cannot introduce cycles, accessors or prototypes into live data', () => {
  for (const edit of [
    (item) => {
      item.self = item;
    },
    (item) =>
      Object.defineProperty(item, 'count', {
        get() {
          return 9;
        },
        enumerable: true
      }),
    (item) => Object.setPrototypeOf(item, { inherited: true })
  ]) {
    const post = saved({ options: { items: [{ count: 2 }, { count: 1 }] } });
    assert.throws(
      () =>
        post.options.items.sort((a) => {
          edit(a);
          return 0;
        }),
      { code: 'YAMB_POST_VALIDATION' }
    );
    assert.deepEqual(post.options.items, [{ count: 2 }, { count: 1 }]);
    assert.deepEqual(post.changes(), {});
  }
});
