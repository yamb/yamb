import helpers from '../async-iterator/helpers.js';
import { AsyncIteratorHelper } from '../async-iterator/index.js';
import { Order, Status } from '../constants/index.js';
import { QueryValidationError } from '../errors/index.js';
import { parse } from '../schemas/parse.js';
import {
  InstantSchema,
  LimitSchema,
  OffsetSchema,
  OrderSchema,
  TagSchema,
  TagsSchema
} from '../schemas/zod.js';
import { begin, effectiveSignal } from '../signal.js';

const option = (schema, value, field) => parse(schema, value, QueryValidationError, field);

export class PostCollection {
  #yamb;
  #query;
  #options;

  constructor(yamb, query = {}, options = {}) {
    this.#yamb = yamb;
    this.#query = query;
    this.#options = options;
  }

  #where(extra) {
    return new PostCollection(this.#yamb, { ...this.#query, ...extra }, this.#options);
  }

  #select(extra) {
    return new PostCollection(this.#yamb, this.#query, { ...this.#options, ...extra });
  }

  published() {
    return this.#where({ status: Status.Published });
  }

  drafts() {
    return this.#where({ status: Status.Draft });
  }

  scheduled() {
    return this.#where({ status: Status.Scheduled });
  }

  archived() {
    return this.#where({ status: Status.Archived });
  }

  tagged(...tags) {
    const parsed = tags.map((tag) => option(TagSchema, tag, 'tag'));
    const merged = [...new Set([...(this.#query.tags ?? []), ...parsed])];

    return this.#where({ tags: option(TagsSchema, merged, 'tags') });
  }

  before(instant) {
    return this.#where({ before: option(InstantSchema, instant, 'before') });
  }

  after(instant) {
    return this.#where({ after: option(InstantSchema, instant, 'after') });
  }

  order(value) {
    return this.#select({ order: option(OrderSchema, value, 'order') });
  }

  limit(value) {
    return this.#select({ limit: option(LimitSchema, value, 'limit') });
  }

  offset(value) {
    return this.#select({ offset: option(OffsetSchema, value, 'offset') });
  }

  recent(n = 10) {
    return this.#select({ order: Order.PublishedDesc, limit: option(LimitSchema, n, 'limit') });
  }

  oldest(n = 10) {
    return this.#select({ order: Order.PublishedAsc, limit: option(LimitSchema, n, 'limit') });
  }

  async first() {
    if (this.#options.limit === 0) {
      return null;
    }

    for await (const post of this.#select({ limit: 1 })) {
      return post;
    }

    return null;
  }

  async count() {
    const signal = begin(this.#yamb, this.#options);

    return this.#yamb.storage.count(this.#query, { signal });
  }

  async *[Symbol.asyncIterator]() {
    const signal = begin(this.#yamb, this.#options);

    if (this.#options.limit === 0) {
      return;
    }

    const options = signal ? { ...this.#options, signal } : this.#options;

    for await (const raw of this.#yamb.storage.all(this.#query, options)) {
      signal?.throwIfAborted();
      yield this.#yamb._hydrate(raw);
    }
  }

  static {
    for (const { name } of helpers) {
      Object.defineProperty(this.prototype, name, {
        value(...args) {
          const signal = effectiveSignal(this.#yamb, this.#options);

          return AsyncIteratorHelper.from(this, { signal })[name](...args);
        },
        writable: false,
        configurable: false,
        enumerable: false
      });
    }
  }
}
