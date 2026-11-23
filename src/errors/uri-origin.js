import { YambError } from './base.js';

export class UriOriginError extends YambError {
  static code = 'YAMB_URI_ORIGIN_MISMATCH';
}
