import { YambError } from './base.js';

export class StorageNotOpenError extends YambError {
  static code = 'YAMB_STORAGE_NOT_OPEN';
}
