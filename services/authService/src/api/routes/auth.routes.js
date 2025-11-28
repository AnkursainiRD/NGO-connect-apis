import { Router } from 'express';
import AuthController from '#api/controllers/authController.js';
import { registerValidator, loginValidator } from '#api/validators/auth.validator.js';
import { authenticate } from '#api/middlewares/auth.middleware.js';

const router = Router();
const authController = new AuthController();

/**
 * Auth routes
 * All authentication-related endpoints
 */

// POST /api/v1/auth/register - Register new user
router.post('/register', registerValidator, authController.register);

// POST /api/v1/auth/login - Login user
router.post('/login', loginValidator, authController.login);

// POST /api/v1/auth/logout - Logout user
router.post('/logout', authenticate, authController.logout);

// POST /api/v1/auth/refresh - Refresh access token
router.post('/refresh', authController.refreshToken);

// POST /api/v1/auth/forgot-password - Request password reset
router.post('/forgot-password', authController.forgotPassword);

// POST /api/v1/auth/reset-password - Reset password with token
router.post('/reset-password', authController.resetPassword);

// POST /api/v1/auth/send-verify-email-otp - Send verify email OTP
router.post('/send-verify-email-otp', authController.sendVerifyEmailOTP);

// POST /api/v1/auth/verify-email - Verify email address
router.post('/verify-email', authController.verifyEmail);

// GET /api/v1/auth/get-current-user - Get current user info (protected)
router.get('/get-current-user', authenticate, authController.getCurrentUser);

export { router as authRoutes };
