import logger from '../../setup/logger.js';

class ConnectionTracker {
  constructor() {
    this.connections = new Set();
    this.isShuttingDown = false;
  }

  // Middleware to track active requests
  middleware() {
    return (req, res, next) => {
      // If we're shutting down, reject new requests
      if (this.isShuttingDown) {
        res.status(503).json({
          success: false,
          error: {
            message: 'Server is shutting down, please try again later'
          }
        });
        return;
      }

      // Track this connection
      this.connections.add(req);
      logger.debug(`Active connections: ${this.connections.size}`);

      // Remove connection when request completes
      const cleanup = () => {
        this.connections.delete(req);
        logger.debug(`Active connections: ${this.connections.size}`);
      };

      res.on('finish', cleanup);
      res.on('close', cleanup);
      res.on('error', cleanup);

      next();
    };
  }

  // Start shutdown process
  startShutdown() {
    this.isShuttingDown = true;
    logger.info(`Starting shutdown with ${this.connections.size} active connections`);
  }

  // Wait for all connections to finish
  async waitForConnections(timeout = 30000) {
    if (this.connections.size === 0) {
      logger.info('No active connections to wait for');
      return Promise.resolve();
    }

    logger.info(`Waiting for ${this.connections.size} active connections to finish...`);
    
    return new Promise((resolve, reject) => {
      const checkInterval = 100; // Check every 100ms
      const maxWait = timeout;
      let waited = 0;

      const check = () => {
        if (this.connections.size === 0) {
          logger.info('All connections closed gracefully');
          resolve();
        } else if (waited >= maxWait) {
          logger.warn(`Timeout waiting for ${this.connections.size} connections to close`);
          resolve(); // Don't reject, just proceed with shutdown
        } else {
          waited += checkInterval;
          setTimeout(check, checkInterval);
        }
      };

      check();
    });
  }

  // Get current connection count
  getActiveConnectionCount() {
    return this.connections.size;
  }

  // Force close all tracked connections
  forceCloseConnections() {
    logger.warn(`Force closing ${this.connections.size} remaining connections`);
    
    for (const req of this.connections) {
      try {
        if (req.socket && !req.socket.destroyed) {
          req.socket.destroy();
        }
      } catch (error) {
        logger.error('Error force closing connection:', error);
      }
    }
    
    this.connections.clear();
  }
}

// Create singleton instance
const connectionTracker = new ConnectionTracker();

export default connectionTracker;
