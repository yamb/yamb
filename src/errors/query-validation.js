import { YambError } from './base.js';

export class QueryValidationError extends YambError {
  static code = 'YAMB_QUERY_VALIDATION';
}
