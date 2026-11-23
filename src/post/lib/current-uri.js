import { buildUri } from '../../uri.js';

export function currentUri(state) {
  const { slug, status, publishedAt } = state.data;

  if (!slug) {
    return null;
  }

  const cached = state.cache.uri;

  if (cached?.slug === slug && cached.status === status && cached.publishedAt === publishedAt) {
    return cached.value;
  }

  const value = buildUri(state.data, state.yamb.timeZone);

  state.cache.uri = { slug, status, publishedAt, value };

  return value;
}
