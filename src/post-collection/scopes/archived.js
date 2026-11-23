import { Status } from '../../constants/index.js';

export default {
  name: 'archived',

  fn(collection) {
    return collection._withQuery({ status: Status.Archived });
  }
};
