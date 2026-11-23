import { YambError } from './base.js';

export class StorageReadError extends YambError {
  static code = 'YAMB_STORAGE_READ';
}
