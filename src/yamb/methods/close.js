import { reportError } from '../../report-error.js';
import { getState } from '../internal.js';

export async function dispose(yamb, state, renderers, op) {
  for (const renderer of renderers) {
    if (typeof renderer.dispose === 'function') {
      try {
        await renderer.dispose({ yamb, timeZone: state.timeZone });
      } catch (err) {
        reportError(state.onError, err, { op, name: renderer.name });
      }
    }
  }
}

async function closeOnce(yamb, state) {
  if (state.opening) {
    try {
      await state.opening;
    } catch {
      return;
    }
  }

  await dispose(yamb, state, Object.values(state.renderers), 'close.renderer');

  try {
    await state.storage.close({});
  } finally {
    state.walks.clear();
    state.byId = new Map();
    state.byUri = new Map();
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
