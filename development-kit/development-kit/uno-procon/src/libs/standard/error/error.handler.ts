/**
 * @module util
 * @description util service
 */
import * as express from 'express';
import { CodeLib } from '../../commons';
import { StatusCodes } from 'http-status-codes';

/**
 * @method validationParamError
 * @description validate param in validator
 * @param {e.Response} res
 * @param errors
 * @return {Response}
 */
export function validationParamErrorBasic(res: express.Response, errors: any) {
  const messageTemp = Object.values<{ message: string }>(errors['errors']);
  return res.json({
    code: CodeLib.PARAMETER_INVALID,
    status: StatusCodes.UNPROCESSABLE_ENTITY,
    message: messageTemp[0].message,
    error: errors['errors'],
  });
}

/**
 * @method validationParamError
 * @description validate param error from req validator
 * @deprecated Please using res.badParam(errors) replace
 * @param res
 * @param errors
 */
export function validationParamError(res: express.Response, errors: any) {
  return res.bad({
    code: CodeLib.PARAMETER_INVALID,
    status: StatusCodes.UNPROCESSABLE_ENTITY,
    message: Object.values<{ msg: string }>(errors)[0].msg,
    errors: errors,
  });
}

export function controllerTransformError(cb?: any) {
  return function (err: any) {
    // eslint-disable-next-line no-console
    console.error(`Controller catch info: `, err.message);
    if (cb) return cb(err);
  };
}

export function serviceTransformError(callback?: Function | { cb?: Function; service?: string }) {
  return function (err: any) {
    const serviceName = String((callback as any).service || 'Unknown').toUpperCase();
    // eslint-disable-next-line no-console
    console.error(`Service "${serviceName}" catch info: `, err.message);
    if (callback) return (callback as Function)(err);
    if ((callback as any).cb) return (callback as any).cb(err);
  };
}
