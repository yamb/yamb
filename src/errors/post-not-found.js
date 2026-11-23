import { YambError } from './base.js';

export class PostNotFoundError extends YambError {
  static code = 'YAMB_POST_NOT_FOUND';
}
