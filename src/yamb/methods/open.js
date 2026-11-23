import { getOptionsConfig } from '../../options.js';
import { reportError } from '../../report-error.js';
import { effectiveSignal } from '../../signal.js';
import { getState } from '../internal.js';

async function rollback(yamb, state, prepared) {
  state.byId.clear();
  state.byUri.clear();

  for (const renderer of prepared) {
    if (typeof renderer.dispose === 'function') {
      try {
        await renderer.dispose({ yamb, timeZone: state.timeZone });
      } catch (err) {
        reportError(state.onError, err, { op: 'open.rollback.renderer', name: renderer.name });
      }
    }
  }

  try {
    await state.storage.close({});
  } catch (err) {
    reportError(state.onError, err, { op: 'open.rollback.storage' });
  }
}

async function openOnce(yamb, state, signal) {
  const prepared = [];

  try {
    await state.storage.open({
      signal,
      timeZone: state.timeZone,
      clock: state.clock,
      optionDefaults: getOptionsConfig(yamb).defaults
    });

    signal?.throwIfAborted();

    for await (const [id, uri] of state.storage.entries({ signal })) {
      signal?.throwIfAborted();
      state.byId.set(id, uri);
      state.byUri.set(uri, id);
    }

    for (const renderer of Object.values(state.renderers)) {
      if (typeof renderer.prepare === 'function') {
        prepared.push(renderer);
        await renderer.prepare({
          yamb,
          timeZone: state.timeZone,
          base: new URL(state.base),
          signal
        });

        signal?.throwIfAborted();
      }
    }

    signal?.throwIfAborted();
  } catch (err) {
    await rollback(yamb, state, prepared);

    throw err;
  }

  state.isOpen = true;

  return yamb;
}

export default {
  name: 'open',

  async fn(yamb, options = {}) {
    const state = getState(yamb);

    if (state.closing) {
      await state.closing;
    }

    if (state.isOpen) {
      return yamb;
    }

    if (state.opening) {
      return state.opening;
    }

    const signal = effectiveSignal(yamb, options);

    signal?.throwIfAborted();

    const opening = openOnce(yamb, state, signal);

    state.opening = opening;

    try {
      return await opening;
    } finally {
      state.opening = null;
    }
  }
};
