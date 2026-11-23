import { reduceAsync } from '../operators.js';

export default {
  name: 'reduce',

  fn(helper, reducer, ...rest) {
    if (typeof reducer !== 'function') {
      throw new TypeError('reduce: first argument must be a function');
    }

    return reduceAsync(helper, reducer, ...rest);
  }
};
