import { v2 as cloudinary } from 'cloudinary';
import { appConfig } from '#config/app.config.js';
import { logger } from '#utils/logger.js';

/**
 * Cloudinary Configuration
 * Configures Cloudinary SDK for media uploads
 */

cloudinary.config({
  cloud_name: appConfig.cloudinary.cloudName,
  api_key: appConfig.cloudinary.apiKey,
  api_secret: appConfig.cloudinary.apiSecret,
  secure: true, // Use HTTPS
});

/**
 * Validate Cloudinary configuration
 */
export const validateCloudinaryConfig = () => {
  const { cloudName, apiKey, apiSecret } = appConfig.cloudinary;
  
  if (!cloudName || !apiKey || !apiSecret) {
    logger.warn('⚠️ Cloudinary credentials not configured. Upload functionality will be limited.');
    return false;
  }
  
  logger.info('✅ Cloudinary configured successfully');
  return true;
};

// Validate on import (non-blocking)
validateCloudinaryConfig();

export default cloudinary;
