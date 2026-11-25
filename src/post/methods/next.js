import { Order } from '../../constants/index.js';
import { resolveNow } from '../../lifecycle/dates.js';
import { MAX_INSTANT } from '../../schemas/zod.js';
import { neighbor } from '../lib/neighbor.js';

function notAfter(yamb) {
  const now = resolveNow(yamb.clock);

  return {
    before: Temporal.Instant.compare(now, MAX_INSTANT) < 0 ? now.add({ nanoseconds: 1 }) : now
  };
}

export default {
  name: 'next',

  fn(post, options) {
    return neighbor(post, options, Order.PublishedAsc, notAfter);
  }
};
