import { PostDateError, PostStatusError } from '../errors/index.js';
import {
  AuthorSchema,
  CoverSchema,
  IdSchema,
  InstantSchema,
  LinksSchema,
  MetaSchema,
  PreviewSchema,
  SlugSchema,
  SocialSchema,
  StatusSchema,
  TagsSchema,
  TextSchema,
  TitleSchema,
  UriSchema
} from '../schemas/zod.js';
import { currentUri } from './lib/current-uri.js';

export default [
  { name: 'id', schema: IdSchema, readonly: true, read: (state) => state.data.id ?? null },
  { name: 'title', schema: TitleSchema },
  { name: 'slug', schema: SlugSchema },
  { name: 'uri', schema: UriSchema, readonly: true, read: currentUri },
  { name: 'preview', schema: PreviewSchema, optional: true },
  { name: 'text', schema: TextSchema },
  { name: 'cover', schema: CoverSchema, absent: {} },
  { name: 'tags', schema: TagsSchema },
  { name: 'status', schema: StatusSchema, error: PostStatusError },
  { name: 'author', schema: AuthorSchema, optional: true },
  { name: 'meta', schema: MetaSchema, optional: true },
  { name: 'social', schema: SocialSchema, optional: true },
  { name: 'links', schema: LinksSchema },
  { name: 'createdAt', schema: InstantSchema, error: PostDateError },
  { name: 'updatedAt', schema: InstantSchema, error: PostDateError, readonly: true },
  { name: 'publishedAt', schema: InstantSchema, error: PostDateError, optional: true },
  { name: 'options', validate: (state, value) => state.optionsConfig.validate(value) }
];
