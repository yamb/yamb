import { YambError } from './base.js';

export class RendererInputError extends YambError {
  static code = 'YAMB_RENDERER_INPUT';
}
