import { YambNotOpenError } from '../../errors/index.js';
import { effectiveSignal } from '../../signal.js';
import { getState } from '../internal.js';

export default {
  name: 'sync',

  async fn(yamb, options = {}) {
    const state = getState(yamb);

    if (!state.isOpen) {
      throw new YambNotOpenError();
    }

    const signal = effectiveSignal(yamb, options);

    signal?.throwIfAborted();

    await state.storage.sync({ signal });

    const byId = new Map();
    const byUri = new Map();

    for await (const [id, uri] of state.storage.entries({ signal })) {
      signal?.throwIfAborted();
      byId.set(id, uri);
      byUri.set(uri, id);
    }

    state.byId.clear();
    state.byUri.clear();

    for (const [id, uri] of byId) {
      state.byId.set(id, uri);
    }

    for (const [uri, id] of byUri) {
      state.byUri.set(uri, id);
    }
  }
};
