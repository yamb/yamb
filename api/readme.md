# Core API

Use this reference to configure a blog, edit and query posts, or implement storage and rendering extensions. See the [quick start](../readme.md#quick-start) for a file-backed blog.

## Configuration

| Key | Value | Default |
| --- | --- | --- |
| `storage` | Adapter implementing the [storage interface](#storage) | Required |
| `renderers` | Map of format names to [renderers](#renderers) | `{}` |
| `options` | Synchronous Zod object schema for application data | Empty strict object |
| `base` | HTTP(S) blog URL, resolved as a directory | `http://localhost` |
| `timeZone` | IANA time zone for dated URIs | `UTC` |
| `signal` | Global `AbortSignal` | Absent |
| `clock` | Function returning an instant, ISO string or `Date` | `Temporal.Now.instant()` |
| `slugger` | Synchronous `title => slug` | Cyrillic transliteration, accent removal, lowercase ASCII with dashes |
| `onError` | Diagnostic callback `(error, context)`, sync or async | Absent |

Unknown configuration keys fail with `YAMB_CONFIG_INVALID`. `storage`, `renderers`, `base`, `timeZone`, `signal`, `clock`, `slugger`, `onError` and `isOpen` are readable instance properties. Diagnostic callback failures cannot replace operation errors or interrupt cleanup.

| Operation | Result |
| --- | --- |
| `await blog.open({ signal }?)` | Open storage, load ID/URI lookups, prepare renderers; return blog |
| `await blog.close()` | Dispose renderers, close storage, clear lookups |
| `await blog.sync({ signal }?)` | Refresh storage state and replace lookups after a complete successful walk |
| `blog.build(data?)` | Unsaved Post; incomplete data is allowed until save |
| `await blog.create(data, { signal }?)` | Build and insert a Post |
| `await blog.find(id, { signal }?)` | Post or `null`, by stable ID |
| `await blog.fetch(uriOrUrl, { signal }?)` | Post or `null`, by current URI. Accepts the same input as `blog.uri()`. |
| `blog.uri(uriOrUrl)` | Trim whitespace and leading slashes from URI strings. Accept an absolute URL string or native `URL` and extract its same-origin path relative to base. |
| `blog.locate(id)` | Indexed URI or `undefined` |
| `blog.identify(uri)` | Indexed ID or `undefined` |
| `blog.has(uri)` | Whether the canonical URI is indexed |
| `blog.all(query?, selection?)` | Lazy [collection](#collections) over every status |
| `blog.published`, `.drafts`, `.scheduled`, `.archived` | Collections with an explicit status |
| `await blog.render(format, input, { signal }?)` | [Renderer](#renderers) result |

`open` and `close` are idempotent; concurrent calls share their operation. Close waits for an earlier open; open during close waits for cleanup. A failed open rolls back acquired storage and every started renderer preparation. `Symbol.asyncDispose` calls close. Cleanup receives no operational signal.

`await blog.fetch(post.url())` looks up a post by its current URL. URL lookup uses the path and ignores the query and fragment. A URL from another origin fails with `YAMB_URI_ORIGIN_MISMATCH`.

Operation signals combine with the global signal through `AbortSignal.any`; native cancellation reasons retain their identity. Storage operations require an open blog. `build`, collection construction and rendering do not acquire storage implicitly.

## Posts

Public fields are own enumerable properties. `Object.keys`, `Object.entries` and spread exclude methods and service state. `id`, `uri` and `updatedAt` are read-only; unknown top-level fields and deletion of a top-level field are rejected.

| Field | Value and constraints |
| --- | --- |
| `id` | Stable string, 1–64 Unicode code points; `null` when absent |
| `uri` | Derived `drafts/<slug>` for drafts/dateless posts, otherwise `YYYY/MM/<slug>` in blog time zone |
| `slug` | Lowercase ASCII letters, digits and dashes, 1–200 characters; derived from title on save when absent |
| `title` | Trimmed nonempty string, ≤500 UTF-16 code units; required on save |
| `text` | Full source text, ≤1048576 UTF-16 code units; defaults to `''` on save |
| `preview` | Optional independent source text, ≤5000 UTF-16 code units; `''` is present |
| `status` | `draft`, `scheduled`, `published` or `archived`; defaults to `draft` on save |
| `cover` | [Cover object](#cover), default `{}` |
| `tags` | ≤50 strings, each 1–64 UTF-16 code units; defaults to `[]` on save |
| `links` | `{ related: string[] }`, ≤50 stable IDs; defaults to `{ related: [] }` on save |
| `author` | Optional strict `{ name, email?, url? }`; name 1–200 Unicode code points, email validated |
| `meta` | Optional strict `{ title?, description?, keywords? }`; limits 500/2000 Unicode code points, ≤20 keywords of 1–64 code points |
| `social` | Optional strict `{ title?, description?, image? }`; title/description limits 500/2000 Unicode code points |
| `createdAt`, `updatedAt`, `publishedAt` | `Temporal.Instant`; assignment accepts an instant, ISO string or `Date` in years 0001–9999 |
| `options` | Application [options](#options), default `{}` |

Author URLs and social images accept `''`, HTTP(S), or valid references starting with `/` or `./`. `text` includes any introduction; `preview` is never generated from text or metadata. Content interpretation belongs to explicit [preparation](#transformations).

Whole-field assignments own their input. Nested objects/arrays remain live and validate synchronously; invalid edits roll back atomically. Array mutators validate one complete candidate. Borrowed array mutators and `Object.assign` perform sequential writes, so an earlier successful write remains if a later one fails. Optional fields clear with `undefined`; initialize an absent object before editing its children. Detached references cannot mutate a replacement.

```js
post.meta = {
  description: 'Original',
  keywords: ['node']
};

post.meta.description = 'Edited';
post.tags.push('javascript');
post.links.related.push(other.id);

const shallow = { ...post };
const snapshot = post.toJSON();

delete post.meta.description;
```

Spread and `Object.assign` preserve shallow live references. `toJSON()` returns independent data with string dates, current URI, related IDs and absent optional keys omitted. `structuredClone(post)` does not clone Post behavior.

### Cover

`cover` is a strict object; strings, `null`, arrays and unknown keys fail. Assigning `{}` or `undefined` clears it. Nested assignment/deletion participates in changes, saving and hashing.

| Key | Constraint |
| --- | --- |
| `url` | Optional string, ≤4096 UTF-16 code units: `''`, HTTP(S) without credentials, or `/`/`./` reference |
| `alt`, `caption` | Optional plain strings, ≤5000 UTF-16 code units each; whitespace preserved |
| `width`, `height` | Optional integers, 1–100000 |

Cover URLs reject protocol-relative references, backslashes, C0 controls, spaces and DEL. Metadata may exist without a URL; an absent/empty URL produces no image in standard renderers.

### Options

Configure `options` with a Zod object schema; applications importing Zod declare it as their own dependency. Without a schema, only `{}` is accepted. Values are finite JSON; cycles, custom objects, accessors, symbols and nested `undefined` fail.

```js
import { z } from 'zod';

const options = z
  .strictObject({
    start: z.number(),
    end: z.number(),
    homepage: z.boolean().default(false)
  })
  .refine(({ start, end }) => start <= end);
```

Pass `options` to `yamb({ storage, options })`. Assign dependent fields together, for example `post.options = { start: 3, end: 4 }`. Top-level defaults, including callback defaults and optional wrappers, are captured once per blog and copied per Post. Missing/deleted default fields regain that value. Nested missing defaults are not synthesized; supply complete nested values or a complete top-level default.

Field and object refinements remain authoritative. Coercion, transformation or stripping that changes supplied values is rejected. Callbacks are trusted synchronous code; async validation is unsupported. Invalid stored options fail with `YAMB_STORAGE_READ`. Defaults loaded into a Post begin clean and do not rewrite storage.

### Persistence

| Method | Behavior |
| --- | --- |
| `await post.save({ signal, mode }?)` | Save the revision captured at invocation; return Post |
| `await post.publish({ signal }?)` | Set `published` and save |
| `await post.schedule(when, { signal }?)` | Require a future instant, set `scheduled`/`publishedAt`, save |
| `await post.archive({ signal }?)` | Set `archived` and save |
| `await post.remove({ signal }?)` | Remove the confirmed stable ID after earlier queued operations |
| `post.changes()` | Independent changed top-level fields relative to the confirmed revision |
| `post.hash()` | SHA-256 of canonical current `toJSON()` data. Object key order is ignored and array order is significant. |
| `post.url(params?)` | Native `URL` for the current derived URI |
| `await post.render(format, { signal }?)` | Render a synchronously captured `toJSON()` revision |
| `await post.next({ signal }?)`, `.prev(...)` | Published neighbor or `null`, ordered by date/URI; next is capped at the blog clock |
| `post.related({ signal }?)` | One-shot lazy helper resolving published related IDs in order; missing/nonpublic targets skipped |

Saves and removals serialize per Post. A queued cancellation rejects immediately with its native reason. Failure rejects waiting operations. Inspect storage before retrying an uncertain write.

```js
post.title = 'Submitted';
const saving = post.save();

post.title = 'Later edit';
await saving;

console.log(post.changes().title);
```

Save fills missing status/text/tags/links, derives a missing slug, assigns creation/update times and stamps first publication when needed. A true no-op reads neither clock nor storage. Transitions are freeform and retain publication dates; a failed transition can leave the working status dirty. `changes()` omits automatic `updatedAt`; reverting a value removes its change. Hashes are memoized until mutation, and ordinary reads do not prepare content.

`mode` is `'insert'`, `'update'` or absent. Insert rejects a supplied ID; update requires one. A build containing an unloaded ID requires explicit update mode. Storage updates never upsert missing records. New colliding drafts receive a suffix; other URI collisions fail. Stale related IDs remain visible to editors, but saving requires each ID in core's lookup index. Related changes do not change a referrer's hash automatically.

## Collections

`all()` and `for await (const post of blog)` include every status, with descending `publishedAt`/`uri` order and no implicit limit. Each PostCollection traversal creates an independent iterator. Declarative query predicates combine with AND and execute in storage.

| Query key         | Predicate                                                  |
| ----------------- | ---------------------------------------------------------- |
| `status`, `uri`   | Exact value                                                |
| `tag`, `tags`     | Membership / all listed tags                               |
| `before`, `after` | Strict `publishedAt` bounds; instant, ISO string or `Date` |
| `options`         | Exact scalar comparisons by declared field                 |

Option filters accept string, finite number, boolean or `null`; missing stored values match captured defaults. Only supplied field schemas apply, including wrapper refinements; required siblings and whole-object refinements do not apply. Names match `[A-Za-z_][A-Za-z0-9_]*`, excluding `__proto__`, `prototype` and `constructor`. Unknown fields, arrays, objects and operators fail with `YAMB_QUERY_VALIDATION`.

| Selection/method | Meaning |
| --- | --- |
| `{ order, offset, limit, signal }` | Second argument to `all` |
| `.published()`, `.drafts()`, `.scheduled()`, `.archived()` | Replace the status predicate |
| `.tagged(...tags)` | Accumulate required tags |
| `.before(instant)`, `.after(instant)` | Set a strict date bound |
| `.order(spec)` | `publishedAt`, `createdAt`, `updatedAt` or `title`, optionally prefixed with `-` |
| `.offset(n)` | Nonnegative integer |
| `.limit(n)` | Nonnegative integer or `null` (unbounded) |
| `.recent(n = 10)`, `.oldest(n = 10)` | Set publication order and limit |
| `await .first()` | First selected Post or `null`; respects offset and zero limit |
| `await .count()` | Total matches before pagination |

URI ties follow the same order direction; missing dates sort last descending and first ascending. `limit(0)` consumes no storage records.

`map`, `filter`, `take`, `drop`, `flatMap`, `forEach`, `reduce`, `some`, `every`, `find` and `toArray` operate through `AsyncIteratorHelper`. Item callbacks receive `(value, index)`; reducers receive `(accumulator, value, index)`. Callbacks may be async and run in JavaScript during consumption. They are not database queries. Derived helpers are one-shot; use `Array.fromAsync(collection)` or `for await` for native consumption. Early termination/error/abort/disposal closes the source cursor.

`AsyncIteratorHelper.from(source, { signal }?)` accepts a sync/async iterable or bare iterator. Helpers expose `next`, `return`, `Symbol.asyncIterator` and `Symbol.asyncDispose`; exhausted helpers stay exhausted. `take`/`drop` require a nonnegative finite number and truncate it to an integer. `flatMap` requires an iterable result. `reduce` without an initial value uses the first item and rejects an empty source.

## Storage

Adapters import errors from `@yamb/core/errors` and optional schemas/`encodeInstant` from `@yamb/core/schemas`. Every method below is required.

| Method | Input/result |
| --- | --- |
| `open(ctx)` | Acquire/check prepared storage; ctx contains `signal`, `timeZone`, `clock`, fixed `optionDefaults` |
| `find(id, { signal }?)`, `fetch(uri, { signal }?)` | Independent RawPost or `null` |
| `all(query?, selection?)` | Lazy iterable/async iterable of independent RawPost; one cursor per traversal |
| `count(query?, { signal }?)` | Matching total before pagination |
| `save(raw, { signal }?)` | Insert without ID; otherwise replace an existing record; return at least `{ id }` |
| `remove(id, { signal }?)` | Delete by ID; reject a missing record |
| `entries({ signal }?)` | Iterable or async iterable of `[id, uri]` pairs for all stored posts |
| `sync({ signal }?)` | Refresh adapter state |
| `close(options?)` | Release owned resources, including partial acquisition |

RawPost uses public fields as plain independent data, string related IDs and UTC ISO date strings. `encodeInstant` emits nine fractional digits for chronological lexical ordering; Post `toJSON()` emits display ISO strings without fixed trailing precision. Omit `undefined` fields. Retained input and returned output must not alias mutable stored data.

Core uses `storage.entries()` to build its lookups on open and sync.

```js
for await (const [id, uri] of blog.storage.entries()) {
  console.log(id, uri);
}
```

Adapters own filtering, sorting, pagination, count and uniqueness at the write boundary. `optionDefaults` is frozen JSON for the open lifetime; the Zod schema stays in core. Query values remain typed literals. Neighbor navigation adds internal `cursor: { publishedAt, uri }`: compare the date/URI pair in order direction, with strict bounds when present.

Check cancellation before I/O, close cursors on every exit and preserve acknowledged writes after late abort. Cleanup survives operational cancellation. Official adapters require prepared filesystem/database structure and perform no DDL. Adapter-created clients belong to the adapter; supplied clients belong to the application.

## Renderers

A renderer is `{ name, version, post?, collection?, prepare?, dispose? }`, with string name/version and at least one rendering method. Sync and async results are accepted.

| Hook | Input/context |
| --- | --- |
| `post(data, ctx)` | Independent PostData |
| `collection({ posts, ...options }, ctx)` | Async iterable of PostData plus renderer-specific options |
| `prepare(ctx)` | Blog-open hook; `yamb`, `timeZone`, `base: URL`, `signal` |
| `dispose(ctx)` | Cleanup after any started preparation; `yamb`, `timeZone` |

Rendering context contains `yamb`, `format`, `scope`, `base: URL`, `timeZone` and `signal`. Dispose must handle partial preparation and repeated cleanup. Unexpected rendering failures become `YAMB_RENDERER_FAILED` with cause; known Yamb errors and native cancellation pass through.

Use `post.render(format)` to capture a live Post or `blog.render(format, { post: data })` to supply PostData. For `{ posts: iterable, ...options }`, core calls `toJSON()` on each live Post during iteration. Supplied PostData passes by reference in both forms. Keep it unchanged until rendering completes. Collection traversal and related lookups can observe different revisions. Renderers treat inputs as read-only and leave application-owned storage open.

### Transformations

`transform(value, stages, ctx = {})` and `prepare(source, stages, ctx = {})` are exported from `@yamb/core/transform`. A stage is `{ name, version, transform(value, ctx) }`. The executor awaits each stage in order and passes its result to the next stage. Value types and extra context belong to the application.

```js
import { transform } from '@yamb/core/transform';

const upper = {
  name: 'upper',
  version: '1',
  transform: (value) => value.toUpperCase()
};

const text = await transform('hello', [upper]);
```

`prepare` captures a deeply frozen source copy before its first await and deeply freezes the result, including descendants of shallow-frozen objects. Pass `post.toJSON()`. The source must be a plain record. Source and result graphs contain only finite JSON values, plain records and dense arrays. Proxies, accessors, cycles, hidden properties and live class instances fail with `TypeError` without invoking getters. `transform` accepts arbitrary JavaScript values.

Cancellation is checked before stages and after awaits. Stage failure becomes `TransformError` with `code: 'YAMB_TRANSFORM_FAILED'`, `stage` and `cause`; later stages do not run. `AbortError` and matching native signal reasons retain identity. Trusted synchronous application code remains cooperative; the executor does not preempt it.

Standard content preparation uses a full-post pipeline:

```js
import { prepare } from '@yamb/core/transform';
import { markdown } from '@yamb/markdown';
import { microtypo } from '@yamb/microtypo';

await using md = markdown();
await using typo = microtypo();

const stages = [md, md.html(), typo, md.clean()];

const ctx = {
  base: new URL(blog.base),
  timeZone: blog.timeZone
};

const prepared = await prepare(post.toJSON(), stages, ctx);
```

Keep Markdown/MicroTypo owners for the application lifetime and close them after preparation completes. The explicit stages produce tokens, HTML, typography and cleaned PreparedPost. Place custom token stages before `md.html()` and every HTML-producing stage before `md.clean()`. Core imports no parser, sanitizer or cache. See [Markdown](https://github.com/yamb/markdown#reference) for content formats, representations and worker budgets, and [MicroTypo](https://github.com/yamb/microtypo#reference) for native typography options and lifecycle.

Standard HTML/RSS/Atom/JSON Feed renderers accept `prepare(source, ctx)` returning the prepared full post; the renderer lifecycle hook above is a separate interface. Reuse one callback/result across outputs. Without that callback, renderers escape literal source strings. The source JSON renderer keeps original data and does not invoke preparation.

For cached preparation, build the key from the same source snapshot passed to `prepare`, the ordered stage names and versions, and any settings and context that affect the result. Include the base URL, time zone, format, scope and external data revisions when stages depend on them. For cached rendered output, also include the renderer name, version and output settings.

## Exports and errors

| Import | Exports |
| --- | --- |
| `@yamb/core` | `yamb`, `Yamb`, `Post`, `PostCollection`, `AsyncIteratorHelper`, status/order constants and five common schemas |
| `@yamb/core/constants` | `Status`, `statusValues`, `Order`, `orderValues` |
| `@yamb/core/errors` | `YambError` and domain subclasses |
| `@yamb/core/schemas` | Zod field, Post, query, selection, configuration and transformer schemas; `encodeInstant` |
| `@yamb/core/transform` | `transform`, `prepare` |
| `@yamb/core/async-iterator` | `AsyncIteratorHelper` |
| `@yamb/core/url` | `url(input, base, params?)` |
| `@yamb/core/internal` | `store(label)` returns isolated WeakMap-backed `{ get, set }` |
| `@yamb/core/package.json` | Package metadata |

`url` returns a native URL using base's pathname as a directory prefix, even without a trailing slash. Absolute/root-relative inputs retain native semantics; params set string query values. Input/base URL objects remain unchanged.

Domain errors carry `code`, optional `cause` and `details`. Error classes derive from `YambError` and are named after their subject: `YambConfigError`, `YambNotOpenError`, `PostValidationError`, `PostDateError`, `PostStatusError`, `PostNotFoundError`, `UriOriginError`, `UriTakenError`, `QueryValidationError`, `LinkRefNotFoundError`, `StorageNotOpenError`, `StorageReadError`, `StorageWriteError`, `StorageDuplicateError`, `RendererMissingError`, `RendererScopeError`, `RendererInputError`, `RendererFailedError`. Codes use `YAMB_` prefixes; date/status/config/origin codes are `YAMB_POST_DATE_INVALID`, `YAMB_POST_STATUS_INVALID`, `YAMB_CONFIG_INVALID`, `YAMB_URI_ORIGIN_MISMATCH`. Native cancellation reasons need not be Error objects.
