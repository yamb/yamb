import assert from 'node:assert/strict';

import { blogWith } from './test/perf/fixture.js';

await using blog = await blogWith();
const post = await blog.create({ title: 'Packed core', text: '**source**' });
await post.publish();
const stored = await blog.find(post.id);
assert.equal(stored.text, '**source**');
assert.equal(await blog.published.count(), 1);
