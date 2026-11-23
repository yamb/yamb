import { YambNotOpenError } from '../../errors/index.js';
import { effectiveSignal } from '../../signal.js';
import { getState } from '../internal.js';

export default {
  name: 'count',

  async fn(collection) {
    const state = getState(collection);
    const { yamb } = state;

    if (!yamb.isOpen) {
      throw new YambNotOpenError('yamb instance is not open');
    }

    const signal = effectiveSignal(yamb, state.options);

    signal?.throwIfAborted();

    return yamb.storage.count(state.query, { signal });
  }
};
