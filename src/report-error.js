export async function reportError(onError, err, context) {
  if (typeof onError !== 'function') {
    return;
  }

  try {
    await onError(err, context);
  } catch {
    // A diagnostic failure must not mask the operation or interrupt cleanup.
  }
}
