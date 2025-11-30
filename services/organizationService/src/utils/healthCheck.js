import { appConfig } from '#config/app.config.js';
import sequelize from '#config/database.js';

/**
 * Health check endpoint handler
 * Returns the health status of the service and its dependencies
 */
export const healthCheck = async (req, res) => {
  const healthStatus = {
    service: appConfig.serviceName,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: appConfig.env,
    version: process.env.npm_package_version || '1.0.0',
    checks: {
      database: await checkDatabase(),
      redis: await checkRedis(),
      memory: checkMemory(),
    },
  };

  // Determine overall health (ignore not_configured services)
  const isHealthy = Object.values(healthStatus.checks).every(
    (check) => check.status === 'healthy' || check.status === 'not_configured' || check.status === 'warning'
  );

  healthStatus.status = isHealthy ? 'healthy' : 'degraded';

  const statusCode = isHealthy ? 200 : 503;
  res.status(statusCode).json(healthStatus);
};

/**
 * Check database connectivity
 */
const checkDatabase = async () => {
  try {
    // Ping database by running a simple query
    await sequelize.authenticate();

    return {
      status: 'healthy',
      message: 'Database connection is healthy',
      responseTime: 'OK',
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: error.message || 'Database connection failed',
    };
  }
};

/**
 * Check Redis connectivity
 */
const checkRedis = async () => {
  try {
    // Redis is optional - if not configured, mark as not applicable
    if (!appConfig.redis.host || appConfig.redis.host === 'localhost') {
      return {
        status: 'not_configured',
        message: 'Redis not configured (optional)',
      };
    }

    // If Redis client is available in the future, ping it here
    // For now, mark as not implemented
    return {
      status: 'not_configured',
      message: 'Redis health check not implemented yet',
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: error.message || 'Redis connection failed',
    };
  }
};

/**
 * Check memory usage
 */
const checkMemory = () => {
  const memoryUsage = process.memoryUsage();
  const totalMemoryMB = Math.round(memoryUsage.heapTotal / 1024 / 1024);
  const usedMemoryMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
  const memoryUsagePercent = (usedMemoryMB / totalMemoryMB) * 100;

  return {
    status: memoryUsagePercent < 90 ? 'healthy' : 'warning',
    used: `${usedMemoryMB}MB`,
    total: `${totalMemoryMB}MB`,
    percentage: `${memoryUsagePercent.toFixed(2)}%`,
  };
};
