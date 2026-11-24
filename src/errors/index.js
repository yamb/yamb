export class YambError extends Error {
  static code = 'YAMB_ERROR';

  constructor(message, options = {}) {
    super(message, options);

    this.name = new.target.name;
    this.code = new.target.code;

    if (options.details !== undefined) {
      this.details = options.details;
    }
  }
}

export class YambConfigError extends YambError {
  static code = 'YAMB_CONFIG_INVALID';
}

export class YambNotOpenError extends YambError {
  static code = 'YAMB_NOT_OPEN';
}

export class PostNotFoundError extends YambError {
  static code = 'YAMB_POST_NOT_FOUND';
}

export class PostConflictError extends YambError {
  static code = 'YAMB_POST_CONFLICT';
}

export class PostValidationError extends YambError {
  static code = 'YAMB_POST_VALIDATION';
}

export class PostDateError extends YambError {
  static code = 'YAMB_POST_DATE_INVALID';
}

export class PostStatusError extends YambError {
  static code = 'YAMB_POST_STATUS_INVALID';
}

export class UriTakenError extends YambError {
  static code = 'YAMB_URI_TAKEN';
}

export class UriOriginError extends YambError {
  static code = 'YAMB_URI_ORIGIN_MISMATCH';
}

export class QueryValidationError extends YambError {
  static code = 'YAMB_QUERY_VALIDATION';
}

export class RendererMissingError extends YambError {
  static code = 'YAMB_RENDERER_MISSING';
}

export class RendererScopeError extends YambError {
  static code = 'YAMB_RENDERER_SCOPE';
}

export class RendererInputError extends YambError {
  static code = 'YAMB_RENDERER_INPUT';
}

export class RendererFailedError extends YambError {
  static code = 'YAMB_RENDERER_FAILED';
}

export class TransformError extends YambError {
  static code = 'YAMB_TRANSFORM_FAILED';
}

export class StorageNotOpenError extends YambError {
  static code = 'YAMB_STORAGE_NOT_OPEN';
}

export class StorageDuplicateError extends YambError {
  static code = 'YAMB_STORAGE_DUPLICATE';
}

export class StorageWriteError extends YambError {
  static code = 'YAMB_STORAGE_WRITE';
}

export class StorageReadError extends YambError {
  static code = 'YAMB_STORAGE_READ';
}

export class LinkRefNotFoundError extends YambError {
  static code = 'YAMB_LINK_REF_NOT_FOUND';
}

export function isCancellation(error, signal) {
  return error?.name === 'AbortError' || (signal?.aborted && Object.is(error, signal.reason));
}
