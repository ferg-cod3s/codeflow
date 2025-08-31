#!/usr/bin/env node

import { readFile, readdir, stat } from 'fs/promises';
import path from 'path';

// Find all agent files across all directories
const agentDirectories = [
  'agent',
  'claude-agents', 
  'opencode-agents',
  '.opencode/agent',
  '.claude/agents'
];

const duplicateReport = {};

console.log('🔍 Analyzing agent files across all directories...\n');

// Recursive function to find all .md files in a directory
async function findMarkdownFiles(dir, baseDir = '') {
  const files = [];
  try {
    const entries = await readdir(dir);
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry);
      const stats = await stat(fullPath);
      
      if (stats.isDirectory()) {
        const subFiles = await findMarkdownFiles(fullPath, path.join(baseDir, entry));
        files.push(...subFiles);
      } else if (entry.endsWith('.md')) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    // Directory doesn't exist or can't be read
    console.warn(`⚠️ Could not read directory ${dir}: ${error.message}`);
  }
  
  return files;
}

for (const directory of agentDirectories) {
  const files = await findMarkdownFiles(directory);
  console.log(`📂 Found ${files.length} files in: ${directory}`);
  
  for (const file of files) {
    const basename = path.basename(file, '.md');
    const dirName = path.dirname(file);
    
    if (!duplicateReport[basename]) {
      duplicateReport[basename] = [];
    }
    
    try {
      const content = await readFile(file);
      duplicateReport[basename].push({
        file,
        directory: dirName,
        size: content.length
      });
    } catch (error) {
      console.warn(`⚠️ Could not read ${file}: ${error.message}`);
    }
  }
}

console.log(`\n📊 Analysis Summary:`);
console.log(`Total unique agent names: ${Object.keys(duplicateReport).length}`);

// Report duplicates - agents with more than 3 formats (base, claude-code, opencode)
const duplicates = Object.entries(duplicateReport)
  .filter(([name, locations]) => locations.length > 3);

const exactlyThree = Object.entries(duplicateReport)
  .filter(([name, locations]) => locations.length === 3);

const lessThanThree = Object.entries(duplicateReport)
  .filter(([name, locations]) => locations.length < 3);

console.log(`Agents with exactly 3 copies (canonical): ${exactlyThree.length}`);
console.log(`Agents with duplicates (>3 copies): ${duplicates.length}`);
console.log(`Agents with missing formats (<3 copies): ${lessThanThree.length}`);

if (duplicates.length > 0) {
  console.log(`\n🔄 Duplicate Agents (more than 3 copies):`);
  duplicates.forEach(([name, locations]) => {
    console.log(`\n${name}: ${locations.length} copies`);
    locations.forEach(loc => console.log(`  - ${loc.file} (${loc.size} bytes)`));
  });
}

if (lessThanThree.length > 0) {
  console.log(`\n❌ Incomplete Agents (missing formats):`);
  lessThanThree.slice(0, 10).forEach(([name, locations]) => {
    console.log(`\n${name}: ${locations.length} copies (missing ${3 - locations.length})`);
    locations.forEach(loc => console.log(`  - ${loc.file}`));
  });
  
  if (lessThanThree.length > 10) {
    console.log(`\n... and ${lessThanThree.length - 10} more agents with missing formats`);
  }
}

// Check for problem directories
console.log(`\n📂 Directory Analysis:`);
const directoryStats = {};
Object.values(duplicateReport).flat().forEach(({ directory }) => {
  directoryStats[directory] = (directoryStats[directory] || 0) + 1;
});

Object.entries(directoryStats)
  .sort(([,a], [,b]) => b - a)
  .forEach(([dir, count]) => {
    console.log(`  ${dir}: ${count} agents`);
  });

// Identify canonical structure status
console.log(`\n🏛️ Canonical Structure Status:`);
console.log(`Expected: 42 unique agents × 3 formats = 126 canonical files`);
console.log(`Found: ${Object.keys(duplicateReport).length} unique agents`);

const canonicalAgents = exactlyThree.filter(([name, locations]) => {
  return locations.some(l => l.directory === 'agent') &&
         locations.some(l => l.directory === 'claude-agents') &&
         locations.some(l => l.directory === 'opencode-agents');
});

console.log(`Properly canonical agents: ${canonicalAgents.length}`);
console.log(`Agents needing cleanup: ${Object.keys(duplicateReport).length - canonicalAgents.length}`);

if (canonicalAgents.length > 0) {
  console.log(`\n✅ Properly Canonical Agents (${canonicalAgents.length}):`);
  canonicalAgents.slice(0, 5).forEach(([name]) => {
    console.log(`  - ${name}`);
  });
  if (canonicalAgents.length > 5) {
    console.log(`  ... and ${canonicalAgents.length - 5} more`);
  }
}