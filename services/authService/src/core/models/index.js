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

import sequelize, { 
  testDatabaseConnection, 
  syncDatabase, 
  closeDatabaseConnection 
} from '#config/database.js';
import User from './User.model.js';
// Import other models here as you create them
// import RefreshToken from './RefreshToken.model.js';
// import PasswordResetToken from './PasswordResetToken.model.js';

/**
 * Define model associations here
 * Example:
 * User.hasMany(RefreshToken, { foreignKey: 'user_id', as: 'refreshTokens' });
 * RefreshToken.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
 */

// Model associations can be defined here
const setupAssociations = () => {
  // Example:
  // User.hasMany(RefreshToken, { 
  //   foreignKey: 'user_id', 
  //   as: 'refreshTokens',
  //   onDelete: 'CASCADE'
  // });
  
  // RefreshToken.belongsTo(User, { 
  //   foreignKey: 'user_id', 
  //   as: 'user' 
  // });
};

// Initialize associations
setupAssociations();

/**
 * Export all models and database utilities
 */
export {
  // Database instance
  sequelize,
  
  // Database utilities
  testDatabaseConnection,
  syncDatabase,
  closeDatabaseConnection,
  
  // Models
  User,
  // Add other models here as you create them
  // RefreshToken,
  // PasswordResetToken,
};

/**
 * Default export for convenience
 */
export default {
  sequelize,
  testDatabaseConnection,
  syncDatabase,
  closeDatabaseConnection,
  User,
  // Add other models here
};
