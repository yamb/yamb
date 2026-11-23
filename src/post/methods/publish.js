import { Status } from '../../constants/index.js';
import { getState } from '../internal.js';
import { setFieldValue } from '../lib/field.js';
import save from './save.js';

export default {
  name: 'publish',

  async fn(post, options) {
    setFieldValue(getState(post), 'status', Status.Published);

    return save.fn(post, options);
  }
};
