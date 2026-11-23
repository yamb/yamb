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
