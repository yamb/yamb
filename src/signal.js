export function effectiveSignal(yamb, options) {
  const signals = [];

  if (yamb?.signal) {
    signals.push(yamb.signal);
  }

  if (options?.signal) {
    signals.push(options.signal);
  }

  if (signals.length === 0) {
    return undefined;
  }

  if (signals.length === 1) {
    return signals[0];
  }

  return AbortSignal.any(signals);
}
