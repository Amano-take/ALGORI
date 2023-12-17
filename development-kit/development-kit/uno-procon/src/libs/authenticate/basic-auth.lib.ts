/**
 * @module auth
 * @description basic authenticate library
 * @version 1.0.0
 */

import * as jwt from 'jsonwebtoken';
import { get, set, pick, omitBy, isNil } from 'lodash';
import { Request, Response, NextFunction, RequestHandler } from 'express';

import { ConfigLib } from '../config.lib';
import { AuthConfig } from './auth.config';

import { expressJwt, GrantPermission } from './';
import { ForbiddenError, UnauthorizedError } from '../standard';
import { CodeLib, ConstLib, PatternLib, Strategy, Environment, ApiOption } from '../commons';

export default class BasicAuthLib {
  /**
   * @method verifyToken
   * @description Check if token is valid
   * @param options
   * @return {e.RequestHandler}
   */
  public static verifyToken(options?: ApiOption & any): RequestHandler {
    return function (req: Request, res: Response, next: NextFunction) {
      return expressJwt.handler(
        Object.assign({}, options, {
          secret: ConfigLib.SECURE.JWT.JWT_SECRET,
        }),
      )(req, res, next);
    };
  }

  /**
   * @method verifyEnvironment
   * @description verify environment access resource
   * @param {string[]} env
   * @return {e.RequestHandler}
   */
  public static verifyEnvironment(env: string[]): RequestHandler {
    return function (req: Request, res: Response, next: NextFunction) {
      if (env.indexOf(ConfigLib.ENVIRONMENT) === -1)
        return res.bad(
          new ForbiddenError({ error: { message: ConstLib.ENVIRONMENT_NOT_SUPPORT } }),
        );
      return next();
    };
  }

  /**
   * @method verifyTokenBase
   * @description same as verifyToken. But function not attach response failed when token not invalid
   * @param {e.Request} req
   * @param {e.Response} res
   * @param {e.NextFunction} next
   * @return {e.RequestHandler}
   */
  public static verifyTokenBase(req: Request, res: Response, next: NextFunction): void {
    const clientSecret: string = <string>req.headers[Strategy.ClientSecret];
    if (
      clientSecret &&
      clientSecret.length >= 71 &&
      ConfigLib.SECURE.API_RESTRICT.CLIENT_SECRET.indexOf(clientSecret) > -1
    ) {
      set(req, 'user', { role: GrantPermission.ADMIN_ROLES.ROOT });
      return next();
    }
    const token: string = <string>req.headers.authorization;
    jwt.verify(
      token ? token.substring(7) : '',
      ConfigLib.SECURE.JWT.JWT_SECRET,
      { algorithms: ConfigLib.SECURE.JWT.ALGORITHMS },
      function (err, decoded) {
        if (err) return next();
        req.user = decoded as any;
        return next();
      },
    );
  }

  /**
   * @method decodeToken
   * @description decode token and attach token to user
   * @param {e.Request} req
   * @param {e.Response} res
   * @param {e.NextFunction} next
   */
  public static decodeToken(req: Request, res: Response, next: NextFunction): void {
    const token: string = <string>req.headers.authorization;
    if (token) {
      req.user = jwt.decode(token.substring(7)) as any;
    }
    next();
  }

  /**
   * @method verifyRoleApply
   * @description check role user
   * @param {string | string[]} roles
   * @return {e.RequestHandler}
   */
  public static verifyRoleApply(roles: string | string[]): RequestHandler {
    return function (req: Request, res: Response, next: NextFunction) {
      if (req.user && req.user.role === GrantPermission.ADMIN_ROLES.ROOT) {
        return next();
      }
      if ('string' === typeof roles) {
        roles = (roles as string).split(' ');
      }
      if (roles.indexOf(req.user.role) === -1) {
        return res.bad(new ForbiddenError());
      }
      next();
    };
  }

  /**
   * @method verifyRolePrevent
   * @description check role user
   * @param {string | string[]} preventRoles
   * @return {e.RequestHandler}
   */
  public static verifyRolePrevent(preventRoles: string | string[]): RequestHandler {
    return function (req: Request, res: Response, next: NextFunction) {
      if (preventRoles.indexOf(req.user.role) > -1) return res.bad(new ForbiddenError());
      next();
    };
  }

  /**
   * @method verifySession
   * @description verify session (device mobile is ignore)
   * @param {boolean} secretVerify default is true
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public static verifySession(secretVerify = false): RequestHandler {
    return function (req: Request, res: Response, next: NextFunction) {
      const envSessionIgnore = [
        Environment.dev,
        Environment.test,
        Environment.staging,
        Environment.production,
      ];
      const clientDevice: string = <string>req.headers[Strategy.ClientDevice] || '';
      if (
        clientDevice !== ConstLib.DEVICE_MOBILE &&
        ConfigLib.SECURE.SESSION_APPROVE &&
        envSessionIgnore.indexOf(ConfigLib.ENVIRONMENT as Environment) > -1 &&
        PatternLib.domainSession.test(<string>req.headers.origin || '') &&
        !PatternLib.swaggerIgnore.test(<string>req.headers.referer)
      ) {
        if (req.user._id === get(req.session, 'key._id')) {
          return next();
        } else {
          return next(
            new UnauthorizedError({
              code: CodeLib.AUTHENTICATE_SESSION_EXPIRE,
              error: { message: ConstLib.ERROR_SESSION_EXPIRE },
            }),
          );
        }
      }
      return next();
    };
  }

  /**
   * @method signToken
   * @description create new token
   * @param {object} user
   * @param {string[]} fields
   * @param {number} expiresIn
   * @return {string}
   */
  public static signToken(
    user: any,
    fields: string[] = [...AuthConfig.JWT.FIELD, ...GrantPermission.allRole],
    expiresIn: number = ConfigLib.SECURE.JWT.TOKEN_EXPIRE,
  ) {
    user = omitBy(user, isNil);
    return jwt.sign(pick(user, fields), ConfigLib.SECURE.JWT.JWT_SECRET, {
      algorithm: ConstLib.JWT_SECRET_ALGORITHM,
      expiresIn: expiresIn,
    });
  }
}
