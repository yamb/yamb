import { Status } from '../../constants/index.js';
import { UriTakenError } from '../../errors/index.js';
import { fitSlug } from '../../slug/fit.js';
import { slugSuffix } from '../../slug/suffix.js';
import { buildUri } from '../../uri.js';

export async function resolveUri({ data, yamb, uri, isInsert, isRename, signal }) {
  if (!isInsert && !isRename) {
    return uri;
  }

  const colliding = await yamb.storage.fetch(uri, { signal });
  const isOwn = !isInsert && colliding?.id === data.id;

  if (!colliding || isOwn) {
    return uri;
  }

  if (data.status !== Status.Draft || !isInsert) {
    throw new UriTakenError(`uri "${uri}" already exists`, { details: { uri } });
  }

  const suffix = slugSuffix({ title: data.title, createdAt: data.createdAt });

  const { slug } = data;
  data.slug = fitSlug(slug, suffix);
  let next = buildUri(data, yamb.timeZone);

  let counter = 2;

  while (await yamb.storage.fetch(next, { signal })) {
    data.slug = fitSlug(slug, `${suffix}-${counter}`);
    next = buildUri(data, yamb.timeZone);

    counter++;
  }

  return next;
}
