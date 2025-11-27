import {
  generateAvatarUploadUrl,
  generateDocumentUploadUrl,
  generateNGOImageUploadUrl,
  validateCloudinaryUrl
} from '#utils/upload.js';
import { successResponse, errorResponse, internalErrorResponse } from '#utils/response.js';
import { User } from '#core/models/index.js';
import { logger } from '#utils/logger.js';

export default class UploadController {

  /**
   * Get signed upload URL for avatar
   * POST /api/v1/upload/avatar-url
   */
  getAvatarUploadUrl = async (req, res) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return errorResponse(res, {
          message: 'User ID is required',
          code: 'USER_ID_REQUIRED',
          statusCode: 400,
        });
      }

      // TODO: Add authentication middleware to verify user
      // const authenticatedUserId = req.user.id;
      // if (userId !== authenticatedUserId) {
      //   return forbiddenResponse(res, 'Cannot upload avatar for another user');
      // }

      const uploadParams = generateAvatarUploadUrl(userId);

      return successResponse(res, {
        data: { upload: uploadParams },
        message: 'Signed upload URL generated successfully',
      });

    } catch (error) {
      logger.error('Get avatar upload URL error:', { error: error.message, stack: error.stack });
      return internalErrorResponse(res, 'Failed to generate upload URL');
    }
  }

  /**
   * Get signed upload URL for documents
   * POST /api/v1/upload/document-url
   */
  getDocumentUploadUrl = async (req, res) => {
    try {
      const { userId, documentType } = req.body;
      
      if (!userId) {
        return errorResponse(res, {
          message: 'User ID is required',
          code: 'USER_ID_REQUIRED',
          statusCode: 400,
        });
      }

      const uploadParams = generateDocumentUploadUrl(userId, documentType);

      return successResponse(res, {
        data: { upload: uploadParams },
        message: 'Signed upload URL generated successfully',
      });

    } catch (error) {
      logger.error('Get document upload URL error:', { error: error.message, stack: error.stack });
      return internalErrorResponse(res, 'Failed to generate upload URL');
    }
  }

  /**
   * Get signed upload URL for NGO images
   * POST /api/v1/upload/ngo-image-url
   */
  getNGOImageUploadUrl = async (req, res) => {
    try {
      const { ngoId, imageType } = req.body;
      
      if (!ngoId) {
        return errorResponse(res, {
          message: 'NGO ID is required',
          code: 'NGO_ID_REQUIRED',
          statusCode: 400,
        });
      }

      const uploadParams = generateNGOImageUploadUrl(ngoId, imageType);

      return successResponse(res, {
        data: { upload: uploadParams },
        message: 'Signed upload URL generated successfully',
      });

    } catch (error) {
      logger.error('Get NGO image upload URL error:', { error: error.message, stack: error.stack });
      return internalErrorResponse(res, 'Failed to generate upload URL');
    }
  }

  /**
   * Update user avatar URL after successful upload
   * POST /api/v1/upload/update-avatar
   */
  updateAvatarUrl = async (req, res) => {
    try {
      const { userId, avatarUrl } = req.body;
      
      if (!userId || !avatarUrl) {
        return errorResponse(res, {
          message: 'User ID and avatar URL are required',
          code: 'MISSING_PARAMETERS',
          statusCode: 400,
        });
      }

      // Validate that the URL is from our Cloudinary account
      if (!validateCloudinaryUrl(avatarUrl)) {
        return errorResponse(res, {
          message: 'Invalid avatar URL. Must be a valid Cloudinary URL',
          code: 'INVALID_URL',
          statusCode: 400,
        });
      }

      // TODO: Add authentication middleware
      // Verify user owns this profile
      
      // Update user's avatar URL
      const user = await User.findByPk(userId);
      if (!user) {
        return errorResponse(res, {
          message: 'User not found',
          code: 'USER_NOT_FOUND',
          statusCode: 404,
        });
      }

      user.avatar_url = avatarUrl;
      await user.save();

      return successResponse(res, {
        data: { user: user.toJSON() },
        message: 'Avatar updated successfully',
      });

    } catch (error) {
      logger.error('Update avatar URL error:', { error: error.message, stack: error.stack });
      return internalErrorResponse(res, 'Failed to update avatar');
    }
  }
}
