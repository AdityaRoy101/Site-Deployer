// Test setup file
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error'; // Reduce logging during tests

// Mock Redis client for tests
jest.mock('./setup/redisSetup', () => ({
  connectRedis: jest.fn().mockResolvedValue({}),
  getRedisClient: jest.fn().mockReturnValue({
    get: jest.fn(),
    set: jest.fn(),
    setEx: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
    mGet: jest.fn(),
    multi: jest.fn().mockReturnValue({
      setEx: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([])
    }),
    flushAll: jest.fn()
  }),
  disconnectRedis: jest.fn().mockResolvedValue()
}));

// Global test timeout
jest.setTimeout(10000);
