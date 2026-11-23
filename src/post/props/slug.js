import { SlugSchema } from '../../schemas/zod.js';
import { getState } from '../internal.js';
import { writeField } from '../lib/field.js';

export default {
  name: 'slug',
  schema: SlugSchema,

  get(post) {
    return getState(post).data.slug;
  },

  set(post, value) {
    writeField(post, this, value);
  }
};
