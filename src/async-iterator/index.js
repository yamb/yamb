import { closeIterator } from './close.js';
import { toAsyncIterator } from './from.js';
import helpers from './helpers.js';
import { getState, setState } from './internal.js';

async function* iterate(state) {
  const iterator = toAsyncIterator(state.source);
  let failed = false;
  let finished = false;

  try {
    while (true) {
      state.signal?.throwIfAborted();
      const { value, done } = await iterator.next();

      if (done) {
        finished = true;
        return;
      }

      state.signal?.throwIfAborted();
      yield value;
    }
  } catch (error) {
    failed = true;
    throw error;
  } finally {
    if (!finished) {
      await closeIterator(iterator, { preserveError: failed });
    }
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
    for (const helper of helpers) {
      Object.defineProperty(this.prototype, helper.name, {
        value(...args) {
          return helper.fn(this, ...args);
        },
        writable: false,
        configurable: false,
        enumerable: false
      });
    }
  }
}
