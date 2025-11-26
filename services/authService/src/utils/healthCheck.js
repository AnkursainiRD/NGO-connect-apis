import { appConfig } from '#config/app.config.js';

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

  // Determine overall health
  const isHealthy = Object.values(healthStatus.checks).every(
    (check) => check.status === 'healthy'
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
    // TODO: Implement actual database ping
    // const result = await db.ping();
    return {
      status: 'healthy',
      message: 'Database connection is healthy',
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: error.message,
    };
  }
};

/**
 * Check Redis connectivity
 */
const checkRedis = async () => {
  try {
    // TODO: Implement actual Redis ping
    // const result = await redis.ping();
    return {
      status: 'healthy',
      message: 'Redis connection is healthy',
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: error.message,
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
