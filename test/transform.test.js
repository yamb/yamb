import assert from 'node:assert/strict';
import test from 'node:test';

import { transform } from 'yamb/transform';

const stage = (name, fn) => ({ name, version: '1', transform: fn });

test('sync and async transformations compose in order', async () => {
  assert.equal(
    await transform(
      'hello',
      [
        stage('prefix', (s) => `(${s}`),
        stage('upper', async (s) => s.toUpperCase()),
        stage('suffix', (s) => `${s})`)
      ],
      {}
    ),
    '(HELLO)'
  );
});

test('a failed stage preserves its cause and prevents publication and later stages', async () => {
  const failure = new Error('service failed');
  let published;
  await assert.rejects(
    async () => {
      published = await transform(
        'source',
        [
          stage('first', (s) => `${s} partial`),
          stage('remote', async () => {
            throw failure;
          }),
          stage('publish', () => {
            assert.fail('stage after failure');
          })
        ],
        {}
      );
    },
    (error) => error.cause === failure && /remote/.test(error.message)
  );
  assert.equal(published, undefined);
});

test('native abort reasons stop stages before work and after an awaited result', async () => {
  for (const reason of [new Error('stop'), { stop: true }, false, null, 0, 'stop']) {
    const controller = new AbortController();
    controller.abort(reason);
    await assert.rejects(
      () =>
        transform('source', [stage('never', () => assert.fail('cancelled stage'))], {
          signal: controller.signal
        }),
      (error) => error === reason
    );

    const pending = new AbortController();
    const gate = Promise.withResolvers();
    const result = transform(
      'source',
      [
        stage('remote', async () => {
          await gate.promise;
          return 'partial';
        }),
        stage('never', () => assert.fail('stage after cancellation'))
      ],
      { signal: pending.signal }
    );
    pending.abort(reason);
    gate.resolve();
    await assert.rejects(result, (error) => error === reason);
  }
});

test('synchronous errors and cancellation inside a stage retain their cause', async () => {
  const cause = new Error('invalid text');
  await assert.rejects(
    () =>
      transform(
        '',
        [
          stage('parse', () => {
            throw cause;
          })
        ],
        {}
      ),
    (error) => error.cause === cause && /parse/.test(error.message)
  );
  const controller = new AbortController();
  const reason = { stop: true };
  await assert.rejects(
    () =>
      transform(
        '',
        [
          stage('cancel', () => {
            controller.abort(reason);
            controller.signal.throwIfAborted();
          })
        ],
        { signal: controller.signal }
      ),
    (error) => error === reason
  );
});

test('stage failure survives abort in finally and native reasons keep their identity', async () => {
  for (const reason of [null, false, 0, NaN]) {
    const controller = new AbortController();
    const failure = new Error('stage failed');
    await assert.rejects(
      () =>
        transform(
          '',
          [
            stage('fail', () => {
              try {
                throw failure;
              } finally {
                controller.abort(reason);
              }
            })
          ],
          { signal: controller.signal }
        ),
      (error) => error.code === 'YAMB_TRANSFORM_FAILED' && error.cause === failure
    );
    await assert.rejects(
      () =>
        transform('', [stage('never', () => assert.fail('aborted'))], {
          signal: controller.signal
        }),
      (error) => Object.is(error, reason)
    );
    const pending = new AbortController();
    await assert.rejects(
      () =>
        transform(
          '',
          [
            stage('abort', () => {
              pending.abort(reason);
              throw reason;
            })
          ],
          { signal: pending.signal }
        ),
      (error) => Object.is(error, reason)
    );
  }
});
