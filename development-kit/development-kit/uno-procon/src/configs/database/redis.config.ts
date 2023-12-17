import * as Redis from 'ioredis';
import * as signale from 'signale';

import APP_CONFIG from '../app.config';

const redis = new Redis({
  host: APP_CONFIG.ENV.DATABASE.REDIS.HOST,
  port: APP_CONFIG.ENV.DATABASE.REDIS.PORT,
  db: APP_CONFIG.ENV.DATABASE.REDIS.DB,
});

redis.on('connect', () => {
  signale.success(
    `[RedisDB] number: ${APP_CONFIG.ENV.DATABASE.REDIS.DB}, ` +
      `host: ${APP_CONFIG.ENV.DATABASE.REDIS.HOST} has connected successfully!`,
  );
});

redis.on('error', (err) => {
  signale.warn(`Redis error: ${err}`);
});

export default redis;
