import { PostDateError } from '../../errors/index.js';
import { InstantSchema } from '../../schemas/zod.js';
import { getState } from '../internal.js';
import { writeField } from '../lib/field.js';

export default {
  name: 'publishedAt',
  schema: InstantSchema,
  optional: true,
  error: PostDateError,

  get(post) {
    return getState(post).data.publishedAt;
  },

  set(post, value) {
    writeField(post, this, value);
  }
};
