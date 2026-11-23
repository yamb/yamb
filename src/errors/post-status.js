import { YambError } from './base.js';

export class PostStatusError extends YambError {
  static code = 'YAMB_POST_STATUS_INVALID';
}
