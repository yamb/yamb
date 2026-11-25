import { getOptionsConfig } from '../../options.js';
import { reportError } from '../../report-error.js';
import { effectiveSignal } from '../../signal.js';
import { getState } from '../internal.js';
import { load } from '../lookups.js';
import { dispose } from './close.js';

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

    const { byId, byUri } = await load(state.storage, signal);

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
    state.byId = byId;
    state.byUri = byUri;
  } catch (err) {
    await dispose(yamb, state, prepared, 'open.rollback.renderer');

    try {
      await state.storage.close({});
    } catch (closeError) {
      reportError(state.onError, closeError, { op: 'open.rollback.storage' });
    }

    throw err;
  }

  state.isOpen = true;

  return yamb;
}

export default {
  name: 'open',

  async fn(yamb, options = {}) {
    const state = getState(yamb);

    await state.closing?.catch(() => {});

    if (state.isOpen) {
      return yamb;
    }

    if (state.opening) {
      return state.opening;
    }

    const signal = effectiveSignal(yamb, options);

    signal?.throwIfAborted();

    state.opening = openOnce(yamb, state, signal);

    try {
      return await state.opening;
    } finally {
      state.opening = null;
    }
  }
};
