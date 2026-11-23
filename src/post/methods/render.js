import { getState } from '../internal.js';

export default {
  name: 'render',

  async fn(post, format, options = {}) {
    const data = post.toJSON();
    return getState(post).yamb.render(format, { post: data }, options);
  }
};
