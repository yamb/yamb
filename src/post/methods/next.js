import { Order, Status } from '../../constants/index.js';
import { YambNotOpenError } from '../../errors/index.js';
import { effectiveSignal } from '../../signal.js';
import { getState } from '../internal.js';
import { isInPublicTimeline } from '../lib/public-timeline.js';

function inclusiveNowCap(now) {
  try {
    const bumped = now.add({ nanoseconds: 1 });

    return /^\d{4}-/.test(bumped.toString()) ? bumped : now;
  } catch {
    return now;
  }
}

export default {
  name: 'next',

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
        cursor: { publishedAt: state.data.publishedAt, uri: state.data.uri },
        before: inclusiveNowCap(yamb.clock())
      },
      { order: Order.PublishedAsc, limit: 1, signal }
    );

    for await (const raw of results) {
      return yamb._hydrate(raw);
    }

    return null;
  }
};
