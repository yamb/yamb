import { InstantSchema } from '../../schemas/zod.js';
import { parseOrThrow } from './parse.js';

export default {
  name: 'before',

  fn(collection, instant) {
    const value = parseOrThrow(InstantSchema, instant, 'before');

    return collection._withQuery({ before: value });
  }
};
