import { YambError } from './base.js';

export class LinkRefNotFoundError extends YambError {
  static code = 'YAMB_LINK_REF_NOT_FOUND';
}
