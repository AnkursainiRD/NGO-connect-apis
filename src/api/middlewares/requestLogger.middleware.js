import { logger } from '#utils/logger.js';

/**
 * Request logging middleware
 * Logs all incoming HTTP requests
 */
export const requestLogger = (req, res, next) => {
  const startTime = Date.now();

  // Log response when it's sent
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.http(req, res, duration);
  });

  next();
};
