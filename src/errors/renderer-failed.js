import { YambError } from './base.js';

export class RendererFailedError extends YambError {
  static code = 'YAMB_RENDERER_FAILED';
}
