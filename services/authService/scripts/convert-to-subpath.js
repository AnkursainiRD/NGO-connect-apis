/**
 * Script to convert @alias to #alias (Node.js subpath imports)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcDir = path.join(__dirname, '../src');
const indexFile = path.join(__dirname, '../index.js');

// Mapping of old aliases to new ones
const aliasMap = {
  '@config/': '#config/',
  '@utils/': '#utils/',
  '@api/': '#api/',
  '@core/': '#core/',
};

function convertImportsInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Replace each alias
  for (const [oldAlias, newAlias] of Object.entries(aliasMap)) {
    const regex = new RegExp(oldAlias.replace('/', '\\/'), 'g');
    if (content.match(regex)) {
      content = content.replace(regex, newAlias);
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

console.log('🔄 Converting @alias to #alias (Node.js subpath imports)...\n');
const converted = processDirectory(srcDir);
console.log(`\n✨ Conversion complete! ${converted} files updated.`);
