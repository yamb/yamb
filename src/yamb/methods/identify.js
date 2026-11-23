import { getState } from '../internal.js';

export default {
  name: 'identify',

  fn(yamb, uri) {
    const state = getState(yamb);

    return state.byUri.get(uri);
  }
};
