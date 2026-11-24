import assert from 'node:assert/strict';
import test from 'node:test';

import {
  AuthorSchema,
  SocialSchema,
  UriSchema,
  SlugSchema,
  TagSchema,
  StatusSchema,
  TitleSchema,
  CoverSchema,
  TagsSchema,
  InstantSchema,
  QuerySchema,
  OptionsSchema,
  ConfigSchema,
  IdSchema,
  LinksSchema,
  PostSchema
} from '../../src/schemas/zod.js';

const inst = (iso) => Temporal.Instant.from(iso);

function fullPost(overrides = {}) {
  return {
    uri: '2026/04/hello',
    slug: 'hello',
    title: 'Hello',
    status: 'published',
    text: '',
    tags: [],
    links: { related: [] },
    createdAt: inst('2026-04-01T00:00:00Z'),
    updatedAt: inst('2026-04-01T00:00:00Z'),
    publishedAt: inst('2026-04-01T00:00:00Z'),
    ...overrides
  };
}

test('UriSchema accepts canonical uri', () => {
  const result = UriSchema.parse('2026/04/hello-world');
  assert.equal(result, '2026/04/hello-world');
});

test('UriSchema accepts draft uri', () => {
  assert.equal(UriSchema.parse('drafts/hello-world'), 'drafts/hello-world');
});

test('UriSchema rejects bad shape', () => {
  assert.throws(() => UriSchema.parse('hello-world'));
  assert.throws(() => UriSchema.parse('/2026/04/hello'));
  assert.throws(() => UriSchema.parse('2026/4/hello'));
  assert.throws(() => UriSchema.parse('drafts/'));
  assert.throws(() => UriSchema.parse('draft/hello'));
});

test('SlugSchema accepts kebab', () => {
  assert.equal(SlugSchema.parse('hello-world'), 'hello-world');
});

test('SlugSchema rejects uppercase or spaces', () => {
  assert.throws(() => SlugSchema.parse('Hello World'));
  assert.throws(() => SlugSchema.parse('hello_world'));
});

test('TagSchema accepts non-empty short string', () => {
  assert.equal(TagSchema.parse('javascript'), 'javascript');
});

test('StatusSchema accepts known values', () => {
  assert.equal(StatusSchema.parse('draft'), 'draft');
  assert.equal(StatusSchema.parse('published'), 'published');
});

test('StatusSchema rejects unknown', () => {
  assert.throws(() => StatusSchema.parse('archived-2'));
});

test('TitleSchema trims and validates', () => {
  assert.equal(TitleSchema.parse('  Hello  '), 'Hello');
  assert.throws(() => TitleSchema.parse(''));
  assert.throws(() => TitleSchema.parse('x'.repeat(501)));
});

test('CoverSchema accepts http and relative', () => {
  assert.deepEqual(CoverSchema.parse({ url: 'https://example.com/img.jpg' }), {
    url: 'https://example.com/img.jpg'
  });
  assert.deepEqual(CoverSchema.parse({ url: '/covers/x.jpg' }), { url: '/covers/x.jpg' });
  assert.deepEqual(CoverSchema.parse({ url: './local.jpg' }), { url: './local.jpg' });
});

test('AuthorSchema and CoverSchema accept absolute URLs on local hosts', () => {
  for (const url of ['http://localhost:3000/about', 'http://127.0.0.1/a', 'http://[::1]/a']) {
    assert.equal(AuthorSchema.parse({ name: 'A', url }).url, url);
    assert.deepEqual(CoverSchema.parse({ url }), { url });
    assert.equal(SocialSchema.parse({ image: url }).image, url);
  }
});

test('AuthorSchema rejects URLs with credentials', () => {
  assert.throws(() => AuthorSchema.parse({ name: 'A', url: 'https://user:pass@example.com/' }));
});

test('CoverSchema rejects javascript: and data:', () => {
  assert.throws(() => CoverSchema.parse({ url: 'javascript:alert(1)' }));
  assert.throws(() => CoverSchema.parse({ url: 'data:text/html,x' }));
});

test('TagsSchema rejects too many tags', () => {
  const tooMany = Array.from({ length: 51 }, (_, i) => `tag-${i}`);
  assert.throws(() => TagsSchema.parse(tooMany));
});

test('QuerySchema strict object', () => {
  assert.deepEqual(QuerySchema.parse({ status: 'draft' }), { status: 'draft' });
  assert.throws(() => QuerySchema.parse({ unknown: 'x' }));
});

test('QuerySchema rejects operator injection', () => {
  assert.throws(() => QuerySchema.parse({ status: { $ne: 'draft' } }));
});

test('OptionsSchema accepts limit null', () => {
  assert.deepEqual(OptionsSchema.parse({ limit: null }), { limit: null });
});

test('InstantSchema accepts iso string and Date', () => {
  const isoResult = InstantSchema.parse('2026-04-26T10:00:00Z');
  assert.ok(isoResult instanceof Temporal.Instant);
  const dateResult = InstantSchema.parse(new Date('2026-04-26T10:00:00Z'));
  assert.ok(dateResult instanceof Temporal.Instant);
});

test('ConfigSchema requires storage', () => {
  assert.throws(() => ConfigSchema.parse({}));
});

test('IdSchema accepts valid id strings', () => {
  assert.doesNotThrow(() => IdSchema.parse('670fab12cd34ef5678901234'));
  assert.doesNotThrow(() => IdSchema.parse('019700ab-cdef-7890-abcd-1234567890ab'));
});

test('IdSchema rejects empty strings', () => {
  assert.throws(() => IdSchema.parse(''));
});

test('IdSchema rejects non-strings', () => {
  assert.throws(() => IdSchema.parse(123));
  assert.throws(() => IdSchema.parse(null));
});

test('IdSchema rejects strings over 64 chars', () => {
  assert.throws(() => IdSchema.parse('a'.repeat(65)));
});

test('LinksSchema accepts array of id strings', () => {
  const out = LinksSchema.parse({
    related: ['670fab12cd34ef5678901234', '019700ab-cdef-7890-abcd-1234567890ab']
  });

  assert.equal(out.related.length, 2);
});

test('LinksSchema defaults related to []', () => {
  const out = LinksSchema.parse({});
  assert.deepEqual(out.related, []);
});

test('LinksSchema rejects related items longer than 64 chars', () => {
  assert.throws(() => LinksSchema.parse({ related: ['a'.repeat(65)] }));
});

test('InstantSchema: invalid Date is a failed parse, not a thrown RangeError', () => {
  let result;
  assert.doesNotThrow(() => {
    result = InstantSchema.safeParse(new Date('not a date'));
  });
  assert.equal(result.success, false);
});

test('InstantSchema rejects years outside the sortable 0001-9999 range', () => {
  assert.equal(InstantSchema.safeParse(inst('2026-04-01T00:00:00Z')).success, true);
  assert.equal(
    InstantSchema.safeParse(Temporal.Instant.from('+010000-01-01T00:00:00Z')).success,
    false,
    'year > 9999 (extended +NNNNNN form) must be rejected'
  );
});

test('InstantSchema rejects year 0000 (a 4-digit form, but outside the stated 0001-9999 range)', () => {
  assert.equal(InstantSchema.safeParse('0000-01-01T00:00:00Z').success, false);
  assert.equal(InstantSchema.safeParse('0001-01-01T00:00:00Z').success, true);
});

test('ConfigSchema rejects an invalid IANA time zone at config time, not later at buildUri', () => {
  const storage = {
    open() {},
    find() {},
    fetch() {},
    count() {
      return 0;
    },
    all() {},
    save() {},
    remove() {},
    sync() {},
    close() {},
    entries() {}
  };

  assert.equal(ConfigSchema.safeParse({ storage, timeZone: 'UTC' }).success, true);
  assert.equal(ConfigSchema.safeParse({ storage, timeZone: 'Europe/Moscow' }).success, true);
  assert.equal(
    ConfigSchema.safeParse({ storage, timeZone: 'Mars/Phobos' }).success,
    false,
    'a non-IANA zone must be rejected at config time'
  );
});

test('PostSchema requires publishedAt for scheduled and published', () => {
  assert.equal(PostSchema.safeParse(fullPost()).success, true);
  assert.equal(
    PostSchema.safeParse(
      fullPost({ status: 'scheduled', uri: 'drafts/hello', publishedAt: undefined })
    ).success,
    false,
    'scheduled without publishedAt must be rejected'
  );
  assert.equal(
    PostSchema.safeParse(fullPost({ status: 'published', publishedAt: undefined })).success,
    false,
    'published without publishedAt must be rejected'
  );
  assert.equal(
    PostSchema.safeParse(fullPost({ status: 'draft', uri: 'drafts/hello', publishedAt: undefined }))
      .success,
    true,
    'draft without publishedAt stays valid'
  );
});
