import { AsyncIteratorHelper } from '../../async-iterator/index.js';
import { Status } from '../../constants/index.js';
import { begin, effectiveSignal } from '../../signal.js';
import { getState } from '../internal.js';

export default {
  name: 'related',

  fn(post, options = {}) {
    const { yamb, data } = getState(post);
    const ids = data.links?.related ?? [];

    async function* source() {
      const signal = begin(yamb, options);

      for (const id of ids) {
        const raw = await yamb.storage.find(id, { signal });

        if (raw?.status === Status.Published) {
          yield yamb._hydrate(raw);
        }
      }
    }

    return AsyncIteratorHelper.from(source(), { signal: effectiveSignal(yamb, options) });
  }
};
