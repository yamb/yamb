import { CoverSchema } from '../../schemas/zod.js';
import { readField, writeField } from '../lib/field.js';

export default {
  name: 'cover',
  schema: CoverSchema,

  get(post) {
    return readField(post, this);
  },

  set(post, value) {
    writeField(post, this, value === undefined ? {} : value);
  }
};
