import { PostStatusError } from '../../errors/index.js';
import { StatusSchema } from '../../schemas/zod.js';
import { getState } from '../internal.js';
import { writeField } from '../lib/field.js';

export default {
  name: 'status',
  schema: StatusSchema,
  error: PostStatusError,

  get(post) {
    return getState(post).data.status;
  },

  set(post, value) {
    writeField(post, this, value);
  }
};
