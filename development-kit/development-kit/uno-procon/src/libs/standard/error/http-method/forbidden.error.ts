import { StatusCodes } from 'http-status-codes';

import { BaseError } from './base.error';
import { BaseOptionError } from '../../../commons';

export class ForbiddenError extends BaseError {
  constructor(options: BaseOptionError = {}) {
    super({
      code: options.code,
      status: StatusCodes.FORBIDDEN,
      message: options.message,
      error: options.error,
    });
  }
}
