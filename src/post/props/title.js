import { TitleSchema } from '../../schemas/zod.js';
import { getState } from '../internal.js';
import { writeField } from '../lib/field.js';

export default {
  name: 'title',
  schema: TitleSchema,

  get(post) {
    return getState(post).data.title;
  },

  set(post, value) {
    writeField(post, this, value);
  }
};
