import { YambNotOpenError } from '../../errors/index.js';
import { effectiveSignal } from '../../signal.js';
import { getState } from '../internal.js';

export default {
  name: 'fetch',

  async fn(yamb, input, options = {}) {
    const state = getState(yamb);

    if (!state.isOpen) {
      throw new YambNotOpenError();
    }

    const signal = effectiveSignal(yamb, options);

    signal?.throwIfAborted();

    const uri = yamb.uri(input);
    const raw = await state.storage.fetch(uri, { signal });

    if (!raw) {
      return null;
    }

    return state._hydrate(raw);
  }
};
