import { YambError } from './base.js';

export class YambConfigError extends YambError {
  static code = 'YAMB_CONFIG_INVALID';
}
