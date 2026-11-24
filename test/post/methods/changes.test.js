import assert from 'node:assert/strict';
import test from 'node:test';

import { Post } from '../../../src/post/index.js';
import { postData } from '../../perf/fixture.js';

const t = (iso) => Temporal.Instant.from(iso);
const raw = { ...postData(), id: 'post-changes', uri: '2026/11/baseline-0', title: 'X' };
const context = { timeZone: 'UTC' };

test('changes() reports a publishedAt edit', () => {
  const p = new Post(
    context,
    { ...raw, publishedAt: t('2026-04-01T00:00:00Z') },
    { pristine: true }
  );
  p.publishedAt = t('2026-05-01T00:00:00Z');

  const diff = p.changes();
  assert.equal(diff.publishedAt, '2026-05-01T00:00:00Z');
});

test('changes() reports a createdAt edit', () => {
  const p = new Post(context, { ...raw, createdAt: t('2026-04-01T00:00:00Z') }, { pristine: true });
  p.createdAt = t('2026-04-02T00:00:00Z');

  assert.ok('createdAt' in p.changes());
});

test('changes() ignores updatedAt (lifecycle noise)', () => {
  const p = new Post(context, { ...raw, updatedAt: t('2026-04-01T00:00:00Z') }, { pristine: true });
  assert.throws(() => {
    p.updatedAt = t('2026-05-01T00:00:00Z');
  }, TypeError);

  assert.deepEqual(p.changes(), {});
});

test('changes() is empty when nothing changed', () => {
  const p = new Post(
    context,
    { ...raw, publishedAt: t('2026-04-01T00:00:00Z') },
    { pristine: true }
  );
  assert.deepEqual(p.changes(), {});
});

test('changes() still reports non-temporal edits', () => {
  const p = new Post(context, raw, { pristine: true });
  p.title = 'Y';

  assert.deepEqual(p.changes(), { title: 'Y' });
});
