import { app, _server } from '../setup/expressSetup.js';
import { registerHealthRoutes } from './routes/healthRoutes.js';
import logger from '../setup/logger.js';
import { initializeRedis, disconnectRedis } from '../setup/redisSetup.js';
import router from './routes/index.js';
import { globalErrorHandler, notFound } from './middleware/errorHandler.js';

(async () => {
  try {
    logger.info('Application Started');

    // GracefulShutdown
    const gracefulShutdown = async signal => {
      logger.info(`Received ${signal}. Starting graceful shutdown...`);
      const shutdownTimeout = parseInt(process.env.SHUTDOWN_TIMEOUT_MS) || 30000;

      const shutdownTimer = setTimeout(() => {
        logger.error('Graceful shutdown timed out, forcing exit');
        process.exit(1);
      }, shutdownTimeout);

      try {
        _server.close(async err => {
          if (err) {
            logger.error('Error during server close:', err);
            clearTimeout(shutdownTimer);
            process.exit(1);
            return;
          }

          logger.info('HTTP server closed');
          await disconnectRedis();
          logger.info('Redis connection closed');

          clearTimeout(shutdownTimer);
          logger.info('Graceful shutdown completed successfully');
          process.exit(0);
        });
      } catch (error) {
        logger.error('Error during graceful shutdown:', error);
        clearTimeout(shutdownTimer);
        process.exit(1);
      }
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

    // Server Config for services
    await initializeRedis();

    // Registered Routes
    registerHealthRoutes(app);

    // Main Entry Routes
    app.use('/api/v1', router);

    // 404 handler
    app.use(notFound);

    // Global error handler
    app.use(globalErrorHandler);

    logger.info('Express Server is up and listening');
  } catch (e) {
    logger.error('Error during app startup:', e);
  }
})();
