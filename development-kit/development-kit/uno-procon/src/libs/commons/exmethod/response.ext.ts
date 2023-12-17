/* eslint-disable @typescript-eslint/no-this-alias */
/**
 * @description customer extension response
 * @since 2018/03/20
 */

import * as chalk from 'chalk';
import * as express from 'express';
import { getReasonPhrase } from 'http-status-codes';

import { ConstLib } from '../consts';
import { ConfigLib } from '../../config.lib';

import {
  BaseError,
  NotFoundError,
  ConflictError,
  ForbiddenError,
  UnauthorizedError,
  RequestFailedError,
  TooManyRequestsError,
} from '../../standard';
import { Environment, ResponseError } from '../';

const exp: any = <any>express;

/**
 * @method ok
 * @description customer response success
 * @param data
 * @param {number} status status default is 200, if data is created new --> should be change to 201
 */
exp.response.ok = function (data: any, status?: number) {
  const _this: express.Response = this;
  if (_this.statusCode >= 400) {
    throw new RangeError(ConstLib.ERROR_STATUS_CODE_INVALID);
  }
  _this.status(status || 200).json({ data: data });
};

/**
 * @method bad
 * @description customer response failed
 * @summary file attach is delete if response is failed
 * @param code
 * @param message
 * @param errors
 * @return {Response}
 */
exp.response.bad = function (code: any, message: any, errors: any) {
  const _this: express.Response = this;
  const status =
    (code ? code.status : undefined) || (_this.statusCode < 400 ? 400 : _this.statusCode);
  if (status < 400) {
    throw new RangeError(ConstLib.ERROR_STATUS_CODE_INVALID);
  }

  if ('object' !== typeof code) {
    return _this.status(status).json(mapError({ status, code, message, errors }, _this));
  }
  if (code.name === 'ValidationError') {
    const msg = _this.req.polyglot.t(Object.values(code.details[0])[0]);
    return _this.status(status).json(
      mapError(
        new BaseError({
          error: {
            details: code.details,
          },
          message: msg,
        }),
        _this,
      ),
    );
  }

  if (ConstLib.ERRORS_SERVER_TYPE.indexOf(code.name) > -1) {
    // eslint-disable-next-line no-console
    console.error(
      chalk.default.bgRed.white(
        '>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>\n',
        code.stack,
        '\n<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<',
      ),
    );
    return _this.status(500).json(mapError(code, _this));
  }
  if (code.code && code.code === 'LIMIT_FILE_SIZE') {
    return _this.status(413).json(mapError(code, _this));
  }
  code.message = _this.req.polyglot.t(code.message);
  return _this.status(status).json(mapError(code, _this));
};

exp.response.badParam = function (errors: any) {
  return this.bad(
    new RequestFailedError({
      message: Object.values<{ msg: string }>(errors)[0].msg,
      error: errors,
    }),
  );
};

/**
 * @method mapError
 * @description map error data
 * @param error
 * @param _this -req, res global
 * @return {ResponseError}
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function mapError(error: any, _this: any): ResponseError {
  if (!error || 'object' !== typeof error) return undefined;
  const verifyCustomerError =
    [
      BaseError.name,
      ConflictError.name,
      ForbiddenError,
      ForbiddenError.name,
      NotFoundError.name,
      UnauthorizedError.name,
      RequestFailedError.name,
      TooManyRequestsError.name,
      UnauthorizedError.name,
    ].indexOf(error.constructor.name) > -1 || error.status === 404;
  const errors: any = {
    code: error.code,
    message: verifyCustomerError
      ? error.message || getReasonPhrase(error.status || 400)
      : ConstLib.ERROR_MESSAGE_DEFAULT_SYSTEM,
  };
  const errorContent =
    error instanceof TypeError ? error.stack : error.errors || error.inner || error;
  if (ConfigLib.ENVIRONMENT !== Environment.production) {
    errors.errors = errorContent;
  }
  return errors;
}

export default 'express/Response';
