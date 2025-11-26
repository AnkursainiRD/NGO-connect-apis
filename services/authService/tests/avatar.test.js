/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Avatar Generation Test
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Test file to generate and verify avatar URLs
 * Run with: node tests/avatar.test.js
 */

import { 
  generateAvatarUrl, 
  getInitials, 
  generateRoleBasedAvatar,
  generateThemedAvatar 
} from '../src/utils/avatar.js';

console.log('🎨 Avatar Generation Test\n');
console.log('═'.repeat(60));

// Test 1: Basic Avatar Generation
console.log('\n✅ Test 1: Basic Avatar Generation');
console.log('─'.repeat(60));
const avatar1 = generateAvatarUrl('Ankur Saini');
console.log('Name: Ankur Saini');
console.log('Avatar URL:', avatar1);
console.log('Expected: Should contain "Ankur+Saini" and have random background');

// Test 2: Custom Options
console.log('\n✅ Test 2: Custom Options (Blue Background)');
console.log('─'.repeat(60));
const avatar2 = generateAvatarUrl('John Doe', {
  size: 300,
  background: '2196F3',
  color: 'fff',
  rounded: true,
  bold: true
});
console.log('Name: John Doe');
console.log('Avatar URL:', avatar2);
console.log('Expected: 300px, blue background (2196F3)');

// Test 3: Get Initials
console.log('\n✅ Test 3: Get Initials');
console.log('─'.repeat(60));
const testNames = [
  'Ankur Saini',
  'John Doe',
  'NGO Connect Admin',
  'A',
  'Single Name'
];
testNames.forEach(name => {
  const initials = getInitials(name);
  console.log(`${name.padEnd(25)} → ${initials}`);
});

// Test 4: Role-Based Avatars
console.log('\n✅ Test 4: Role-Based Avatars');
console.log('─'.repeat(60));
const roles = ['donor', 'volunteer', 'ngo_admin', 'super_admin'];
roles.forEach(role => {
  const avatar = generateRoleBasedAvatar('Test User', role);
  console.log(`${role.padEnd(15)} → ${avatar}`);
});

// Test 5: Themed Avatars
console.log('\n✅ Test 5: Themed Avatars');
console.log('─'.repeat(60));
const themes = ['default', 'primary', 'success', 'danger', 'warning', 'info'];
themes.forEach(theme => {
  const avatar = generateThemedAvatar('Theme Test', theme);
  console.log(`${theme.padEnd(10)} → ${avatar}`);
});

// Test 6: Edge Cases
console.log('\n✅ Test 6: Edge Cases');
console.log('─'.repeat(60));
try {
  generateAvatarUrl('');
  console.log('❌ FAILED: Should throw error for empty name');
} catch (error) {
  console.log('✓ Correctly threw error for empty name:', error.message);
}

try {
  generateAvatarUrl(null);
  console.log('❌ FAILED: Should throw error for null name');
} catch (error) {
  console.log('✓ Correctly threw error for null name:', error.message);
}

// Test 7: URL Validity
console.log('\n✅ Test 7: URL Validity Check');
console.log('─'.repeat(60));
const testUrl = generateAvatarUrl('Test User');
const isValid = testUrl.startsWith('https://ui-avatars.com/api/');
console.log(`Generated URL: ${testUrl}`);
console.log(`Is Valid: ${isValid ? '✓ YES' : '❌ NO'}`);

// Test 8: Different Name Formats
console.log('\n✅ Test 8: Different Name Formats');
console.log('─'.repeat(60));
const nameFormats = [
  'Ankur Saini',           // Normal
  'ankur saini',           // Lowercase
  'ANKUR SAINI',           // Uppercase
  '  Ankur  Saini  ',      // Extra spaces
  'Ankur',                 // Single name
  'A B C D E',             // Multiple words
];
nameFormats.forEach(name => {
  try {
    const avatar = generateAvatarUrl(name);
    const initials = getInitials(name);
    console.log(`"${name}" → Initials: ${initials} ✓`);
  } catch (error) {
    console.log(`"${name}" → ERROR: ${error.message} ❌`);
  }
});

// Summary
console.log('\n' + '═'.repeat(60));
console.log('🎉 All Tests Completed!');
console.log('═'.repeat(60));
console.log('\n📝 Sample Avatar URLs Generated:');
console.log('1. Random Color:', generateAvatarUrl('Ankur Saini'));
console.log('2. Green (Donor):', generateRoleBasedAvatar('Donor User', 'donor'));
console.log('3. Blue (Volunteer):', generateRoleBasedAvatar('Volunteer User', 'volunteer'));
console.log('4. Primary Theme:', generateThemedAvatar('Admin User', 'primary'));
console.log('\n✨ You can open these URLs in a browser to see the avatars!\n');
