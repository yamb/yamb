import assert from 'node:assert/strict';
import test from 'node:test';

import { z } from 'zod';

import { blogWith } from '../perf/fixture.js';

function gateMethod(target, method) {
  const entered = Promise.withResolvers();
  const release = Promise.withResolvers();
  const original = target[method].bind(target);

  target[method] = async (...args) => {
    target[method] = original;
    entered.resolve(args);
    await release.promise;

    return original(...args);
  };

  return { entered: entered.promise, release };
}

async function setup(t, config = {}) {
  const blog = await blogWith([], config);
  t.after(() => blog.close());

  return blog;
}

test('save captures source before URI lookup and keeps later scalar and nested edits live', async (t) => {
  const blog = await setup(t);
  const post = blog.build({ title: 'A', text: '**A**', tags: ['a'], meta: { keywords: ['a'] } });
  const { tags } = post;
  const { keywords } = post.meta;
  const lookup = gateMethod(blog.storage, 'fetch');

  const saving = post.save();
  await lookup.entered;

  post.title = 'B';
  post.text = '**B**';
  tags.push('b');
  keywords.push('b');

  lookup.release.resolve();
  await saving;

  const stored = await blog.find(post.id);

  assert.equal(stored.title, 'A');
  assert.equal(stored.text, '**A**');
  assert.deepEqual(stored.tags, ['a']);
  assert.deepEqual(stored.meta.keywords, ['a']);
  assert.equal(post.title, 'B');
  assert.equal(post.tags, tags);
  assert.equal(post.meta.keywords, keywords);
  assert.equal(post.changes().title, 'B');
  assert.deepEqual(post.changes().tags, ['a', 'b']);

  tags.push('c');
  assert.deepEqual(post.tags, ['a', 'b', 'c']);
});

test('storage await confirms only the submitted revision and preserves nested aliases', async (t) => {
  const blog = await setup(t, { options: z.strictObject({ items: z.json() }) });
  const item = { name: 'A' };
  const post = blog.build({ title: 'A', options: { items: [item, item] } });
  const { items } = post.options;
  const alias = items[0];
  const write = gateMethod(blog.storage, 'save');

  const saving = post.save();
  await write.entered;

  post.title = 'B';
  alias.name = 'B';

  write.release.resolve();
  await saving;

  const stored = await blog.find(post.id);

  assert.equal(stored.title, 'A');
  assert.deepEqual(stored.options.items, [{ name: 'A' }, { name: 'A' }]);
  assert.equal(post.options.items, items);
  assert.equal(items[0], alias);
  assert.equal(items[1], alias);
  assert.deepEqual(post.changes().options.items, [{ name: 'B' }, { name: 'B' }]);
});

test('two saves of a new Post write their own revisions to one confirmed identity', async (t) => {
  const blog = await setup(t);
  const post = blog.build({ title: 'A' });
  const write = gateMethod(blog.storage, 'save');

  const first = post.save();
  await write.entered;

  post.title = 'B';
  const second = post.save();
  post.title = 'C';

  write.release.resolve();
  await first;

  const { id, createdAt } = post;

  await second;

  assert.equal(post.id, id);
  assert.equal(post.createdAt, createdAt);
  const posts = await blog.all({ status: 'draft' }).toArray();
  const stored = await blog.find(id);

  assert.equal(posts.length, 1);
  assert.equal(stored.title, 'B');
  assert.equal(post.title, 'C');
  assert.equal(post.changes().title, 'C');
});

test('queued revert saves A after B even when changes was empty at invocation', async (t) => {
  const blog = await setup(t);
  const post = await blog.create({ title: 'A' });
  const write = gateMethod(blog.storage, 'save');
  post.title = 'B';

  const first = post.save();
  await write.entered;

  post.title = 'A';
  assert.deepEqual(post.changes(), {});

  const second = post.save();
  write.release.resolve();
  await Promise.all([first, second]);

  const stored = await blog.find(post.id);

  assert.equal(stored.title, 'A');
  assert.deepEqual(post.changes(), {});
});

test('true no-op leaves the date alone and requires neither storage nor clock', async (t) => {
  let now = '2026-11-10T09:00:00Z';
  const blog = await setup(t, { clock: () => Temporal.Instant.from(now) });
  const post = await blog.create({ title: 'A' });
  const original = post.updatedAt;
  post.title = 'B';
  post.title = 'A';

  now = 'invalid clock: no-op must not read it';
  blog.storage.save = () => {
    throw new Error('no-op must not write');
  };
  blog.storage.fetch = () => {
    throw new Error('no-op must not look up URI');
  };

  await post.save();

  assert.equal(post.updatedAt, original);
  assert.deepEqual(post.changes(), {});
});

test('failed write rejects pending save/remove but a new explicit save keeps all edits', async (t) => {
  const blog = await setup(t);
  const post = await blog.create({ title: 'A' });
  const before = post.updatedAt;
  const write = gateMethod(blog.storage, 'save');
  post.title = 'B';
  const first = post.save();
  await write.entered;
  post.title = 'C';
  const second = post.save();
  const removing = post.remove();
  const results = Promise.allSettled([first, second, removing]);

  write.release.reject(new Error('connection lost'));

  const failures = await results;

  assert.deepEqual(
    failures.map((r) => r.status),
    ['rejected', 'rejected', 'rejected']
  );
  assert.equal(post.updatedAt, before);
  const stored = await blog.find(post.id);
  assert.equal(stored.title, 'A');
  assert.equal(post.title, 'C');
  assert.equal(post.changes().title, 'C');

  await post.save();

  const retried = await blog.find(post.id);

  assert.equal(retried.title, 'C');
  assert.deepEqual(post.changes(), {});
});

test('failed first insert rejects a queued insert and permits a later explicit save', async (t) => {
  const blog = await setup(t);
  const post = blog.build({ title: 'A' });
  const write = gateMethod(blog.storage, 'save');
  const first = post.save();
  await write.entered;
  post.title = 'B';
  const second = post.save();
  const results = Promise.allSettled([first, second]);

  write.release.reject(new Error('connection lost'));

  const failures = await results;

  assert.deepEqual(
    failures.map((r) => r.status),
    ['rejected', 'rejected']
  );
  assert.equal(post.id, null);
  assert.deepEqual(await blog.all({ status: 'draft' }).toArray(), []);
  assert.equal(post.title, 'B');

  await post.save();

  const stored = await blog.find(post.id);

  assert.equal(stored.title, 'B');
});

test('save then remove uses the confirmed insert id and deleted instances cannot save', async (t) => {
  const blog = await setup(t);
  const post = blog.build({ title: 'A' });
  const write = gateMethod(blog.storage, 'save');
  const saving = post.save();
  await write.entered;
  const removing = post.remove();

  write.release.resolve();
  await saving;

  const { id } = post;

  await removing;

  assert.equal(post.id, id);
  assert.equal(await blog.find(id), null);
  await assert.rejects(post.save(), { code: 'YAMB_POST_NOT_FOUND' });
});

test('remove then save is ordered; removing an unsaved Post has no persistent effect', async (t) => {
  const blog = await setup(t);
  const fresh = blog.build({ title: 'Fresh' });

  await fresh.remove();
  await fresh.save();

  const stored = await blog.find(fresh.id);
  assert.equal(stored.title, 'Fresh');

  const removal = gateMethod(blog.storage, 'remove');
  const removing = fresh.remove();
  await removal.entered;
  fresh.title = 'Later';
  const saving = assert.rejects(fresh.save(), { code: 'YAMB_POST_NOT_FOUND' });

  removal.release.resolve();
  await Promise.all([removing, saving]);

  assert.equal(await blog.find(fresh.id), null);
  assert.equal(fresh.title, 'Later');
});

test('abort during URI lookup prevents sending and a committed write survives abort', async (t) => {
  const blog = await setup(t);
  const post = blog.build({ title: 'A' });
  const controller = new AbortController();
  const lookup = gateMethod(blog.storage, 'fetch');
  const saving = post.save({ signal: controller.signal });

  await lookup.entered;
  controller.abort();
  lookup.release.resolve();

  await assert.rejects(saving, { name: 'AbortError' });
  assert.deepEqual(await blog.all({ status: 'draft' }).toArray(), []);

  const lateAbort = new AbortController();
  const written = Promise.withResolvers();
  const confirm = Promise.withResolvers();
  const save = blog.storage.save.bind(blog.storage);
  blog.storage.save = async (...args) => {
    const result = await save(...args);
    written.resolve();
    await confirm.promise;
    return result;
  };

  const committed = post.save({ signal: lateAbort.signal });

  await written.promise;
  lateAbort.abort();
  confirm.resolve();
  await committed;

  const stored = await blog.find(post.id);

  assert.equal(stored.title, 'A');
  assert.deepEqual(post.changes(), {});
});

test('queued abort never sends the cancelled revision and later explicit save is allowed', async (t) => {
  const blog = await setup(t);
  const post = await blog.create({ title: 'A' });
  const write = gateMethod(blog.storage, 'save');
  post.title = 'B';
  const first = post.save();
  await write.entered;
  post.title = 'C';
  const controller = new AbortController();
  const second = assert.rejects(post.save({ signal: controller.signal }), { name: 'AbortError' });

  controller.abort();
  write.release.resolve();
  await Promise.all([first, second]);

  const stored = await blog.find(post.id);

  assert.equal(stored.title, 'B');
  assert.equal(post.changes().title, 'C');

  await post.save();

  const retried = await blog.find(post.id);

  assert.equal(retried.title, 'C');
});

test('publish, schedule and archive use revision saves and failures keep the working transition', async (t) => {
  const blog = await setup(t);
  const post = await blog.create({ title: 'A' });
  const write = gateMethod(blog.storage, 'save');
  const publishing = post.publish();
  await write.entered;
  post.title = 'Edited';
  const when = Temporal.Instant.from('2026-12-01T12:00:00Z');
  const scheduling = post.schedule(when);

  write.release.resolve();
  await Promise.all([publishing, scheduling]);

  const stored = await blog.find(post.id);

  assert.equal(stored.status, 'scheduled');
  assert.equal(stored.title, 'Edited');
  assert.equal(stored.publishedAt.toString(), when.toString());
  assert.deepEqual(post.changes(), {});

  const failure = gateMethod(blog.storage, 'save');
  const archiving = post.archive();
  await failure.entered;
  post.title = 'Still editing';

  failure.release.reject(new Error('offline'));
  await assert.rejects(archiving, /offline/);

  assert.equal(post.status, 'archived');
  assert.equal(post.title, 'Still editing');
  assert.equal(post.changes().status, 'archived');
  const unchanged = await blog.find(post.id);
  assert.equal(unchanged.status, 'scheduled');
});

test('confirmed generated values never overwrite newer slug or date intent', async (t) => {
  const blog = await setup(t);
  const post = blog.build({ title: 'A', status: 'published' });
  const write = gateMethod(blog.storage, 'save');
  const saving = post.save();
  await write.entered;
  post.slug = 'later';
  post.publishedAt = undefined;
  post.createdAt = '2026-10-01T12:00:00Z';

  write.release.resolve();
  await saving;

  assert.equal(post.slug, 'later');
  assert.equal(post.publishedAt, undefined);
  assert.equal(post.createdAt.toString(), '2026-10-01T12:00:00Z');
  assert.equal(post.changes().slug, 'later');
  assert.ok(Object.hasOwn(post.changes(), 'publishedAt'));
  const stored = await blog.find(post.id);
  assert.equal(stored.slug, 'a');
});

test('save preserves Markdown bytes and does not run a renderer or repeat options defaults', async (t) => {
  let edition = 0;
  const blog = await setup(t, {
    options: z.strictObject({ edition: z.number().default(() => ++edition) }),
    renderers: {
      article: {
        name: 'article',
        version: '1',
        post() {
          throw new Error('save must not render source');
        }
      }
    }
  });
  const source = '# "Source"\r\n\n**a -- b**  \n';
  const post = await blog.create({ title: 'Source', text: source, preview: source });

  post.title = 'Edited';
  await post.save();

  assert.equal(post.options.edition, 1);
  const loaded = await blog.find(post.id);
  assert.equal(loaded.text, source);
  assert.equal(loaded.preview, source);
  assert.equal(loaded.options.edition, 1);
});

test('save owns the revision immediately, even before the caller first yields', async (t) => {
  const blog = await setup(t);
  const post = blog.build({ title: '  A  ', tags: ['a'] });

  const saving = post.save();
  post.title = 'B';
  post.tags.push('b');
  await saving;

  const stored = await blog.find(post.id);

  assert.equal(stored.title, 'A');
  assert.deepEqual(stored.tags, ['a']);
  assert.equal(post.title, 'B');
  assert.deepEqual(post.changes().tags, ['a', 'b']);
});

test('a rename lookup keeps its submitted URI while later slug and date edits remain pending', async (t) => {
  const blog = await setup(t);
  const post = await blog.create({ title: 'A', status: 'published' });
  post.slug = 'submitted';
  const lookup = gateMethod(blog.storage, 'fetch');
  const saving = post.save();
  await lookup.entered;

  post.slug = 'later';
  post.publishedAt = '2026-12-01T12:00:00Z';

  lookup.release.resolve();
  await saving;

  const stored = await blog.find(post.id);

  assert.equal(stored.uri, '2026/11/submitted');
  assert.equal(post.uri, '2026/12/later');
  assert.equal(post.changes().uri, '2026/12/later');

  await post.save();

  const latest = await blog.find(post.id);
  assert.equal(latest.uri, '2026/12/later');
  assert.equal(blog.locate(post.id), latest.uri);
});

test('queued new revision inherits the confirmed collision suffix instead of inserting again', async (t) => {
  const blog = await setup(t);
  const occupied = await blog.create({ title: 'Same' });
  const post = blog.build({ title: 'Same' });
  const write = gateMethod(blog.storage, 'save');
  const first = post.save();
  await write.entered;
  post.text = 'Second revision';
  const second = post.save();

  write.release.resolve();
  await first;

  const { id, slug } = post;

  await second;

  const stored = await blog.find(id);
  const drafts = await blog.all({ status: 'draft' }).toArray();

  assert.equal(drafts.length, 2);
  assert.notEqual(slug, occupied.slug);
  assert.equal(stored.slug, slug);
  assert.equal(stored.text, 'Second revision');
  assert.deepEqual(post.changes(), {});
});

test('failed removal preserves the record, rejects a pending save and permits a new save', async (t) => {
  const blog = await setup(t);
  const post = await blog.create({ title: 'A' });
  const removal = gateMethod(blog.storage, 'remove');
  const removing = post.remove();
  await removal.entered;
  post.title = 'B';
  const saving = post.save();
  const outcomes = Promise.allSettled([removing, saving]);

  removal.release.reject(new Error('offline'));

  const failures = await outcomes;

  assert.deepEqual(
    failures.map((result) => result.status),
    ['rejected', 'rejected']
  );
  const unchanged = await blog.find(post.id);
  assert.equal(unchanged.title, 'A');
  assert.equal(post.changes().title, 'B');

  await post.save();

  const retried = await blog.find(post.id);

  assert.equal(retried.title, 'B');
});

test('insert/update modes and untrusted ids cannot silently overwrite another Post', async (t) => {
  const blog = await setup(t);
  const existing = await blog.create({ title: 'Original' });
  const supplied = blog.build({ id: existing.id, title: 'Replacement' });

  await assert.rejects(supplied.save(), { code: 'YAMB_POST_VALIDATION' });
  await assert.rejects(supplied.save({ mode: 'insert' }), { code: 'YAMB_POST_VALIDATION' });
  const fresh = blog.build({ title: 'New' });
  await assert.rejects(fresh.save({ mode: 'update' }), { code: 'YAMB_POST_VALIDATION' });
  const unchanged = await blog.find(existing.id);
  assert.equal(unchanged.title, 'Original');

  supplied.slug = existing.slug;
  await supplied.save({ mode: 'update' });
  const replaced = await blog.find(existing.id);

  assert.equal(replaced.title, 'Replacement');
  assert.equal(supplied.id, existing.id);
});

test('abort before save/remove and while remove is queued never sends those operations', async (t) => {
  const blog = await setup(t);
  const post = await blog.create({ title: 'A' });

  await assert.rejects(post.remove({ signal: AbortSignal.abort() }), { name: 'AbortError' });
  post.title = 'B';
  await assert.rejects(post.save({ signal: AbortSignal.abort() }), { name: 'AbortError' });
  const unchanged = await blog.find(post.id);
  assert.equal(unchanged.title, 'A');

  const write = gateMethod(blog.storage, 'save');
  const saving = post.save();
  await write.entered;
  const controller = new AbortController();
  const removing = assert.rejects(post.remove({ signal: controller.signal }), {
    name: 'AbortError'
  });

  controller.abort();
  write.release.resolve();
  await Promise.all([saving, removing]);

  const stored = await blog.find(post.id);

  assert.equal(stored.title, 'B');
});

test('save-time link defaults preserve a previously read live container', async (t) => {
  const blog = await setup(t);
  const target = await blog.create({ title: 'Target' });
  const post = blog.build({ title: 'Source', links: {} });
  const { links } = post;

  await post.save();

  assert.equal(post.links, links);
  assert.deepEqual(links.related, []);

  links.related.push(target.id);
  assert.deepEqual(post.changes().links, { related: [target.id] });

  await post.save();

  const stored = await blog.find(post.id);

  assert.deepEqual(stored.links.related, [target.id]);
});

test('remove of an unconfirmed build with another Post id leaves that record intact', async (t) => {
  const blog = await setup(t);
  const existing = await blog.create({ title: 'Original' });
  const unsaved = blog.build({ id: existing.id, title: 'Never saved' });

  await assert.rejects(unsaved.save(), { code: 'YAMB_POST_VALIDATION' });
  await unsaved.remove();

  const remaining = await blog.find(existing.id);

  assert.equal(remaining?.title, 'Original');
  assert.equal(blog.locate(existing.id), existing.uri);
  assert.equal(unsaved.id, existing.id);
  await assert.rejects(unsaved.save(), { code: 'YAMB_POST_VALIDATION' });
});

test('loaded and explicitly updated Posts can still be removed after confirmation', async (t) => {
  const blog = await setup(t);
  const original = await blog.create({ title: 'Original' });
  const loaded = await blog.find(original.id);

  await loaded.remove();
  assert.equal(await blog.find(original.id), null);

  const existing = await blog.create({ title: 'Second' });
  const explicit = blog.build({ id: existing.id, title: 'Replacement', slug: existing.slug });

  await explicit.save({ mode: 'update' });
  const replaced = await blog.find(existing.id);
  assert.equal(replaced.title, 'Replacement');

  await explicit.remove();
  assert.equal(await blog.find(existing.id), null);
  assert.equal(explicit.id, existing.id);
});

test('ack keeps late scalar/nested reverts, optional clears and derived URI edits pending', async (t) => {
  const blog = await setup(t, { options: z.strictObject({ notes: z.array(z.string()) }) });
  const post = await blog.create({
    title: 'A',
    text: 'Source',
    preview: 'Preview',
    status: 'published',
    tags: ['base'],
    meta: { description: 'Before' },
    options: { notes: ['base'] }
  });
  const { tags, meta, options } = post;

  post.title = 'B';
  post.tags[0] = 'submitted';
  post.meta.description = 'Submitted';
  post.options.notes[0] = 'submitted';
  post.slug = 'submitted';
  const write = gateMethod(blog.storage, 'save');
  const saving = post.save();
  await write.entered;

  post.title = 'A';
  tags[0] = 'base';
  meta.description = 'Before';
  options.notes[0] = 'base';
  post.slug = 'a';
  post.preview = undefined;
  post.publishedAt = undefined;

  write.release.resolve();
  await saving;

  assert.equal(post.tags, tags);
  assert.equal(post.meta, meta);
  assert.equal(post.options, options);
  assert.deepEqual(post.changes(), {
    title: 'A',
    tags: ['base'],
    meta: { description: 'Before' },
    options: { notes: ['base'] },
    slug: 'a',
    uri: 'drafts/a',
    preview: undefined,
    publishedAt: undefined
  });
  const submitted = await blog.find(post.id);
  assert.equal(submitted.title, 'B');
  assert.equal(submitted.uri, '2026/11/submitted');
  assert.deepEqual(submitted.options.notes, ['submitted']);

  await post.save();
  assert.deepEqual(post.changes(), {});

  post.title = 'Next';
  assert.deepEqual(post.changes(), { title: 'Next' });
  post.title = 'A';
  assert.deepEqual(post.changes(), {});
});
