#!/usr/bin/env node

import { readdir, rename, readFile, writeFile } from 'fs/promises';
import path from 'path';

console.log('🔧 Converting agent naming convention (hyphens → underscores)...\n');

const directories = [
  'base-agents',
  'command',
  '.claude/agents',
  '.claude/commands',
  '.opencode/agent',
  '.opencode/command',
];

const totalStats = {
  filesRenamed: 0,
  frontmatterUpdated: 0,
  errors: 0,
};

for (const dir of directories) {
  const stats = await processDirectory(dir);
  totalStats.filesRenamed += stats.filesRenamed;
  totalStats.frontmatterUpdated += stats.frontmatterUpdated;
  totalStats.errors += stats.errors;
}

console.log(`\n📊 Total Summary:`);
console.log(`  Files renamed: ${totalStats.filesRenamed}`);
console.log(`  Frontmatter updated: ${totalStats.frontmatterUpdated}`);
console.log(`  Errors: ${totalStats.errors}`);

if (totalStats.errors > 0) {
  console.log(`\n❌ Completed with ${totalStats.errors} errors`);
  process.exit(1);
} else {
  console.log(`\n✅ Successfully converted all agents to use underscores`);
}

async function processDirectory(dir) {
  const stats = { filesRenamed: 0, frontmatterUpdated: 0, errors: 0 };

  if (!(await exists(dir))) {
    console.log(`📁 Directory not found: ${dir}`);
    return stats;
  }

  console.log(`\n📂 Processing: ${dir}`);

  try {
    const entries = await readdir(dir, { withFileTypes: true });
    const filesToProcess = [];

    // Collect all files to process
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.md') && !entry.name.startsWith('README')) {
        filesToProcess.push(entry.name);
      } else if (entry.isDirectory()) {
        // Recursively process subdirectories
        const subDir = path.join(dir, entry.name);
        const subStats = await processDirectory(subDir);
        stats.filesRenamed += subStats.filesRenamed;
        stats.frontmatterUpdated += subStats.frontmatterUpdated;
        stats.errors += subStats.errors;
      }
    }

    // Process files in this directory
    for (const fileName of filesToProcess) {
      try {
        const result = await processFile(dir, fileName);
        if (result.renamed) stats.filesRenamed++;
        if (result.frontmatterUpdated) stats.frontmatterUpdated++;
      } catch (error) {
        console.error(`  ❌ Error processing ${fileName}: ${error.message}`);
        stats.errors++;
      }
    }
  } catch (error) {
    console.error(`❌ Error reading directory ${dir}: ${error.message}`);
    stats.errors++;
  }

  return stats;
}

async function processFile(dir, fileName) {
  const oldPath = path.join(dir, fileName);
  const newName = fileName.replace(/-/g, '_');

  let result = { renamed: false, frontmatterUpdated: false };

  // Read file content
  const content = await readFile(oldPath, 'utf-8');

  // Update frontmatter name field if it exists
  const updatedContent = updateFrontmatterName(content);

  // Write updated content if changed
  if (updatedContent !== content) {
    await writeFile(oldPath, updatedContent, 'utf-8');
    result.frontmatterUpdated = true;
    console.log(`  ✏️  Updated frontmatter in: ${fileName}`);
  }

  // Rename file if name changed
  if (newName !== fileName) {
    const newPath = path.join(dir, newName);
    await rename(oldPath, newPath);
    result.renamed = true;
    console.log(`  📝 ${fileName} → ${newName}`);
  }

  return result;
}

function updateFrontmatterName(content) {
  // Extract frontmatter
  if (!content.startsWith('---')) {
    return content;
  }

  const parts = content.split('---');
  if (parts.length < 3) {
    return content;
  }

  const frontmatter = parts[1];
  const body = parts.slice(2).join('---');

  // Update name field if it exists
  const updatedFrontmatter = frontmatter.replace(/^(name:\s*)(.+)$/m, (_, prefix, name) => {
    const updatedName = name.replace(/-/g, '_');
    return prefix + updatedName;
  });

  // If frontmatter changed, return updated content
  if (updatedFrontmatter !== frontmatter) {
    return `---${updatedFrontmatter}---${body}`;
  }

  return content;
}

async function exists(path) {
  try {
    await readdir(path);
    return true;
  } catch {
    return false;
  }
}
