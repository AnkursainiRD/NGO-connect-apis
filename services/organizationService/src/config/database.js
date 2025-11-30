/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Database Configuration
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Sequelize configuration for MySQL database connection.
 * 
 * @module config/database
 */

import { Sequelize } from 'sequelize';
import { appConfig } from '#config/app.config.js';
import { logger } from '#utils/logger.js';

/**
 * Sequelize instance for database connection
 * @type {Sequelize}
 */
const sequelize = new Sequelize(
  appConfig.database.name,
  appConfig.database.user,
  appConfig.database.password,
  {
    host: appConfig.database.host,
    port: appConfig.database.port,
    dialect: 'mysql',
    logging: (msg) => logger.debug(msg), // Use our logger for SQL queries
    pool: {
      max: appConfig.database.connectionLimit,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    define: {
      timestamps: true, // Add createdAt and updatedAt timestamps
      underscored: true, // Use snake_case for database columns
      paranoid: true, // Soft deletes (deletedAt)
    },
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false // Required for TiDB Cloud
      }
    }
  }
);

/**
 * Test database connection
 * @returns {Promise<void>}
 */
export const testDatabaseConnection = async () => {
  try {
    await sequelize.authenticate();
    logger.info('✅ Database connection has been established successfully.');
  } catch (error) {
    logger.error('❌ Unable to connect to the database:', error);
    throw error;
  }
};

/**
 * Sync database models
 * @param {boolean} force - Force sync (drop tables) - use with caution!
 * @returns {Promise<void>}
 */
export const syncDatabase = async (force = false) => {
  try {
    await sequelize.sync({ force, alter: appConfig.env === 'development' });
    logger.info(`✅ Database synchronized${force ? ' (force)' : ''}.`);
  } catch (error) {
    logger.error('❌ Failed to sync database:', error);
    throw error;
  }
};

/**
 * Close database connection
 * @returns {Promise<void>}
 */
export const closeDatabaseConnection = async () => {
  try {
    await sequelize.close();
    logger.info('✅ Database connection closed.');
  } catch (error) {
    logger.error('❌ Failed to close database connection:', error);
  }
};

export default sequelize;
