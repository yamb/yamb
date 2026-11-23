import { AsyncIteratorHelper } from '../../async-iterator/index.js';
import { Status } from '../../constants/index.js';
import { effectiveSignal } from '../../signal.js';
import { getState } from '../internal.js';

export default {
  name: 'related',

  fn(post, options = {}) {
    const state = getState(post);
    const { yamb } = state;
    const ids = state.data.links?.related ?? [];
    const signal = effectiveSignal(yamb, options);

    async function* source() {
      for (const id of ids) {
        signal?.throwIfAborted();
        const raw = await yamb.storage.find(id, { signal });

        if (raw && raw.status === Status.Published) {
          yield yamb._hydrate(raw);
        }
      }
    }

    return AsyncIteratorHelper.from(source(), { signal });
  }
};
