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

// Load environment variables
dotenv.config();

const app = express();
const httpServer = createServer(app)


// ═══════════════════════════════════════════════════════════════════════════
// GRACEFUL SHUTDOWN
// ═══════════════════════════════════════════════════════════════════════════

const gracefulShutdown = (exitCode = 0) => {
  logger.info('🛑 Initiating graceful shutdown...');
  
  httpServer.close(() => {
    logger.info('✅ HTTP server closed');
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
  console.error('💥 Uncaught Exception:', error);
  logger.error('💥 Uncaught Exception:', error);
  gracefulShutdown(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection:', reason);
  logger.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
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
      console.error('💥 HTTP Server Error:', error);
      logger.error('💥 HTTP Server Error:', error);
      process.exit(1);
    });

  } catch (error) {
    console.error('💥 Failed to start server:', error);
    logger.error('💥 Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();
