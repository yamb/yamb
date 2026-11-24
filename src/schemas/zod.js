import { z } from 'zod';

import { statusValues, orderValues, Status } from '../constants/index.js';

function maxUnits(schema, limit, label) {
  return schema.refine(
    (value) => value.length <= limit,
    `${label} must be ${limit} UTF-16 units or less`
  );
}

export const UriSchema = z
  .string()
  .regex(
    /^(\d{4}\/\d{2}\/[a-z0-9-]+|drafts\/[a-z0-9-]+)$/,
    'invalid uri shape (expected YYYY/MM/slug or drafts/slug)'
  );

export const IdSchema = z
  .string()
  .min(1, 'id must not be empty')
  .max(64, 'id must be 64 chars or less');

export const VersionSchema = z
  .string()
  .min(1, 'version must not be empty')
  .max(64, 'version must be 64 chars or less');

export const SLUG_LIMIT = 200;

export const SlugSchema = z
  .string()
  .regex(/^[a-z0-9-]+$/, 'slug must be lowercase letters, digits, dashes')
  .min(1)
  .max(SLUG_LIMIT);

export const TagSchema = maxUnits(z.string().min(1), 64, 'tag');

export const StatusSchema = z.enum(statusValues);
export const OrderSchema = z.enum(orderValues);

export const MIN_INSTANT = Temporal.Instant.from('0001-01-01T00:00:00Z');
export const MAX_INSTANT = Temporal.Instant.from('9999-12-31T23:59:59.999999999Z');

export function encodeInstant(instant) {
  return instant.toString({ fractionalSecondDigits: 9 });
}

export const InstantSchema = z.codec(
  z.union([z.instanceof(Temporal.Instant), z.string()]),
  z.instanceof(Temporal.Instant),
  {
    decode(value, ctx) {
      let instant;

      try {
        instant = value instanceof Temporal.Instant ? value : Temporal.Instant.from(value);
      } catch {
        ctx.issues.push({ code: 'custom', message: `invalid instant: ${value}`, input: value });

        return z.NEVER;
      }

      if (
        Temporal.Instant.compare(instant, MIN_INSTANT) < 0 ||
        Temporal.Instant.compare(instant, MAX_INSTANT) > 0
      ) {
        ctx.issues.push({
          code: 'custom',
          message: `instant year out of sortable range (0001-9999): ${value}`,
          input: value
        });

        return z.NEVER;
      }

      return instant;
    },
    encode: encodeInstant
  }
);

function isHttpUrl(value) {
  // oxlint-disable-next-line no-control-regex
  if (/[\\\x00-\x20\x7f]/u.test(value) || !/^https?:\/\//i.test(value)) {
    return false;
  }

  const url = URL.parse(value);

  return url !== null && !url.username && !url.password;
}

const HttpUrlSchema = z
  .string()
  .trim()
  .refine(isHttpUrl, 'must be an absolute HTTP(S) URL without credentials');

function isRelativeUrl(value) {
  // oxlint-disable-next-line no-control-regex
  if (/[\\\x00-\x1f\x7f]/u.test(value)) {
    return false;
  }

  const url = URL.parse(value, 'https://example.invalid/');

  return url !== null && !url.username && !url.password;
}

const HttpOrRelativeSchema = z.union([
  z.literal(''),
  z
    .string()
    .regex(/^\.?\//, 'must start with / or ./')
    .refine(isRelativeUrl, 'invalid relative URL'),
  HttpUrlSchema
]);

export const TitleSchema = maxUnits(z.string().trim().min(1), 500, 'title');
export const PreviewSchema = maxUnits(z.string(), 5000, 'preview');
export const TextSchema = maxUnits(z.string(), 1024 * 1024, 'text');

function isCoverUrl(value) {
  if (value === '') {
    return true;
  }

  if (value.includes(' ') || value.startsWith('//')) {
    return false;
  }

  return /^\.?\//.test(value) ? isRelativeUrl(value) : isHttpUrl(value);
}

const CoverUrlSchema = z
  .string()
  .refine((value) => value.length <= 4096, {
    error: 'cover URL must be 4096 UTF-16 units or less',
    abort: true
  })
  .refine(isCoverUrl, 'invalid cover URL');

const CoverObjectSchema = z.strictObject({
  url: CoverUrlSchema.optional(),
  alt: maxUnits(z.string(), 5000, 'cover alt').optional(),
  caption: maxUnits(z.string(), 5000, 'cover caption').optional(),
  width: z.number().int().min(1).max(100000).optional(),
  height: z.number().int().min(1).max(100000).optional()
});

function cleanCover(value) {
  return Object.fromEntries(Object.entries(value).filter(([, field]) => field !== undefined));
}

export const CoverSchema = z.codec(CoverObjectSchema, z.custom(), {
  decode: cleanCover,
  encode: cleanCover
});
export const TagsSchema = z.array(TagSchema).max(50);

export const AuthorSchema = z.strictObject({
  name: z.string().min(1).max(200),
  email: z.email().optional(),
  url: HttpOrRelativeSchema.optional()
});

export const MetaSchema = z.strictObject({
  title: z.string().max(500).optional(),
  description: z.string().max(2000).optional(),
  keywords: z.array(z.string().min(1).max(64)).max(20).optional()
});

export const SocialSchema = z.strictObject({
  title: z.string().max(500).optional(),
  description: z.string().max(2000).optional(),
  image: HttpOrRelativeSchema.optional()
});

export const LinksSchema = z.strictObject({
  related: z.array(IdSchema).max(50).default([])
});

export const PostOptionsSchema = z.record(z.string(), z.json());

export const PostSchema = z
  .strictObject({
    id: IdSchema.optional(),
    uri: UriSchema,
    slug: SlugSchema,
    title: TitleSchema,
    status: StatusSchema,
    text: TextSchema,
    tags: TagsSchema,
    links: LinksSchema,
    preview: PreviewSchema.optional(),
    cover: CoverSchema.default({}),
    author: AuthorSchema.optional(),
    meta: MetaSchema.optional(),
    social: SocialSchema.optional(),
    createdAt: InstantSchema,
    updatedAt: InstantSchema,
    publishedAt: InstantSchema.optional(),
    options: PostOptionsSchema.optional()
  })
  .refine(
    (post) => {
      if (post.status === Status.Scheduled || post.status === Status.Published) {
        return post.publishedAt != null;
      }

      return true;
    },
    {
      error: 'publishedAt is required for scheduled and published posts',
      path: ['publishedAt']
    }
  );

export const OptionFilterSchema = z
  .unknown()
  .superRefine((value, ctx) => {
    if (value !== null && typeof value === 'object' && Object.hasOwn(value, '__proto__')) {
      ctx.addIssue({ code: 'custom', message: 'forbidden option name: __proto__' });
    }
  })
  .pipe(
    z.record(
      z.string().regex(/^(?!__proto__$|prototype$|constructor$)[A-Za-z_][A-Za-z0-9_]*$/),
      z.union([z.string(), z.number().finite(), z.boolean(), z.null()])
    )
  );

export const QuerySchema = z.strictObject({
  status: StatusSchema.optional(),
  tags: TagsSchema.optional(),
  uri: UriSchema.optional(),
  before: InstantSchema.optional(),
  after: InstantSchema.optional(),
  options: OptionFilterSchema.optional()
});

export const LimitSchema = z.union([z.number().int().nonnegative(), z.null()]);

export const OffsetSchema = z.number().int().nonnegative();

export const OptionsSchema = z.strictObject({
  order: OrderSchema.optional(),
  limit: LimitSchema.optional(),
  offset: OffsetSchema.optional(),
  signal: z.instanceof(AbortSignal).optional()
});

const StorageContract = z.custom(
  (storage) =>
    storage !== null &&
    typeof storage === 'object' &&
    typeof storage.open === 'function' &&
    typeof storage.find === 'function' &&
    typeof storage.fetch === 'function' &&
    typeof storage.all === 'function' &&
    typeof storage.count === 'function' &&
    typeof storage.save === 'function' &&
    typeof storage.remove === 'function' &&
    typeof storage.fence === 'function' &&
    typeof storage.sync === 'function' &&
    typeof storage.close === 'function' &&
    typeof storage.entries === 'function',
  {
    message:
      'storage must implement contract (open/find/fetch/all/count/save/remove/fence/sync/close/entries)'
  }
);

const RendererContract = z.custom(
  (renderer) =>
    renderer !== null &&
    typeof renderer === 'object' &&
    typeof renderer.name === 'string' &&
    typeof renderer.version === 'string' &&
    (typeof renderer.post === 'function' || typeof renderer.collection === 'function'),
  { message: 'renderer must have name, version, and post() or collection()' }
);

const TimeZoneSchema = z.string().transform((value, ctx) => {
  try {
    return new Temporal.ZonedDateTime(0n, value).timeZoneId;
  } catch {
    ctx.issues.push({ code: 'custom', message: 'invalid IANA time zone', input: value });

    return z.NEVER;
  }
});

export const ConfigSchema = z.strictObject({
  storage: StorageContract,
  options: z.instanceof(z.ZodObject).optional(),
  renderers: z.record(z.string(), RendererContract).optional(),
  base: HttpUrlSchema.optional(),
  timeZone: TimeZoneSchema.optional(),
  signal: z.instanceof(AbortSignal).optional(),
  slugger: z.function().optional(),
  clock: z.function().optional(),
  onError: z.function().optional()
});

export const TransformerSchema = z.custom(
  (transformer) =>
    transformer !== null &&
    typeof transformer === 'object' &&
    typeof transformer.name === 'string' &&
    typeof transformer.version === 'string' &&
    typeof transformer.transform === 'function',
  { message: 'transformer must have name, version, and transform(value, ctx)' }
);
