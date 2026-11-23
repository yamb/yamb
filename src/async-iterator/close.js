export async function closeIterator(iterator, { preserveError = false } = {}) {
  try {
    await iterator?.return?.();
  } catch (error) {
    if (!preserveError) {
      throw error;
    }
  }
}
