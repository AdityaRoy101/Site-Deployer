import express from 'express';
import compression from 'compression';
// import config from '../src/config/index.js';
import connectionTracker from '../src/middleware/connectionTracker.js';
import { serverSetup } from './serverSetup.js';
import { config } from '../src/config/index.js';

export const app = express();

// Trust proxy if behind reverse proxy (nginx, load balancer, etc.)
if (config.security.trustProxy) {
  app.set('trust proxy', 1);
}

// Security middleware
app.use(serverSetup.security);

// CORS configuration
app.use(serverSetup.CORS);

// Compression middleware
app.use(compression());

// Rate limiting
app.use(serverSetup.limiter);

// Logging middleware
app.use(serverSetup.logging);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Connection tracking middleware for graceful shutdown
app.use(connectionTracker.middleware());

const port = process.env.PORT || 3000;

// Starting the server
let _server;
try {
  _server = app.listen(port, () => {
    console.log(`Express Server started and listening on port ${port} in ${process.env.NODE_ENV} mode`);
  });
} catch (error) {
  console.error('Error starting the server:', error);
  process.exit(1);
}

export { _server };
