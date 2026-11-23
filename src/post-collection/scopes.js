import after from './scopes/after.js';
import archived from './scopes/archived.js';
import before from './scopes/before.js';
import count from './scopes/count.js';
import drafts from './scopes/drafts.js';
import first from './scopes/first.js';
import limit from './scopes/limit.js';
import offset from './scopes/offset.js';
import oldest from './scopes/oldest.js';
import order from './scopes/order.js';
import published from './scopes/published.js';
import recent from './scopes/recent.js';
import scheduled from './scopes/scheduled.js';
import tagged from './scopes/tagged.js';

export default [
  published,
  drafts,
  scheduled,
  archived,
  tagged,
  before,
  after,
  order,
  limit,
  offset,
  recent,
  oldest,
  first,
  count
];
