import express from 'express';
import { appConfig } from '#config/app.config.js';
import { setupMiddlewares } from '#api/middlewares/index.js';
import { setupRoutes } from '#api/routes/index.js';
import { errorHandler } from '#api/middlewares/error.middleware.js';
import { notFoundHandler } from '#api/middlewares/notFound.middleware.js';
import { logger } from '#utils/logger.js';
import { healthCheck } from '#utils/healthCheck.js';

/**
 * Initialize the Express application with all necessary configurations
 * @param {express.Application} app - Express application instance
 */
export const initializeApp = async (app) => {
  try {
    logger.info('🔧 Initializing Auth Service...');

    // Trust proxy for deployment behind reverse proxy (nginx, load balancers)
    app.set('trust proxy', 1);

    // Disable x-powered-by header for security
    app.disable('x-powered-by');

    // Setup global middlewares (CORS, body-parser, security, etc.)
    setupMiddlewares(app);
    logger.info('✅ Middlewares initialized');

    // Health check endpoint (before routes for availability monitoring)
    app.get('/health', healthCheck);
    app.get('/ping', (req, res) => res.status(200).json({ message: 'pong' }));

    // Setup API routes
    setupRoutes(app);
    logger.info('✅ Routes initialized');

    // 404 handler for undefined routes
    app.use(notFoundHandler);

    // Global error handler (must be last)
    app.use(errorHandler);
    logger.info('✅ Error handlers initialized');

    logger.info('✅ Auth Service initialization complete');
  } catch (error) {
    logger.error('❌ Failed to initialize Auth Service:', error);
    throw error;
  }
};
