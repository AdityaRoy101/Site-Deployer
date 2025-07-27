import app from './src/app.js';
import dotenv from 'dotenv';
// import logger from './utils/logger.js';
// import { disconnectRedis } from './src/config/database.js';
import logger from './setup/logger.js';
import { disconnectRedis } from './setup/redisSetup.js';

dotenv.config();

const PORT = process.env.PORT || 3000;

// Start server
const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

// Graceful shutdown configuration
const gracefulShutdown = async (signal) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  
  const shutdownTimeout = parseInt(process.env.SHUTDOWN_TIMEOUT_MS) || 30000; // 30 seconds default
  let shutdownTimer;
  
  // Set shutdown timeout
  shutdownTimer = setTimeout(() => {
    logger.error('Graceful shutdown timed out, forcing exit');
    process.exit(1);
  }, shutdownTimeout);
  
  try {
    // Stop accepting new connections
    server.close(async (err) => {
      if (err) {
        logger.error('Error during server close:', err);
        clearTimeout(shutdownTimer);
        process.exit(1);
        return;
      }
      
      logger.info('HTTP server closed');
      
      try {
        // Close database connections
        await disconnectRedis();
        logger.info('Database connections closed');
        
        // Clear shutdown timer
        clearTimeout(shutdownTimer);
        
        logger.info('Graceful shutdown completed successfully');
        process.exit(0);
      } catch (error) {
        logger.error('Error during graceful shutdown:', error);
        clearTimeout(shutdownTimer);
        process.exit(1);
      }
    });
    
    setTimeout(() => {
      if (!server.listening) {
        logger.info('No active connections, proceeding with shutdown');
      }
    }, 1000);
    
  } catch (error) {
    logger.error('Error during graceful shutdown:', error);
    clearTimeout(shutdownTimer);
    process.exit(1);
  }
};

// Handle process termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('unhandledRejection');
});

export default server;
