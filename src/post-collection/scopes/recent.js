import { Order } from '../../constants/index.js';
import { LimitSchema } from '../../schemas/zod.js';
import { parseOrThrow } from './parse.js';

export default {
  name: 'recent',

  fn(collection, n = 10) {
    const limit = parseOrThrow(LimitSchema, n, 'limit');

    return collection._withOptions({ order: Order.PublishedDesc, limit });
  }
};
