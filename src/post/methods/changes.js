import { isDeepStrictEqual } from 'node:util';

import { buildUri } from '../../uri.js';
import { getState } from '../internal.js';
import { currentUri } from '../lib/current-uri.js';
import { serializeData } from '../lib/serialize.js';
import { TEMPORAL_FIELDS } from '../lib/temporal-fields.js';
import toJSON from './to-json.js';

const IGNORED_FIELDS = new Set(['updatedAt']);

function isChanged(key, cur, prev) {
  if (TEMPORAL_FIELDS.has(key)) {
    if (cur === undefined || prev === undefined) {
      return cur !== prev;
    }

    return cur.epochNanoseconds !== prev.epochNanoseconds;
  }

  return !isDeepStrictEqual(cur, prev);
}

export default {
  name: 'changes',

  fn(post) {
    const state = getState(post);
    const { data } = state;

    if (!state.pristine) {
      return omit(toJSON.fn(post), IGNORED_FIELDS);
    }

    const diff = {};

    for (const key of state.touched) {
      if (IGNORED_FIELDS.has(key)) {
        continue;
      }

      const value = key === 'uri' && data.slug ? currentUri(state) : data[key];
      const previous =
        key === 'uri' && state.pristine.slug
          ? buildUri(state.pristine, state.yamb.timeZone)
          : state.pristine[key];

      if (isChanged(key, value, previous)) {
        diff[key] = value === undefined ? undefined : serializeData({ [key]: value })[key];
      }
    }

    return diff;
  }
};

function omit(obj, keys) {
  const out = {};

  for (const [key, value] of Object.entries(obj)) {
    if (!keys.has(key)) {
      out[key] = value;
    }
  }

  return out;
}
