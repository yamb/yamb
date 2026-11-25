import { QueryValidationError } from '../../errors/index.js';
import { parse } from '../../schemas/parse.js';
import { IdSchema } from '../../schemas/zod.js';
import { begin } from '../../signal.js';
import { getState } from '../internal.js';

export default {
  name: 'find',

  async fn(yamb, id, options = {}) {
    const state = getState(yamb);
    const signal = begin(yamb, options);
    const raw = await state.storage.find(parse(IdSchema, id, QueryValidationError, 'id'), {
      signal
    });

    return raw ? state._hydrate(raw) : null;
  }
};
