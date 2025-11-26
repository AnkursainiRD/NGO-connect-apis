import dotenv from 'dotenv';

dotenv.config();

/**
 * Application configuration
 * Centralized configuration for the Auth Service
 */
export const appConfig = {
  // Server configuration
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3008', 10),
  host: process.env.HOST || '0.0.0.0',
  serviceName: process.env.SERVICE_NAME || 'auth-service',

  // CORS configuration
  cors: {
    origin: process.env.CORS_ORIGIN 
      ? process.env.CORS_ORIGIN.split(',') 
      : ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true,
    optionsSuccessStatus: 200,
  },

  // JWT configuration
  jwt: {
    accessTokenSecret: process.env.JWT_ACCESS_SECRET || 'your-access-token-secret-change-in-production',
    refreshTokenSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-token-secret-change-in-production',
    accessTokenExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
    issuer: process.env.JWT_ISSUER || 'ngoconnect-auth',
    audience: process.env.JWT_AUDIENCE || 'ngoconnect-api',
  },

  // Database configuration (if needed for auth service)
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    name: process.env.DB_NAME || 'ngo_connect_auth',
    connectionLimit: parseInt(process.env.DB_POOL_SIZE || '10', 10),
  },

  // Redis configuration
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || '',
    db: parseInt(process.env.REDIS_DB || '0', 10),
    keyPrefix: process.env.REDIS_KEY_PREFIX || 'auth:',
  },

  // Rate limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },

  // Security
  security: {
    bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10),
    passwordMinLength: parseInt(process.env.PASSWORD_MIN_LENGTH || '8', 10),
    maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5', 10),
    lockoutDuration: parseInt(process.env.LOCKOUT_DURATION || '900000', 10), // 15 minutes
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
  },

  // External services
  services: {
    userServiceUrl: process.env.USER_SERVICE_URL || 'http://localhost:3002',
    notificationServiceUrl: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3003',
  },

  // Cloudinary configuration
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
    uploadPreset: process.env.CLOUDINARY_UPLOAD_PRESET || 'ngo_connect',
    folder: process.env.CLOUDINARY_FOLDER || 'ngo-connect/avatars',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10), // 5MB default
    allowedFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
  },

  // Feature flags
  features: {
    enableRefreshTokenRotation: process.env.ENABLE_REFRESH_TOKEN_ROTATION === 'true',
    enableMFA: process.env.ENABLE_MFA === 'true',
    enableOAuth: process.env.ENABLE_OAUTH === 'true',
  },
};

/**
 * Validate required environment variables
 */
export const validateConfig = () => {
  const requiredEnvVars = [
    'JWT_ACCESS_SECRET',
    'JWT_REFRESH_SECRET',
  ];

  const missingVars = requiredEnvVars.filter(
    (envVar) => !process.env[envVar]
  );

  if (missingVars.length > 0 && appConfig.env === 'production') {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}`
    );
  }
};

// Validate on import
if (appConfig.env === 'production') {
  validateConfig();
}
