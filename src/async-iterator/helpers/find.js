import { findAsync } from '../operators.js';

export default {
  name: 'find',

  fn(helper, predicate) {
    if (typeof predicate !== 'function') {
      throw new TypeError('find: argument must be a function');
    }

    return findAsync(helper, predicate);
  }
};
