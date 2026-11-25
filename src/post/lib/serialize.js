import { encodeInstant } from '../../schemas/zod.js';
import { copyOwned } from './snapshot.js';

function serialize(data, encode) {
  const out = {};

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      out[key] = value instanceof Temporal.Instant ? encode(value) : copyOwned(value);
    }
  }

  return out;
}

export function serializeData(data) {
  return serialize(data, String);
}

export function serializeForStorage(data) {
  return serialize(data, encodeInstant);
}
