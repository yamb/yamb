import { StorageReadError, PostDateError, PostValidationError } from '../errors/index.js';
import { getOptionsConfig } from '../options.js';
import { IdSchema, InstantSchema, LinksSchema, PostSchema } from '../schemas/zod.js';
import { setState } from './internal.js';
import { validateField } from './lib/field.js';
import { copyOwned, copyValue } from './lib/snapshot.js';
import methods from './methods.js';
import props from './props.js';
import cover from './props/cover.js';

const StoredSchema = PostSchema.safeExtend({
  id: IdSchema,
  links: LinksSchema.extend({ related: LinksSchema.shape.related.removeDefault() })
});

const descriptors = {};

function hydrate(raw, stored, optionsConfig) {
  for (const field of Reflect.ownKeys(raw)) {
    if (!Object.hasOwn(descriptors, field)) {
      const ErrorClass = stored ? StorageReadError : PostValidationError;

      throw new ErrorClass('unknown post field', { details: { field } });
    }
  }

  const data = { ...raw };

  for (const field of ['createdAt', 'updatedAt', 'publishedAt']) {
    if (data[field] !== undefined && !(data[field] instanceof Temporal.Instant)) {
      try {
        data[field] = InstantSchema.parse(data[field]);
      } catch (err) {
        if (stored) {
          throw new StorageReadError(`corrupt stored post: invalid ${field}`, {
            cause: err,
            details: { id: raw.id, uri: raw.uri, field }
          });
        }

        throw new PostDateError(`invalid ${field}`, {
          cause: err,
          details: { field, value: data[field] }
        });
      }
    }
  }

  for (const field of Object.keys(data)) {
    if (field === 'options') {
      continue;
    }

    data[field] = copyValue(data[field]);
  }

  try {
    data.options = optionsConfig.normalize(data.options);
  } catch (cause) {
    if (stored) {
      throw new StorageReadError('corrupt stored post: invalid options', {
        cause,
        details: { id: raw.id, uri: raw.uri, field: 'options' }
      });
    }

    throw cause;
  }

  data.cover = validateField(cover, data.cover === undefined ? {} : data.cover);

  if (stored) {
    StoredSchema.parse(data);
  }

  return data;
}

export class Post {
  constructor(yamb, raw, { pristine = true } = {}) {
    const optionsConfig = getOptionsConfig(yamb);
    let data;

    try {
      data = hydrate(raw ?? {}, pristine, optionsConfig);
    } catch (cause) {
      if (!pristine || cause instanceof StorageReadError) {
        throw cause;
      }

      throw new StorageReadError('corrupt stored post', {
        cause,
        details: { id: raw?.id, uri: raw?.uri }
      });
    }

    setState(this, {
      yamb,
      optionsConfig,
      data,
      pristine: pristine ? copyOwned(data) : null,
      cache: {},
      touched: new Set()
    });

    Object.defineProperties(this, descriptors);
    Object.preventExtensions(this);
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

      descriptors[prop.name] = descriptor;
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
