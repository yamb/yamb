import { OrderSchema } from '../../schemas/zod.js';
import { parseOrThrow } from './parse.js';

export default {
  name: 'order',

  fn(collection, value) {
    const order = parseOrThrow(OrderSchema, value, 'order');

    return collection._withOptions({ order });
  }
};
