import { YambError } from './base.js';

export class UriTakenError extends YambError {
  static code = 'YAMB_URI_TAKEN';
}
