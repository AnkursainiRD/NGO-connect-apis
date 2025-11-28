import { User, UserActivityLogs } from '#core/models/index.js';
import { successResponse, errorResponse, createdResponse, conflictResponse, internalErrorResponse, notFoundResponse, badRequestResponse } from '#utils/response.js';
import { generateAndUploadAvatar } from '#utils/localAvatar.js';
import { generateTokens, excludeKeyFromObject, checkTokenExpiry, generateResetPasswordToken, generateOTP } from '#core/helpers/helper.js';
import {setCache, getCache, delCache } from '#core/helpers/redis.helper.js'
import { logger } from '#utils/logger.js';
import { appConfig } from '#config/app.config.js';
import { sendEmail, loadEmailTemplate } from '#core/helpers/email.helper.js';


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
      return internalErrorResponse(res, { message: 'Failed to register user' });
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
      console.log("found user", user);
      if (user==null || !user) {
        console.log("user not found");
        return unauthorizedResponse(res, 'Invalid email');
      }

      const validPassword = await user.comparePassword(password);
      console.log("validPassword", validPassword);
      if(!validPassword){
        return errorResponse(res, { message: 'Invalid password' });
      }

      const { refreshToken, accessToken } = await generateTokens(user.email, user.id, user.tenant_id, "both");
      if(!refreshToken || !accessToken){
        return errorResponse(res, { message: 'Failed to generate tokens' });
      }
      
      const userLastLoginAt = await UserActivityLogs.findOne({ where: { user_id: user.id }, order: [["created_at", "DESC"]], limit: 1 });

      await UserActivityLogs.logActivity({
        user_id: user.id,
        entity_type: 'user',
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
        maxAge: appConfig.accessTokenExpiry, // 60 minutes
      });

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: appConfig.isProduction,
        sameSite: 'strict',
        maxAge: appConfig.refreshTokenExpiry, // 7 days
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
        entity_type: 'user',
        entity_id: user.id,
        action: 'logout',
        description: 'User logged out',
        ip_address: req.ip,
        user_agent: req.get('User-Agent'),
      });
      
      await delCache(`user-${user_id}`);
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
      const refreshToken = req.cookies.refreshToken;

      if(!refreshToken){
        return unauthorizedResponse(res, 'Refresh token not found');
      }
      const user = await User.findOne({ where: { refresh_token: refreshToken } });
      if(!user){
        return unauthorizedResponse(res, 'User not found');
      }
      //Checking refresh token expiry
      const isRefreshTokenExpired = checkTokenExpiry(refreshToken, "refresh");
      let tokenType;
      if(isRefreshTokenExpired){
        tokenType = "both";
      }else{
        tokenType = "access";
      }
      const tokens = generateTokens(user.email, user.id, user.tenant_id, tokenType);
      if(!tokens.accessToken){
        return errorResponse(res, 'Failed to generate tokens');
      }

      res.cookie('accessToken', tokens.accessToken, {
        httpOnly: true,
        secure: appConfig.isProduction,
        sameSite: 'strict',
        maxAge: appConfig.accessTokenExpiry, // 60 minutes
      });

      if(isRefreshTokenExpired){
        user.refresh_token = tokens.refreshToken;
        await user.save();
        res.cookie('refreshToken', tokens.refreshToken, {
          httpOnly: true,
          secure: appConfig.isProduction,
          sameSite: 'strict',
          maxAge: appConfig.refreshTokenExpiry, // 7 days
        });
      }

      return successResponse(res, {
        message: 'Token refresh successful',
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
      const { email } = req.body;
      if(!email){
        return badRequestResponse(res, 'Email is required');
      }
      const user = await User.findOne({ where: { email } });
      if(!user){
        return notFoundResponse(res, 'User not found');
      }
      const { resetPasswordToken } = generateResetPasswordToken(user.email, user.id, user.tenant_id);      


      // Load and render the forgot password template
      const html = await loadEmailTemplate('forgotPasswrod.template', {
          userName: user.name,
          resetLink: `https://yourapp.com/reset-password?token=${resetPasswordToken}`,
          expiryTime: '30 minutes',
          logoUrl: '', // Add your logo URL
          supportLink: 'https://support.ngoconnect.com',
          websiteLink: 'https://ngoconnect.com'
      });
    
      // Send the email
      const emailData = await sendEmail({
          to: user.email,
          subject: 'Reset Your Password - NGO Connect',
          html: html
      });
      user.reset_token = resetPasswordToken;
      user.reset_token_expires_at = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
      await user.save();

      return successResponse(res, {
        message: 'Password forgot email sent successfully',
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
      const { resetPasswordToken, new_password } = req.body;
      if(!resetPasswordToken || !new_password){
        return badRequestResponse(res, 'Token and password are required');
      }
      const user = await User.findOne({ where: { reset_token: resetPasswordToken } });
      if(!user){
        return notFoundResponse(res, 'User not found');
      }
      if(user.reset_token_expiry < new Date(Date.now())){
        return badRequestResponse(res, 'Token has expired');
      }
      user.password_hash = new_password;
      user.reset_token = null;
      user.reset_token_expiry = null;
      await user.save();
      return successResponse(res, {
        message: 'Password reset successfully',
      });
    } catch (error) {
      logger.error('Reset password error:', { error: error.message, stack: error.stack });
      return internalErrorResponse(res, 'Failed to reset password');
    }
  }

  /**
   * Send verify email OTP
   * POST /api/v1/auth/send-verify-email-otp
   */
  sendVerifyEmailOTP = async (req, res) => {
    try {
      const { email } = req.body;
      if(!email){
        return badRequestResponse(res, 'Email is required');
      }
      const user = await User.findOne({ where: { email } });
      if(!user){
        return notFoundResponse(res, 'User not found');
      }
      const userOtp = await getCache(`verify-email-otp-${user.id}:${user.email}`);
      if(userOtp){
        return badRequestResponse(res, 'Email OTP already sent');
      }
      const otp = generateOTP();

      const html = await loadEmailTemplate('sendEmailVerifyOTP.template', {
        userName: user.name,
        otpCode: otp,
        expiryTime: '5 minutes',
        actionContext: 'email verification',
        logoUrl: '', // Add your logo URL
        supportLink: 'https://support.ngoconnect.com',
        websiteLink: 'https://ngoconnect.com'
      });
      
      // Send the email
      const emailData = await sendEmail({
          to: user.email,
          subject: 'Verify Your Email - NGO Connect',
          html: html
      });
      
      // Store OTP in cache
      await setCache(`verify-email-otp-${user.id}:${user.email}`, otp, 300); // 5 minutes
  
      return successResponse(res, {
        message: 'Email OTP sent successfully',
      });
    } catch (error) {
      logger.error('Send verify email OTP error:', { error: error.message, stack: error.stack });
      return internalErrorResponse(res, 'Failed to send verify email OTP');
    }
  }

  /**
   * Verify email address
   * POST /api/v1/auth/verify-email
   */
  verifyEmail = async (req, res) => {
    try {
      const { email, otp } = req.body;
      if(!email){
        return badRequestResponse(res, 'Email is required');
      }
      if(!otp){
        return badRequestResponse(res, 'OTP is required');
      }
      const user = await User.findOne({ where: { email } });
      if(!user){
        return notFoundResponse(res, 'User not found');
      }
      const userOtp = await getCache(`verify-email-otp-${user.id}:${user.email}`);
      if(!userOtp){
        return badRequestResponse(res, 'OTP Expired');
      }

      if(String(userOtp) !== String(otp)){
        return badRequestResponse(res, 'Invalid OTP');
      }
      await delCache(`verify-email-otp-${user.id}:${user.email}`);
      user.email_verified = true;
      await user.save();
      return successResponse(res, {
        message: 'Email verified successfully',
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
      const user_id = req.user.userId;
      const cachedUser = await getCache(`user-${user_id}`);
      if(cachedUser){
        return successResponse(res, {
          message: 'Current user retrieved successfully',
          data: cachedUser,
        });
      }
      const user = await User.findOne({ where: { id: user_id } });
      if(!user){
        return notFoundResponse(res, 'User not found');
      }
      const sanitizedUser = user ? user.toJSON() : null;
      const cleanedData = excludeKeyFromObject(sanitizedUser, ["password", "refresh_token", "reset_token", "reset_token_expires_at"]);
      
      await setCache(`user-${user_id}`, JSON.stringify(cleanedData), 60 * 60 * 24);
      return successResponse(res, {
        message: 'Current user retrieved successfully',
        data: cleanedData,
      });
    } catch (error) {
      logger.error('Get current user error:', { error: error.message, stack: error.stack });
      return internalErrorResponse(res, 'Failed to get current user');
    }
  }
}
