import logger from '../utils/logger.js';

// Test all log levels with colors
console.log('\n🎨 Testing Colored Logging Levels:\n');

logger.error('This is an ERROR message - displayed in RED');
logger.warn('This is a WARNING message - displayed in YELLOW'); 
logger.info('This is an INFO message - displayed in GREEN');
logger.debug('This is a DEBUG message - displayed in BLUE');

console.log('\n📊 Testing logging with structured data:\n');

logger.info('Deployment started', {
  projectName: 'my-react-app',
  deploymentId: 'abc-123',
  timestamp: new Date().toISOString()
});

logger.warn('Cache connection failed', {
  service: 'Redis',
  error: 'Connection timeout',
  retryCount: 3
});

logger.error('Build process failed', {
  projectPath: '/tmp/my-project',
  buildCommand: 'npm run build',
  exitCode: 1,
  error: 'Module not found'
});

console.log('\n✅ Logging test completed! Check logs/ directory for file output.\n');
