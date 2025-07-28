import { createClient } from 'redis';
import logger from './logger.js';
import { config } from '../src/config/index.js';
// import config from '../src/config/index.js';

let redisClient = null;

export const connectRedis = async () => {
  try {
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        connectTimeout: 10000,
        lazyConnect: true,
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            logger.error('Redis connection failed after 10 retries');
            return new Error('Redis connection failed');
          }
          logger.warn(`Redis reconnection attempt ${retries}`);
          return Math.min(retries * 100, 3000);
        }
      }
    });

    redisClient.on('error', (err) => {
      logger.error('Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      logger.info('Redis client connected');
    });

    redisClient.on('ready', () => {
      logger.info('Redis client ready');
    });

    redisClient.on('end', () => {
      logger.info('Redis client disconnected');
    });

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    logger.error('Failed to connect to Redis:', error);
    throw error;
  }
};

export const getRedisClient = () => {
  if (!redisClient) {
    throw new Error('Redis client not initialized. Call connectRedis() first.');
  }
  return redisClient;
};

export const disconnectRedis = async () => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
};

// Initialize Redis connection
export const initializeRedis = async () => {
  try {
    if (config.redis.url !== 'redis://localhost:6379' || process.env.NODE_ENV === 'production') {
      await connectRedis();
      logger.info('Redis connection established');
    } else {
      logger.warn('Redis connection skipped in development mode');
    }
  } catch (error) {
    logger.error('Failed to initialize Redis:', error);
    // Don't exit the process, just log the error
    // The app can still function without Redis for basic operations
  }
};