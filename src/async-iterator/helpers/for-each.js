import { forEachAsync } from '../operators.js';

export default {
  name: 'forEach',

  fn(helper, callback) {
    if (typeof callback !== 'function') {
      throw new TypeError('forEach: argument must be a function');
    }

    return forEachAsync(helper, callback);
  }
};
