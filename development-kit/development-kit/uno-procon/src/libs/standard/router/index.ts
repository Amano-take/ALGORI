/**
 * @description routing config project
 * @version 1.0
 * @since 2018/05/25
 */

import * as express from 'express';

import { ApiOption } from '../../commons/models';
import { BasicAuthLib } from '../../authenticate';

const _router = express.Router();

export class Index {
  /**
   * @method get
   * @description custom router get from express
   * @param {string} path
   * @param fn
   * @param {ApiOption} options
   */
  public static get(path: string, fn: any, options?: ApiOption) {
    Index.route('get', path, fn, options);
  }

  /**
   * @description custom router method get from express
   * @param {string} path
   * @param fn
   * @param {ApiOption} options
   */
  public static post(path: string, fn: any, options?: ApiOption) {
    Index.route('post', path, fn, options);
  }

  /**
   * @method put
   * @description custom router method post from express
   * @param {string} path
   * @param fn
   * @param {ApiOption} options
   */
  public static put(path: string, fn: any, options?: ApiOption) {
    Index.route('put', path, fn, options);
  }

  /**
   * @method patch
   * @description custom router method patch from express
   * @param {string} path
   * @param fn
   * @param {ApiOption} options
   */
  public static patch(path: string, fn: any, options?: ApiOption) {
    Index.route('patch', path, fn, options);
  }

  /**
   * @method delete
   * @description custom router method delete from express
   * @param {string} path
   * @param fn
   * @param {ApiOption} options
   * @private
   */
  public static delete(path: string, fn: any, options?: ApiOption) {
    Index.route('delete', path, fn, options);
  }

  /**
   * @method route
   * @description custom router handler by pass to middleware
   * @param {String}      method                      Route method
   * @param {String}      path                        Route path
   * @param {Function[]}  fn                          Functions
   * @param {Object}      options                     Route options
   * @param {Boolean}     [options.allowAnonymous]   Allow anonymous request
   * @param {String}      [options.role]              Identify role for this api, if allowAnonymous == false
   * @param {String}      [options.clientVerify]     Verify with client id
   * @param {String}      [options.secretVerify]     Verify with secret key (note: this option only, use for the internal transaction between services)
   * @param {String}      [options.env]               Verify environment use function api (local, develop, production, test)
   */
  private static route(
    method: 'get' | 'post' | 'put' | 'delete' | 'patch',
    path: string,
    fn: any,
    options?: ApiOption,
  ) {
    if (!Array.isArray(fn)) {
      fn = [fn];
    }
    if (!options) {
      options = {
        allowAnonymous: false,
      };
    }
    if (options.allowAnonymous !== true) {
      if (options.roles) {
        fn.unshift(BasicAuthLib.verifyRoleApply(options.roles));
      }
      if (options.preventRoles) {
        fn.unshift(BasicAuthLib.verifyRolePrevent(options.preventRoles));
      }
      if (options.env) {
        fn.unshift(BasicAuthLib.verifyEnvironment(options.env));
      }
      // Fixed: from 2020-05-18 --> disable session support
      // if (!options.skipVerifySession) {
      //   fn.unshift(BasicAuthLib.verifySession(!!options.secretVerify));
      // }
      fn.unshift(BasicAuthLib.verifyToken(options));
    } else {
      fn.unshift(BasicAuthLib.verifyTokenBase);
    }
    _router[method](path, fn);
  }
}

export const route = _router;
