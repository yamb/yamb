import { UriSchema } from '../../schemas/zod.js';
import { begin } from '../../signal.js';
import { getState } from '../internal.js';

export default {
  name: 'fetch',

  async fn(yamb, input, options = {}) {
    const state = getState(yamb);
    const signal = begin(yamb, options);
    const uri = yamb.uri(input);

    if (!UriSchema.safeParse(uri).success) {
      return null;
    }

    const raw = await state.storage.fetch(uri, { signal });

    return raw ? state._hydrate(raw) : null;
  }
};
