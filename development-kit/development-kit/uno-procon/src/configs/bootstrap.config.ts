/**
 * @description bootstrap config
 * @since 2018/03/20
 */

import * as mkdirp from 'mkdirp';
import * as signale from 'signale';

import APP_CONFIG from './app.config';
import { registerExtensionMethods } from '../libs/commons';

/**
 * @method preloadExtensionMethods
 * @description load extension method
 */
function preloadExtensionMethods() {
  registerExtensionMethods({ pagination: true, response: true });
}

function initBucket() {
  const pathUpload = `${APP_CONFIG.ENV.IMAGE_STORE.ROOT}/${APP_CONFIG.ENV.IMAGE_STORE.BUCKET}`;
  mkdirp(pathUpload, function (err: any) {
    if (err) {
      // eslint-disable-next-line no-console
      console.error(err);
    } else {
      signale.success(`Init bucket "${APP_CONFIG.ENV.IMAGE_STORE.BUCKET}" success.`);
    }
  });
}

export default function () {
  initBucket();
  /** preload extension method*/
  preloadExtensionMethods();
}
