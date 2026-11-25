import { isDeepStrictEqual } from 'node:util';

import { PostValidationError } from '../../errors/index.js';

export function copyValue(value) {
  try {
    return copy(value);
  } catch (cause) {
    if (cause instanceof RangeError) {
      throw new PostValidationError('post structure exceeds the supported stack depth', { cause });
    }

    throw cause;
  }
}

function copy(value, copies, ancestors) {
  if (value === null || typeof value !== 'object' || value instanceof Temporal.Instant) {
    if (typeof value === 'function' || typeof value === 'symbol' || typeof value === 'bigint') {
      throw new PostValidationError('post data must contain serializable values');
    }

    return value;
  }

  const cloned = copies ?? new Map();
  const path = ancestors ?? new Set();
  const array = Array.isArray(value);
  const prototype = Object.getPrototypeOf(value);

  if (path.has(value) || (!array && prototype !== Object.prototype && prototype !== null)) {
    throw new PostValidationError('post data must contain acyclic plain objects and arrays');
  }

  if (cloned.has(value)) {
    return cloned.get(value);
  }

  const result = array ? [] : {};
  const keys = Reflect.ownKeys(value);

  cloned.set(value, result);
  path.add(value);

  for (const key of keys) {
    if (array && key === 'length') {
      continue;
    }

    const descriptor = Object.getOwnPropertyDescriptor(value, key);

    if (
      typeof key !== 'string' ||
      key === '__proto__' ||
      !descriptor.enumerable ||
      !('value' in descriptor) ||
      (array && (!/^(0|[1-9]\d*)$/.test(key) || Number(key) >= value.length))
    ) {
      throw new PostValidationError('post data cannot contain accessors or hidden properties');
    }

    Object.defineProperty(result, key, {
      value: copy(descriptor.value, cloned, path),
      writable: true,
      enumerable: true,
      configurable: true
    });
  }

  path.delete(value);

  if (array && (result.length !== value.length || keys.length - 1 !== value.length)) {
    throw new PostValidationError('post arrays cannot contain holes');
  }

  return result;
}

export function copyOwned(value, copies) {
  if (value === null || typeof value !== 'object' || value instanceof Temporal.Instant) {
    return value;
  }

  const cloned = copies ?? new Map();

  if (cloned.has(value)) {
    return cloned.get(value);
  }

  const result = Array.isArray(value) ? [] : {};

  cloned.set(value, result);

  for (const key of Object.keys(value)) {
    result[key] = copyOwned(value[key], cloned);
  }

  return result;
}

export function captureRevision(state) {
  return {
    data: copyOwned(state.data),
    fields: new Map(state.fieldRevisions),
    pristine: state.pristine
  };
}

export function sameValue(left, right) {
  if (left instanceof Temporal.Instant) {
    return right instanceof Temporal.Instant && left.equals(right);
  }

  if (right instanceof Temporal.Instant) {
    return false;
  }

  return isDeepStrictEqual(left, right);
}

export function inheritConfirmed(state, revision) {
  if (revision.pristine === state.pristine || !state.confirmedRevisions) {
    return;
  }

  for (const field of Object.keys(state.pristine)) {
    if ((revision.fields.get(field) ?? 0) === (state.confirmedRevisions.get(field) ?? 0)) {
      revision.data[field] = copyOwned(state.pristine[field]);
    }
  }
}

export function sameRevision(data, pristine) {
  if (!pristine) {
    return false;
  }

  for (const field of new Set([...Object.keys(data), ...Object.keys(pristine)])) {
    if (field !== 'uri' && field !== 'updatedAt' && !sameValue(data[field], pristine[field])) {
      return false;
    }
  }

  return true;
}
