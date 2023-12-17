'use strict';

import * as path from 'path';
import { AppEnvironment } from '../../commons/interfaces';

export const ENV: AppEnvironment = {
  NAME: 'local',
  APP: {
    METHOD: 'http',
    HOST: '',
    PORT: 8080,
    TEST_PORT: 3000,
    IP: process.env['IP'] || '0.0.0.0',
  },
  SECURE: {
    JWT: {
      JWT_SECRET: `uno-localjwtauthenticate-##2020`,
      /*time expire token*/
      TOKEN_EXPIRE: 7 * 24 * 60 * 60, // 7 days
    },
  },
  DATABASE: {
    MONGODB: {
      USERNAME: '',
      PASSWORD: '',
      HOST: 'localhost',
      PORT: 27017,
      NAME: 'uno-local',
    },
    REDIS: {
      HOST: '127.0.0.1',
      PORT: 6379,
      DB: 1,
    },
  },
  IMAGE_STORE: {
    HOST: 'http://localhost:8080',
    ROOT: path.join(__dirname, '../../../../', 'public/buckets'),
    BUCKET: 'uno-local',
  },
};
