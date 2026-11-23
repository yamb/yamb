import { getState } from '../internal.js';

export default {
  name: 'locate',

  fn(yamb, id) {
    const state = getState(yamb);

    return state.byId.get(id);
  }
};
