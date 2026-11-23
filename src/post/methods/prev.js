import { Order, Status } from '../../constants/index.js';
import { YambNotOpenError } from '../../errors/index.js';
import { effectiveSignal } from '../../signal.js';
import { getState } from '../internal.js';
import { isInPublicTimeline } from '../lib/public-timeline.js';

export default {
  name: 'prev',

  async fn(post, options = {}) {
    const state = getState(post);
    const { yamb } = state;

    if (!yamb.isOpen) {
      throw new YambNotOpenError('yamb instance is not open');
    }

    const signal = effectiveSignal(yamb, options);

    signal?.throwIfAborted();

    if (!isInPublicTimeline(state.data)) {
      return null;
    }

    const results = yamb.storage.all(
      {
        status: Status.Published,
        cursor: { publishedAt: state.data.publishedAt, uri: state.data.uri }
      },
      { order: Order.PublishedDesc, limit: 1, signal }
    );

    for await (const raw of results) {
      return yamb._hydrate(raw);
    }

    return null;
  }
};
