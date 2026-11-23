import { getState } from '../internal.js';
import { currentUri } from '../lib/current-uri.js';
import { serializeData } from '../lib/serialize.js';

export default {
  name: 'toJSON',

  fn(post) {
    const state = getState(post);
    const data = serializeData(state.data);

    if (state.data.slug) {
      data.uri = currentUri(state);
    }

    return data;
  }
};
