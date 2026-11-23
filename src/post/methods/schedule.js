import { Status } from '../../constants/index.js';
import { PostDateError } from '../../errors/index.js';
import { InstantSchema } from '../../schemas/zod.js';
import { getState } from '../internal.js';
import { setFieldValue } from '../lib/field.js';
import save from './save.js';

export default {
  name: 'schedule',

  async fn(post, instant, options) {
    const result = InstantSchema.safeParse(instant);

    if (!result.success) {
      throw new PostDateError('schedule requires valid Instant', {
        details: { issues: result.error.issues }
      });
    }

    const state = getState(post);

    if (Temporal.Instant.compare(result.data, state.yamb.clock()) <= 0) {
      throw new PostDateError('schedule requires a publishedAt in the future', {
        details: { publishedAt: result.data.toString() }
      });
    }

    setFieldValue(state, 'status', Status.Scheduled);
    setFieldValue(state, 'publishedAt', result.data);

    return save.fn(post, options);
  }
};
