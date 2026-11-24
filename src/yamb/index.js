import { YambConfigError } from '../errors/index.js';
import { configureOptions } from '../options.js';
import { Post } from '../post/index.js';
import { parse } from '../schemas/parse.js';
import { ConfigSchema } from '../schemas/zod.js';
import { defaultSlugger } from '../slug/slugger.js';
import { normalizeUri } from '../uri.js';
import { getState, setState } from './internal.js';
import methods from './methods.js';

const exposed = [
  'storage',
  'renderers',
  'base',
  'timeZone',
  'signal',
  'slugger',
  'clock',
  'onError',
  'isOpen'
];

export class Yamb {
  constructor(config) {
    const validated = parse(ConfigSchema, config, YambConfigError, 'config');

    configureOptions(this, validated.options);

    const state = {
      storage: validated.storage,
      renderers: { ...validated.renderers },
      base: validated.base ?? 'http://localhost',
      timeZone: validated.timeZone ?? 'UTC',
      signal: validated.signal,
      slugger: validated.slugger ?? defaultSlugger,
      clock: validated.clock ?? (() => Temporal.Now.instant()),
      onError: validated.onError,
      isOpen: false,
      byId: new Map(),
      byUri: new Map(),
      walks: new Set(),
      _hydrate: (raw) => new Post(this, raw)
    };

    Object.defineProperty(this, '_hydrate', { value: state._hydrate });
    setState(this, state);
  }

  get published() {
    return this.all().published();
  }

  get drafts() {
    return this.all().drafts();
  }

  get scheduled() {
    return this.all().scheduled();
  }

  get archived() {
    return this.all().archived();
  }

  uri(input) {
    return normalizeUri(input, getState(this).base);
  }

  locate(id) {
    return getState(this).byId.get(id);
  }

  identify(uri) {
    return getState(this).byUri.get(uri);
  }

  has(uri) {
    return getState(this).byUri.has(uri);
  }

  [Symbol.asyncDispose]() {
    return this.close();
  }

  [Symbol.asyncIterator]() {
    return this.all()[Symbol.asyncIterator]();
  }

  static {
    for (const name of exposed) {
      Object.defineProperty(this.prototype, name, {
        get() {
          return getState(this)[name];
        },
        enumerable: true,
        configurable: false
      });
    }

    for (const method of methods) {
      Object.defineProperty(this.prototype, method.name, {
        value(...args) {
          return method.fn(this, ...args);
        },
        writable: false,
        configurable: false,
        enumerable: false
      });
    }
  }
}

export function yamb(config) {
  return new Yamb(config);
}
