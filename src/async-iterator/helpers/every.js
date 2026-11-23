import { everyAsync } from '../operators.js';

export default {
  name: 'every',

  fn(helper, predicate) {
    if (typeof predicate !== 'function') {
      throw new TypeError('every: argument must be a function');
    }

    return everyAsync(helper, predicate);
  }
};
