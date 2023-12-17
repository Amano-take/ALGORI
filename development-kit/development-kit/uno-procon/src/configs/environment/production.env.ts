'use strict';

import * as path from 'path';
import { AppEnvironment } from '../../commons/interfaces';

export const ENV: AppEnvironment = {
  NAME: 'production',
  APP: {
    METHOD: 'http',
    HOST: '',
    PORT: 8082,
    TEST_PORT: 3000,
    IP: process.env['IP'] || '0.0.0.0',
  },
  SECURE: {
    JWT: {
      JWT_SECRET: `uno-productionjwtauthenticate-#2020`,
      /*time expire token*/
      TOKEN_EXPIRE: 24 * 60 * 60, // 1 days
    },
  },
  DATABASE: {
    MONGODB: {
      USERNAME: '',
      PASSWORD: '',
      HOST: 'localhost',
      PORT: 27017,
      NAME: 'uno-production',
    },
    REDIS: {
      HOST: '127.0.0.1',
      PORT: 6379,
      DB: 0,
    },
  },
  IMAGE_STORE: {
    HOST: '',
    ROOT: path.join(__dirname, '../../../../', 'public/buckets'),
    BUCKET: 'uno-production',
  },
};
