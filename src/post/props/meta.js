import { MetaSchema } from '../../schemas/zod.js';
import { readField, writeField } from '../lib/field.js';

export default {
  name: 'meta',
  schema: MetaSchema,
  optional: true,

  get(post) {
    return readField(post, this);
  },

  set(post, value) {
    writeField(post, this, value);
  }
};
