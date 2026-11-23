import { buildUri } from '../../uri.js';
import { url } from '../../url.js';
import { getState } from '../internal.js';

export default {
  name: 'url',

  fn(post, params) {
    const state = getState(post);
    const uri = buildUri(state.data, state.yamb.timeZone);

    return url(uri, state.yamb.base, params);
  }
};
