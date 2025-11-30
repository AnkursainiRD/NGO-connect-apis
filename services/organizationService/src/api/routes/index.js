import { Router } from 'express';
import { organizationRoutes } from '#api/routes/organization.routes.js';

/**
 * Setup all API routes
 * @param {express.Application} app - Express application instance
 */
export const setupRoutes = (app) => {
  const router = Router();

  // API version prefix
  const API_VERSION = '/api/v1';

  // Mount organization routes
  router.use('/organization', organizationRoutes);

  // Mount the router with API version prefix
  app.use(API_VERSION, router);

  // Root endpoint
  app.get('/', (req, res) => {
    res.status(200).json({
      service: 'NGOConnect Auth Service',
      version: '1.0.0',
      status: 'running',
      timestamp: new Date().toISOString(),
      endpoints: {
        health: '/health',
        ping: '/ping',
        api: API_VERSION,
      },
    });
  });
};
