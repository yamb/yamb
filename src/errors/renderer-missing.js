import { YambError } from './base.js';

export class RendererMissingError extends YambError {
  static code = 'YAMB_RENDERER_MISSING';
}
