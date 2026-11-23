import { RendererFailedError } from './errors/index.js';

export function normalizeRenderError(err, format) {
  if (err?.name === 'AbortError' || err?.code?.startsWith?.('YAMB_')) {
    return err;
  }

  return new RendererFailedError(`renderer "${format}" failed`, { cause: err });
}
