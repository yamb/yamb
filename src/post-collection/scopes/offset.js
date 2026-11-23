import { OffsetSchema } from '../../schemas/zod.js';
import { parseOrThrow } from './parse.js';

export default {
  name: 'offset',

  fn(collection, value) {
    const offset = parseOrThrow(OffsetSchema, value, 'offset');

    return collection._withOptions({ offset });
  }
};
