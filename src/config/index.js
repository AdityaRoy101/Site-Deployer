import dotenv from 'dotenv';

dotenv.config();

// Validate required environment variables
const requiredVars = ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_REGION', 'CLOUDFRONT_URL'];

const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
}

export const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',

  // AWS Configuration
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'us-east-1',
    s3Bucket: process.env.S3_BUCKET_NAME || 'infraless-static-sites-bucket',
    cloudfrontUrl: process.env.CLOUDFRONT_URL
  },

  // Redis Configuration
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    ttl: parseInt(process.env.REDIS_TTL) || 3600 // 1 hour default
  },

  // Rate limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100 // limit each IP to 100 requests per windowMs
  },

  // Build configuration
  build: {
    timeout: parseInt(process.env.BUILD_TIMEOUT_MS) || 10 * 60 * 1000, // 10 minutes
    tempDir:
      process.env.TEMP_DIR ||
      (process.platform === 'win32' ? process.env.TEMP || process.env.TMP : '/tmp'),
    maxProjectSize: parseInt(process.env.MAX_PROJECT_SIZE_MB) || 500 // 500MB
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    maxFiles: process.env.LOG_MAX_FILES || '14d',
    maxSize: process.env.LOG_MAX_SIZE || '20m'
  },

  // Security
  security: {
    corsOrigin: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(',')
      : ['http://localhost:3000'],
    trustProxy: process.env.TRUST_PROXY === 'true'
  }
};

// All configurations keys and values needed to added here
