import { z } from 'zod';

import { PostValidationError } from '../../errors/index.js';
import { getState } from '../internal.js';
import { observe } from './observe.js';
import { copyValue } from './snapshot.js';

export function invalidateState(state) {
  state.cache = {};
}

export function touchField(state, field, { authored = true, invalidate = true } = {}) {
  if (authored) {
    state.fieldRevisions ??= new Map();

    const revisions = state.fieldRevisions;

    revisions.set(field, (revisions.get(field) ?? 0) + 1);

    if (field === 'slug' || field === 'status' || field === 'publishedAt') {
      revisions.set('uri', (revisions.get('uri') ?? 0) + 1);
    }
  }

  (state.touched ??= new Set()).add(field);

  if (field === 'slug' || field === 'status' || field === 'publishedAt') {
    state.touched.add('uri');
  }

  if (invalidate) {
    invalidateState(state);
  }
}

export function setFieldValue(state, field, value, options) {
  if (state.data[field] !== value) {
    state.observed?.delete(field);
  }

  state.data[field] = value;
  touchField(state, field, options);
}

export function validateField(prop, value, state) {
  if (prop.validate) {
    return prop.validate(state, value);
  }

  if (value === undefined && prop.optional) {
    return undefined;
  }

  const result = prop.schema.safeParse(value);

  if (!result.success) {
    const ErrorClass = prop.error ?? PostValidationError;

    throw new ErrorClass(`${prop.name}: ${z.prettifyError(result.error)}`, {
      details: { field: prop.name, issues: result.error.issues }
    });
  }

  return result.data;
}

export function writeField(post, prop, value) {
  const state = getState(post);

  if (state.editingField === prop.name) {
    throw new PostValidationError(`cannot reenter an edit of ${prop.name}`);
  }

  const input =
    prop.error || value === null || typeof value !== 'object' ? value : copyValue(value);
  const editing = state.editingField;

  state.editingField = prop.name;

  try {
    setFieldValue(state, prop.name, validateField(prop, input, state));
  } finally {
    state.editingField = editing;
  }
}

export function readField(post, prop) {
  const state = getState(post);
  const value = state.data[prop.name];

  if (value === null || typeof value !== 'object' || value instanceof Temporal.Instant) {
    return value;
  }

  state.observed ??= new Map();

  const { observed } = state;
  let entry = observed.get(prop.name);

  if (entry?.value !== value) {
    entry = {
      value,
      proxy: observe(value, {
        validate: (candidate) => validateField(prop, candidate, state),
        begin() {
          if (state.editingField !== undefined) {
            throw new PostValidationError('cannot reenter a nested edit');
          }

          state.editingField = prop.name;
        },
        end() {
          state.editingField = undefined;
        },
        changed() {
          if (state.data[prop.name] === value) {
            touchField(state, prop.name);
          }
        }
      })
    };

    observed.set(prop.name, entry);
  }

  return entry.proxy;
}
