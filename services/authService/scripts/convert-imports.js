/**
 * Script to convert all @alias imports to relative paths
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcDir = path.join(__dirname, '../src');

// Mapping of aliases to their actual paths
const aliasMap = {
  '@config/': '../config/',
  '@utils/': '../utils/',
  '@api/': '../api/',
  '@core/': '../core/',
};

function convertImportsInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Get the directory of the current file
  const fileDir = path.dirname(filePath);
  const relativeSrcDir = path.relative(fileDir, srcDir);

  // Replace each alias
  for (const [alias, replacement] of Object.entries(aliasMap)) {
    const regex = new RegExp(`from '${alias.replace('/', '\\/')}`, 'g');
    if (content.match(regex)) {
      // Calculate relative path from current file to src
      const relPath = relativeSrcDir || '.';
      content = content.replace(regex, `from '${relPath}/${replacement.replace('../', '')}`);
      modified = true;
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Converted: ${path.relative(process.cwd(), filePath)}`);
    return true;
  }
  return false;
}

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  let totalConverted = 0;

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      totalConverted += processDirectory(fullPath);
    } else if (file.endsWith('.js')) {
      if (convertImportsInFile(fullPath)) {
        totalConverted++;
      }
    }
  }

  return totalConverted;
}

console.log('🔄 Converting @alias imports to relative paths...\n');
const converted = processDirectory(srcDir);
console.log(`\n✨ Conversion complete! ${converted} files updated.`);
