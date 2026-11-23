import { YambError } from './base.js';

export class StorageDuplicateError extends YambError {
  static code = 'YAMB_STORAGE_DUPLICATE';
}
