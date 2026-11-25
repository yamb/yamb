import { Order } from '../../constants/index.js';
import { QueryValidationError } from '../../errors/index.js';
import { getOptionsConfig } from '../../options.js';
import { PostCollection } from '../../post-collection/index.js';
import { parse } from '../../schemas/parse.js';
import { QuerySchema, OptionsSchema } from '../../schemas/zod.js';

export default {
  name: 'all',

  fn(yamb, query = {}, options = {}) {
    const parsed = parse(QuerySchema, query, QueryValidationError, 'query');
    const selection = parse(OptionsSchema, options, QueryValidationError, 'options');

    if (parsed.options) {
      getOptionsConfig(yamb).validateFilter(parsed.options);
    }

    return new PostCollection(yamb, parsed, { order: Order.PublishedDesc, ...selection });
  }
};
