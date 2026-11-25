import { begin } from '../../signal.js';
import { getState } from '../internal.js';
import { index, load } from '../lookups.js';

export default {
  name: 'sync',

  async fn(yamb, options = {}) {
    const state = getState(yamb);
    const signal = begin(yamb, options);
    const writes = new Map();
    let lookups;

    state.walks.add(writes);

    try {
      await state.storage.sync({ signal });
      lookups = await load(state.storage, signal);
    } catch (err) {
      state.walks.delete(writes);
      throw err;
    }

    if (!state.walks.delete(writes)) {
      return;
    }

    for (const [id, uri] of writes) {
      index(lookups.byId, lookups.byUri, id, uri);
    }

    state.byId = lookups.byId;
    state.byUri = lookups.byUri;
  }
};
