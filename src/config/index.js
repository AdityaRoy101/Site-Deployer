import dotenv from 'dotenv';

dotenv.config();

// Validate required environment variables
const requiredVars = {
  AWS_ACCESS_KEY_ID: 'AWS Access Key ID for S3 uploads',
  AWS_SECRET_ACCESS_KEY: 'AWS Secret Access Key for S3 uploads',
  AWS_REGION: 'AWS Region for S3 bucket',
  CLOUDFRONT_URL: 'CloudFront distribution URL for CDN'
};

const validateConfig = () => {
  const missingVars = [];
  const invalidVars = [];

  Object.entries(requiredVars).forEach(([varName, description]) => {
    const value = process.env[varName];
    if (!value) {
      missingVars.push(`${varName} (${description})`);
    } else {
      // Additional validation
      if (varName === 'CLOUDFRONT_URL' && !value.startsWith('https://')) {
        invalidVars.push(`${varName} must start with https://`);
      }
      if (varName === 'AWS_REGION' && !/^[a-z0-9-]+$/.test(value)) {
        invalidVars.push(`${varName} has invalid format`);
      }
    }
  });

  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(varInfo => console.error(`  - ${varInfo}`));
    console.error('\n💡 Please check your .env file or environment variables.');
    throw new Error(
      `Missing required environment variables: ${missingVars.map(v => v.split(' ')[0]).join(', ')}`
    );
  }

  if (invalidVars.length > 0) {
    console.error('❌ Invalid environment variables:');
    invalidVars.forEach(varInfo => console.error(`  - ${varInfo}`));
    throw new Error(`Invalid environment variables: ${invalidVars.join(', ')}`);
  }

  // console.log('✅ All required environment variables are present and valid');
};

// Run validation
validateConfig();

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
