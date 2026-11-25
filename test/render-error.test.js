import assert from 'node:assert/strict';
import test from 'node:test';

import { RendererInputError } from '../src/errors/index.js';
import { blogWith } from './perf/fixture.js';

async function renderThrowing(t, failure) {
  const renderer = {
    name: 'html',
    version: '1',
    collection() {
      throw failure;
    }
  };
  const blog = await blogWith([], { renderers: { html: renderer } });

  t.after(() => blog.close());

  return blog.render('html', { posts: [] }).then(
    () => assert.fail('render must reject'),
    (error) => error
  );
}

test('render wraps a plain renderer error as YAMB_RENDERER_FAILED', async (t) => {
  const failure = new Error('boom');
  const error = await renderThrowing(t, failure);

  assert.equal(error.code, 'YAMB_RENDERER_FAILED');
  assert.match(error.message, /renderer "html" failed/);
  assert.equal(error.cause, failure);
});

test('render passes a typed Yamb error through unchanged', async (t) => {
  const failure = new RendererInputError('bad');

  assert.equal(await renderThrowing(t, failure), failure);
});

test('render passes an AbortError through unchanged', async (t) => {
  const failure = new Error('aborted');

  failure.name = 'AbortError';

  assert.equal(await renderThrowing(t, failure), failure);
});
