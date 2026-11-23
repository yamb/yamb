import { YambError } from './base.js';

export class StorageWriteError extends YambError {
  static code = 'YAMB_STORAGE_WRITE';
}
