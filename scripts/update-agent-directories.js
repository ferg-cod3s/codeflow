#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { existsSync } from 'node:fs';

/**
 * Update all agent files to include allowed_directories configuration
 */

const ALLOWED_DIRECTORIES = ['/Users/johnferguson/Github'];

async function updateAgentFile(filePath) {
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

    // Check if allowed_directories already exists
    const frontmatterLines = lines.slice(1, frontmatterEndIndex);
    const hasAllowedDirectories = frontmatterLines.some((line) =>
      line.trim().startsWith('allowed_directories:')
    );

    if (hasAllowedDirectories) {
      console.log(`Skipping ${filePath} - already has allowed_directories`);
      return false;
    }

    // Find where to insert allowed_directories (before tools section or at end of frontmatter)
    let insertIndex = frontmatterEndIndex - 1;
    for (let i = frontmatterLines.length - 1; i >= 0; i--) {
      const line = frontmatterLines[i].trim();
      if (line === 'tools:') {
        insertIndex = i;
        break;
      }
    }

    // Insert allowed_directories before tools or at end
    const allowedDirectoriesYaml = `allowed_directories: ${JSON.stringify(ALLOWED_DIRECTORIES)}`;
    lines.splice(insertIndex + 1, 0, allowedDirectoriesYaml);

    // Write updated content
    const updatedContent = lines.join('\n');
    await fs.writeFile(filePath, updatedContent, 'utf-8');

    console.log(`✅ Updated ${path.basename(filePath)}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to update ${filePath}: ${error.message}`);
    return false;
  }
}

async function processDirectory(dirPath) {
  if (!existsSync(dirPath)) {
    console.log(`Directory not found: ${dirPath}`);
    return;
  }

  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  let updatedCount = 0;

  for (const entry of entries) {
    if (entry.isDirectory()) {
      // Recursively process subdirectories
      const subDirUpdated = await processDirectory(path.join(dirPath, entry.name));
      updatedCount += subDirUpdated;
    } else if (entry.isFile() && entry.name.endsWith('.md') && !entry.name.startsWith('README')) {
      // Process agent files
      const updated = await updateAgentFile(path.join(dirPath, entry.name));
      if (updated) updatedCount++;
    }
  }

  return updatedCount;
}

async function main() {
  const codeflowRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
  const agentDirectories = [
    path.join(codeflowRoot, 'codeflow-agents'),
    path.join(codeflowRoot, 'deprecated', 'claude-agents'),
    path.join(codeflowRoot, 'deprecated', 'opencode-agents'),
    path.join(codeflowRoot, '.opencode', 'agent'),
  ];

  console.log('🔄 Updating agent files with allowed_directories configuration...');
  console.log(`📂 Allowed directories: ${ALLOWED_DIRECTORIES.join(', ')}\n`);

  let totalUpdated = 0;

  for (const dir of agentDirectories) {
    console.log(`📁 Processing directory: ${dir}`);
    const updated = await processDirectory(dir);
    console.log(`   Updated ${updated} files in this directory\n`);
    totalUpdated += updated;
  }

  console.log(
    `✅ Complete! Updated ${totalUpdated} agent files with allowed_directories configuration.`
  );
}

main().catch(console.error);
