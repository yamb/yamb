export function url(input, base, params) {
  let directory = base instanceof URL ? base : new URL(base);

  if (!directory.pathname.endsWith('/')) {
    if (directory === base) {
      directory = new URL(base);
    }

    directory.pathname += '/';
  }

  const result = new URL(input, directory);

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      result.searchParams.set(key, String(value));
    }
  }

  return result;
}
