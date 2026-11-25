import { YambNotOpenError } from '../../errors/index.js';
import { reportError } from '../../report-error.js';
import { begin } from '../../signal.js';
import { getState as getYambState } from '../../yamb/internal.js';
import { record } from '../../yamb/lookups.js';
import { getState } from '../internal.js';
import { enqueueOperation } from '../lib/operations.js';
import { expectedVersion } from '../lib/version.js';

export default {
  name: 'remove',

  async fn(post, options = {}) {
    const state = getState(post);
    const { yamb } = state;
    const signal = begin(yamb, options);
    const explicit = expectedVersion(options);

    return enqueueOperation(state, signal, async () => {
      if (!yamb.isOpen) {
        throw new YambNotOpenError('yamb instance is not open');
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

      record(getYambState(yamb), id, null);
      state.removed = true;
      state.pristine = null;
      state.confirmedRevisions = undefined;
      state.version = null;
    });
  }
};
