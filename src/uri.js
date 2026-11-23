import { Status } from './constants/index.js';
import { UriOriginError, QueryValidationError, PostDateError } from './errors/index.js';

export function buildUri(data, timeZone) {
  if (data.status === Status.Draft || !data.publishedAt) {
    return `drafts/${data.slug}`;
  }

  const date = data.publishedAt.toZonedDateTimeISO(timeZone).toPlainDate();

  if (date.year < 1 || date.year > 9999) {
    throw new PostDateError(
      `publishedAt zoned into "${timeZone}" produces a uri year (${date.year}) outside the sortable 0001-9999 range`,
      { details: { field: 'publishedAt', timeZone, year: date.year } }
    );
  }

  const year = String(date.year).padStart(4, '0');
  const month = String(date.month).padStart(2, '0');

  return `${year}/${month}/${data.slug}`;
}

export function normalizeUri(input, base) {
  let url;

  if (typeof input === 'string') {
    const trimmed = input.trim();
    url = URL.parse(trimmed);

    if (!url) {
      return trimmed.replace(/^\/+/, '');
    }
  } else if (input instanceof URL) {
    url = input;
  } else {
    throw new QueryValidationError('uri must be a string or URL', {
      details: { field: 'uri', receivedType: typeof input }
    });
  }

  const baseUrl = new URL(base);

  if (url.origin !== baseUrl.origin) {
    throw new UriOriginError(`uri origin "${url.origin}" does not match base "${baseUrl.origin}"`, {
      details: { input, base }
    });
  }

  let { pathname } = url;
  const basePath = baseUrl.pathname.replace(/\/$/, '');

  if (basePath && (pathname === basePath || pathname.startsWith(`${basePath}/`))) {
    pathname = pathname.slice(basePath.length);
  }

  return pathname.replace(/^\/+/, '');
}
