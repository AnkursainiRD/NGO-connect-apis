import { User, UserActivityLogs } from '#core/models/index.js';
import { successResponse, errorResponse, createdResponse, conflictResponse, internalErrorResponse, notFoundResponse } from '#utils/response.js';
import { generateAndUploadAvatar } from '#utils/localAvatar.js';
import { generateTokens, excludeKeyFromObject } from '#core/helpers/helper.js';
import { logger } from '#utils/logger.js';
import { appConfig } from '#config/app.config.js';

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
      const { email, password } = req.body;

      const user = await User.findOne({ where: { email } });
      if(!user){
        return notFoundResponse(res, 'User not found');
      }

      const validPassword = await user.comparePassword(password);
      console.log(user);
      if(!validPassword){
        return errorResponse(res, 'Invalid password');
      }

      const { refreshToken, accessToken } = await generateTokens(user.email, user.id, user.tenant_id, "both");
      if(!refreshToken || !accessToken){
        return errorResponse(res, 'Failed to generate tokens');
      }
      
      const userLastLoginAt = await UserActivityLogs.findOne({ where: { user_id: user.id }, order: [["created_at", "DESC"]], limit: 1 });

      await UserActivityLogs.logActivity({
        user_id: user.id,
        entity_type: 'login',
        entity_id: user.id,
        action: 'login',
        description: 'User logged in',
        ip_address: req.ip,
        user_agent: req.get('User-Agent'),
      });


      user.refresh_token = refreshToken;
      user.last_login_at = userLastLoginAt ? userLastLoginAt.created_at : null;
      await user.save();
      
      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: appConfig.isProduction,
        sameSite: 'strict',
        maxAge: 60 * 60 * 1000, // 60 minutes
      });
      return successResponse(res, {
        data: { user: excludeKeyFromObject(user.toJSON(), ['password_hash', 'refresh_token']) },
        message: 'Login successful',
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
      const user_id = req.user.userId;
      if(!user_id){
        return notFoundResponse(res, 'User not found');
      }
      
      const user = await User.findOne({ where: { id: user_id } });
      if(!user){
        return notFoundResponse(res, 'User not found');
      }
      user.refresh_token = null;
      await user.save();
      
      await UserActivityLogs.logActivity({
        user_id: user.id,
        entity_type: 'logout',
        entity_id: user.id,
        action: 'logout',
        description: 'User logged out',
        ip_address: req.ip,
        user_agent: req.get('User-Agent'),
      });
      
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');
      return successResponse(res, {
        message: 'Logout successful',
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
