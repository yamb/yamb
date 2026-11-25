import assert from 'node:assert/strict';
import test from 'node:test';

import { Status } from '../../src/constants/index.js';
import { applySaveLifecycle } from '../../src/lifecycle/dates.js';

const clockAt = (iso) => () => Temporal.Instant.from(iso);

test('new draft sets createdAt and updatedAt only', () => {
  const data = { status: Status.Draft, title: 'X' };
  applySaveLifecycle(data, clockAt('2026-04-26T10:00:00Z'));
  assert.equal(data.createdAt.toString(), '2026-04-26T10:00:00Z');
  assert.equal(data.updatedAt.toString(), '2026-04-26T10:00:00Z');
  assert.equal(data.publishedAt, undefined);
});

test('draft resave updates updatedAt only, leaves publishedAt untouched', () => {
  const pristine = {
    status: Status.Draft,
    createdAt: Temporal.Instant.from('2026-04-26T10:00:00Z'),
    updatedAt: Temporal.Instant.from('2026-04-26T10:00:00Z')
  };

  const data = { ...pristine, title: 'Updated' };
  applySaveLifecycle(data, clockAt('2026-04-28T14:00:00Z'));
  assert.equal(data.updatedAt.toString(), '2026-04-28T14:00:00Z');
  assert.equal(data.publishedAt, undefined);
});

test('draft → published without manual date sets publishedAt to now', () => {
  const pristine = {
    status: Status.Draft,
    createdAt: Temporal.Instant.from('2026-04-26T10:00:00Z'),
    updatedAt: Temporal.Instant.from('2026-04-26T10:00:00Z')
  };

  const data = { ...pristine, status: Status.Published };
  applySaveLifecycle(data, clockAt('2026-05-02T10:00:00Z'));
  assert.equal(data.publishedAt.toString(), '2026-05-02T10:00:00Z');
  assert.equal(data.updatedAt.toString(), '2026-05-02T10:00:00Z');
});

test('draft → published respects user-provided publishedAt', () => {
  const pristine = {
    status: Status.Draft,
    createdAt: Temporal.Instant.from('2026-04-26T10:00:00Z'),
    updatedAt: Temporal.Instant.from('2026-04-26T10:00:00Z')
  };

  const data = {
    ...pristine,
    status: Status.Published,
    publishedAt: Temporal.Instant.from('2026-03-15T09:00:00Z')
  };

  applySaveLifecycle(data, clockAt('2026-05-02T10:00:00Z'));
  assert.equal(data.publishedAt.toString(), '2026-03-15T09:00:00Z');
});

test('insert as published without date sets publishedAt to now', () => {
  const data = { status: Status.Published, title: 'X' };
  applySaveLifecycle(data, clockAt('2026-04-26T10:00:00Z'));
  assert.equal(data.publishedAt.toString(), '2026-04-26T10:00:00Z');
});

test('insert as published with user date keeps it', () => {
  const data = {
    status: Status.Published,
    title: 'X',
    publishedAt: Temporal.Instant.from('2025-01-01T00:00:00Z')
  };
  applySaveLifecycle(data, clockAt('2026-04-26T10:00:00Z'));
  assert.equal(data.publishedAt.toString(), '2025-01-01T00:00:00Z');
});

test('saving published post leaves publishedAt unchanged', () => {
  const pristine = {
    status: Status.Published,
    createdAt: Temporal.Instant.from('2026-04-26T10:00:00Z'),
    publishedAt: Temporal.Instant.from('2026-04-26T12:00:00Z'),
    updatedAt: Temporal.Instant.from('2026-04-26T12:00:00Z')
  };

  const data = { ...pristine, title: 'Edited' };
  applySaveLifecycle(data, clockAt('2026-05-01T10:00:00Z'));
  assert.equal(data.publishedAt.toString(), '2026-04-26T12:00:00Z');
  assert.equal(data.updatedAt.toString(), '2026-05-01T10:00:00Z');
});

test('scheduled → published preserves scheduled publishedAt', () => {
  const pristine = {
    status: Status.Scheduled,
    createdAt: Temporal.Instant.from('2026-04-26T10:00:00Z'),
    publishedAt: Temporal.Instant.from('2026-06-01T08:00:00Z'),
    updatedAt: Temporal.Instant.from('2026-04-26T10:00:00Z')
  };

  const data = { ...pristine, status: Status.Published };
  applySaveLifecycle(data, clockAt('2026-06-01T08:00:00Z'));
  assert.equal(data.publishedAt.toString(), '2026-06-01T08:00:00Z');
});

test('archived (never published) → published sets publishedAt to now', () => {
  const pristine = {
    status: Status.Archived,
    createdAt: Temporal.Instant.from('2026-04-26T10:00:00Z'),
    updatedAt: Temporal.Instant.from('2026-04-26T10:00:00Z')
  };

  const data = { ...pristine, status: Status.Published };
  applySaveLifecycle(data, clockAt('2026-05-02T10:00:00Z'));
  assert.equal(data.publishedAt?.toString(), '2026-05-02T10:00:00Z');
});

for (const value of [
  '2026-04-26T10:00:00Z',
  'not-a-real-instant',
  Temporal.Instant.from('+010000-01-01T00:00:00Z')
]) {
  test(`clock returning ${value} throws a typed PostDateError`, () => {
    const data = { status: Status.Published, title: 'X' };
    assert.throws(() => applySaveLifecycle(data, () => value), {
      code: 'YAMB_POST_DATE_INVALID'
    });
  });
}
