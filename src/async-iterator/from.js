// `for await` does not close an iterator whose next() rejects or whose result cannot be read, but a storage cursor
// still holds its handle then.
function closeOnFailedNext(iterator) {
  return {
    [Symbol.asyncIterator]: () => ({
      async next() {
        try {
          const { done, value } = await iterator.next();

          return { done, value };
        } catch (error) {
          await Promise.try(() => iterator.return?.()).catch(() => {});
          throw error;
        }
      },
      return: iterator.return?.bind(iterator)
    })
  };
}

export function toAsyncIterable(source) {
  if (source == null) {
    throw new TypeError('AsyncIteratorHelper: source must not be null/undefined');
  }

  if (typeof source[Symbol.asyncIterator] === 'function') {
    return closeOnFailedNext(source[Symbol.asyncIterator]());
  }

  if (typeof source[Symbol.iterator] === 'function') {
    return source;
  }

  if (typeof source.next === 'function') {
    return closeOnFailedNext(source);
  }

  throw new TypeError('AsyncIteratorHelper: source is not iterable');
}
