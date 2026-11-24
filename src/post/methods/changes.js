import { isDeepStrictEqual } from 'node:util';

import { buildUri } from '../../uri.js';
import { getState } from '../internal.js';
import { serializeData } from '../lib/serialize.js';
import toJSON from './to-json.js';

export default {
  name: 'changes',

  fn(post) {
    const state = getState(post);
    const current = toJSON.fn(post);

    delete current.updatedAt;

    if (!state.pristine) {
      return current;
    }

    const previous = serializeData(state.pristine);

    delete previous.updatedAt;

    if (state.pristine.slug) {
      previous.uri = buildUri(state.pristine, state.yamb.timeZone);
    }

    const diff = {};

    for (const key of new Set([...Object.keys(current), ...Object.keys(previous)])) {
      if (!isDeepStrictEqual(current[key], previous[key])) {
        diff[key] = current[key];
      }
    }

    return diff;
  }
};
