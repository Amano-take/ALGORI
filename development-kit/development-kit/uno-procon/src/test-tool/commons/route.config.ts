import * as path from 'path';
import * as express from 'express';
import * as stylus from 'stylus';

import { AppConst } from '../../commons/consts/app.const';
import webRouter from '../web/web.route';

/**
 * @method registerRoutes
 * @description register router application
 * @param {e.Express} app
 */
export default function (app: express.Express) {
  // basic router ******
  app.set('view engine', 'pug');
  app.use(
    stylus.middleware({
      src: path.join(__dirname, '/../../../assets'),
    }),
  );
  app.use('/assets', express.static(path.join(__dirname, '/../../../assets')));
  app.use(`/${AppConst.API_PREFIX}/${AppConst.API_VERSION}`, webRouter);
}
