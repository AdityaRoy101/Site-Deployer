import express from 'express';
import compression from 'compression';
import config from './config/index.js';
import deployRoutes from './routes/deployRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import connectionTracker from './middleware/connectionTracker.js';
import { serverSetup } from '../setup/serverSetup.js';
import { initializeRedis } from '../setup/redisSetup.js';

const app = express();

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

// Routes
app.use('/api/v1/health', healthRoutes);
app.use('/api/v1', deployRoutes);

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

// Initialize Redis
initializeRedis();

export default app;
