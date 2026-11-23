import { getState } from '../internal.js';
import { takeAsync } from '../operators.js';

export default {
  name: 'take',

  fn(helper, n) {
    const limit = Number(n);

    if (!Number.isFinite(limit) || limit < 0) {
      throw new RangeError('take: argument must be a non-negative finite number');
    }

    const Helper = helper.constructor;
    const { signal } = getState(helper);

    return new Helper(takeAsync(helper, Math.floor(limit)), { signal });
  }
};
