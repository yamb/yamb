import { hash } from 'node:crypto';

import { getState } from '../internal.js';
import { canonicalJSON } from '../lib/canonical-json.js';
import toJSON from './to-json.js';

export default {
  name: 'hash',

  fn(post) {
    const state = getState(post);
    return (state.cache.hash ??= hash('sha256', canonicalJSON(toJSON.fn(post))));
  }
};
