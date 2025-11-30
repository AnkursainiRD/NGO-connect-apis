/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Upload Utility
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Handles secure media upload using Cloudinary signed URLs
 * Frontend uploads directly to Cloudinary using these signed URLs
 * 
 * @module utils/upload
 */

import cloudinary from '#config/cloudinary.config.js';
import { appConfig } from '#config/app.config.js';
import { logger } from '#utils/logger.js';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * DIRECT BACKEND UPLOAD HELPERS
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * Upload file to Cloudinary (Backend Direct Upload)
 * Simple helper for uploading files from backend to Cloudinary
 * 
 * @param {string} filePath - Local file path to upload
 * @param {string} folder - Cloudinary folder path (e.g., 'ngo-connect/logos')
 * @param {Object} options - Additional Cloudinary upload options
 * @returns {Promise<Object>} - Upload result with secure_url, public_id, etc.
 */
export const uploadToCloudinary = async (filePath, folder, options = {}) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      resource_type: 'auto', // Auto-detect image, video, or raw
      ...options,
    });

    logger.info('File uploaded to Cloudinary:', { 
      public_id: result.public_id,
      secure_url: result.secure_url 
    });

    return result;
  } catch (error) {
    logger.error('Failed to upload to Cloudinary:', error);
    throw new Error('File upload failed');
  }
};

/**
 * Upload organization logo to Cloudinary
 * Preset transformations and folder for organization logos
 * 
 * @param {string} filePath - Local file path
 * @param {string} orgId - Organization ID for folder structure
 * @returns {Promise<Object>} - Upload result
 */
export const uploadOrganizationLogo = async (filePath, orgId) => {
  return uploadToCloudinary(filePath, `ngo-connect/organizations/${orgId}/logo`, {
    transformation: [
      { width: 400, height: 400, crop: 'fit' },
      { quality: 'auto', fetch_format: 'auto' }
    ]
  });
};

/**
 * Upload user avatar to Cloudinary
 * 
 * @param {string} filePath - Local file path
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Upload result
 */
export const uploadUserAvatar = async (filePath, userId) => {
  return uploadToCloudinary(filePath, `ngo-connect/avatars/${userId}`, {
    transformation: [
      { width: 500, height: 500, crop: 'fill', gravity: 'face' },
      { quality: 'auto', fetch_format: 'auto' }
    ]
  });
};

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * FRONTEND SIGNED URL HELPERS (Existing)
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * Generate signed upload URL for Cloudinary
 * Frontend will use this URL to upload files directly to Cloudinary
 * 
 * @param {Object} options - Upload options
 * @param {string} options.folder - Cloudinary folder path
 * @param {string} options.resourceType - Resource type (image, video, raw)
 * @param {string} options.publicId - Optional public ID for the file
 * @param {Object} options.transformation - Optional transformations
 * @param {number} options.maxFileSize - Max file size in bytes
 * @param {Array<string>} options.allowedFormats - Allowed file formats
 * @returns {Object} - Signed upload parameters
 */
export const generateSignedUploadUrl = (options = {}) => {
  try {
    const {
      folder = appConfig.cloudinary.folder,
      resourceType = 'image',
      publicId = null,
      transformation = null,
      maxFileSize = appConfig.cloudinary.maxFileSize,
      allowedFormats = appConfig.cloudinary.allowedFormats,
    } = options;

    // Timestamp for signature (valid for 1 hour)
    const timestamp = Math.round(new Date().getTime() / 1000);
    const expiresAt = timestamp + 3600; // 1 hour from now

    // Upload parameters
    const uploadParams = {
      timestamp,
      folder,
      resource_type: resourceType,
      allowed_formats: allowedFormats.join(','),
    };

    // Add optional parameters
    if (publicId) {
      uploadParams.public_id = publicId;
    }

    // Add transformation if provided
    if (transformation) {
      uploadParams.transformation = transformation;
    }

    // Generate signature
    const signature = cloudinary.utils.api_sign_request(
      uploadParams,
      appConfig.cloudinary.apiSecret
    );

    // Return signed upload parameters
    return {
      url: `https://api.cloudinary.com/v1_1/${appConfig.cloudinary.cloudName}/${resourceType}/upload`,
      params: {
        ...uploadParams,
        signature,
        api_key: appConfig.cloudinary.apiKey,
      },
      cloudName: appConfig.cloudinary.cloudName,
      maxFileSize,
      allowedFormats,
      expiresAt: new Date(expiresAt * 1000).toISOString(),
    };
  } catch (error) {
    logger.error('Failed to generate signed upload URL:', error);
    throw new Error('Failed to generate upload URL');
  }
};

/**
 * Generate signed upload URL for avatar images
 * Includes avatar-specific transformations and limits
 * 
 * @param {string} userId - User ID for unique file naming
 * @returns {Object} - Signed upload parameters
 */
export const generateAvatarUploadUrl = (userId) => {
  return generateSignedUploadUrl({
    folder: `${appConfig.cloudinary.folder}/avatars`,
    publicId: `avatar_${userId}_${Date.now()}`,
    transformation: {
      width: 500,
      height: 500,
      crop: 'fill',
      gravity: 'face',
      quality: 'auto',
      fetch_format: 'auto',
    },
    maxFileSize: 2 * 1024 * 1024, // 2MB for avatars
    allowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
  });
};

/**
 * Generate signed upload URL for document uploads
 * 
 * @param {string} userId - User ID for unique file naming
 * @param {string} documentType - Type of document
 * @returns {Object} - Signed upload parameters
 */
export const generateDocumentUploadUrl = (userId, documentType = 'general') => {
  return generateSignedUploadUrl({
    folder: `${appConfig.cloudinary.folder}/documents/${documentType}`,
    resourceType: 'raw', // For PDFs, docs, etc.
    publicId: `doc_${userId}_${Date.now()}`,
    maxFileSize: 10 * 1024 * 1024, // 10MB for documents
    allowedFormats: ['pdf', 'doc', 'docx', 'xls', 'xlsx'],
  });
};

/**
 * Generate signed upload URL for NGO/project images
 * 
 * @param {string} ngoId - NGO/Organization ID
 * @param {string} imageType - Type of image (logo, banner, gallery)
 * @returns {Object} - Signed upload parameters
 */
export const generateNGOImageUploadUrl = (ngoId, imageType = 'general') => {
  return generateSignedUploadUrl({
    folder: `${appConfig.cloudinary.folder}/ngos/${ngoId}/${imageType}`,
    publicId: `${imageType}_${ngoId}_${Date.now()}`,
    transformation: imageType === 'logo' ? {
      width: 400,
      height: 400,
      crop: 'fit',
      quality: 'auto',
      fetch_format: 'auto',
    } : {
      width: 1920,
      height: 1080,
      crop: 'limit',
      quality: 'auto',
      fetch_format: 'auto',
    },
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
  });
};

/**
 * Validate uploaded file URL from Cloudinary
 * Ensures the URL is from our configured Cloudinary account
 * 
 * @param {string} url - Cloudinary URL to validate
 * @returns {boolean} - Whether URL is valid
 */
export const validateCloudinaryUrl = (url) => {
  if (!url || typeof url !== 'string') {
    return false;
  }

  const cloudName = appConfig.cloudinary.cloudName;
  const validPatterns = [
    `https://res.cloudinary.com/${cloudName}/`,
    `https://cloudinary.com/${cloudName}/`,
  ];

  return validPatterns.some(pattern => url.startsWith(pattern));
};

/**
 * Extract public ID from Cloudinary URL
 * Useful for deletions and transformations
 * 
 * @param {string} url - Cloudinary URL
 * @returns {string|null} - Public ID or null
 */
export const extractPublicIdFromUrl = (url) => {
  if (!validateCloudinaryUrl(url)) {
    return null;
  }

  try {
    const urlParts = url.split('/');
    const uploadIndex = urlParts.indexOf('upload');
    if (uploadIndex === -1) return null;

    // Get everything after 'upload' and version (if present)
    const afterUpload = urlParts.slice(uploadIndex + 1);
    const pathParts = afterUpload.filter(part => !part.startsWith('v'));
    
    // Remove file extension
    const publicId = pathParts.join('/').replace(/\.[^/.]+$/, '');
    return publicId;
  } catch (error) {
    logger.error('Failed to extract public ID from URL:', error);
    return null;
  }
};

/**
 * Delete file from Cloudinary
 * Use when user deletes their avatar or other media
 * 
 * @param {string} publicId - Cloudinary public ID
 * @param {string} resourceType - Resource type (image, video, raw)
 * @returns {Promise<Object>} - Deletion result
 */
export const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
    
    logger.info('File deleted from Cloudinary:', { publicId, result });
    return result;
  } catch (error) {
    logger.error('Failed to delete from Cloudinary:', error);
    throw new Error('Failed to delete file');
  }
};

export default {
  // Direct backend upload helpers
  uploadToCloudinary,
  uploadOrganizationLogo,
  uploadUserAvatar,
  // Frontend signed URL helpers
  generateSignedUploadUrl,
  generateAvatarUploadUrl,
  generateDocumentUploadUrl,
  generateNGOImageUploadUrl,
  // Validation and utilities
  validateCloudinaryUrl,
  extractPublicIdFromUrl,
  deleteFromCloudinary,
};
