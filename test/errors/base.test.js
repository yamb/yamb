import assert from 'node:assert/strict';
import test from 'node:test';

import { YambError } from '../../src/errors/base.js';

test('YambError sets name from constructor', () => {
  class Custom extends YambError {
    static code = 'YAMB_CUSTOM';
  }

  const err = new Custom('boom');
  assert.equal(err.name, 'Custom');
  assert.equal(err.code, 'YAMB_CUSTOM');
  assert.equal(err.message, 'boom');
});

test('YambError preserves cause', () => {
  const cause = new Error('root');
  const err = new YambError('wrapped', { cause });
  assert.equal(err.cause, cause);
});

test('YambError attaches details', () => {
  const err = new YambError('failed', { details: { uri: 'x' } });
  assert.deepEqual(err.details, { uri: 'x' });
});

test('YambError has default code YAMB_ERROR', () => {
  const err = new YambError('x');
  assert.equal(err.code, 'YAMB_ERROR');
});
