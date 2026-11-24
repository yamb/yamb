import { PostValidationError, StorageReadError } from '../errors/index.js';
import { getOptionsConfig } from '../options.js';
import { IdSchema, LinksSchema, PostSchema, VersionSchema } from '../schemas/zod.js';
import { getState, setState } from './internal.js';
import { prepareInput, readField, validateField, writeField } from './lib/field.js';
import { copyOwned } from './lib/snapshot.js';
import methods from './methods.js';
import props from './props.js';

const StoredSchema = PostSchema.safeExtend({
  id: IdSchema,
  version: VersionSchema.nullable().optional(),
  links: LinksSchema.extend({ related: LinksSchema.shape.related.removeDefault() })
});

const byName = new Map(props.map((prop) => [prop.name, prop]));
const descriptors = {};

function load(raw, optionsConfig) {
  try {
    const { version = null, ...data } = StoredSchema.parse(raw);

    data.options = optionsConfig.validate(data.options);

    return { data, version };
  } catch (cause) {
    throw new StorageReadError('corrupt stored post', {
      cause,
      details: {
        id: raw?.id,
        uri: raw?.uri,
        field: cause.details?.field ?? cause.issues?.[0]?.path?.[0]
      }
    });
  }
}

function build(input, optionsConfig) {
  const state = { optionsConfig };
  const data = {};

  for (const field of Reflect.ownKeys(input)) {
    const prop = byName.get(field);

    if (!prop) {
      throw new PostValidationError('unknown post field', { details: { field } });
    }

    if (input[field] !== undefined) {
      data[field] = validateField(prop, prepareInput(prop, input[field]), state);
    }
  }

  data.cover ??= {};
  data.options ??= optionsConfig.validate(undefined);

  return { data, version: null };
}

export class Post {
  constructor(yamb, raw, { pristine = true } = {}) {
    const optionsConfig = getOptionsConfig(yamb);
    const { data, version } = pristine ? load(raw, optionsConfig) : build(raw, optionsConfig);

    setState(this, {
      yamb,
      optionsConfig,
      data,
      pristine: pristine ? copyOwned(data) : null,
      version,
      cache: {}
    });

    Object.defineProperties(this, descriptors);
    Object.preventExtensions(this);
  }

  static {
    for (const prop of props) {
      descriptors[prop.name] = {
        enumerable: true,
        configurable: false,
        get() {
          return prop.read ? prop.read(getState(this)) : readField(this, prop);
        },
        set: prop.readonly
          ? undefined
          : function (value) {
              writeField(this, prop, value === undefined && prop.absent ? prop.absent : value);
            }
      };
    }

    Object.defineProperty(this.prototype, 'version', {
      get() {
        return getState(this).version;
      },
      enumerable: false,
      configurable: false
    });

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
