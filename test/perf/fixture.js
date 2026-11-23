import { yamb } from '@yamb/core';

export function postData(bytes = 1024, index = 0) {
  const paragraph = `# Yamb baseline

A post with **Markdown**, a [link](/blog) and \`code\`.

`;
  return {
    title: `Baseline ${index}`,
    slug: `baseline-${index}`,
    status: 'published',
    text: paragraph.repeat(Math.ceil(bytes / paragraph.length)).slice(0, bytes),
    tags: ['javascript'],
    meta: { title: 'Baseline', keywords: ['node'] },
    links: { related: [] },
    options: {},
    createdAt: '2026-11-01T12:00:00.000000000Z',
    updatedAt: '2026-11-01T12:00:00.000000000Z',
    publishedAt: '2026-11-01T12:00:00.000000000Z'
  };
}

export async function blogWith(rows = [], config = {}) {
  const records = new Map(rows.map((row) => [row.id, structuredClone(row)]));
  const uris = new Map(rows.map((row) => [row.uri, row.id]));
  let sequence = records.size;
  const storage = {
    async open() {},
    async close() {},
    async sync() {},
    async find(id) {
      return structuredClone(records.get(id) ?? null);
    },
    async fetch(uri) {
      return this.find(uris.get(uri));
    },
    async save(raw) {
      const id = raw.id ?? `memory-${++sequence}`;
      records.set(id, structuredClone({ ...raw, id }));
      uris.set(raw.uri, id);
      return { id };
    },
    async remove(id) {
      const row = records.get(id);
      if (row) {
        uris.delete(row.uri);
        records.delete(id);
      }
    },
    async *entries() {
      for (const { id, uri } of records.values()) {
        yield [id, uri];
      }
    },
    async *all(query, { limit = null, offset = 0 } = {}) {
      let matched = 0;
      let emitted = 0;
      for (const row of records.values()) {
        if (query.status && row.status !== query.status) {
          continue;
        }
        if (matched++ < offset) {
          continue;
        }
        if (limit !== null && emitted >= limit) {
          break;
        }
        emitted++;
        yield structuredClone(row);
      }
    },
    async count(query) {
      return records
        .values()
        .filter((row) => !query.status || row.status === query.status)
        .reduce((n) => n + 1, 0);
    }
  };
  const blog = yamb({
    storage,
    clock: () => Temporal.Instant.from('2026-11-10T09:00:00Z'),
    ...config
  });
  await blog.open();
  return blog;
}
