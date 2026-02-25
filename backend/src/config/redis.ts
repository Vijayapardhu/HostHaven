import Redis from 'ioredis';
import { config } from '../config';

const createRedisClient = () => {
  return new Redis(config.redis.url, {
    maxRetriesPerRequest: 3,
    retryDelayOnFailover: 100,
    lazyConnect: true,
  });
};

const createNoopRedis = () => {
  return {
    get: async () => null,
    set: async () => 'OK',
    setex: async () => 'OK',
    del: async () => 0,
    keys: async () => [],
    exists: async () => 0,
    quit: async () => undefined,
  };
};

declare global {
  // eslint-disable-next-line no-var
  var redis: Redis | undefined;
}

export const redis = config.redis.enabled
  ? globalThis.redis ?? createRedisClient()
  : createNoopRedis();

if (config.app.nodeEnv === 'development') {
  globalThis.redis = redis;
}

export default redis;
