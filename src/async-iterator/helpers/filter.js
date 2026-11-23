import { getState } from '../internal.js';
import { filterAsync } from '../operators.js';

export default {
  name: 'filter',

  fn(helper, predicate) {
    if (typeof predicate !== 'function') {
      throw new TypeError('filter: argument must be a function');
    }

    const Helper = helper.constructor;
    const { signal } = getState(helper);

    return new Helper(filterAsync(helper, predicate), { signal });
  }
};
