import Redis from 'ioredis';
import { config } from '../config';

const createRedisClient = () => {
  return new Redis(config.redis.url, {
    maxRetriesPerRequest: 3,
    retryDelayOnFailover: 100,
    lazyConnect: true,
  });
};

declare global {
  // eslint-disable-next-line no-var
  var redis: Redis | undefined;
}

export const redis = globalThis.redis ?? createRedisClient();

if (config.app.nodeEnv === 'development') {
  globalThis.redis = redis;
}

export default redis;
