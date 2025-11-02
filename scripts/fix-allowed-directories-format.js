#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { existsSync } from 'node:fs';

/**
 * Fix allowed_directories format in all agent files
 * Convert from: allowed_directories: ['/path']
 * To: allowed_directories:
 *     - /path
 */

async function fixAgentFile(filePath) {
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

    let modified = false;
    const newLines = [...lines];

    // Look for allowed_directories line
    for (let i = 1; i < frontmatterEndIndex; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();

      // Check for the old format: allowed_directories: ['/path']
      if (
        trimmedLine.startsWith('allowed_directories:') &&
        trimmedLine.includes('[') &&
        trimmedLine.includes(']')
      ) {
        // Extract the path from the array format
        const match = trimmedLine.match(/allowed_directories:\s*\[(['"])([^'"]+)\1\]/);
        if (match) {
          const directoryPath = match[2];

          // Replace with proper YAML array format
          newLines[i] = 'allowed_directories:';
          newLines.splice(i + 1, 0, `  - ${directoryPath}`);

          modified = true;
          console.log(`✅ Fixed format in ${path.basename(filePath)}`);
          break;
        }
      }
    }

    if (modified) {
      const updatedContent = newLines.join('\n');
      await fs.writeFile(filePath, updatedContent, 'utf-8');
      return true;
    }

    return false;
  } catch (error) {
    console.error(`❌ Failed to fix ${filePath}: ${error.message}`);
    return false;
  }
}

async function processDirectory(dirPath) {
  if (!existsSync(dirPath)) {
    console.log(`Directory not found: ${dirPath}`);
    return 0;
  }

  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  let fixedCount = 0;

  for (const entry of entries) {
    if (entry.isDirectory()) {
      // Recursively process subdirectories
      const subFixed = await processDirectory(path.join(dirPath, entry.name));
      fixedCount += subFixed;
    } else if (entry.isFile() && entry.name.endsWith('.md') && !entry.name.startsWith('README')) {
      // Process agent files
      const fixed = await fixAgentFile(path.join(dirPath, entry.name));
      if (fixed) fixedCount++;
    }
  }

  return fixedCount;
}

async function main() {
  const codeflowRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
  const agentDirectories = [
    path.join(codeflowRoot, 'base-agents'),
    path.join(codeflowRoot, 'deprecated', 'claude-agents'),
    path.join(codeflowRoot, 'deprecated', 'opencode-agents'),
    path.join(codeflowRoot, '.opencode', 'agent'),
  ];

  console.log('🔧 Fixing allowed_directories format in agent files...');
  console.log("📝 Converting from: allowed_directories: ['/path']");
  console.log('📝 Converting to: allowed_directories:\\n  - /path\\n');

  let totalFixed = 0;

  for (const dir of agentDirectories) {
    console.log(`📁 Processing directory: ${dir}`);
    const fixed = await processDirectory(dir);
    console.log(`   Fixed ${fixed} files in this directory\\n`);
    totalFixed += fixed;
  }

  console.log(`✅ Complete! Fixed allowed_directories format in ${totalFixed} agent files.`);
}

// Run the fix
main().catch(console.error);
