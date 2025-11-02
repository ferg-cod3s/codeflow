#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { existsSync } from 'node:fs';

const OLD_MODEL = 'opencode/grok-code-fast';
const NEW_MODEL = 'opencode/grok-code';

async function fixModelField(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n');

    // Check if file starts with frontmatter
    if (lines[0] !== '---') {
      console.log(`Skipping ${filePath} - no frontmatter`);
      return false;
    }

    // Find end of frontmatter
    let frontmatterEndIndex = -1;
    for (let i = 1; i < lines.length; i++) {
      if (lines[i] === '---') {
        frontmatterEndIndex = i;
        break;
      }
    }

    if (frontmatterEndIndex === -1) {
      console.log(`Skipping ${filePath} - malformed frontmatter`);
      return false;
    }

    // Check if model field exists and needs updating
    let modified = false;
    for (let i = 1; i < frontmatterEndIndex; i++) {
      const line = lines[i].trim();
      if (line === `model: ${OLD_MODEL}`) {
        lines[i] = `model: ${NEW_MODEL}`;
        modified = true;
        console.log(`✅ Updated model in ${path.basename(filePath)}`);
        break;
      }
    }

    if (modified) {
      const updatedContent = lines.join('\n');
      await fs.writeFile(filePath, updatedContent, 'utf-8');
      return true;
    }

    return false;
  } catch (error) {
    console.error(`❌ Failed to update ${filePath}: ${error.message}`);
    return false;
  }
}

async function processDirectory(dirPath) {
  if (!existsSync(dirPath)) {
    console.log(`Directory not found: ${dirPath}`);
    return 0;
  }

  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  let updatedCount = 0;

  for (const entry of entries) {
    if (entry.isDirectory()) {
      // Recursively process subdirectories
      const subUpdated = await processDirectory(path.join(dirPath, entry.name));
      updatedCount += subUpdated;
    } else if (entry.isFile() && entry.name.endsWith('.md') && !entry.name.startsWith('README')) {
      // Process agent files
      const updated = await fixModelField(path.join(dirPath, entry.name));
      if (updated) updatedCount++;
    }
  }

  return updatedCount;
}

async function main() {
  const codeflowRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
  const agentDirectories = [
    path.join(codeflowRoot, 'base-agents'),
    path.join(codeflowRoot, 'claude-agents'),
    path.join(codeflowRoot, 'opencode-agents'),
    path.join(codeflowRoot, '.opencode', 'agent'),
    path.join(codeflowRoot, 'backup', 'duplicates'),
    path.join(codeflowRoot, 'test-setup', '.opencode', 'agent'),
    path.join(codeflowRoot, 'deprecated', 'claude-agents'),
    path.join(codeflowRoot, 'deprecated', 'opencode-agents'),
  ];

  console.log('🔧 Fixing agent model field from grok-code-fast to grok-code...');
  console.log(`📝 Changing model: ${OLD_MODEL} → ${NEW_MODEL}\n`);

  let totalUpdated = 0;

  for (const dir of agentDirectories) {
    console.log(`📁 Processing directory: ${dir}`);
    const updated = await processDirectory(dir);
    console.log(`   Updated ${updated} files in this directory\n`);
    totalUpdated += updated;
  }

  console.log(`✅ Complete! Updated model field in ${totalUpdated} agent files.`);

  if (totalUpdated > 0) {
    console.log('\n📋 Next steps:');
    console.log('1. Run: codeflow validate');
    console.log('2. Run: codeflow convert-all');
    console.log('3. Test agent invocation: codeflow pull . && test affected agents');
  }
}

main().catch(console.error);
