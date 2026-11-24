import { randomUUIDv7 } from 'node:crypto';

import { PostValidationError, YambNotOpenError } from '../../errors/index.js';
import { expectedVersion } from '../../post/lib/version.js';
import { reportError } from '../../report-error.js';
import { IdSchema } from '../../schemas/zod.js';
import { effectiveSignal } from '../../signal.js';
import { getState } from '../internal.js';

export default {
  name: 'fence',

  async fn(yamb, id, expected, options = {}) {
    const state = getState(yamb);

    if (!state.isOpen) {
      throw new YambNotOpenError();
    }

    if (!IdSchema.safeParse(id).success) {
      throw new PostValidationError('fence requires a valid id', { details: { field: 'id' } });
    }

    if (expectedVersion({ expected }) === undefined) {
      throw new PostValidationError('fence requires an expected version or null', {
        details: { field: 'expected' }
      });
    }

    const signal = effectiveSignal(yamb, options);
    const version = randomUUIDv7();

    signal?.throwIfAborted();

    try {
      await state.storage.fence(id, version, { signal, expected });
    } catch (err) {
      reportError(state.onError, err, { op: 'fence', id });
      throw err;
    }

    return version;
  }
};
