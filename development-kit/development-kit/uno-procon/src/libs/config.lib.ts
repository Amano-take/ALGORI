/**
 * @description expose config lib
 */

import { merge } from 'lodash';
import { ConfigLibModel, Environment } from './commons/models';

let defaultConfig: ConfigLibModel = {
  ENVIRONMENT: Environment.local,

  // [SECURE-CONFIG] Security configuration ========================================================
  SECURE: {
    JWT: {
      TOKEN_EXPIRE: 0,
      JWT_SECRET: '',
      FIELD: ['_id', 'role', 'email'],
    },
    API_RESTRICT: {
      CLIENT_SECRET: '',
    },
  },

  // config common ===================================================================================
  PAGE_SIZE: 20,
};

export function initConfig(config: ConfigLibModel) {
  defaultConfig = merge(defaultConfig, config);
}

export const ConfigLib: ConfigLibModel = defaultConfig;
