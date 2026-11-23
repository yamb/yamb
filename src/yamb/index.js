import { z } from 'zod';

import { YambConfigError } from '../errors/index.js';
import { configureOptions } from '../options.js';
import { Post } from '../post/index.js';
import { ConfigSchema } from '../schemas/zod.js';
import { defaultSlugger } from '../slug/slugger.js';
import { setState } from './internal.js';
import methods from './methods.js';
import props from './props.js';

export class Yamb {
  constructor(config) {
    const result = ConfigSchema.safeParse(config);

    if (!result.success) {
      throw new YambConfigError(`invalid config: ${z.prettifyError(result.error)}`, {
        details: { issues: result.error.issues }
      });
    }

    const validated = result.data;

    configureOptions(this, validated.options);

    const renderers = { ...validated.renderers };

    const state = {
      storage: validated.storage,
      renderers,
      base: validated.base ?? 'http://localhost',
      timeZone: validated.timeZone ?? 'UTC',
      signal: validated.signal,
      slugger: validated.slugger ?? defaultSlugger,
      clock: validated.clock ?? (() => Temporal.Now.instant()),
      onError: validated.onError,
      isOpen: false,
      byId: new Map(),
      byUri: new Map()
    };

    state._hydrate = (raw) => new Post(this, raw, { pristine: true });

    Object.defineProperty(this, 'storage', {
      get: () => state.storage
    });

    Object.defineProperty(this, 'renderers', {
      get: () => state.renderers
    });

    Object.defineProperty(this, 'base', { get: () => state.base });

    Object.defineProperty(this, 'timeZone', {
      get: () => state.timeZone
    });

    Object.defineProperty(this, 'signal', { get: () => state.signal });

    Object.defineProperty(this, 'slugger', {
      get: () => state.slugger
    });

    Object.defineProperty(this, 'clock', { get: () => state.clock });

    Object.defineProperty(this, 'onError', {
      get: () => state.onError
    });

    Object.defineProperty(this, 'isOpen', { get: () => state.isOpen });
    Object.defineProperty(this, '_hydrate', { value: state._hydrate });

    setState(this, state);
  }

  static {
    for (const prop of props) {
      const descriptor = { enumerable: true, configurable: false };

      if (prop.get !== false) {
        descriptor.get = function () {
          return prop.get(this);
        };
      }

      if (prop.set !== false) {
        descriptor.set = function (value) {
          prop.set(this, value);
        };
      }

      Object.defineProperty(this.prototype, prop.name, descriptor);
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
