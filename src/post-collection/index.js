import helpers from '../async-iterator/helpers.js';
import { AsyncIteratorHelper } from '../async-iterator/index.js';
import { effectiveSignal } from '../signal.js';
import { setState, getState } from './internal.js';
import scopes from './scopes.js';

export class PostCollection {
  constructor(yamb, query = {}, options = {}) {
    setState(this, { yamb, query, options });
  }

  _withQuery(extra) {
    const state = getState(this);

    return new PostCollection(state.yamb, { ...state.query, ...extra }, state.options);
  }

  _withOptions(extra) {
    const state = getState(this);

    return new PostCollection(state.yamb, state.query, {
      ...state.options,
      ...extra
    });
  }

  async *[Symbol.asyncIterator]() {
    const state = getState(this);

    if (state.options.limit === 0) {
      return;
    }

    const signal = effectiveSignal(state.yamb, state.options);
    const storageOptions = signal ? { ...state.options, signal } : state.options;

    for await (const raw of state.yamb.storage.all(state.query, storageOptions)) {
      signal?.throwIfAborted();
      yield state.yamb._hydrate(raw);
    }
  }

  static {
    for (const scope of scopes) {
      Object.defineProperty(this.prototype, scope.name, {
        value(...args) {
          return scope.fn(this, ...args);
        },
        writable: false,
        configurable: false,
        enumerable: false
      });
    }

    for (const helper of helpers) {
      Object.defineProperty(this.prototype, helper.name, {
        value(...args) {
          const state = getState(this);
          const signal = effectiveSignal(state.yamb, state.options);
          const wrapped = AsyncIteratorHelper.from(this, { signal });

          return wrapped[helper.name](...args);
        },
        writable: false,
        configurable: false,
        enumerable: false
      });
    }
  }
}
