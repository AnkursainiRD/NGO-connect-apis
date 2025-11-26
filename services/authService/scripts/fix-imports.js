/**
 * Script to fix broken paths and convert to # imports
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcDir = path.join(__dirname, '../src');

// Mapping of patterns to replace
const replacements = [
  // Fix broken Windows paths
  { pattern: /from '..\\..\/config\//g, replacement: "from '#config/" },
  { pattern: /from '..\\..\/utils\//g, replacement: "from '#utils/" },
  { pattern: /from '..\\..\/api\//g, replacement: "from '#api/" },
  { pattern: /from '..\\..\/core\//g, replacement: "from '#core/" },
  
  // Fix standard relative paths to # imports (optional but good for consistency)
  { pattern: /from '\.\.\/config\//g, replacement: "from '#config/" },
  { pattern: /from '\.\.\/utils\//g, replacement: "from '#utils/" },
  { pattern: /from '\.\.\/api\//g, replacement: "from '#api/" },
  { pattern: /from '\.\.\/core\//g, replacement: "from '#core/" },
  
  // Fix deep relative paths
  { pattern: /from '\.\.\/\.\.\/config\//g, replacement: "from '#config/" },
  { pattern: /from '\.\.\/\.\.\/utils\//g, replacement: "from '#utils/" },
  { pattern: /from '\.\.\/\.\.\/api\//g, replacement: "from '#api/" },
  { pattern: /from '\.\.\/\.\.\/core\//g, replacement: "from '#core/" },
];

function fixImportsInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  for (const { pattern, replacement } of replacements) {
    if (content.match(pattern)) {
      content = content.replace(pattern, replacement);
      modified = true;
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed: ${path.relative(process.cwd(), filePath)}`);
    return true;
  }
  return false;
}

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  let totalFixed = 0;

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      totalFixed += processDirectory(fullPath);
    } else if (file.endsWith('.js')) {
      if (fixImportsInFile(fullPath)) {
        totalFixed++;
      }
    }
  }

  return totalFixed;
}

console.log('🔧 Fixing broken imports and converting to # imports...\n');
const fixed = processDirectory(srcDir);
console.log(`\n✨ Fix complete! ${fixed} files updated.`);
