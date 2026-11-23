import { getState } from '../internal.js';

export default {
  name: 'has',

  fn(yamb, uri) {
    const state = getState(yamb);

    return state.byUri.has(uri);
  }
};
