'use strict';

import * as path from 'path';
import { AppEnvironment } from '../../commons/interfaces';

export const ENV: AppEnvironment = {
  NAME: 'dev2',
  APP: {
    METHOD: 'http',
    HOST: '',
    PORT: 8081,
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
      USERNAME: 'uno',
      PASSWORD: 'pael4Kom',
      HOST: 'uno-dev2-docdb-cluster.cluster-c1lgitlxzmh8.ap-northeast-1.docdb.amazonaws.com',
      PORT: 27017,
      NAME: 'uno-dev2',
    },
    REDIS: {
      HOST: 'uno-dev2-redis.llqqv4.0001.apne1.cache.amazonaws.com',
      PORT: 6379,
      DB: 3,
    },
  },
  IMAGE_STORE: {
    HOST: '',
    ROOT: path.join(__dirname, '../../../../', 'public/buckets'),
    BUCKET: 'uno-staging',
  },
};
