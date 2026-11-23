import { isDeepStrictEqual } from 'node:util';

import { z } from 'zod';

import { PostValidationError, QueryValidationError, YambConfigError } from './errors/index.js';
import { copyOwned, copyValue } from './post/lib/snapshot.js';

const configs = new WeakMap();
const EmptySchema = z.strictObject({});
const JsonSchema = z.record(z.string(), z.json());

function parse(schema, value, ErrorClass) {
  let result;

  try {
    result = schema.safeParse(value);
  } catch (cause) {
    throw new ErrorClass('options requires synchronous validation of JSON values', {
      cause,
      details: { field: 'options' }
    });
  }

  if (!result.success) {
    throw new ErrorClass(`options: ${z.prettifyError(result.error)}`, {
      details: { field: 'options', issues: result.error.issues }
    });
  }

  return result.data;
}

function freeze(value) {
  if (value !== null && typeof value === 'object') {
    for (const child of Object.values(value)) {
      freeze(child);
    }

    Object.freeze(value);
  }

  return value;
}

function prepare(schema = EmptySchema) {
  if (!(schema instanceof z.ZodObject)) {
    throw new YambConfigError('options must be a Zod object schema');
  }

  const shape = { ...schema.shape };
  const fields = Object.fromEntries(
    Object.entries(shape).map(([key, field]) => {
      let source = field;

      while (source instanceof z.ZodOptional || source instanceof z.ZodDefault) {
        source = source instanceof z.ZodDefault ? source.removeDefault() : source.unwrap();
      }

      return [key, source];
    })
  );
  const defaults = {};

  try {
    for (const [key, field] of Object.entries(shape)) {
      let source = field;

      while (source instanceof z.ZodOptional) {
        source = source.unwrap();
      }

      if (source instanceof z.ZodDefault) {
        const value = copyValue(parse(source, undefined, YambConfigError));
        const preserved = parse(fields[key], copyOwned(value), YambConfigError);

        if (!isDeepStrictEqual(value, preserved)) {
          throw new YambConfigError('options defaults must not transform values');
        }

        const checked = copyValue(parse(field, copyOwned(value), YambConfigError));

        if (!isDeepStrictEqual(value, checked)) {
          throw new YambConfigError('options defaults must not transform values');
        }

        Object.defineProperty(defaults, key, {
          value,
          writable: true,
          enumerable: true,
          configurable: true
        });
      }
    }

    parse(JsonSchema, defaults, YambConfigError);
  } catch (cause) {
    if (cause instanceof YambConfigError) {
      throw cause;
    }

    throw new YambConfigError('options defaults must contain finite JSON values', { cause });
  }

  freeze(defaults);

  return {
    defaults,

    validateFilter(filter) {
      for (const [key, value] of Object.entries(filter)) {
        if (!Object.hasOwn(shape, key)) {
          throw new QueryValidationError(`options: unknown field ${key}`);
        }

        if (fields[key] !== shape[key]) {
          const preserved = parse(fields[key], value, QueryValidationError);

          if (!Object.is(value, preserved)) {
            throw new QueryValidationError(
              `options.${key} must validate without transforming values`
            );
          }
        }

        const output = parse(shape[key], value, QueryValidationError);

        if (!Object.is(value, output)) {
          throw new QueryValidationError(
            `options.${key} must validate without transforming values`
          );
        }
      }

      return filter;
    },

    normalize(value) {
      return this.validate(value === undefined ? undefined : copyValue(value));
    },

    validate(value) {
      const input = value === undefined ? {} : value;

      if (
        input === null ||
        typeof input !== 'object' ||
        (Object.getPrototypeOf(input) !== Object.prototype && Object.getPrototypeOf(input) !== null)
      ) {
        throw new PostValidationError('options must be a JSON object', {
          details: { field: 'options' }
        });
      }

      for (const key of Object.keys(input)) {
        if (!Object.hasOwn(shape, key)) {
          throw new PostValidationError(`options: unknown field ${key}`, {
            details: { field: 'options', key }
          });
        }

        if (input[key] === undefined) {
          delete input[key];
        }
      }

      if (schema === EmptySchema) {
        return input;
      }

      for (const key of Object.keys(defaults)) {
        if (!Object.hasOwn(input, key)) {
          input[key] = copyOwned(defaults[key]);
        }

        const preserved = parse(fields[key], copyOwned(input[key]), PostValidationError);

        if (!isDeepStrictEqual(input[key], preserved)) {
          throw new PostValidationError(`options.${key} must validate without transforming values`);
        }
      }

      parse(JsonSchema, input, PostValidationError);
      const expected = copyOwned(input);
      const output = copyValue(parse(schema, input, PostValidationError));

      if (!isDeepStrictEqual(expected, output)) {
        throw new PostValidationError(
          'options schema must validate without transforming or removing values',
          {
            details: { field: 'options' }
          }
        );
      }

      return expected;
    }
  };
}

const empty = prepare();

export function configureOptions(yamb, schema) {
  configs.set(yamb, prepare(schema));
}

export function getOptionsConfig(yamb) {
  return configs.get(yamb) ?? empty;
}
