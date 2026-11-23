import { Status } from '../../constants/index.js';

export default {
  name: 'scheduled',

  fn(collection) {
    return collection._withQuery({ status: Status.Scheduled });
  }
};
