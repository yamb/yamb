import { addAbortListener } from 'node:events';

export function enqueueOperation(state, signal, execute) {
  state.operations ??= { pending: [], running: null };

  const queue = state.operations;
  const result = Promise.withResolvers();

  let listener;
  const job = {
    execute,
    result,
    cleanup() {
      listener?.[Symbol.dispose]();
    }
  };

  function abort() {
    const index = queue.pending.indexOf(job);

    if (index !== -1) {
      queue.pending.splice(index, 1);
      job.execute = null;
      job.cleanup();
      result.reject(signal.reason);
    }
  }

  queue.pending.push(job);

  if (signal) {
    listener = addAbortListener(signal, abort);
  }

  if (signal?.aborted) {
    abort();
  }

  if (!queue.running) {
    queue.running = drain(queue);
  }

  return result.promise;
}

async function drain(queue) {
  // Yield once so queue.running is assigned before execution can finish.
  await Promise.resolve();

  while (queue.pending.length > 0) {
    const { execute, result, cleanup } = queue.pending.shift();
    cleanup();

    try {
      result.resolve(await execute());
    } catch (error) {
      const waiting = queue.pending.splice(0);

      queue.running = null;
      result.reject(error);

      for (const pending of waiting) {
        pending.cleanup();
        pending.execute = null;
        pending.result.reject(error);
      }

      return;
    }
  }

  queue.running = null;
}
