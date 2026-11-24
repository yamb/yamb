import { randomUUIDv7 } from 'node:crypto';

import { PostValidationError } from '../../errors/index.js';
import { expectedVersion } from '../../post/lib/version.js';
import { reportError } from '../../report-error.js';
import { parse } from '../../schemas/parse.js';
import { IdSchema } from '../../schemas/zod.js';
import { begin } from '../../signal.js';
import { getState } from '../internal.js';

export default {
  name: 'fence',

  async fn(yamb, id, expected, options = {}) {
    const state = getState(yamb);
    const signal = begin(yamb, options);

    parse(IdSchema, id, PostValidationError, 'id');

    if (expectedVersion({ expected }) === undefined) {
      throw new PostValidationError('fence requires an expected version or null', {
        details: { field: 'expected' }
      });
    }

    const version = randomUUIDv7();

    try {
      await state.storage.fence(id, version, { signal, expected });
    } catch (err) {
      reportError(state.onError, err, { op: 'fence', id });
      throw err;
    }

    return version;
  }
};
