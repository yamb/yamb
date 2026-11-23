import { YambError } from './base.js';

export class PostDateError extends YambError {
  static code = 'YAMB_POST_DATE_INVALID';
}
