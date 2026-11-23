import build from './build.js';

export default {
  name: 'create',

  async fn(yamb, data, options) {
    const post = build.fn(yamb, data);
    await post.save({ ...options, mode: 'insert' });

    return post;
  }
};
