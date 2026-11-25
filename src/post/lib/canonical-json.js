export function canonicalJSON(value) {
  if (Array.isArray(value)) {
    return `[${value.map(canonicalJSON).join(',')}]`;
  }

  if (value !== null && typeof value === 'object') {
    const entries = Object.keys(value)
      .toSorted()
      .filter((key) => value[key] !== undefined)
      .map((key) => `${JSON.stringify(key)}:${canonicalJSON(value[key])}`);

    return `{${entries.join(',')}}`;
  }

  return JSON.stringify(value);
}
