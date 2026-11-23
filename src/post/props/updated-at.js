import { getState } from '../internal.js';

export default {
  name: 'updatedAt',

  get(post) {
    return getState(post).data.updatedAt;
  },
  set: false
};
