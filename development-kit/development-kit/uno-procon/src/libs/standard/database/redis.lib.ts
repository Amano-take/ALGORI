import { Redis } from 'ioredis';
import * as Promise from 'bluebird';

export class RedisLib {
  public redisClient: Redis;

  constructor(_redisClient: Redis) {
    this.redisClient = _redisClient;
  }

  /**
   * @method getSingleKey
   * @description get single key value
   * @param {string} _pattern
   * @return {Bluebird<string>}
   */
  public async getSingleKey(_pattern: string) {
    return new Promise<string>((resolve) => {
      const stream = this.redisClient.scanStream({
        match: _pattern,
        count: 1,
      });
      const keys: string[] = [];
      stream.on('data', function (resultKeys: string[]) {
        keys.push(...resultKeys);
      });
      stream.on('end', function () {
        return resolve(keys[0]);
      });
    });
  }

  /**
   * @method getMultipleKey
   * @description get multiple key in redis
   * @param {string} _pattern pattern match value
   * @param {number} _count default count = 100
   * @return {Bluebird<string[]>}
   */
  public async getMultipleKey(_pattern: string, _count = 100) {
    return new Promise<string[]>((resolve) => {
      const stream = this.redisClient.scanStream({
        match: _pattern,
        count: _count,
      });
      const keys: string[] = [];
      stream.on('data', function (resultKeys: string[]) {
        keys.push(...resultKeys);
      });
      stream.on('end', function () {
        return resolve(keys);
      });
    });
  }

  public async flushDb() {
    return await this.redisClient.flushdb();
  }
}
