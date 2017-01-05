export class BaseError extends Error {
  constructor(message) {
    super(message);
    this.name = 'Neo4jsBaseError';
    this.message = message;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends BaseError {
  constructor(message, errors) {
    super(message);
    this.name = 'Neo4jsValidationError';

    this.errors = errors || [];

    if (message) {
      this.message = message;
    } else if (this.errors.length) {
      this.message = this.errors.map(err => err.type + ': ' + err.message).join(',\n');
    }
  }
}

export class UniqueConstraintError extends ValidationError {
  constructor(options) {
    options = options || {};
    super(options.message, options.errors);
  }
}

export class ExistsConstraintError extends ValidationError {

}
