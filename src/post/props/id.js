import { getState } from '../internal.js';

export default {
  name: 'id',

  get(post) {
    return getState(post).data.id ?? null;
  },
  set: false
};
