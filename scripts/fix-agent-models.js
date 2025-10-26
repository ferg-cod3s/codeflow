#!/usr/bin/env node

/**
 * Fix agent model references to match available models
 */

import fs from 'fs';
import path from 'path';

// Model mapping from old to new
const MODEL_MAPPINGS = {
  'anthropic/claude-sonnet-4': 'opencode/claude-sonnet-4',
  'anthropic/claude-opus-4': 'opencode/claude-opus-4-1',
  'anthropic/claude-haiku-4': 'opencode/claude-3-5-haiku',
  'gpt-4.1': 'github-copilot/gpt-4.1',
  'grok-code': 'opencode/grok-code',
  sonnet: 'opencode/claude-sonnet-4',
  opus: 'opencode/claude-opus-4-1',
  haiku: 'opencode/claude-3-5-haiku',
  inherit: 'opencode/grok-code',
  'github-copilot/gpt-5': 'opencode/gpt-5',
};

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

function fixAgentFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    let modified = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (line.startsWith('model:')) {
        const model = line.split(':')[1]?.trim();

        if (MODEL_MAPPINGS[model]) {
          lines[i] = `model: ${MODEL_MAPPINGS[model]}`;
          modified = true;
          console.log(`✅ Fixed ${filePath}:${i + 1} - ${model} → ${MODEL_MAPPINGS[model]}`);
        }
      }
    }

    if (modified) {
      fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
      return true;
    }

    return false;
  } catch (error) {
    console.error(`Error fixing ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  console.log('🔧 Fixing agent model configurations...\n');

  const directories = ['./base-agents', './.opencode/agent', './.claude/agents', './claude-agents'];

  let totalFiles = 0;
  let fixedFiles = 0;

  for (const dir of directories) {
    if (!fs.existsSync(dir)) {
      console.log(`📁 Directory not found: ${dir}`);
      continue;
    }

    console.log(`📂 Processing: ${dir}`);
    const files = findAgentFiles(dir);
    totalFiles += files.length;

    for (const file of files) {
      if (fixAgentFile(file)) {
        fixedFiles++;
      }
    }
  }

  console.log('\n📊 Fix Summary:');
  console.log(`   Total files processed: ${totalFiles}`);
  console.log(`   Files fixed: ${fixedFiles}`);

  if (fixedFiles > 0) {
    console.log('\n✅ Agent model configurations fixed!');
  } else {
    console.log('\n✅ No fixes needed!');
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
