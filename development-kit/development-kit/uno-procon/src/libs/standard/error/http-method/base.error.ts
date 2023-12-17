/**
 * @description custom base error
 * @link https://gist.github.com/slavafomin/b164e3e710a6fc9352c934b9073e7216
 */

import { get } from 'lodash';
import { StatusCodes, getReasonPhrase } from 'http-status-codes';

import { CodeLib, BaseOptionError } from '../../../commons';

export class BaseError extends Error {
  constructor(options?: BaseOptionError) {
    // Calling parent constructor of base Error class.
    super();

    // set status
    const status = get(options, 'status') || StatusCodes.BAD_REQUEST;

    // Saving class name in the property of our custom error as a shortcut.
    this.message = get(options, 'error.message') || options.message || getReasonPhrase(status);

    // Capturing stack trace, excluding constructor call from it.
    Error.captureStackTrace(this, this.constructor);

    // set code default from status handler (please replace code compatibility with coding)
    (this as any).code = get(options, 'code') || CodeLib.ERROR_DEFAULT[status];
    (this as any).status = status; // default 400
    (this as any).inner = get(options, 'error');
  }
}
