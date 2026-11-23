import assert from 'node:assert/strict';
import test from 'node:test';

import { RendererInputError } from '../src/errors/index.js';
import { normalizeRenderError } from '../src/render-error.js';

test('normalizeRenderError wraps a plain error as YAMB_RENDERER_FAILED', () => {
  const out = normalizeRenderError(new Error('boom'), 'html');
  assert.equal(out.code, 'YAMB_RENDERER_FAILED');
  assert.match(out.message, /renderer "html" failed/);
  assert.equal(out.cause.message, 'boom');
});

test('normalizeRenderError passes a typed Yamb error through unchanged', () => {
  const input = new RendererInputError('bad');
  assert.equal(normalizeRenderError(input, 'rss'), input);
});

test('normalizeRenderError passes an AbortError through unchanged', () => {
  const abort = new Error('aborted');
  abort.name = 'AbortError';
  assert.equal(normalizeRenderError(abort, 'json'), abort);
});
