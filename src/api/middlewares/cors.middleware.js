import { appConfig } from '#config/app.config.js';

/**
 * CORS middleware
 * Handles Cross-Origin Resource Sharing
 */
export const corsMiddleware = (req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = appConfig.cors.origin;

  // Check if origin is allowed
  if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }

  // Allow credentials
  if (appConfig.cors.credentials) {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  // Allowed headers
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Org-ID'
  );

  // Allowed methods
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, PATCH, DELETE, OPTIONS'
  );

  // Max age for preflight
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(appConfig.cors.optionsSuccessStatus).end();
  }

  next();
};
