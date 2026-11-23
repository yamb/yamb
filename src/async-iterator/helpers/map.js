import { getState } from '../internal.js';
import { mapAsync } from '../operators.js';

export default {
  name: 'map',

  fn(helper, mapper) {
    if (typeof mapper !== 'function') {
      throw new TypeError('map: argument must be a function');
    }

    const Helper = helper.constructor;
    const { signal } = getState(helper);

    return new Helper(mapAsync(helper, mapper), { signal });
  }
};
