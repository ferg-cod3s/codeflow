#!/usr/bin/env node

import { readdir, rename } from 'fs/promises';
import path from 'path';

console.log('🔧 Fixing OpenCode agent naming convention (underscores → hyphens)...\n');

const opencodeDir = 'opencode-agents';
const files = await readdir(opencodeDir);

const renames = [];

for (const file of files) {
  if (file.includes('_') && file.endsWith('.md')) {
    const newName = file.replace(/_/g, '-');
    const oldPath = path.join(opencodeDir, file);
    const newPath = path.join(opencodeDir, newName);

    renames.push({ oldPath, newPath, oldName: file, newName });
  }
}

console.log(`Found ${renames.length} files to rename:`);

for (const { oldPath, newPath, oldName, newName } of renames) {
  console.log(`  ${oldName} → ${newName}`);
  await rename(oldPath, newPath);
}

console.log(`\n✅ Renamed ${renames.length} OpenCode agent files to use hyphens`);

// Also need to update the manifest
console.log('\n🔄 Updating agent manifest with new names...');

import { readFile, writeFile } from 'fs/promises';

const manifest = JSON.parse(await readFile('AGENT_MANIFEST.json', 'utf-8'));

// Update the manifest to use hyphens for OpenCode sources
manifest.canonical_agents.forEach((agent) => {
  const opencodeFile = agent.sources.opencode;
  if (opencodeFile.includes('_')) {
    agent.sources.opencode = opencodeFile.replace(/_/g, '-');
  }
});

manifest.last_updated = new Date().toISOString();

await writeFile('AGENT_MANIFEST.json', JSON.stringify(manifest, null, 2));

console.log('✅ Updated agent manifest with hyphenated OpenCode filenames');
