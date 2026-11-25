import { buildUri } from '../../uri.js';

export function currentUri(state) {
  const { slug, status, publishedAt } = state.data;

  if (!slug) {
    return null;
  }

  const cached = state.cache.uri;

  if (cached?.slug !== slug || cached.status !== status || cached.publishedAt !== publishedAt) {
    state.cache.uri = {
      slug,
      status,
      publishedAt,
      value: buildUri(state.data, state.yamb.timeZone)
    };
  }

  return state.cache.uri.value;
}
