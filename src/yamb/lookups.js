export function index(byId, byUri, id, uri) {
  const confirmed = byId.get(id);

  if (confirmed !== undefined && confirmed !== uri && byUri.get(confirmed) === id) {
    byUri.delete(confirmed);
  }

  if (uri === null) {
    byId.delete(id);
  } else {
    byId.set(id, uri);
    byUri.set(uri, id);
  }
}

export function record(state, id, uri) {
  index(state.byId, state.byUri, id, uri);

  for (const writes of state.walks) {
    writes.set(id, uri);
  }
}

export async function load(storage, signal) {
  const byId = new Map();
  const byUri = new Map();

  for await (const [id, uri] of storage.entries({ signal })) {
    signal?.throwIfAborted();
    byId.set(id, uri);
    byUri.set(uri, id);
  }

  return { byId, byUri };
}
