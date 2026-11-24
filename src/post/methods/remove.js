import { YambNotOpenError } from '../../errors/index.js';
import { reportError } from '../../report-error.js';
import { effectiveSignal } from '../../signal.js';
import { getState as getYambState } from '../../yamb/internal.js';
import { getState } from '../internal.js';
import { enqueueOperation } from '../lib/operations.js';
import { expectedVersion } from '../lib/version.js';

export default {
  name: 'remove',

  async fn(post, options = {}) {
    const state = getState(post);
    const { yamb } = state;
    const signal = effectiveSignal(yamb, options);
    const explicit = expectedVersion(options);

    if (!yamb.isOpen) {
      throw new YambNotOpenError();
    }

    signal?.throwIfAborted();

    return enqueueOperation(state, signal, async () => {
      if (!yamb.isOpen) {
        throw new YambNotOpenError();
      }

      signal?.throwIfAborted();

      const id = state.data.id ?? state.pristine?.id;
      const uri = state.pristine?.uri ?? state.data.uri;

      if (!state.pristine || !id || state.removed) {
        return;
      }

      const expected = explicit === undefined ? state.version : explicit;

      try {
        await yamb.storage.remove(id, { signal, expected });
      } catch (err) {
        reportError(yamb.onError, err, { op: 'remove', id, uri });
        throw err;
      }

      const yambState = getYambState(yamb);
      const confirmed = yambState.byId.get(id);

      yambState.byId.delete(id);

      if (yambState.byUri.get(confirmed) === id) {
        yambState.byUri.delete(confirmed);
      }

      state.removed = true;
      state.pristine = null;
      state.confirmedRevisions = undefined;
      state.version = null;
    });
  }
};
