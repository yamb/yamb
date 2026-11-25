import { Status } from '../../constants/index.js';
import { PostDateError } from '../../errors/index.js';
import { resolveNow } from '../../lifecycle/dates.js';
import { parse } from '../../schemas/parse.js';
import { InstantSchema } from '../../schemas/zod.js';
import { getState } from '../internal.js';
import { setFieldValue } from '../lib/field.js';
import save from './save.js';

export default {
  name: 'schedule',

  async fn(post, instant, options) {
    const publishedAt = parse(InstantSchema, instant, PostDateError, 'publishedAt');
    const state = getState(post);

    if (Temporal.Instant.compare(publishedAt, resolveNow(state.yamb.clock)) <= 0) {
      throw new PostDateError('schedule requires a publishedAt in the future', {
        details: { field: 'publishedAt', publishedAt: publishedAt.toString() }
      });
    }

    setFieldValue(state, 'status', Status.Scheduled);
    setFieldValue(state, 'publishedAt', publishedAt);

    return save.fn(post, options);
  }
};
