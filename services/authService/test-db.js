import sequelize, { testDatabaseConnection } from './src/config/database.js';

console.log('Testing database connection...');

try {
  await testDatabaseConnection();
  console.log('✅ Connection successful!');
  process.exit(0);
} catch (error) {
  console.error('❌ Connection failed:', error);
  process.exit(1);
}
