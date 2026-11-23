import { getState } from '../internal.js';

export default {
  name: 'first',

  async fn(collection) {
    if (getState(collection).options.limit === 0) {
      return null;
    }

    const limited = collection._withOptions({ limit: 1 });

    for await (const post of limited) {
      return post;
    }

    return null;
  }
};
