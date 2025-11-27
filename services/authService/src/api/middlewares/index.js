import express from 'express';
import { appConfig } from '#config/app.config.js';
import { requestLogger } from '#api/middlewares/requestLogger.middleware.js';
import { corsMiddleware } from '#api/middlewares/cors.middleware.js';
import { securityHeaders } from '#api/middlewares/security.middleware.js';
import { rateLimitMiddleware } from '#api/middlewares/rateLimit.middleware.js';

/**
 * Setup all global middlewares
 * @param {express.Application} app - Express application instance
 */
export const setupMiddlewares = (app) => {
  // Security headers
  app.use(securityHeaders);

  // CORS configuration
  app.use(corsMiddleware);

  // Rate limiting
  app.use(rateLimitMiddleware);

  // Body parser middlewares
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Request logging
  app.use(requestLogger);
};
