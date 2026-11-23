import { YambError } from './base.js';

export class RendererScopeError extends YambError {
  static code = 'YAMB_RENDERER_SCOPE';
}
