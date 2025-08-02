#!/usr/bin/env node

/**
 * @purpose: UTIL/SCRIPT/validate-tags
 * @connects-to: PURPOSE_TAGS.md
 * @description: Validates that all TypeScript/TSX files have proper purpose tags
 */

import { readdir, readFile } from 'fs/promises';
import { join, extname } from 'path';

const IGNORED_PATHS = ['node_modules', 'dist', '.git'];
const REQUIRED_TAGS = ['@purpose:'];
const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

async function validateFile(filePath) {
  const content = await readFile(filePath, 'utf8');
  const firstLines = content.split('\n').slice(0, 10).join('\n');
  
  const missingTags = REQUIRED_TAGS.filter(tag => !firstLines.includes(tag));
  
  return {
    filePath,
    valid: missingTags.length === 0,
    missingTags
  };
}

async function scanDirectory(dir, results = []) {
  const items = await readdir(dir, { withFileTypes: true });
  
  for (const item of items) {
    const fullPath = join(dir, item.name);
    
    if (IGNORED_PATHS.some(ignored => fullPath.includes(ignored))) {
      continue;
    }
    
    if (item.isDirectory()) {
      await scanDirectory(fullPath, results);
    } else if (EXTENSIONS.includes(extname(item.name))) {
      const result = await validateFile(fullPath);
      if (!result.valid) {
        results.push(result);
      }
    }
  }
  
  return results;
}

async function main() {
  console.log('🏷️  Validating Purpose Tags...\n');
  
  const invalidFiles = await scanDirectory('.');
  
  if (invalidFiles.length === 0) {
    console.log('✅ All files have proper purpose tags!');
    process.exit(0);
  } else {
    console.log(`❌ Found ${invalidFiles.length} files without proper tags:\n`);
    
    invalidFiles.forEach(({ filePath, missingTags }) => {
      console.log(`  ${filePath}`);
      console.log(`    Missing: ${missingTags.join(', ')}\n`);
    });
    
    console.log('\n💡 Add purpose tags to these files following the format in PURPOSE_TAGS.md');
    process.exit(1);
  }
}

main().catch(console.error);