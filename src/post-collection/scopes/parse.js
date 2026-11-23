import { z } from 'zod';

import { QueryValidationError } from '../../errors/index.js';

export function parseOrThrow(schema, value, field) {
  const result = schema.safeParse(value);

  if (!result.success) {
    throw new QueryValidationError(`${field}: ${z.prettifyError(result.error)}`, {
      details: { field, issues: result.error.issues }
    });
  }

  return result.data;
}
