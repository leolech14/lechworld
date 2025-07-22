#!/usr/bin/env node
import { build } from 'esbuild';
import { copyFileSync, mkdirSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Build server code
console.log('Building server...');
await build({
  entryPoints: ['server/index-prod.ts'],
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'esm',
  outfile: 'dist/server/index-prod.js',
  external: [
    'express',
    'pg',
    'drizzle-orm',
    'bcryptjs',
    'jsonwebtoken',
    'ws',
    '@supabase/supabase-js',
    'dotenv',
    'express-session',
    'zod',
    'drizzle-zod',
    'nanoid'
  ],
  minify: false,
  sourcemap: false,
});

// Copy shared directory structure
function copyDir(src, dest) {
  mkdirSync(dest, { recursive: true });
  const entries = readdirSync(src);
  
  for (const entry of entries) {
    const srcPath = join(src, entry);
    const destPath = join(dest, entry);
    
    if (statSync(srcPath).isDirectory()) {
      copyDir(srcPath, destPath);
    } else if (entry.endsWith('.ts') && !entry.endsWith('.d.ts')) {
      // Skip TypeScript files, they're bundled
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}

console.log('Copying shared files...');
copyDir('shared', 'dist/shared');

console.log('Build complete!');