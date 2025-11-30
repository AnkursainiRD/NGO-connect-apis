import { logger } from '#utils/logger.js';
import { appConfig } from '#config/app.config.js';

/**
 * Global error handler middleware
 * Catches all errors and sends appropriate responses
 */
export const errorHandler = (err, req, res, next) => {
  // Log the error
  logger.error('Error occurred:', {
    error: err.message,
    stack: appConfig.env === 'development' ? err.stack : undefined,
    url: req.originalUrl || req.url,
    method: req.method,
    ip: req.ip,
  });

  // Determine status code
  const statusCode = err.statusCode || err.status || 500;

  // Prepare error response
  const errorResponse = {
    success: false,
    error: {
      message: err.message || 'Internal Server Error',
      code: err.code || 'INTERNAL_ERROR',
    },
    timestamp: new Date().toISOString(),
  };

  // Add stack trace in development
  if (appConfig.env === 'development') {
    errorResponse.error.stack = err.stack;
  }

  // Add validation errors if present
  if (err.errors && Array.isArray(err.errors)) {
    errorResponse.error.details = err.errors;
  }

  // Send error response
  res.status(statusCode).json(errorResponse);
};
