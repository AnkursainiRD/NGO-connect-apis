/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Models Index
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Central export point for all Sequelize models.
 * Handles model initialization and associations.
 * 
 * @module models
 */

import sequelize from '#config/database.js';
import Organization from './Organization.model.js';
import User from './User.model.js';
import Role from './Role.model.js';
import Permission from './Permission.model.js';
import RolePermission from './RolePermission.model.js';
// Import other models here as you create them
// import OrganizationMember from './OrganizationMember.model.js';
// import Project from './Project.model.js';

/**
 * Define model associations here
 */
const setupAssociations = () => {
  // Collect all models
  const models = {
    Organization,
    User,
    Role,
    Permission,
    RolePermission,
    // Add other models here
  };

  // Call associate method on each model if it exists
  Object.values(models).forEach(model => {
    if (model.associate) {
      model.associate(models);
    }
  });
};

// Initialize associations
setupAssociations();

/**
 * Database utilities
 */

/**
 * Test database connection
 * @returns {Promise<boolean>}
 */
export const testDatabaseConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    return true;
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    return false;
  }
};

/**
 * Sync database (create tables)
 * @param {Object} options - Sequelize sync options
 * @returns {Promise<void>}
 */
export const syncDatabase = async (options = {}) => {
  try {
    await sequelize.sync(options);
    console.log('✅ Database synchronized successfully.');
  } catch (error) {
    console.error('❌ Error synchronizing database:', error);
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
    console.log('✅ Database connection closed.');
  } catch (error) {
    console.error('❌ Error closing database connection:', error);
    throw error;
  }
};

/**
 * Export all models and database utilities
 */
export {
  // Database instance
  sequelize,
  
  // Models
  Organization,
  User,
  Role,
  Permission,
  RolePermission,
  // Add other models here as you create them
  // OrganizationMember,
  // Project,
};

/**
 * Default export for convenience
 */
export default {
  sequelize,
  testDatabaseConnection,
  syncDatabase,
  closeDatabaseConnection,
  Organization,
  User,
  Role,
  Permission,
  RolePermission,
  // Add other models here
};
