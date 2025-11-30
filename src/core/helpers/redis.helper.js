import { getRedisClient } from '#config/redis.js';
import { appConfig } from '#config/app.config.js';
import { logger } from '#utils/logger.js';

/**
 * Redis utility functions
 */

/**
 * Set a key-value pair with optional expiration
 * @param {string} key - Redis key
 * @param {any} value - Value to store (will be JSON stringified)
 * @param {number} expirySeconds - Optional expiry time in seconds
 */
export const setCache = async (key, value, expirySeconds) => {
  try {
    const client = getRedisClient();
    if (!client) return false;

    const prefixedKey = appConfig.redis.keyPrefix + key;
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);

    if (expirySeconds) {
      await client.setEx(prefixedKey, expirySeconds, stringValue);
    } else {
      await client.set(prefixedKey, stringValue);
    }

    return true;
  } catch (error) {
    logger.error('Redis setCache error:', {
      error: error.message,
      key,
    });
    return false;
  }
};

/**
 * Get value from cache
 * @param {string} key - Redis key
 * @param {boolean} parseJson - Whether to parse JSON (default: true)
 */
export const getCache = async (key, parseJson = true) => {
  try {
    const client = getRedisClient();
    if (!client) return null;

    const prefixedKey = appConfig.redis.keyPrefix + key;
    const value = await client.get(prefixedKey);

    if (!value) return null;

    return parseJson ? JSON.parse(value) : value;
  } catch (error) {
    logger.error('Redis getCache error:', {
      error: error.message,
      key,
    });
    return null;
  }
};

/**
 * Delete a key from cache
 * @param {string} key - Redis key
 */
export const delCache = async (key) => {
  try {
    const client = getRedisClient();
    if (!client) return false;

    const prefixedKey = appConfig.redis.keyPrefix + key;
    await client.del(prefixedKey);
    return true;
  } catch (error) {
    logger.error('Redis delCache error:', {
      error: error.message,
      key,
    });
    return false;
  }
};

/**
 * Check if key exists
 * @param {string} key - Redis key
 */
export const existsCache = async (key) => {
  try {
    const client = getRedisClient();
    if (!client) return false;

    const prefixedKey = appConfig.redis.keyPrefix + key;
    const exists = await client.exists(prefixedKey);
    return exists === 1;
  } catch (error) {
    logger.error('Redis existsCache error:', {
      error: error.message,
      key,
    });
    return false;
  }
};

/**
 * Set expiry on existing key
 * @param {string} key - Redis key
 * @param {number} seconds - Expiry time in seconds
 */
export const expireCache = async (key, seconds) => {
  try {
    const client = getRedisClient();
    if (!client) return false;

    const prefixedKey = appConfig.redis.keyPrefix + key;
    await client.expire(prefixedKey, seconds);
    return true;
  } catch (error) {
    logger.error('Redis expireCache error:', {
      error: error.message,
      key,
    });
    return false;
  }
};

/**
 * Flush all keys with the configured prefix
 */
export const flushPrefixedCache = async () => {
  try {
    const client = getRedisClient();
    if (!client) return false;

    const pattern = appConfig.redis.keyPrefix + '*';
    const keys = await client.keys(pattern);

    if (keys.length > 0) {
      await client.del(keys);
    }

    logger.info('✅ Flushed all prefixed cache keys', { count: keys.length });
    return true;
  } catch (error) {
    logger.error('Redis flushPrefixedCache error:', {
      error: error.message,
    });
    return false;
  }
};

export default {
  setCache,
  getCache,
  delCache,
  existsCache,
  expireCache,
  flushPrefixedCache,
};
