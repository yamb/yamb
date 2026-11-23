import { YambError } from './base.js';

export class YambNotOpenError extends YambError {
  static code = 'YAMB_NOT_OPEN';
}
