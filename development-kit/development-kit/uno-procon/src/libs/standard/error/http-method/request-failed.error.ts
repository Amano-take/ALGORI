/**
 * @description my team moving 402 status to parameters were valid but the request failed (flow stripe development)
 * - References: https://stripe.com/docs/api/errors
 */

import { StatusCodes } from 'http-status-codes';

import { BaseError } from './base.error';
import { BaseOptionError } from '../../../commons';

export class RequestFailedError extends BaseError {
  constructor(options: BaseOptionError = {}) {
    super({
      code: options.code,
      status: StatusCodes.UNPROCESSABLE_ENTITY,
      message: options.message,
      error: options.error,
    });
  }
}
