import { YambNotOpenError } from './errors/index.js';

export function effectiveSignal(yamb, options) {
  const signal = options?.signal;

  return yamb?.signal && signal ? AbortSignal.any([yamb.signal, signal]) : (yamb?.signal ?? signal);
}

export function begin(yamb, options) {
  if (!yamb.isOpen) {
    throw new YambNotOpenError('yamb instance is not open');
  }

  const signal = effectiveSignal(yamb, options);

  signal?.throwIfAborted();

  return signal;
}
