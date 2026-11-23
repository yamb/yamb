import { InstantSchema } from '../../schemas/zod.js';
import { parseOrThrow } from './parse.js';

export default {
  name: 'after',

  fn(collection, instant) {
    const value = parseOrThrow(InstantSchema, instant, 'after');

    return collection._withQuery({ after: value });
  }
};
