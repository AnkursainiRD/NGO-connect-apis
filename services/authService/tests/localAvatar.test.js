/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Local Avatar Generator Test
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Test local avatar generation using Canvas
 * Run with: node tests/localAvatar.test.js
 */

import { 
  generateAvatarImage,
  saveAvatarToFile 
} from '../src/utils/localAvatar.js';
import fs from 'fs';
import path from 'path';

console.log('🎨 Local Avatar Generation Test\n');
console.log('═'.repeat(60));

// Create media directory in utils
const outputDir = './src/utils/media/avatars';
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
  console.log(`✓ Created directory: ${outputDir}\n`);
}

// Test 1: Generate Basic Avatar
console.log('\n✅ Test 1: Generate Basic Avatar');
console.log('─'.repeat(60));
const avatar1 = generateAvatarImage('Ankur Saini');
const filepath1 = path.join(outputDir, 'ankur_saini.png');
fs.writeFileSync(filepath1, avatar1);
console.log(`✓ Generated avatar for "Ankur Saini"`);
console.log(`✓ Saved to: ${filepath1}`);
console.log(`✓ Size: ${(avatar1.length / 1024).toFixed(2)} KB`);

// Test 2: Custom Colors
console.log('\n✅ Test 2: Custom Colors');
console.log('─'.repeat(60));
const avatar2 = generateAvatarImage('John Doe', {
  backgroundColor: '#2196F3', // Blue
  textColor: '#FFFFFF',
  size: 300
});
const filepath2 = path.join(outputDir, 'john_doe_blue.png');
fs.writeFileSync(filepath2, avatar2);
console.log(`✓ Generated blue avatar for "John Doe"`);
console.log(`✓ Saved to: ${filepath2}`);
console.log(`✓ Size: ${(avatar2.length / 1024).toFixed(2)} KB`);

// Test 3: Square Avatar
console.log('\n✅ Test 3: Square Avatar');
console.log('─'.repeat(60));
const avatar3 = generateAvatarImage('Square Test', {
  rounded: false,
  backgroundColor: '#FF9800',
  size: 200
});
const filepath3 = path.join(outputDir, 'square_avatar.png');
fs.writeFileSync(filepath3, avatar3);
console.log(`✓ Generated square avatar`);
console.log(`✓ Saved to: ${filepath3}`);

// Test 4: Multiple Sizes
console.log('\n✅ Test 4: Multiple Sizes');
console.log('─'.repeat(60));
const sizes = [100, 200, 300, 500];
sizes.forEach(size => {
  const avatar = generateAvatarImage('Size Test', { size });
  const filepath = path.join(outputDir, `size_${size}.png`);
  fs.writeFileSync(filepath, avatar);
  console.log(`✓ Generated ${size}x${size}px avatar: ${(avatar.length / 1024).toFixed(2)} KB`);
});

// Test 5: Different Names
console.log('\n✅ Test 5: Different Names & Colors');
console.log('─'.repeat(60));
const testUsers = [
  { name: 'Donor User', color: '#4CAF50' },      // Green
  { name: 'Volunteer', color: '#2196F3' },       // Blue
  { name: 'NGO Admin', color: '#FF9800' },       // Orange
  { name: 'Super Admin', color: '#9C27B0' },     // Purple
];
testUsers.forEach(({ name, color }) => {
  const avatar = generateAvatarImage(name, { backgroundColor: color });
  const filename = name.toLowerCase().replace(/\s+/g, '_');
  const filepath = path.join(outputDir, `${filename}.png`);
  fs.writeFileSync(filepath, avatar);
  console.log(`✓ ${name.padEnd(15)} → ${filepath}`);
});

// Test 6: Save using utility function
console.log('\n✅ Test 6: Using Utility Function');
console.log('─'.repeat(60));
saveAvatarToFile('Utility Test', path.join(outputDir, 'utility_test.png'));
console.log('✓ Avatar saved using saveAvatarToFile()');

// Summary
console.log('\n' + '═'.repeat(60));
console.log('🎉 All Tests Completed!');
console.log('═'.repeat(60));
console.log(`\n📁 Generated avatars saved in: ${outputDir}/`);
console.log('\n📋 Generated Files:');
const files = fs.readdirSync(outputDir);
files.forEach(file => {
  const stats = fs.statSync(path.join(outputDir, file));
  console.log(`   • ${file} (${(stats.size / 1024).toFixed(2)} KB)`);
});
console.log('\n✨ Open the PNG files to see your locally generated avatars!\n');
