import assert from 'node:assert/strict';
import test from 'node:test';

import { z } from 'zod';

import { blogWith, postData } from '../perf/fixture.js';

const validationError = { code: 'YAMB_POST_VALIDATION' };

test('query options preserve refinements on default and optional wrappers', async (t) => {
  const blog = await blogWith([], {
    options: z.strictObject({
      rating: z
        .number()
        .default(1)
        .refine((value) => value > 0),
      edition: z
        .number()
        .optional()
        .refine((value) => value === undefined || value > 0)
    })
  });
  t.after(() => blog.close());
  assert.equal(blog.build({ title: 'Default rating' }).options.rating, 1);
  assert.throws(() => blog.build({ title: 'Invalid', options: { rating: -1 } }), validationError);
  for (const options of [{ rating: -1 }, { edition: -1 }]) {
    assert.throws(() => blog.all({ options }), { code: 'YAMB_QUERY_VALIDATION' });
  }
  assert.deepEqual(await blog.all({ options: { rating: 1 } }).toArray(), []);
});

test('a default cannot conceal a transform that removes its explicit value', async () => {
  await assert.rejects(
    () =>
      blogWith([], {
        options: z.strictObject({
          homepage: z
            .boolean()
            .transform(() => undefined)
            .default(() => false)
        })
      }),
    { code: 'YAMB_CONFIG_INVALID' }
  );
});

test('captured defaults remain usable when their source becomes unavailable', async (t) => {
  let available = true;
  const blog = await blogWith([], {
    options: z.strictObject({
      homepage: z.boolean().default(() => {
        if (!available) {
          throw new Error('default source unavailable');
        }
        return false;
      }),
      rating: z
        .number()
        .transform((value) => (value < 0 ? undefined : value))
        .default(1)
    })
  });
  t.after(() => blog.close());
  available = false;
  const post = await blog.create({ title: 'Captured defaults' });
  assert.deepEqual(post.options, { homepage: false, rating: 1 });
  assert.throws(() => {
    post.options.rating = -1;
  }, validationError);
  const loaded = await blog.find(post.id);
  assert.deepEqual(loaded.options, { homepage: false, rating: 1 });
});

test('missing stored homepage gets a clean default; edits survive snapshot, save and reload', async (t) => {
  const row = { ...postData(), id: 'old-homepage', uri: '2026/11/baseline-0' };
  delete row.options;
  const blog = await blogWith([row], {
    options: z.strictObject({ homepage: z.boolean().default(false) })
  });
  t.after(() => blog.close());
  const post = await blog.find(row.id);
  assert.equal(post.options.homepage, false);
  assert.deepEqual(post.changes(), {});
  post.options.homepage = true;
  assert.deepEqual(post.changes().options, { homepage: true });
  assert.deepEqual(post.toJSON().options, { homepage: true });
  assert.throws(() => {
    post.options.homepage = 'yes';
  }, validationError);
  assert.equal(post.options.homepage, true);
  await post.save();
  assert.deepEqual(post.changes(), {});
  const loaded = await blog.find(row.id);
  assert.equal(loaded.options.homepage, true);
});

test('defaults are fixed per blog and nested values belong to each Post and snapshot', async (t) => {
  let nextEdition = 10;
  const blog = await blogWith([], {
    options: z.strictObject({
      edition: z
        .number()
        .default(() => ++nextEdition)
        .optional(),
      layout: z.strictObject({ sections: z.array(z.string()) }).default({ sections: ['intro'] })
    })
  });
  t.after(() => blog.close());
  const first = blog.build({ title: 'First' });
  const second = blog.build({ title: 'Second' });
  assert.equal(first.options.edition, 11);
  assert.equal(second.options.edition, 11);
  first.options.layout.sections.push('body');
  assert.deepEqual(second.options.layout.sections, ['intro']);
  const snapshot = first.toJSON();
  snapshot.options.layout.sections.push('outside');
  assert.deepEqual(first.options.layout.sections, ['intro', 'body']);
  await first.save();
  const loaded = await blog.find(first.id);
  assert.deepEqual(loaded.options, {
    edition: 11,
    layout: { sections: ['intro', 'body'] }
  });
  first.options = {};
  assert.deepEqual(first.options, { edition: 11, layout: { sections: ['intro'] } });
  delete first.options.edition;
  assert.equal(first.options.edition, 11);
  first.options = undefined;
  assert.deepEqual(first.options, { edition: 11, layout: { sections: ['intro'] } });
});

test('old posts get the same configured defaults through repeated lookup and lazy listing', async (t) => {
  let edition = 20;
  const rows = [0, 1].map((index) => {
    const row = postData(1024, index);
    row.id = `edition-${index}`;
    row.uri = `2026/11/baseline-${index}`;
    return row;
  });
  const blog = await blogWith(rows, {
    options: z.strictObject({ edition: z.number().default(() => ++edition) })
  });
  t.after(() => blog.close());
  const first = await blog.find('edition-0');
  const again = await blog.find('edition-0');
  assert.equal(first.options.edition, 21);
  assert.equal(again.options.edition, 21);
  const posts = await blog.all().toArray();
  assert.deepEqual(
    posts.map((post) => post.options.edition),
    [21, 21]
  );
  for (const post of posts) {
    assert.deepEqual(post.changes(), {});
  }
});

test('optional fields can be removed and invalid old nested data is never silently stripped', async (t) => {
  const row = {
    ...postData(),
    id: 'invalid-nested',
    uri: '2026/11/baseline-0',
    options: { layout: { size: 3, unexpected: true } }
  };
  const blog = await blogWith([row], {
    options: z.strictObject({
      layout: z.object({ size: z.number() }),
      note: z.string().optional()
    })
  });
  t.after(() => blog.close());
  await assert.rejects(() => blog.find(row.id), { code: 'YAMB_STORAGE_READ' });
  const input = { layout: { size: 3 }, note: 'Draft' };
  const post = await blog.create({ title: 'Layout', options: input });
  input.layout.size = 99;
  assert.equal(post.options.layout.size, 3);
  delete post.options.note;
  assert.deepEqual(post.changes().options, { layout: { size: 3 } });
  await post.save();
  const loaded = await blog.find(post.id);
  assert.deepEqual(loaded.options, { layout: { size: 3 } });
});

test('full assignment updates dependent fields atomically and nested failures preserve live data', async (t) => {
  const blog = await blogWith([], {
    options: z
      .strictObject({ start: z.number(), end: z.number(), labels: z.array(z.string()) })
      .refine(({ start, end }) => start <= end, { message: 'invalid interval' })
  });
  t.after(() => blog.close());
  const post = await blog.create({
    title: 'Interval',
    options: { start: 1, end: 2, labels: ['a'] }
  });
  const previous = post.options;
  assert.throws(() => {
    post.options.start = 3;
  }, validationError);
  assert.deepEqual(post.changes(), {});
  assert.throws(() => {
    delete post.options.start;
  }, validationError);
  assert.throws(() => {
    post.options.labels.push('b', 7);
  }, validationError);
  assert.deepEqual(post.options.labels, ['a']);
  post.options = { start: 3, end: 4, labels: ['new'] };
  previous.labels.push('detached');
  assert.deepEqual(post.options, { start: 3, end: 4, labels: ['new'] });
  assert.deepEqual(post.changes().options, { start: 3, end: 4, labels: ['new'] });
  assert.throws(() => {
    post.options = { start: 8, end: 4, labels: [] };
  }, validationError);
  assert.equal(post.options.start, 3);
  await post.save();
  const loaded = await blog.find(post.id);
  assert.deepEqual(loaded.options, { start: 3, end: 4, labels: ['new'] });
  assert.throws(() => blog.build({ title: 'Missing' }), validationError);
});

test('without a schema options stays empty and unrecognized stored values are rejected', async (t) => {
  const row = {
    ...postData(),
    id: 'unknown-options',
    uri: '2026/11/baseline-0',
    options: { homepage: true }
  };
  const blog = await blogWith([row]);
  t.after(() => blog.close());
  const post = blog.build({ title: 'No options' });
  assert.deepEqual(post.options, {});
  assert.throws(() => {
    post.options.homepage = true;
  }, validationError);
  assert.throws(() => {
    post.options = { homepage: true };
  }, validationError);
  for (const input of [
    null,
    [],
    new Map(),
    Object.defineProperty({}, 'hidden', { value: true }),
    {
      get hidden() {
        return true;
      }
    },
    { [Symbol('hidden')]: true }
  ]) {
    assert.throws(() => {
      post.options = input;
    }, validationError);
  }
  const input = {};
  post.options = input;
  input.homepage = true;
  assert.deepEqual(post.options, {});
  await assert.rejects(() => blog.find(row.id), { code: 'YAMB_STORAGE_READ' });
  await post.save();
});

test('options reject non-finite JSON without damaging a previously saved Post', async (t) => {
  const blog = await blogWith([], { options: z.strictObject({ value: z.json().optional() }) });
  t.after(() => blog.close());
  const post = await blog.create({ title: 'JSON', options: { value: { safe: [1, true, null] } } });
  const cycle = {};
  cycle.self = cycle;
  for (const value of [
    NaN,
    Infinity,
    1n,
    () => 1,
    Symbol('x'),
    new Date(),
    new Map(),
    Temporal.Now.instant(),
    [undefined],
    { bad: undefined },
    cycle
  ]) {
    assert.throws(() => {
      post.options.value = value;
    }, validationError);
    assert.deepEqual(post.options.value, { safe: [1, true, null] });
    assert.deepEqual(post.changes(), {});
  }
});

test('an application with an empty options schema still rejects forbidden edits', async (t) => {
  let allowed = true;
  const blog = await blogWith([], {
    options: z.strictObject({}).refine(() => allowed)
  });
  t.after(() => blog.close());
  const post = await blog.create({ title: 'Policy' });
  allowed = false;
  assert.throws(() => {
    post.options = {};
  }, validationError);
  assert.throws(() => blog.build({ title: 'Blocked' }), validationError);
  assert.deepEqual(post.options, {});
  assert.deepEqual(post.changes(), {});
});

test('invalid schema results cannot replace valid saved options', async (t) => {
  let replacement;
  const blog = await blogWith([], {
    options: z.strictObject({
      value: z.number().transform((value) => (value === 1 ? value : replacement))
    })
  });
  t.after(() => blog.close());
  const post = await blog.create({ title: 'Schema output', options: { value: 1 } });
  const cycle = {};
  cycle.self = cycle;
  const accessor = {
    get value() {
      return 2;
    }
  };
  for (const output of [Infinity, undefined, Temporal.Now.instant(), () => 2, cycle, accessor]) {
    replacement = output;
    assert.throws(() => {
      post.options.value = 2;
    }, validationError);
    assert.throws(() => {
      post.options = { value: 2 };
    }, validationError);
    assert.deepEqual(post.options, { value: 1 });
    assert.deepEqual(post.changes(), {});
  }
});

test('retained schema callback data cannot modify a Post or its saved revision', async (t) => {
  let retained;
  const blog = await blogWith([], {
    options: z.strictObject({ value: z.json() }).refine((data) => {
      retained = data.value;
      return true;
    })
  });
  t.after(() => blog.close());
  const post = await blog.create({ title: 'Isolated callback', options: { value: { n: 1 } } });
  retained.n = 90;
  assert.deepEqual(post.options.value, { n: 1 });
  assert.deepEqual(post.changes(), {});
  post.options.value.n = 2;
  retained.n = 91;
  assert.deepEqual(post.options.value, { n: 2 });
  assert.deepEqual(post.changes().options, { value: { n: 2 } });
  await post.save();
  const loaded = await blog.find(post.id);
  retained.n = 92;
  assert.deepEqual(loaded.options.value, { n: 2 });
  assert.deepEqual(loaded.changes(), {});
});

test('value-changing schema effects fail synchronously and leave existing values untouched', async (t) => {
  const blog = await blogWith([], {
    options: z.strictObject({ value: z.coerce.number(), label: z.string().trim() })
  });
  t.after(() => blog.close());
  const post = await blog.create({ title: 'Effects', options: { value: 2, label: 'ok' } });
  assert.throws(() => {
    post.options.value = '3';
  }, validationError);
  assert.throws(() => {
    post.options.label = ' trimmed ';
  }, validationError);
  assert.deepEqual(post.options, { value: 2, label: 'ok' });
  assert.deepEqual(post.changes(), {});
});

test('async refinements cannot partially edit a Post', async (t) => {
  const blog = await blogWith([], {
    options: z.strictObject({
      value: z.number().refine((value) => value === 1 || Promise.resolve(true))
    })
  });
  t.after(() => blog.close());
  const post = await blog.create({ title: 'Sync only', options: { value: 1 } });
  assert.throws(() => {
    post.options.value = 2;
  }, validationError);
  assert.equal(post.options.value, 1);
  assert.deepEqual(post.changes(), {});
});

test('schema callbacks cannot reenter options and leave partial replacements behind', async (t) => {
  let post = null;
  const blog = await blogWith([], {
    options: z.strictObject({ value: z.number() }).refine((data) => {
      if (data.value === 2) {
        post.options = { value: 3 };
      }
      return true;
    })
  });
  t.after(() => blog.close());
  post = await blog.create({ title: 'Protected edit', options: { value: 1 } });
  assert.throws(() => {
    post.options = { value: 2 };
  }, validationError);
  assert.throws(() => {
    post.options.value = 2;
  }, validationError);
  assert.equal(post.options.value, 1);
  assert.deepEqual(post.changes(), {});
});
