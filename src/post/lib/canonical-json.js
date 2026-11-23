import { PostValidationError } from '../../errors/index.js';

export function canonicalJSON(value) {
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalJSON(item)).join(',')}]`;
  }

  if (value !== null && typeof value === 'object') {
    const prototype = Object.getPrototypeOf(value);

    if (prototype !== Object.prototype && prototype !== null) {
      throw new PostValidationError('cannot hash non-JSON post data');
    }

    const entries = Object.keys(value)
      .toSorted()
      .filter((key) => value[key] !== undefined)
      .map((key) => `${JSON.stringify(key)}:${canonicalJSON(value[key])}`);

    return `{${entries.join(',')}}`;
  }

  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'boolean' ||
    (typeof value === 'number' && Number.isFinite(value))
  ) {
    return JSON.stringify(value);
  }

  throw new PostValidationError('cannot hash non-JSON post data');
}
