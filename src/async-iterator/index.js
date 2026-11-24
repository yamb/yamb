import { toAsyncIterable } from './from.js';
import helpers from './helpers.js';
import { getState, setState } from './internal.js';

async function* iterate({ source, signal }) {
  signal?.throwIfAborted();

  for await (const value of toAsyncIterable(source)) {
    signal?.throwIfAborted();
    yield value;
    signal?.throwIfAborted();
  }
}

export class AsyncIteratorHelper {
  constructor(source, { signal = null } = {}) {
    setState(this, { source, signal, iterator: null });
  }

  static from(source, options = {}) {
    return new AsyncIteratorHelper(source, options);
  }

  [Symbol.asyncIterator]() {
    return this;
  }

  next(value) {
    const state = getState(this);
    state.iterator ??= iterate(state);

    return state.iterator.next(value);
  }

  return(value) {
    const state = getState(this);
    state.iterator ??= iterate(state);

    return state.iterator.return(value);
  }

  async [Symbol.asyncDispose]() {
    await this.return();
  }

  static {
    for (const { name, lazy, check, run } of helpers) {
      Object.defineProperty(this.prototype, name, {
        value(arg, ...rest) {
          const result = run(this, check ? check(name, arg) : arg, ...rest);

          return lazy ? new AsyncIteratorHelper(result, { signal: getState(this).signal }) : result;
        },
        writable: false,
        configurable: false,
        enumerable: false
      });
    }
  }
}
