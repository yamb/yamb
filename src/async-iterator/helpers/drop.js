import { getState } from '../internal.js';
import { dropAsync } from '../operators.js';

export default {
  name: 'drop',

  fn(helper, n) {
    const count = Number(n);

    if (!Number.isFinite(count) || count < 0) {
      throw new RangeError('drop: argument must be a non-negative finite number');
    }

    const Helper = helper.constructor;
    const { signal } = getState(helper);

    return new Helper(dropAsync(helper, Math.floor(count)), { signal });
  }
};
