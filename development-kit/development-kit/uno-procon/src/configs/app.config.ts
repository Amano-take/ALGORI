/**
 * @class AppConfig
 * @description config environment + preload bootstrap app
 * @since 1.0.0
 */

import * as path from 'path';
import * as glob from 'glob';
import * as chalk from 'chalk';
import * as signale from 'signale';

import { AppEnvironment, AppConfigModel } from '../commons/interfaces';
import { Environment } from '../libs/commons';

let ENV: AppEnvironment;
// config root
const ROOT = path.normalize(__dirname + '/..');

/**
 * @method setupEnv
 * @description config load environment
 * @return {AppEnvironment}
 */
function setupEnv(): AppEnvironment {
  let mode = (process.env.NODE_ENV = process.env.NODE_ENV || Environment.production);
  if (
    process.argv.length > 2 &&
    Object.values(Environment).indexOf(process.argv[2] as Environment) > -1
  ) {
    mode = process.argv[2];
  }
  mode = mode.trim();
  const environmentFile = glob.sync(path.normalize(__dirname + `/environment/${mode}.env.{js,ts}`));
  if (environmentFile && !environmentFile.length) {
    signale.note(
      chalk.default.red(
        `No configuration file found for "${mode}" environment, using "${process.env.NODE_ENV}" instead!`,
      ),
    );
  } else {
    signale.note(
      chalk.default.black.bgWhite(
        `Application loaded using the "${mode}" environment configuration.`,
      ),
    );
    process.env.NODE_ENV = mode;
  }

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require(`./environment/${process.env.NODE_ENV}.env`).ENV as AppEnvironment;
}

// eslint-disable-next-line prefer-const
ENV = setupEnv();

export default {
  ROOT: ROOT,
  ENV: ENV,
} as AppConfigModel;
