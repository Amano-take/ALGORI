/**
 * @description custom config express json web-token
 * @version 2.0
 */

import { set } from 'lodash';
import * as async from 'async';
import * as jwt from 'jsonwebtoken';
import * as unless from 'express-unless';
import { NextFunction, Request, Response } from 'express';

import { Options } from './express-jwt.model';

import { ConfigLib } from '../../config.lib';
import { GrantPermission } from '../grant-permission';
import { Strategy, Utils, CodeLib } from '../../commons';
import { BaseError, UnauthorizedError } from '../../standard';

export class ExpressJwt {
  public static DEFAULT_REVOKED_FUNCTION = function (_: any, __: any, cb: Function) {
    return cb(undefined, false);
  };

  static isFunction(object: any) {
    return Object.prototype.toString.call(object) === '[object Function]';
  }

  public static wrapStaticSecretInCallback(secret: string) {
    return function (_: any, __: any, cb: Function) {
      return cb(undefined, secret);
    };
  }

  public static handler(options: Options) {
    if (!options || !options.secret) {
      throw new BaseError({ message: 'Secret should be set' });
    }

    let secretCallback: any = options.secret;

    if (!ExpressJwt.isFunction(secretCallback) && typeof secretCallback === 'string') {
      secretCallback = ExpressJwt.wrapStaticSecretInCallback(secretCallback);
    }

    const isRevokedCallback = options.isRevoked || this.DEFAULT_REVOKED_FUNCTION;

    const _requestProperty = options.userProperty || options.requestProperty || 'user';
    const _resultProperty = options.resultProperty;
    const credentialsRequired =
      typeof options.credentialsRequired === 'undefined' ? true : options.credentialsRequired;

    const middleware: any = function (req: Request, res: Response, next: NextFunction) {
      if (options.secretVerify) {
        const clientSecret: string = <string>req.headers[Strategy.ClientSecret];
        if (
          clientSecret &&
          clientSecret.length >= 71 &&
          ConfigLib.SECURE.API_RESTRICT.CLIENT_SECRET.indexOf(clientSecret) > -1
        ) {
          set(req, _requestProperty, { role: GrantPermission.ADMIN_ROLES.ROOT, internal: true });
          return next();
        }
      }
      let token: any;

      if (
        req.method === 'OPTIONS' &&
        // eslint-disable-next-line no-prototype-builtins
        req.headers.hasOwnProperty('access-control-request-headers')
      ) {
        const hasAuthInAccessControl = !!~(req.headers['access-control-request-headers'] as string)
          .split(',')
          .map(function (header: any) {
            return header.trim();
          })
          .indexOf('authorization');

        if (hasAuthInAccessControl) {
          return next();
        }
      }

      if (options.getToken && typeof options.getToken === 'function') {
        try {
          token = options.getToken(req);
        } catch (e) {
          return next(e);
        }
      } else if (req.headers && req.headers.authorization) {
        const parts = (req.headers.authorization as string).split(' ');
        if (parts.length == 2) {
          const scheme = parts[0];
          const credentials = parts[1];

          if (/^Bearer$/i.test(scheme)) {
            token = credentials;
          } else {
            if (credentialsRequired) {
              return next(
                new UnauthorizedError({
                  code: CodeLib.AUTHENTICATE_CREDENTIALS_BAD_SCHEME,
                  error: { message: 'Format is Authorization: Bearer [token]' },
                }),
              );
            } else {
              return next();
            }
          }
        } else {
          return next(
            new UnauthorizedError({
              code: CodeLib.AUTHENTICATE_CREDENTIALS_BAD_FORMAT,
              error: { message: 'Format is Authorization: Bearer [token]' },
            }),
          );
        }
      }

      if (!token) {
        if (credentialsRequired) {
          return next(
            new UnauthorizedError({
              code: CodeLib.AUTHENTICATE_CREDENTIALS_REQUIRED,
              error: { message: 'No authorization token was found' },
            }),
          );
        } else {
          return next();
        }
      }

      let dtoken: any;

      try {
        dtoken = jwt.decode(token, { complete: true }) || {};
      } catch (err) {
        return next(
          new UnauthorizedError({
            code: 'invalid_token',
            error: err,
          }),
        );
      }

      async.waterfall(
        [
          function getSecret(callback: Function) {
            const arity = secretCallback.length;
            if (arity == 4) {
              secretCallback(req, dtoken.header, dtoken.payload, callback);
            } else {
              // arity == 3
              secretCallback(req, dtoken.payload, callback);
            }
          },
          function verifyToken(secret: string, callback: Function) {
            jwt.verify(token, secret, options as any, function (err, decoded) {
              if (err) {
                callback(
                  new UnauthorizedError({
                    code: CodeLib.AUTHENTICATE_JWT_INVALID,
                    error: err,
                  }),
                );
              } else {
                callback(undefined, decoded);
              }
            });
          },
          function checkRevoked(decoded: any, callback: Function) {
            isRevokedCallback(req, dtoken.payload, function (err: any, revoked: any) {
              if (err) {
                callback(err);
              } else if (revoked) {
                callback(
                  new UnauthorizedError({
                    code: CodeLib.AUTHENTICATE_REVOKED_TOKEN,
                    error: { message: 'The token has been revoked.' },
                  }),
                );
              } else {
                callback(undefined, decoded);
              }
            });
          },
        ],
        function (err, result) {
          if (err) {
            return next(err);
          }
          if (_resultProperty) {
            // release new v2
            set(
              res,
              _resultProperty,
              Object.assign(Utils.camelCase(result), { _id: (result as any)['_id'] }),
            );
          } else {
            // release new v2
            set(
              req,
              _requestProperty,
              Object.assign(Utils.camelCase(result), { _id: (result as any)['_id'] }),
            );
          }
          next();
        },
      );
    };

    middleware.unless = unless;
    middleware.UnauthorizedError = UnauthorizedError;

    return middleware;
  }
}
