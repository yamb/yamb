import { randomUUIDv7 } from 'node:crypto';

import { Status } from '../../constants/index.js';
import {
  YambNotOpenError,
  PostValidationError,
  PostNotFoundError,
  LinkRefNotFoundError
} from '../../errors/index.js';
import { applySaveLifecycle } from '../../lifecycle/dates.js';
import { reportError } from '../../report-error.js';
import { parse } from '../../schemas/parse.js';
import { PostSchema } from '../../schemas/zod.js';
import { begin } from '../../signal.js';
import { fitSlug } from '../../slug/fit.js';
import { buildUri } from '../../uri.js';
import { getState as getYambState } from '../../yamb/internal.js';
import { record } from '../../yamb/lookups.js';
import { getState } from '../internal.js';
import { replaceField } from '../lib/field.js';
import { reconcile } from '../lib/observe.js';
import { enqueueOperation } from '../lib/operations.js';
import { resolveUri } from '../lib/resolve-uri.js';
import { serializeForStorage } from '../lib/serialize.js';
import {
  copyOwned,
  captureRevision,
  inheritConfirmed,
  sameRevision,
  sameValue
} from '../lib/snapshot.js';
import { expectedVersion } from '../lib/version.js';

function assertMode(state, data, mode, expected) {
  if (expected !== undefined && !data.id) {
    throw new PostValidationError('cannot insert a post with an expected version', {
      details: { field: 'expected' }
    });
  }

  if (mode === 'insert' && data.id) {
    throw new PostValidationError('cannot insert a post that already has an id', {
      details: { field: 'id', id: data.id }
    });
  }

  if (mode === 'update' && !data.id) {
    throw new PostValidationError('cannot update a post without an id', {
      details: { field: 'id' }
    });
  }

  if (mode === null && data.id && !state.pristine) {
    throw new PostValidationError(
      'cannot save a post with an id that was never loaded from storage without an explicit mode',
      { details: { field: 'id', id: data.id } }
    );
  }
}

function confirm(state, revision, data) {
  for (const field of Object.keys(data)) {
    if ((state.fieldRevisions?.get(field) ?? 0) !== (revision.fields.get(field) ?? 0)) {
      continue;
    }

    if (sameValue(state.data[field], data[field])) {
      continue;
    }

    const current = state.data[field];
    const saved = data[field];

    if (
      current !== null &&
      saved !== null &&
      typeof current === 'object' &&
      typeof saved === 'object' &&
      !(current instanceof Temporal.Instant)
    ) {
      reconcile(current, saved);
    } else {
      replaceField(state, field, saved);
    }

    state.cache.hash = undefined;
  }

  state.pristine = copyOwned(data);
  state.confirmedRevisions = revision.fields;
}

export default {
  name: 'save',

  async fn(post, options = {}) {
    const state = getState(post);
    const { yamb } = state;
    const signal = begin(yamb, options);
    const mode = options.mode ?? null;
    const explicit = expectedVersion(options);

    if (mode !== null && mode !== 'insert' && mode !== 'update') {
      throw new PostValidationError('unknown save mode', { details: { field: 'mode' } });
    }

    const revision = captureRevision(state);

    return enqueueOperation(state, signal, async () => {
      if (!yamb.isOpen) {
        throw new YambNotOpenError('yamb instance is not open');
      }

      if (state.removed) {
        throw new PostNotFoundError('cannot save a removed post', {
          details: { id: state.data.id }
        });
      }

      signal?.throwIfAborted();
      inheritConfirmed(state, revision);
      assertMode(state, revision.data, mode, explicit);

      const { data } = revision;

      if (sameRevision(data, state.pristine)) {
        return post;
      }

      data.status ||= Status.Draft;
      data.tags ??= [];
      data.links ??= { related: [] };
      data.text ??= '';

      applySaveLifecycle(data, yamb.clock);

      if (!data.slug) {
        data.slug = fitSlug(yamb.slugger(data.title || ''));

        if (!data.slug) {
          throw new PostValidationError('slug cannot be derived from empty title', {
            details: { field: 'slug' }
          });
        }
      }

      const candidate = buildUri(data, yamb.timeZone);
      const insert = !data.id;
      const yambState = getYambState(yamb);
      const previous = yambState.byId.get(data.id);
      const uri = await resolveUri({
        data,
        yamb,
        uri: candidate,
        isInsert: insert,
        isRename: !insert && previous !== candidate,
        signal
      });

      data.uri = uri;

      const saved = parse(PostSchema, data, PostValidationError, 'post');
      const unknownRefs = saved.links.related.filter((id) => !yambState.byId.has(id));

      if (unknownRefs.length > 0) {
        throw new LinkRefNotFoundError('unknown link ids', { details: { unknownRefs } });
      }

      const raw = serializeForStorage(saved);
      const expected = explicit !== undefined || !state.pristine ? explicit : state.version;

      raw.version = randomUUIDv7();
      signal?.throwIfAborted();

      let result;

      try {
        result = await yamb.storage.save(raw, { signal, expected });
      } catch (err) {
        reportError(yamb.onError, err, { op: 'save', uri });
        throw err;
      }

      if (!saved.id && result?.id) {
        saved.id = result.id;
      }

      record(yambState, saved.id, uri);
      state.version = raw.version;
      confirm(state, revision, saved);

      return post;
    });
  }
};
