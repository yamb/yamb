import { AsyncIteratorHelper } from '../../async-iterator/index.js';
import {
  isCancellation,
  RendererFailedError,
  RendererInputError,
  RendererMissingError,
  RendererScopeError
} from '../../errors/index.js';
import { effectiveSignal } from '../../signal.js';
import { getState } from '../internal.js';

const toData = (post) => (typeof post?.toJSON === 'function' ? post.toJSON() : post);

export default {
  name: 'render',

  async fn(yamb, format, input, options = {}) {
    const state = getState(yamb);

    if (!format) {
      throw new RendererMissingError('format argument is required');
    }

    const renderer = state.renderers[format];

    if (!renderer) {
      throw new RendererMissingError(`renderer "${format}" not registered`);
    }

    const scope = input && Object.hasOwn(input, 'post') ? 'post' : 'collection';

    if (typeof renderer[scope] !== 'function') {
      throw new RendererScopeError(`renderer "${format}" does not support ${scope} scope`);
    }

    const signal = effectiveSignal(yamb, options);

    signal?.throwIfAborted();

    try {
      let value = input?.post;

      if (
        scope === 'post' &&
        (!value || typeof value !== 'object' || typeof value.toJSON === 'function')
      ) {
        throw new RendererInputError('input.post must be independent PostData; use post.toJSON()');
      }

      if (scope === 'collection') {
        const posts = input?.posts;

        if (
          !posts ||
          (typeof posts[Symbol.asyncIterator] !== 'function' &&
            typeof posts[Symbol.iterator] !== 'function')
        ) {
          throw new RendererInputError('input.posts must be iterable or async iterable');
        }

        value = { ...input, posts: AsyncIteratorHelper.from(posts, { signal }).map(toData) };
      }

      const result = await renderer[scope](value, {
        yamb,
        format,
        scope,
        timeZone: state.timeZone,
        base: new URL(state.base),
        signal
      });

      signal?.throwIfAborted();

      return result;
    } catch (err) {
      if (isCancellation(err, signal) || err?.code?.startsWith?.('YAMB_')) {
        throw err;
      }

      throw new RendererFailedError(`renderer "${format}" failed`, { cause: err });
    }
  }
};
