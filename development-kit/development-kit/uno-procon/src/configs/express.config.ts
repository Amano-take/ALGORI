/**
 * @description config express
 * @since 2018/03/21
 */

import * as cors from 'cors';
import * as morgan from 'morgan';
import * as helmet from 'helmet';
import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as compression from 'compression';
import * as expressValidator from 'express-validator';
import * as createLocaleMiddleware from 'express-locale';

import startPolyglot from '../commons/locale/startPolyglot';
import { Environment, Validators } from '../libs/commons';

export default function (app: express.Express) {
  if (
    process.env.NODE_ENV !== Environment.production &&
    process.env.NODE_ENV !== Environment.test
  ) {
    app.use(morgan('dev'));
  }

  /**
   * @description Middleware here
   */
  app.use(helmet()); // protected http header
  app.use(cors()); // control cross resources
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(compression());
  app.use(
    expressValidator({
      customValidators: Validators.express.customExpressValidation(),
    }),
  );
  // Get the user's locale, and set a default in case there's none
  app.use(
    createLocaleMiddleware({
      priority: ['accept-language', 'default'],
      default: 'en_US',
    }),
  );
  app.use(startPolyglot);

  app.get('/favicon.ico', function (req, res) {
    res.status(204);
    res.send();
  });

  /**
   * Handle request errors
   * these middleware will be registered after all routes & other middleware
   */
  setImmediate(() => {
    app.use(function (
      err: Error,
      req: express.Request,
      res: express.Response,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      next: express.NextFunction,
    ) {
      res.bad(err);
    });
    app.use(function (req: express.Request, res: express.Response) {
      res.status(404).bad();
    });
  });
}
