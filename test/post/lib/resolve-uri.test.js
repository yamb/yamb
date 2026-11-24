import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveUri } from '../../../src/post/lib/resolve-uri.js';

const t = (iso) => Temporal.Instant.from(iso);

function makeYamb(fetch) {
  return { timeZone: 'UTC', storage: { fetch } };
}

test('no collision → returns the candidate uri unchanged', async () => {
  const data = {
    slug: 'hello',
    title: 'Hello',
    status: 'draft',
    createdAt: t('2026-04-01T00:00:00Z')
  };
  const uri = await resolveUri({
    data,
    yamb: makeYamb(async () => null),
    uri: 'drafts/hello',
    isInsert: true,
    isRename: false
  });

  assert.equal(uri, 'drafts/hello');
  assert.equal(data.slug, 'hello');
});

test('insert draft collision → appends a deterministic suffix', async () => {
  const data = {
    slug: 'hello',
    title: 'Hello',
    status: 'draft',
    createdAt: t('2026-04-01T00:00:00Z')
  };
  const uri = await resolveUri({
    data,
    yamb: makeYamb(async (u) => (u === 'drafts/hello' ? { id: 'other' } : null)),
    uri: 'drafts/hello',
    isInsert: true,
    isRename: false
  });

  assert.match(uri, /^drafts\/hello-[0-9a-f]{6}$/);
  assert.match(data.slug, /^hello-[0-9a-f]{6}$/);
});

test('insert draft collision with suffix also taken → counter bump', async () => {
  const data = {
    slug: 'hello',
    title: 'Hello',
    status: 'draft',
    createdAt: t('2026-04-01T00:00:00Z')
  };
  const uri = await resolveUri({
    data,
    yamb: makeYamb(async (u) => (u.endsWith('-2') ? null : { id: 'x' })),
    uri: 'drafts/hello',
    isInsert: true,
    isRename: false
  });

  assert.ok(uri.endsWith('-2'));
});

test('published collision → hard UriTakenError', async () => {
  const data = {
    slug: 'hello',
    title: 'Hello',
    status: 'published',
    publishedAt: t('2026-04-01T00:00:00Z'),
    createdAt: t('2026-04-01T00:00:00Z')
  };

  await assert.rejects(
    () =>
      resolveUri({
        data,
        yamb: makeYamb(async () => ({ id: 'x' })),
        uri: '2026/04/hello',
        isInsert: true,
        isRename: false
      }),
    { code: 'YAMB_URI_TAKEN' }
  );
});

test('insert draft collision with all-digit hash suffix → counter bump does not strip it as a false counter match', async () => {
  const data = {
    slug: 'hello-5',
    title: 'Hello 5',
    status: 'draft',
    createdAt: t('2026-04-01T00:00:00Z')
  };
  const uri = await resolveUri({
    data,
    yamb: makeYamb(async (u) => (u.endsWith('-2') ? null : { id: 'x' })),
    uri: 'drafts/hello-5',
    isInsert: true,
    isRename: false
  });

  assert.equal(
    uri,
    'drafts/hello-5-709046-2',
    'all-digit hash suffix must survive the counter bump'
  );
});

test('rename onto own existing row (same id) → no collision', async () => {
  const data = {
    id: 'me',
    slug: 'hello',
    title: 'Hello',
    status: 'draft',
    createdAt: t('2026-04-01T00:00:00Z')
  };
  const uri = await resolveUri({
    data,
    yamb: makeYamb(async () => ({ id: 'me' })),
    uri: 'drafts/hello',
    isInsert: false,
    isRename: true
  });

  assert.equal(uri, 'drafts/hello');
});

test('insert draft collision keeps suffixed slugs within 200 characters', async () => {
  const slug = 'a'.repeat(200);
  const data = { slug, title: 'Long', status: 'draft', createdAt: t('2026-04-01T00:00:00Z') };
  const fetched = [];

  const uri = await resolveUri({
    data,
    yamb: makeYamb(async (u) => {
      fetched.push(u);
      return fetched.length <= 2 ? { id: 'other' } : null;
    }),
    uri: `drafts/${slug}`,
    isInsert: true,
    isRename: false
  });

  assert.deepEqual(
    fetched.map((u) => u.length - 'drafts/'.length),
    [200, 200, 200]
  );
  assert.match(data.slug, /^a{191}-[0-9a-f]{6}-2$/);
  assert.equal(uri, `drafts/${data.slug}`);
});
