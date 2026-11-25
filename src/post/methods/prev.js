import { Order } from '../../constants/index.js';
import { neighbor } from '../lib/neighbor.js';

export default {
  name: 'prev',

  fn(post, options) {
    return neighbor(post, options, Order.PublishedDesc);
  }
};
