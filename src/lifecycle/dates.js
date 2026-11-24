import { Status } from '../constants/index.js';
import { PostDateError } from '../errors/index.js';
import { parse } from '../schemas/parse.js';
import { InstantSchema } from '../schemas/zod.js';

export function resolveNow(clock) {
  const now = clock();

  if (!(now instanceof Temporal.Instant)) {
    throw new PostDateError('clock() must return a Temporal.Instant', {
      details: { field: 'clock' }
    });
  }

  return parse(InstantSchema, now, PostDateError, 'clock');
}

export function applySaveLifecycle(data, clock) {
  const now = resolveNow(clock);

  data.createdAt ??= now;
  data.updatedAt = now;

  if (data.status === Status.Published && !data.publishedAt) {
    data.publishedAt = now;
  }
}
