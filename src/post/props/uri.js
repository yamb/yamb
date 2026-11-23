import { getState } from '../internal.js';
import { currentUri } from '../lib/current-uri.js';

export default {
  name: 'uri',

  get(post) {
    return currentUri(getState(post));
  },
  set: false
};
