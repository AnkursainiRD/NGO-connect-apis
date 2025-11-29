/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Authentication Middleware
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Verifies JWT tokens and protects routes that require authentication
 * Extracts tokens from cookies or Authorization header
 * 
 * @module middlewares/auth
 */

import jwt from 'jsonwebtoken';
import { appConfig } from '#config/app.config.js';
import { unauthorizedResponse, forbiddenResponse } from '#utils/response.js';
import { logger } from '#utils/logger.js';

/**
 * Authentication middleware
 * Verifies JWT access token and attaches user info to request
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const authenticate = async (req, res, next) => {
  try {
    // Extract token from cookies or Authorization header
    let token = null;

    // 1. Check cookies first (more secure)
    if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }
    console.log(req.cookies);
    // 2. Check Authorization header (Bearer token)
    if (!token && req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7); // Remove 'Bearer ' prefix
      }
    }

    // No token found
    if (!token) {
      logger.warn('Authentication failed: No token provided', {
        ip: req.ip,
        url: req.url,
        method: req.method,
      });
      return unauthorizedResponse(res, 'Access token is required');
    }

    // Verify token
    try {
      const decoded = jwt.verify(token, appConfig.jwt.accessTokenSecret);

      // Attach user info to request
      req.user = {
        userId: decoded.userId,
        email: decoded.email,
        tenantId: decoded.tenantId,
      };

      // Log successful authentication
      logger.debug('User authenticated successfully', {
        userId: decoded.userId,
        email: decoded.email,
      });

      next();
    } catch (jwtError) {
      // Handle specific JWT errors
      if (jwtError.name === 'TokenExpiredError') {
        logger.warn('Authentication failed: Token expired', {
          ip: req.ip,
          url: req.url,
        });
        return unauthorizedResponse(res, 'Access token has expired');
      }

      if (jwtError.name === 'JsonWebTokenError') {
        logger.warn('Authentication failed: Invalid token', {
          ip: req.ip,
          url: req.url,
          error: jwtError.message,
        });
        return unauthorizedResponse(res, 'Invalid access token');
      }

      // Other JWT errors
      logger.error('JWT verification error:', {
        error: jwtError.message,
        stack: jwtError.stack,
      });
      return unauthorizedResponse(res, 'Token verification failed');
    }
  } catch (error) {
    logger.error('Authentication middleware error:', {
      error: error.message,
      stack: error.stack,
    });
    return forbiddenResponse(res, 'Authentication failed');
  }
};

/**
 * Optional authentication middleware
 * Similar to authenticate but doesn't fail if no token is provided
 * Useful for routes that work differently for authenticated vs unauthenticated users
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const optionalAuthenticate = async (req, res, next) => {
  try {
    // Extract token
    let token = null;

    if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token && req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    // If no token, just continue without authentication
    if (!token) {
      req.user = null;
      return next();
    }

    // Try to verify token
    try {
      const decoded = jwt.verify(token, appConfig.jwt.accessTokenSecret);
      req.user = {
        userId: decoded.userId,
        email: decoded.email,
        tenantId: decoded.tenantId,
      };
    } catch (jwtError) {
      // If token is invalid, just set user to null and continue
      req.user = null;
    }

    next();
  } catch (error) {
    logger.error('Optional authentication middleware error:', {
      error: error.message,
      stack: error.stack,
    });
    req.user = null;
    next();
  }
};

/**
 * Role-based authorization middleware
 * Checks if the authenticated user has the required role
 * Must be used after authenticate middleware
 * 
 * @param {Array<string>} allowedRoles - Array of allowed roles
 * @returns {Function} Middleware function
 */
export const authorize = (allowedRoles = []) => {
  return async (req, res, next) => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        return unauthorizedResponse(res, 'Authentication required');
      }

      // If no roles specified, just check authentication
      if (!allowedRoles || allowedRoles.length === 0) {
        return next();
      }

      // Check if user has the required role
      // Note: You'll need to add role to the JWT payload or fetch from database
      const userRole = req.user.role; // You need to add this to your JWT

      if (!userRole || !allowedRoles.includes(userRole)) {
        logger.warn('Authorization failed: Insufficient permissions', {
          userId: req.user.userId,
          requiredRoles: allowedRoles,
          userRole: userRole,
        });
        return forbiddenResponse(res, 'Insufficient permissions');
      }

      next();
    } catch (error) {
      logger.error('Authorization middleware error:', {
        error: error.message,
        stack: error.stack,
      });
      return forbiddenResponse(res, 'Authorization failed');
    }
  };
};

export const oAuth2Token = (req, res, next) => {
  try {
    
    let token = null;
    if (req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }
    req.user = {
      oAuthToken: token,
    };
    next();
  } catch (error) {
    logger.error('OAuth token verification error:', {
      error: error.message,
      stack: error.stack,
    });
    return forbiddenResponse(res, 'OAuth token verification failed');
  }
}

export default {
  authenticate,
  optionalAuthenticate,
  authorize,
  oAuth2Token
};
