import { toArrayAsync } from '../operators.js';

export default {
  name: 'toArray',

  fn(helper) {
    return toArrayAsync(helper);
  }
};
