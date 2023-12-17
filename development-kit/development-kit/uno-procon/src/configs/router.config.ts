/**
 * @module router-config
 * @description config router
 *  * api
 *  * static file
 * @version 1.0.0
 */

import * as glob from 'glob';
import * as path from 'path';
import * as chalk from 'chalk';
import * as express from 'express';
import * as signale from 'signale';
import * as stylus from 'stylus';

import APP_CONFIG from './app.config';
import { route } from '../libs/standard';
import { AppConst } from '../commons/consts/app.const';
import { getLogger } from '../libs/commons';

/**
 * @method registerRoutes
 * @description register router application
 * @param {e.Express} app
 */
export default function (app: express.Express) {
  // basic router ******
  app.use('/apidocs', express.static(path.join(__dirname, '../public')));
  app.use('/coverage', express.static(path.join(__dirname, '../../coverage')));
  // eslint-disable-next-line no-console
  getLogger('admin', '').debug(
    `${APP_CONFIG.ENV.IMAGE_STORE.ROOT}/${APP_CONFIG.ENV.IMAGE_STORE.BUCKET}`,
  );
  app.use(
    `/${APP_CONFIG.ENV.IMAGE_STORE.BUCKET}`,
    express.static(`${APP_CONFIG.ENV.IMAGE_STORE.ROOT}/${APP_CONFIG.ENV.IMAGE_STORE.BUCKET}`),
  );

  // 管理者ツール ********
  app.set('view engine', 'pug');
  app.use(
    stylus.middleware({
      src: path.join(__dirname, '/../../assets'),
    }),
  );
  app.use('/assets', express.static(path.join(__dirname, '/../../assets')));

  // api router ********
  const routes = glob.sync(path.normalize(`${APP_CONFIG.ROOT}/api/**/*.route.{ts,js}`));
  routes.forEach((route) => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const routerChild = require(route).default;
    if (routerChild)
      signale.complete(
        chalk.default.yellow(
          `Router "/${AppConst.API_PREFIX}/${AppConst.API_VERSION}/${routerChild}" has been registered!`,
        ),
      );
  });
  app.use(`/${AppConst.API_PREFIX}/${AppConst.API_VERSION}`, route);
}
