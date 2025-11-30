import { logger } from '#utils/logger.js';

/**
 * Graceful shutdown handler
 * Ensures all connections are closed properly before exiting
 */
export const gracefulShutdown = (server, exitCode = 0) => {
  logger.info('🛑 Initiating graceful shutdown...');

  // Stop accepting new connections
  server.close(() => {
    logger.info('✅ HTTP server closed');

    // Close database connections (if any)
    // await closeDatabase();

    // Close Redis connections (if any)
    // await closeRedis();

    // Close any other resources
    logger.info('✅ All resources cleaned up');
    
    logger.info('👋 Shutdown complete. Exiting...');
    process.exit(exitCode);
  });

  // Force shutdown after timeout (30 seconds)
  setTimeout(() => {
    logger.error('⚠️ Forced shutdown due to timeout');
    process.exit(1);
  }, 30000);
};
