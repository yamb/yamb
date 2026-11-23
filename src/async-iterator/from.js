export function toAsyncIterator(source) {
  if (source == null) {
    throw new TypeError('AsyncIteratorHelper: source must not be null/undefined');
  }

  if (typeof source[Symbol.asyncIterator] === 'function') {
    return source[Symbol.asyncIterator]();
  }

  if (typeof source[Symbol.iterator] === 'function') {
    return (async function* () {
      for await (const value of source) {
        yield value;
      }
    })();
  }

  if (typeof source.next === 'function') {
    return source;
  }

  throw new TypeError('AsyncIteratorHelper: source is not iterable');
}
