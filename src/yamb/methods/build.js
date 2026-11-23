import { Post } from '../../post/index.js';

export default {
  name: 'build',

  fn(yamb, data = {}) {
    return new Post(yamb, { ...data }, { pristine: false });
  }
};
