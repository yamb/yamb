import { LinksSchema } from '../../schemas/zod.js';
import { readField, writeField } from '../lib/field.js';

export default {
  name: 'links',
  schema: LinksSchema,

  get(post) {
    return readField(post, this);
  },

  set(post, value) {
    writeField(post, this, value);
  }
};
