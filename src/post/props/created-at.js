import { PostDateError } from '../../errors/index.js';
import { InstantSchema } from '../../schemas/zod.js';
import { getState } from '../internal.js';
import { writeField } from '../lib/field.js';

export default {
  name: 'createdAt',
  schema: InstantSchema,
  error: PostDateError,

  get(post) {
    return getState(post).data.createdAt;
  },

  set(post, value) {
    writeField(post, this, value);
  }
};
