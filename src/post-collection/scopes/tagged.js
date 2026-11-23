import { TagSchema } from '../../schemas/zod.js';
import { getState } from '../internal.js';
import { parseOrThrow } from './parse.js';

export default {
  name: 'tagged',

  fn(collection, ...tags) {
    let current = collection;

    for (const tag of tags) {
      const parsed = parseOrThrow(TagSchema, tag, 'tag');
      const { query } = getState(current);

      if (query.tags) {
        current = current._withQuery({ tags: [...new Set([...query.tags, parsed])] });
      } else if (query.tag !== undefined) {
        current = current._withQuery({
          tag: undefined,
          tags: [...new Set([query.tag, parsed])]
        });
      } else {
        current = current._withQuery({ tag: parsed });
      }
    }

    return current;
  }
};
