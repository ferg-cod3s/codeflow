#!/usr/bin/env node

/**
 * Fix global model configurations
 * Wrapper script for easier usage
 */

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const args = process.argv.slice(2);
const scriptPath = path.join(__dirname, '../src/cli/fix-models.ts');

try {
  execSync(`bun run "${scriptPath}" --global ${args.join(' ')}`, {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..'),
  });
} catch (error) {
  console.error('Error running model fix script:', error.message);
  process.exit(1);
}
