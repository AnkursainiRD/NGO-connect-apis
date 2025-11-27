import { User } from '#core/models/index.js';
import { successResponse, errorResponse, createdResponse, conflictResponse, internalErrorResponse } from '#utils/response.js';
import { generateAndUploadAvatar } from '#utils/localAvatar.js';
import { logger } from '#utils/logger.js';

export default class AuthController {

  /**
   * Register a new user
   * POST /api/v1/auth/register
   */
  register = async (req, res) => {
    try {
      const { name, email, password, phone, auth_provider, two_factor_enabled, tenant_id } = req.body;
      
      // Check if user already exists
      const existedUser = await User.findOne({ where: { email } });
      if (existedUser) {
        return conflictResponse(res, 'User with this email already exists');
      }
      
      // Create user first to get user ID
      const newUser = await User.create({
        name,
        email,
        password_hash: password, // Will be hashed by the model hook
        phone,
        avatar_url: null, // Will be updated after avatar upload
        auth_provider: auth_provider || 'local',
        two_factor_enabled: two_factor_enabled || false,
        tenant_id,
        email_verified: false,
        phone_verified: false,
      });

      // Generate avatar locally and upload to Cloudinary
      try {
        const avatarUrl = await generateAndUploadAvatar(newUser.id, name, {
          size: 200,
          rounded: true,
        });
        
        // Update user with Cloudinary avatar URL
        newUser.avatar_url = avatarUrl;
        await newUser.save();
      } catch (avatarError) {
        logger.error('Avatar upload failed, continuing without avatar:', { error: avatarError.message });
        // Continue even if avatar upload fails - user is already created
      }
      
      // Return success response (user.toJSON() removes sensitive fields)
      return createdResponse(res, {
        data: { user: newUser.toJSON() },
        message: 'User registered successfully',
      });
      
    } catch (error) {
      logger.error('Register error:', { error: error.message, stack: error.stack });
      return internalErrorResponse(res, 'Failed to register user');
    }
  }

  /**
   * Login user
   * POST /api/v1/auth/login
   */
  login = async (req, res) => {
    try {
      // TODO: Implement login logic
      return errorResponse(res, {
        message: 'Login endpoint not yet implemented',
        code: 'NOT_IMPLEMENTED',
        statusCode: 501,
      });
    } catch (error) {
      logger.error('Login error:', { error: error.message, stack: error.stack });
      return internalErrorResponse(res, 'Failed to login');
    }
  }

  /**
   * Logout user
   * POST /api/v1/auth/logout
   */
  logout = async (req, res) => {
    try {
      // TODO: Implement logout logic
      return successResponse(res, {
        message: 'Logout endpoint not yet implemented',
      });
    } catch (error) {
      logger.error('Logout error:', { error: error.message, stack: error.stack });
      return internalErrorResponse(res, 'Failed to logout');
    }
  }

  /**
   * Refresh access token
   * POST /api/v1/auth/refresh
   */
  refreshToken = async (req, res) => {
    try {
      // TODO: Implement refresh token logic
      return errorResponse(res, {
        message: 'Refresh token endpoint not yet implemented',
        code: 'NOT_IMPLEMENTED',
        statusCode: 501,
      });
    } catch (error) {
      logger.error('Refresh token error:', { error: error.message, stack: error.stack });
      return internalErrorResponse(res, 'Failed to refresh token');
    }
  }

  /**
   * Request password reset
   * POST /api/v1/auth/forgot-password
   */
  forgotPassword = async (req, res) => {
    try {
      // TODO: Implement forgot password logic
      return successResponse(res, {
        message: 'Forgot password endpoint not yet implemented',
      });
    } catch (error) {
      logger.error('Forgot password error:', { error: error.message, stack: error.stack });
      return internalErrorResponse(res, 'Failed to process password reset request');
    }
  }

  /**
   * Reset password with token
   * POST /api/v1/auth/reset-password
   */
  resetPassword = async (req, res) => {
    try {
      // TODO: Implement reset password logic
      return successResponse(res, {
        message: 'Reset password endpoint not yet implemented',
      });
    } catch (error) {
      logger.error('Reset password error:', { error: error.message, stack: error.stack });
      return internalErrorResponse(res, 'Failed to reset password');
    }
  }

  /**
   * Verify email address
   * POST /api/v1/auth/verify-email
   */
  verifyEmail = async (req, res) => {
    try {
      // TODO: Implement email verification logic
      return successResponse(res, {
        message: 'Email verification endpoint not yet implemented',
      });
    } catch (error) {
      logger.error('Verify email error:', { error: error.message, stack: error.stack });
      return internalErrorResponse(res, 'Failed to verify email');
    }
  }

  /**
   * Get current authenticated user
   * GET /api/v1/auth/me
   */
  getCurrentUser = async (req, res) => {
    try {
      // TODO: Implement get current user logic (requires auth middleware)
      return errorResponse(res, {
        message: 'Get current user endpoint not yet implemented',
        code: 'NOT_IMPLEMENTED',
        statusCode: 501,
      });
    } catch (error) {
      logger.error('Get current user error:', { error: error.message, stack: error.stack });
      return internalErrorResponse(res, 'Failed to get current user');
    }
  }
}
