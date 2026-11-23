import { LimitSchema } from '../../schemas/zod.js';
import { parseOrThrow } from './parse.js';

export default {
  name: 'limit',

  fn(collection, value) {
    const limit = parseOrThrow(LimitSchema, value, 'limit');

    return collection._withOptions({ limit });
  }
};
