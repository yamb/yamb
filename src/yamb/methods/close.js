import { reportError } from '../../report-error.js';
import { getState } from '../internal.js';

async function closeOnce(yamb, state) {
  if (state.opening) {
    try {
      await state.opening;
    } catch {
      return;
    }
  }

  for (const renderer of Object.values(state.renderers)) {
    if (typeof renderer.dispose === 'function') {
      try {
        await renderer.dispose({ yamb, timeZone: state.timeZone });
      } catch (err) {
        reportError(state.onError, err, { op: 'close.renderer', name: renderer.name });
      }
    }
  }

  try {
    await state.storage.close({});
  } finally {
    state.byId.clear();
    state.byUri.clear();
    state.isOpen = false;
  }
}

export default {
  name: 'close',

  async fn(yamb) {
    const state = getState(yamb);

    if (state.closing) {
      return state.closing;
    }

    if (!state.isOpen && !state.opening) {
      return;
    }

    const closing = closeOnce(yamb, state);

    state.closing = closing;

    try {
      await closing;
    } finally {
      state.closing = null;
    }
  }
};
