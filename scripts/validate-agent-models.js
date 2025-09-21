#!/usr/bin/env node

/**
 * Validation script to ensure all agents use the correct model
 * Prevents ProviderModelNotFoundError by checking model references
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VALID_MODELS = ['opencode/grok-code', 'opencode/code-supernova', 'github-copilot/gpt-4.1', 'anthropic/claude-sonnet-4'];
const INVALID_MODELS = ['opencode/grok-code-fast'];

function findAgentFiles(dir) {
  const files = [];

  function scan(directory) {
    const items = fs.readdirSync(directory);

    for (const item of items) {
      const fullPath = path.join(directory, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        scan(fullPath);
      } else if (item.endsWith('.md') && (item.includes('agent') || directory.includes('agent'))) {
        files.push(fullPath);
      }
    }
  }

  scan(dir);
  return files;
}

function validateAgentFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (line.startsWith('model:')) {
        const model = line.split(':')[1]?.trim();

        if (INVALID_MODELS.includes(model)) {
          console.error(`❌ INVALID MODEL in ${filePath}:${i + 1}`);
          console.error(`   Found: ${model}`);
          console.error(`   Expected: ${VALID_MODELS.join(' or ')}`);
          return false;
        }

        if (!VALID_MODELS.includes(model)) {
          console.warn(`⚠️  UNKNOWN MODEL in ${filePath}:${i + 1}`);
          console.warn(`   Found: ${model}`);
          console.warn(`   Expected: ${VALID_MODELS.join(' or ')}`);
        }
      }
    }

    return true;
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  console.log('🔍 Validating agent model configurations...\n');

  const directories = [
    './codeflow-agents',
    './.opencode/agent',
    './.claude/agents',
    './claude-agents',
  ];

  let totalFiles = 0;
  let validFiles = 0;
  let invalidFiles = 0;

  for (const dir of directories) {
    if (!fs.existsSync(dir)) {
      console.log(`📁 Directory not found: ${dir}`);
      continue;
    }

    console.log(`📂 Scanning: ${dir}`);
    const files = findAgentFiles(dir);
    totalFiles += files.length;

    for (const file of files) {
      if (validateAgentFile(file)) {
        validFiles++;
      } else {
        invalidFiles++;
      }
    }
  }

  console.log('\n📊 Validation Summary:');
  console.log(`   Total files checked: ${totalFiles}`);
  console.log(`   Valid files: ${validFiles}`);
  console.log(`   Invalid files: ${invalidFiles}`);

  if (invalidFiles > 0) {
    console.log('\n❌ Validation failed! Fix the invalid model references above.');
    process.exit(1);
  } else {
    console.log('\n✅ All agent models are valid!');
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { validateAgentFile, findAgentFiles };
