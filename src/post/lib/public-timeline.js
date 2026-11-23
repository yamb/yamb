import { Status } from '../../constants/index.js';

export function isInPublicTimeline(data) {
  return data.status === Status.Published && Boolean(data.publishedAt);
}
