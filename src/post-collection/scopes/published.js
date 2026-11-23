import { Status } from '../../constants/index.js';

export default {
  name: 'published',

  fn(collection) {
    return collection._withQuery({ status: Status.Published });
  }
};
