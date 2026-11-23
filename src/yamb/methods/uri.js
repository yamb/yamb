import { normalizeUri } from '../../uri.js';
import { getState } from '../internal.js';

export default {
  name: 'uri',

  fn(yamb, input) {
    const state = getState(yamb);

    return normalizeUri(input, state.base);
  }
};
