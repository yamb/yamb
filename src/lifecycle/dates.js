import { Status } from '../constants/index.js';
import { PostDateError } from '../errors/index.js';
import { InstantSchema } from '../schemas/zod.js';

function resolveNow(clock) {
  const result = InstantSchema.safeParse(clock());

  if (!result.success) {
    throw new PostDateError(`clock() returned a value that could not be decoded as an instant`, {
      details: { issues: result.error.issues }
    });
  }

  return result.data;
}

export function applySaveLifecycle(data, clock) {
  const now = resolveNow(clock);

  if (!data.createdAt) {
    data.createdAt = now;
  }
  data.updatedAt = now;

  if (data.status === Status.Published && !data.publishedAt) {
    data.publishedAt = now;
  }
}
