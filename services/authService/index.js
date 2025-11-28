/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Auth Service - Entry Point
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Production-ready authentication microservice for NGOConnect platform.
 * 
 * @module index
 * @version 1.0.0
 * @author Ankur Saini & Anshul
 */

import express from 'express';
import dotenv from 'dotenv';
import { createServer} from 'http';
import { initializeApp } from './src/app.js';
import { logger } from '#utils/logger.js';
import { appConfig } from '#config/app.config.js';
import { testDatabaseConnection, closeDatabaseConnection } from '#config/database.js';
import { connectRedis, disconnectRedis } from '#config/redis.js';

// Load environment variables (suppress logs)
dotenv.config({ quiet: true });

const app = express();
const httpServer = createServer(app)


// ═══════════════════════════════════════════════════════════════════════════
// GRACEFUL SHUTDOWN
// ═══════════════════════════════════════════════════════════════════════════

const gracefulShutdown = async (exitCode = 0) => {
  logger.info('🛑 Initiating graceful shutdown...');

  httpServer.close(async () => {
    logger.info('✅ HTTP server closed');

    // Close database and Redis connections
    await closeDatabaseConnection();
    await disconnectRedis();

    logger.info('👋 Shutdown complete. Exiting...');
    process.exit(exitCode);
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    logger.error('⚠️ Forced shutdown due to timeout');
    process.exit(1);
  }, 30000);
};

// ═══════════════════════════════════════════════════════════════════════════
// PROCESS ERROR HANDLERS
// ═══════════════════════════════════════════════════════════════════════════

process.on('uncaughtException', (error) => {
  logger.error('💥 Uncaught Exception:', { error: error.message, stack: error.stack });
  gracefulShutdown(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('💥 Unhandled Rejection:', { reason, promise });
  gracefulShutdown(1);
});

process.on('SIGTERM', () => {
  logger.info('📨 SIGTERM signal received');
  gracefulShutdown(0);
});

process.on('SIGINT', () => {
  logger.info('📨 SIGINT signal received');
  gracefulShutdown(0);
});

// ═══════════════════════════════════════════════════════════════════════════
// APPLICATION INITIALIZATION & SERVER START
// ═══════════════════════════════════════════════════════════════════════════

const startServer = async () => {
  try {
    logger.info('🚀 Starting Auth Service...');
    logger.info(`📍 Environment: ${appConfig.env}`);
    logger.info(`📍 Node Version: ${process.version}`);

    // Test database connection before starting
    await testDatabaseConnection();

    // Connect to Redis (optional - service continues without it)
    await connectRedis();

    // Initialize application (middlewares, routes, error handlers)
    await initializeApp(app);

    // Start HTTP server
    httpServer.listen(appConfig.port, appConfig.host, () => {
      logger.info('═'.repeat(60));
      logger.info('🎉 Auth Service is running!');
      logger.info(`📍 URL: http://${appConfig.host}:${appConfig.port}`);
      logger.info(`📍 Health: http://${appConfig.host}:${appConfig.port}/health`);
      logger.info(`📍 API: http://${appConfig.host}:${appConfig.port}/api/v1`);
      logger.info('═'.repeat(60));
    });

    httpServer.on('error', (error) => {
      logger.error('💥 HTTP Server Error:', { error: error.message, stack: error.stack });
      process.exit(1);
    });

  } catch (error) {
    logger.error('💥 Failed to start server:', { error: error.message, stack: error.stack });
    process.exit(1);
  }
};

// Start the server
startServer();
