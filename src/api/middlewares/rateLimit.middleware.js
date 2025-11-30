/**
 * Simple in-memory rate limiting middleware
 * For production, consider using express-rate-limit with Redis
 */

import { appConfig } from '#config/app.config.js';
import { logger } from '#utils/logger.js';

// In-memory store for rate limiting
const rateLimitStore = new Map();

/**
 * Clean up old entries from rate limit store
 */
const cleanupStore = () => {
  const now = Date.now();
  for (const [key, data] of rateLimitStore.entries()) {
    if (now - data.resetTime > appConfig.rateLimit.windowMs) {
      rateLimitStore.delete(key);
    }
  }
};

// Run cleanup every 5 minutes
setInterval(cleanupStore, 5 * 60 * 1000);

/**
 * Rate limiting middleware
 */
export const rateLimitMiddleware = (req, res, next) => {
  try {
    // Get client identifier (IP address)
    const clientId = req.ip || req.connection.remoteAddress;
    const now = Date.now();

    // Get or create rate limit data for this client
    let clientData = rateLimitStore.get(clientId);

    if (!clientData) {
      // First request from this client
      clientData = {
        count: 1,
        resetTime: now + appConfig.rateLimit.windowMs,
      };
      rateLimitStore.set(clientId, clientData);
      return next();
    }

    // Check if window has expired
    if (now > clientData.resetTime) {
      // Reset the counter
      clientData.count = 1;
      clientData.resetTime = now + appConfig.rateLimit.windowMs;
      rateLimitStore.set(clientId, clientData);
      return next();
    }

    // Increment counter
    clientData.count++;

    // Check if limit exceeded
    if (clientData.count > appConfig.rateLimit.maxRequests) {
      const retryAfter = Math.ceil((clientData.resetTime - now) / 1000);

      logger.warn('Rate limit exceeded', {
        clientId,
        count: clientData.count,
        limit: appConfig.rateLimit.maxRequests,
      });

      res.set({
        'Retry-After': retryAfter,
        'X-RateLimit-Limit': appConfig.rateLimit.maxRequests,
        'X-RateLimit-Remaining': 0,
        'X-RateLimit-Reset': new Date(clientData.resetTime).toISOString(),
      });

      return res.status(429).json({
        success: false,
        error: {
          message: 'Too many requests, please try again later',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: retryAfter,
        },
      });
    }

    // Set rate limit headers
    res.set({
      'X-RateLimit-Limit': appConfig.rateLimit.maxRequests,
      'X-RateLimit-Remaining': appConfig.rateLimit.maxRequests - clientData.count,
      'X-RateLimit-Reset': new Date(clientData.resetTime).toISOString(),
    });

    next();
  } catch (error) {
    logger.error('Rate limit middleware error:', { error: error.message });
    // Don't block requests if rate limiting fails
    next();
  }
};
