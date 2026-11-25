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
  if (n === 0) {
    return;
  }

  let left = n;

  for await (const v of source) {
    yield v;

    if (--left === 0) {
      return;
    }
  }
}

export async function* dropAsync(source, n) {
  let skipped = 0;

  for await (const v of source) {
    if (skipped < n) {
      skipped += 1;
    } else {
      yield v;
    }
  }
}

export async function* flatMapAsync(source, fn) {
  let i = 0;

  for await (const v of source) {
    const inner = await fn(v, i++);

    if (
      typeof inner?.[Symbol.asyncIterator] !== 'function' &&
      typeof inner?.[Symbol.iterator] !== 'function'
    ) {
      throw new TypeError('flatMap: function must return an iterable or async iterable');
    }

    yield* inner;
  }
}

export async function forEachAsync(source, fn) {
  let i = 0;

  for await (const v of source) {
    await fn(v, i++);
  }
}

export async function reduceAsync(source, reducer, ...initial) {
  let seeded = initial.length > 0;
  let acc = initial[0];
  let i = 0;

  for await (const v of source) {
    if (seeded) {
      acc = await reducer(acc, v, i);
    } else {
      acc = v;
      seeded = true;
    }

    i += 1;
  }

  if (!seeded) {
    throw new TypeError('reduce of empty async iterator with no initial value');
  }

  return acc;
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
