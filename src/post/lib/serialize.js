import { encodeInstant } from '../../schemas/zod.js';
import { copyOwned } from './snapshot.js';
import { TEMPORAL_FIELDS } from './temporal-fields.js';

function serialize(data, encodeTemporal) {
  const out = {};

  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) {
      continue;
    }

    if (TEMPORAL_FIELDS.has(key) && value instanceof Temporal.Instant) {
      out[key] = encodeTemporal(value);
    } else {
      out[key] = copyOwned(value);
    }
  }

  return out;
}

export function serializeData(data) {
  return serialize(data, (value) => value.toString());
}

export function serializeForStorage(data) {
  return serialize(data, encodeInstant);
}
