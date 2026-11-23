import { PostValidationError } from '../../errors/index.js';
import { copyOwned, copyValue } from './snapshot.js';

const mutators = new Set([
  'push',
  'pop',
  'shift',
  'unshift',
  'splice',
  'sort',
  'reverse',
  'fill',
  'copyWithin'
]);

export function observe(root, hooks) {
  const proxies = new WeakMap();

  function transact(target, edit) {
    hooks.begin();

    try {
      const copies = new Map();
      let candidate = copyOwned(root, copies);
      const attached = copies.has(target);

      if (!attached) {
        candidate = copyOwned(target, copies);
      }

      const draftTarget = copies.get(target);
      const originals = new Map([...copies].map(([raw, draft]) => [draft, raw]));
      const result = edit(draftTarget, originals);

      const plain = copyValue(candidate);
      const validated = attached ? hooks.validate(plain) : plain;

      reconcile(candidate, validated);

      const committed = new Map();

      function commit(draft) {
        if (draft === null || typeof draft !== 'object') {
          return draft;
        }

        if (committed.has(draft)) {
          return committed.get(draft);
        }

        const raw = originals.get(draft) ?? (Array.isArray(draft) ? [] : {});

        committed.set(draft, raw);

        for (const key of Object.keys(raw)) {
          if (!Object.hasOwn(draft, key)) {
            delete raw[key];
          }
        }

        for (const key of Object.keys(draft)) {
          const value = commit(draft[key]);

          if (Object.hasOwn(raw, key) && Object.is(raw[key], value)) {
            continue;
          }

          Object.defineProperty(raw, key, {
            value,
            writable: true,
            enumerable: true,
            configurable: true
          });
        }

        if (Array.isArray(raw)) {
          raw.length = draft.length;
        }

        return raw;
      }

      commit(candidate);

      if (attached) {
        hooks.changed();
      }

      if (result === draftTarget) {
        return wrap(target);
      }

      if (Array.isArray(result) && !originals.has(result)) {
        return result.map((item) => wrap(commit(item)));
      }

      return wrap(commit(result));
    } finally {
      hooks.end();
    }
  }

  function wrap(target) {
    if (target === null || typeof target !== 'object') {
      return target;
    }

    let proxy = proxies.get(target);

    if (proxy) {
      return proxy;
    }

    proxy = new Proxy(target, {
      get(raw, key, receiver) {
        if (Array.isArray(raw) && mutators.has(key)) {
          return function (...args) {
            if (this !== receiver) {
              return Array.prototype[key].apply(this, args);
            }

            return transact(raw, (draft, originals) => {
              const incoming = key === 'sort' ? args : args.map((arg) => copyValue(arg));
              const compare = incoming[0];

              if (key === 'sort' && typeof compare === 'function') {
                incoming[0] = (a, b) =>
                  compare(wrap(originals.get(a) ?? a), wrap(originals.get(b) ?? b));
              }

              return Array.prototype[key].apply(draft, incoming);
            });
          };
        }

        const value = Reflect.get(raw, key, receiver);

        return Object.hasOwn(raw, key) ? wrap(value) : value;
      },
      getOwnPropertyDescriptor(raw, key) {
        const descriptor = Reflect.getOwnPropertyDescriptor(raw, key);

        if (descriptor && 'value' in descriptor) {
          descriptor.value = wrap(descriptor.value);
        }

        return descriptor;
      },
      set(raw, key, value) {
        return transact(raw, (draft) => Reflect.set(draft, key, copyValue(value)));
      },
      deleteProperty(raw, key) {
        return transact(raw, (draft) => Reflect.deleteProperty(draft, key));
      },
      defineProperty(raw, key, descriptor) {
        const length = Array.isArray(raw) && key === 'length';

        if (
          'get' in descriptor ||
          'set' in descriptor ||
          descriptor.writable === false ||
          (length
            ? descriptor.enumerable === true || descriptor.configurable === true
            : descriptor.enumerable === false || descriptor.configurable === false)
        ) {
          throw new PostValidationError('post data properties must remain ordinary mutable values');
        }

        return transact(raw, (draft) => {
          const current = Object.getOwnPropertyDescriptor(draft, key);

          if (!current && !('value' in descriptor)) {
            throw new PostValidationError('a new post data property needs a value');
          }

          return Reflect.defineProperty(draft, key, {
            value: 'value' in descriptor ? copyValue(descriptor.value) : current.value,
            writable: true,
            enumerable: !length,
            configurable: !length
          });
        });
      },
      setPrototypeOf() {
        throw new PostValidationError('post data prototypes cannot change');
      },
      preventExtensions() {
        throw new PostValidationError('post data must remain extensible');
      }
    });

    proxies.set(target, proxy);

    return proxy;
  }

  return wrap(root);
}

export function reconcile(draft, parsed) {
  for (const key of Object.keys(draft)) {
    if (!Object.hasOwn(parsed, key)) {
      delete draft[key];
    }
  }

  for (const key of Object.keys(parsed)) {
    const present = Object.hasOwn(draft, key);
    const previous = present ? draft[key] : undefined;
    const next = parsed[key];

    if (present && Object.is(previous, next)) {
      continue;
    }

    if (
      previous !== null &&
      next !== null &&
      typeof previous === 'object' &&
      typeof next === 'object'
    ) {
      reconcile(previous, next);
    } else {
      Object.defineProperty(draft, key, {
        value: next,
        writable: true,
        configurable: true,
        enumerable: true
      });
    }
  }

  if (Array.isArray(draft)) {
    draft.length = parsed.length;
  }
}
