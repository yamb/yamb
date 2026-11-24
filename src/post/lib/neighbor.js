import { Status } from '../../constants/index.js';
import { begin } from '../../signal.js';
import { getState } from '../internal.js';

export async function neighbor(post, options, order, bound) {
  const { yamb, data } = getState(post);
  const signal = begin(yamb, options);

  if (data.status !== Status.Published || !data.publishedAt) {
    return null;
  }

  const query = {
    status: Status.Published,
    cursor: { publishedAt: data.publishedAt, uri: data.uri },
    ...bound?.(yamb)
  };

  for await (const raw of yamb.storage.all(query, { order, limit: 1, signal })) {
    return yamb._hydrate(raw);
  }

  return null;
}
