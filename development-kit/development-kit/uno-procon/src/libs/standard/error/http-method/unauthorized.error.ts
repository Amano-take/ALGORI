import { StatusCodes } from 'http-status-codes';

import { BaseError } from './base.error';
import { BaseOptionError } from '../../../commons';

export class UnauthorizedError extends BaseError {
  constructor(options: BaseOptionError = {}) {
    super({
      code: options.code,
      status: StatusCodes.UNAUTHORIZED,
      message: options.message,
      error: options.error,
    });
  }
}
