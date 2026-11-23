import { someAsync } from '../operators.js';

export default {
  name: 'some',

  fn(helper, predicate) {
    if (typeof predicate !== 'function') {
      throw new TypeError('some: argument must be a function');
    }

    return someAsync(helper, predicate);
  }
};
