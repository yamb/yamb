import { z } from 'zod';

export function parse(schema, value, ErrorClass, field) {
  const result = schema.safeParse(value);

  if (!result.success) {
    throw new ErrorClass(`${field}: ${z.prettifyError(result.error)}`, {
      details: { field, issues: result.error.issues }
    });
  }

  return result.data;
}
