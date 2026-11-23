import { closeIterator } from './close.js';

export async function* mapAsync(source, fn) {
  let i = 0;

  for await (const v of source) {
    yield await fn(v, i++);
  }
}

export async function* filterAsync(source, fn) {
  let i = 0;

  for await (const v of source) {
    if (await fn(v, i++)) {
      yield v;
    }
  }
}

export async function* takeAsync(source, n) {
  if (n <= 0) {
    return;
  }

  let i = 0;

  for await (const v of source) {
    yield v;
    i += 1;

    if (i >= n) {
      return;
    }
  }
}

export async function* dropAsync(source, n) {
  let i = 0;

  for await (const v of source) {
    if (i < n) {
      i += 1;
      continue;
    }

    yield v;
  }
}

export async function* flatMapAsync(source, fn) {
  let i = 0;

  for await (const v of source) {
    const inner = await fn(v, i++);

    if (inner == null) {
      throw new TypeError('flatMap: function must return an iterable or async iterable');
    }

    if (typeof inner[Symbol.asyncIterator] === 'function') {
      yield* inner;
      continue;
    }

    if (typeof inner[Symbol.iterator] === 'function') {
      for (const x of inner) {
        yield x;
      }

      continue;
    }

    throw new TypeError('flatMap: function must return an iterable or async iterable');
  }
}

export async function toArrayAsync(source) {
  const out = [];

  for await (const v of source) {
    out.push(v);
  }

  return out;
}

export async function forEachAsync(source, fn) {
  let i = 0;

  for await (const v of source) {
    await fn(v, i++);
  }
}

export async function reduceAsync(source, reducer, ...rest) {
  const iter = source[Symbol.asyncIterator]();
  let acc;
  let i = 0;
  let failed = false;

  try {
    if (rest.length > 0) {
      acc = rest[0];
    } else {
      const first = await iter.next();

      if (first.done) {
        throw new TypeError('reduce of empty async iterator with no initial value');
      }

      acc = first.value;
      i = 1;
    }

    while (true) {
      const { value, done } = await iter.next();

      if (done) {
        return acc;
      }

      acc = await reducer(acc, value, i++);
    }
  } catch (error) {
    failed = true;
    throw error;
  } finally {
    await closeIterator(iter, { preserveError: failed });
  }
}

export async function someAsync(source, fn) {
  let i = 0;

  for await (const v of source) {
    if (await fn(v, i++)) {
      return true;
    }
  }

  return false;
}

export async function everyAsync(source, fn) {
  let i = 0;

  for await (const v of source) {
    if (!(await fn(v, i++))) {
      return false;
    }
  }

  return true;
}

export async function findAsync(source, fn) {
  let i = 0;

  for await (const v of source) {
    if (await fn(v, i++)) {
      return v;
    }
  }

  return undefined;
}
