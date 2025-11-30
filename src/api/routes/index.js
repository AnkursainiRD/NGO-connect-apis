import { Router } from 'express';
import { authRoutes } from '#api/routes/auth.routes.js';
import { uploadRoutes } from '#api/routes/upload.routes.js';

/**
 * Setup all API routes
 * @param {express.Application} app - Express application instance
 */
export const setupRoutes = (app) => {
  const router = Router();

  // API version prefix
  const API_VERSION = '/api/v1';

  // Mount auth routes
  router.use('/auth', authRoutes);

  // Mount upload routes
  router.use('/upload', uploadRoutes);

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
