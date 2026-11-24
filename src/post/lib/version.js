import { PostValidationError } from '../../errors/index.js';
import { VersionSchema } from '../../schemas/zod.js';

export function expectedVersion(options) {
  const expected = options?.expected;

  if (expected === undefined || expected === null || VersionSchema.safeParse(expected).success) {
    return expected;
  }

  throw new PostValidationError('expected must be a version string or null', {
    details: { field: 'expected' }
  });
}
