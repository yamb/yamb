import { Status } from '../../constants/index.js';

export default {
  name: 'drafts',

  fn(collection) {
    return collection._withQuery({ status: Status.Draft });
  }
};
