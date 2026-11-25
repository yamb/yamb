import { Status } from '../../constants/index.js';
import { getState } from '../internal.js';
import { setFieldValue } from '../lib/field.js';
import save from './save.js';

export function transition(name, status) {
  return {
    name,

    async fn(post, options) {
      setFieldValue(getState(post), 'status', status);

      return save.fn(post, options);
    }
  };
}

export default transition('publish', Status.Published);
