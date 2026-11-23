import { types } from 'node:util';

function record(value) {
  if (value === null || typeof value !== 'object') {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);

  return (
    prototype === Object.prototype ||
    prototype === null ||
    (Array.isArray(value) && prototype === Array.prototype)
  );
}

function immutable(value, clone, copies = new WeakMap(), path = new WeakSet()) {
  if (
    value === null ||
    ['string', 'boolean'].includes(typeof value) ||
    (typeof value === 'number' && Number.isFinite(value))
  ) {
    return value;
  }

  if (types.isProxy(value) || !record(value)) {
    throw new TypeError('prepared data must contain only JSON values, plain records and arrays');
  }

  if (path.has(value)) {
    throw new TypeError('prepared data must not contain circular objects');
  }

  if (copies.has(value)) {
    return copies.get(value);
  }

  const array = Array.isArray(value);
  let result = value;

  if (clone) {
    result = array ? [] : {};
  }

  copies.set(value, result);
  path.add(value);

  const keys = Reflect.ownKeys(value);

  for (const key of keys) {
    if (array && key === 'length') {
      continue;
    }

    const descriptor = Object.getOwnPropertyDescriptor(value, key);

    if (
      typeof key !== 'string' ||
      key === '__proto__' ||
      !descriptor.enumerable ||
      !Object.hasOwn(descriptor, 'value') ||
      (array && (!/^(0|[1-9]\d*)$/.test(key) || Number(key) >= value.length))
    ) {
      throw new TypeError(
        'prepared data must not contain accessors, hidden or extra array properties'
      );
    }

    const child = immutable(descriptor.value, clone, copies, path);

    if (clone) {
      Object.defineProperty(result, key, {
        value: child,
        enumerable: true,
        configurable: true,
        writable: true
      });
    }
  }

  if (array && keys.length - 1 !== value.length) {
    throw new TypeError('prepared arrays must not contain holes');
  }

  path.delete(value);

  return Object.freeze(result);
}

function snapshot(source) {
  if (types.isProxy(source) || !record(source) || Array.isArray(source)) {
    throw new TypeError('source must be a plain PostData record');
  }

  return immutable(source, true);
}

export async function prepare(source, stages, ctx = {}) {
  ctx.signal?.throwIfAborted();

  const result = await transform(snapshot(source), stages, ctx);

  ctx.signal?.throwIfAborted();

  return immutable(result, false);
}

export async function transform(value, stages, ctx = {}) {
  ctx.signal?.throwIfAborted();

  let result = value;

  for (const stage of stages) {
    ctx.signal?.throwIfAborted();

    try {
      result = await stage.transform(result, ctx);
    } catch (cause) {
      if (ctx.signal?.aborted && Object.is(cause, ctx.signal.reason)) {
        throw cause;
      }

      if (cause?.name === 'AbortError') {
        throw cause;
      }

      const error = new Error(`transformer "${stage.name}" failed`, { cause });
      error.name = 'TransformError';
      error.code = 'YAMB_TRANSFORM_FAILED';
      error.stage = stage.name;

      throw error;
    }

    ctx.signal?.throwIfAborted();
  }

  return result;
}
