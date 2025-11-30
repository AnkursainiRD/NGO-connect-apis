import jwt from 'jsonwebtoken';
import { appConfig } from '#config/app.config.js';
import { logger } from '#utils/logger.js';

/**
 * JWT Utility Functions
 * Handles JWT token generation and verification
 */

/**
 * Generate access token
 * @param {object} payload - Token payload (user data)
 * @returns {string} - JWT access token
 */
export const generateAccessToken = (payload) => {
  try {
    return jwt.sign(
      payload,
      appConfig.jwt.accessTokenSecret,
      {
        expiresIn: appConfig.jwt.accessTokenExpiry,
        issuer: appConfig.jwt.issuer,
        audience: appConfig.jwt.audience,
      }
    );
  } catch (error) {
    logger.error('Error generating access token:', { error: error.message });
    throw new Error('Failed to generate access token');
  }
};

/**
 * Generate refresh token
 * @param {object} payload - Token payload (user data)
 * @returns {string} - JWT refresh token
 */
export const generateRefreshToken = (payload) => {
  try {
    return jwt.sign(
      payload,
      appConfig.jwt.refreshTokenSecret,
      {
        expiresIn: appConfig.jwt.refreshTokenExpiry,
        issuer: appConfig.jwt.issuer,
        audience: appConfig.jwt.audience,
      }
    );
  } catch (error) {
    logger.error('Error generating refresh token:', { error: error.message });
    throw new Error('Failed to generate refresh token');
  }
};

/**
 * Generate both access and refresh tokens
 * @param {object} user - User object
 * @returns {object} - Object containing access and refresh tokens
 */
export const generateTokens = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    name: user.name,
    org_id: user.org_id,
  };

  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
};

/**
 * Verify access token
 * @param {string} token - JWT access token
 * @returns {object} - Decoded token payload
 */
export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, appConfig.jwt.accessTokenSecret, {
      issuer: appConfig.jwt.issuer,
      audience: appConfig.jwt.audience,
    });
  } catch (error) {
    logger.error('Error verifying access token:', { error: error.message });
    throw new Error('Invalid or expired access token');
  }
};

/**
 * Verify refresh token
 * @param {string} token - JWT refresh token
 * @returns {object} - Decoded token payload
 */
export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, appConfig.jwt.refreshTokenSecret, {
      issuer: appConfig.jwt.issuer,
      audience: appConfig.jwt.audience,
    });
  } catch (error) {
    logger.error('Error verifying refresh token:', { error: error.message });
    throw new Error('Invalid or expired refresh token');
  }
};

/**
 * Decode token without verification (useful for debugging)
 * @param {string} token - JWT token
 * @returns {object} - Decoded token payload
 */
export const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    logger.error('Error decoding token:', { error: error.message });
    return null;
  }
};
