#!/usr/bin/env node

/**
 * Import Path Validation Script
 *
 * Validates that all ES module imports in TypeScript files include .js extensions
 * as required by the package.json "type": "module" configuration.
 */

import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');

const SRC_DIR = join(__dirname, 'src');
const TEST_DIR = join(__dirname, 'tests');

// Patterns that should have .js extensions
const RELATIVE_IMPORT_PATTERN = /from\s+['"](\.\.?\/[^'"]+)['"]/g;
const NODE_IMPORT_PATTERN = /from\s+['"]([^.'"][^'"]*)['"]/g;

function shouldHaveJsExtension(importPath) {
  // Skip node_modules imports
  if (importPath.startsWith('node:') || importPath.includes('node_modules')) {
    return false;
  }

  // Skip absolute paths
  if (importPath.startsWith('/')) {
    return false;
  }

  // Skip URLs
  if (importPath.startsWith('http://') || importPath.startsWith('https://')) {
    return false;
  }

  // Skip package imports (no leading dot or slash)
  if (!importPath.startsWith('./') && !importPath.startsWith('../')) {
    return false;
  }

  // Skip JSON files
  if (importPath.endsWith('.json')) {
    return false;
  }

  return true;
}

function validateFile(filePath) {
  const content = readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const errors = [];

  lines.forEach((line, lineNumber) => {
    // Check relative imports
    const relativeMatches = line.matchAll(RELATIVE_IMPORT_PATTERN);
    for (const match of relativeMatches) {
      const importPath = match[1];

      if (shouldHaveJsExtension(importPath) && !importPath.endsWith('.js')) {
        errors.push({
          file: filePath,
          line: lineNumber + 1,
          column: match.index + match[0].indexOf(importPath),
          message: `Import should have .js extension: ${importPath}`,
          suggestion: `Change to: ${importPath}.js`,
        });
      }
    }

    // Check node imports (should not have .js extension)
    const nodeMatches = line.matchAll(NODE_IMPORT_PATTERN);
    for (const match of nodeMatches) {
      const importPath = match[1];

      if (importPath.endsWith('.js') && !importPath.startsWith('node:')) {
        errors.push({
          file: filePath,
          line: lineNumber + 1,
          column: match.index + match[0].indexOf(importPath),
          message: `Node import should not have .js extension: ${importPath}`,
          suggestion: `Change to: ${importPath.replace('.js', '')}`,
        });
      }
    }
  });

  return errors;
}

function findTypeScriptFiles(dir) {
  const files = [];

  function traverse(currentDir) {
    const entries = readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(currentDir, entry.name);

      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        traverse(fullPath);
      } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.js'))) {
        files.push(fullPath);
      }
    }
  }

  traverse(dir);
  return files;
}

function main() {
  console.log('🔍 Validating ES module import paths...\n');

  const allErrors = [];
  const directories = [SRC_DIR, TEST_DIR];

  for (const dir of directories) {
    if (!existsSync(dir)) {
      console.log(`⚠️  Skipping ${dir} (directory not found)`);
      continue;
    }

    console.log(`📁 Checking ${dir}...`);
    const files = findTypeScriptFiles(dir);

    for (const file of files) {
      const errors = validateFile(file);
      if (errors.length > 0) {
        allErrors.push(
          ...errors.map((error) => ({ ...error, relativePath: file.replace(__dirname + '/', '') }))
        );
      }
    }

    console.log(`   ✅ Checked ${files.length} files`);
  }

  if (allErrors.length === 0) {
    console.log('\n🎉 All import paths are valid!');
    process.exit(0);
  } else {
    console.log('\n❌ Found import path issues:\n');

    allErrors.forEach((error, index) => {
      console.log(`${index + 1}. ${error.relativePath}:${error.line}:${error.column}`);
      console.log(`   ${error.message}`);
      console.log(`   💡 ${error.suggestion}\n`);
    });

    console.log(
      `\n📊 Summary: ${allErrors.length} issues found in ${new Set(allErrors.map((e) => e.relativePath)).size} files`
    );
    process.exit(1);
  }
}

main();
