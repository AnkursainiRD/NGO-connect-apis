/**
 * Test if module aliases are working
 */

console.log('Testing module alias imports...\n');

// Test 1: Try importing with @ alias (esm-module-alias style)
try {
  console.log('Test 1: Trying @config/app.config.js...');
  const { appConfig } = await import('@config/app.config.js');
  console.log('✅ SUCCESS: @config alias works!');
  console.log('   App config loaded:', appConfig.env);
} catch (error) {
  console.log('❌ FAILED: @config alias does not work');
  console.log('   Error:', error.message);
}

console.log('');

// Test 2: Try importing with # alias (Node.js subpath imports)
try {
  console.log('Test 2: Trying #config/app.config.js...');
  const { appConfig } = await import('#config/app.config.js');
  console.log('✅ SUCCESS: #config alias works!');
  console.log('   App config loaded:', appConfig.env);
} catch (error) {
  console.log('❌ FAILED: #config alias does not work');
  console.log('   Error:', error.message);
}

console.log('');

// Test 3: Try relative import
try {
  console.log('Test 3: Trying relative path ../src/config/app.config.js...');
  const { appConfig } = await import('../src/config/app.config.js');
  console.log('✅ SUCCESS: Relative path works!');
  console.log('   App config loaded:', appConfig.env);
} catch (error) {
  console.log('❌ FAILED: Relative path does not work');
  console.log('   Error:', error.message);
}

console.log('\n' + '='.repeat(60));
console.log('Test Complete!');
console.log('='.repeat(60));
