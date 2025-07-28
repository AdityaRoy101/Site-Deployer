import logger from '../../setup/logger.js';
import { getRedisClient } from '../../setup/redisSetup.js';

class CacheService {
  constructor() {
    this.enabled = true;
  }

  async get(key) {
    try {
      if (!this.enabled) return null;

      const client = getRedisClient();
      if (!client || !client.isReady) {
        logger.debug('Redis client not ready, skipping cache get');
        return null;
      }

      const data = await client.get(key);

      if (data) {
        logger.debug(`Cache hit for key: ${key}`);
        return JSON.parse(data);
      }

      logger.debug(`Cache miss for key: ${key}`);
      return null;
    } catch (error) {
      logger.warn(`Cache get failed for key ${key}: ${error.message}`);
      if (error.message.includes('Redis client not initialized')) {
        this.enabled = false;
      }
      return null;
    }
  }

  async set(key, value, ttl = 3600) {
    try {
      if (!this.enabled) return false;

      const client = getRedisClient();
      const serializedValue = JSON.stringify(value);

      await client.setEx(key, ttl, serializedValue);
      logger.debug(`Cache set for key: ${key}, TTL: ${ttl}s`);
      return true;
    } catch (error) {
      logger.warn(`Cache set failed for key ${key}: ${error.message}`);
      this.enabled = false;
      return false;
    }
  }

  async del(key) {
    try {
      if (!this.enabled) return false;

      const client = getRedisClient();
      const result = await client.del(key);
      logger.debug(`Cache delete for key: ${key}`);
      return result > 0;
    } catch (error) {
      logger.warn(`Cache delete failed for key ${key}: ${error.message}`);
      this.enabled = false;
      return false;
    }
  }

  async flush() {
    try {
      if (!this.enabled) return false;

      const client = getRedisClient();
      await client.flushAll();
      logger.info('Cache flushed successfully');
      return true;
    } catch (error) {
      logger.warn(`Cache flush failed: ${error.message}`);
      this.enabled = false;
      return false;
    }
  }

  async exists(key) {
    try {
      if (!this.enabled) return false;

      const client = getRedisClient();
      const result = await client.exists(key);
      return result === 1;
    } catch (error) {
      logger.warn(`Cache exists check failed for key ${key}: ${error.message}`);
      this.enabled = false;
      return false;
    }
  }

  async setMultiple(keyValuePairs, ttl = 3600) {
    try {
      if (!this.enabled) return false;

      const client = getRedisClient();
      const pipeline = client.multi();

      for (const [key, value] of keyValuePairs) {
        const serializedValue = JSON.stringify(value);
        pipeline.setEx(key, ttl, serializedValue);
      }

      await pipeline.exec();
      logger.debug(`Cache set multiple: ${keyValuePairs.length} keys`);
      return true;
    } catch (error) {
      logger.warn(`Cache set multiple failed: ${error.message}`);
      this.enabled = false;
      return false;
    }
  }

  async getMultiple(keys) {
    try {
      if (!this.enabled) return {};

      const client = getRedisClient();
      const values = await client.mGet(keys);

      const result = {};
      keys.forEach((key, index) => {
        if (values[index]) {
          result[key] = JSON.parse(values[index]);
        }
      });

      logger.debug(`Cache get multiple: ${keys.length} keys, ${Object.keys(result).length} hits`);
      return result;
    } catch (error) {
      logger.warn(`Cache get multiple failed: ${error.message}`);
      this.enabled = false;
      return {};
    }
  }
}

export default new CacheService();
