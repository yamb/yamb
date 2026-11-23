import { YambError } from './base.js';

export class PostValidationError extends YambError {
  static code = 'YAMB_POST_VALIDATION';
}
