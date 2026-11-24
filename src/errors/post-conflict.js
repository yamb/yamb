import { YambError } from './base.js';

export class PostConflictError extends YambError {
  static code = 'YAMB_POST_CONFLICT';
}
