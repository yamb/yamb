import { url } from '../../url.js';
import { getState } from '../internal.js';
import { currentUri } from '../lib/current-uri.js';

export default {
  name: 'url',

  fn(post, params) {
    const state = getState(post);

    return url(currentUri(state), state.yamb.base, params);
  }
};
