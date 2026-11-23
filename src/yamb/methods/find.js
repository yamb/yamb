import { QueryValidationError, YambNotOpenError } from '../../errors/index.js';
import { IdSchema } from '../../schemas/zod.js';
import { effectiveSignal } from '../../signal.js';
import { getState } from '../internal.js';

export default {
  name: 'find',

  async fn(yamb, id, options = {}) {
    const state = getState(yamb);

    if (!state.isOpen) {
      throw new YambNotOpenError();
    }

    const result = IdSchema.safeParse(id);

    if (!result.success) {
      throw new QueryValidationError('find requires a valid id (non-empty string, max 64 chars)', {
        details: { issues: result.error.issues }
      });
    }

    const signal = effectiveSignal(yamb, options);

    signal?.throwIfAborted();

    const raw = await state.storage.find(result.data, { signal });

    if (!raw) {
      return null;
    }

    return state._hydrate(raw);
  }
};
