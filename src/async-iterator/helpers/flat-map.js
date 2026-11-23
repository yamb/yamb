import { getState } from '../internal.js';
import { flatMapAsync } from '../operators.js';

export default {
  name: 'flatMap',

  fn(helper, mapper) {
    if (typeof mapper !== 'function') {
      throw new TypeError('flatMap: argument must be a function');
    }

    const Helper = helper.constructor;
    const { signal } = getState(helper);

    return new Helper(flatMapAsync(helper, mapper), { signal });
  }
};
