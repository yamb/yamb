import { z } from 'zod';

import { Order } from '../../constants/index.js';
import { QueryValidationError } from '../../errors/index.js';
import { getOptionsConfig } from '../../options.js';
import { PostCollection } from '../../post-collection/index.js';
import { QuerySchema, OptionsSchema } from '../../schemas/zod.js';

const DEFAULT_OPTIONS = { order: Order.PublishedDesc };

export default {
  name: 'all',

  fn(yamb, query = {}, options = {}) {
    const queryResult = QuerySchema.safeParse(query);

    if (!queryResult.success) {
      throw new QueryValidationError(`invalid query: ${z.prettifyError(queryResult.error)}`, {
        details: { issues: queryResult.error.issues }
      });
    }

    const optionsResult = OptionsSchema.safeParse(options);

    if (!optionsResult.success) {
      throw new QueryValidationError(`invalid options: ${z.prettifyError(optionsResult.error)}`, {
        details: { issues: optionsResult.error.issues }
      });
    }

    const parsed = queryResult.data;

    if (parsed.options) {
      getOptionsConfig(yamb).validateFilter(parsed.options);
    }

    const selection = { ...DEFAULT_OPTIONS, ...optionsResult.data };

    return new PostCollection(yamb, parsed, selection);
  }
};
