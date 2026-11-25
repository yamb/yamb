import { SLUG_LIMIT } from '../schemas/zod.js';

export function fitSlug(slug, tail = '') {
  if (typeof slug !== 'string') {
    return slug;
  }

  const room = tail ? SLUG_LIMIT - tail.length - 1 : SLUG_LIMIT;
  const head = slug.length > room ? slug.slice(0, room).replace(/-+$/, '') : slug;

  return tail ? `${head}-${tail}` : head;
}
