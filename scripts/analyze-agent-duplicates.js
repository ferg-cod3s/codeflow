#!/usr/bin/env node

import { readFile, readdir, stat } from 'fs/promises';
import path from 'path';
import crypto from 'node:crypto';

// Simple agent parsing for duplicate analysis
async function parseAgentFile(filePath, format) {
  try {
    const content = await readFile(filePath, 'utf-8');
    const lines = content.split('\n');
    const yamlStart = lines.findIndex((line) => line.trim() === '---');
    const yamlEnd = lines.findIndex((line, index) => index > yamlStart && line.trim() === '---');

    if (yamlStart === -1 || yamlEnd === -1) {
      throw new Error('Invalid frontmatter');
    }

    const yamlContent = lines.slice(yamlStart + 1, yamlEnd).join('\n');
    const YAML = (await import('yaml')).default;
    const frontmatter = YAML.parse(yamlContent);

    const name = path.basename(filePath, '.md');

    return {
      id: name,
      name,
      format,
      description: frontmatter.description || frontmatter.name || '',
      model: frontmatter.model || 'claude-3-5-sonnet-20241022',
      temperature: frontmatter.temperature || 0.3,
      tools: frontmatter.tools || {},
      mode: frontmatter.mode || 'subagent',
      allowedDirectories: frontmatter.allowed_directories || [],
      permission: frontmatter.permission,
      context: '',
      filePath,
      frontmatter,
    };
  } catch (error) {
    throw new Error(`Failed to parse ${filePath}: ${error.message}`);
  }
}

// Normalize agent core fields for duplicate detection and hashing
function normalizeAgentForHashing(agent) {
  return {
    model: agent.model || 'claude-3-5-sonnet-20241022',
    tools: agent.tools || {},
    allowed_directories: agent.allowedDirectories || [],
    inputs: agent.inputs || {},
    outputs: agent.outputs || {},
  };
}

// Generate hash for normalized agent data
function hashAgentData(normalizedData) {
  const dataString = JSON.stringify(normalizedData, Object.keys(normalizedData).sort());
  return crypto.createHash('sha256').update(dataString).digest('hex');
}

// Find all agent files across all directories
const agentDirectories = [
  'codeflow-agents',
  'opencode-agents',
  'claude-agents',
  'agent',
  '.opencode/agent',
  '.claude/agents',
];

const duplicateReport = {};
const includeLegacy = process.env.CODEFLOW_INCLUDE_LEGACY === '1';

if (includeLegacy) {
  agentDirectories.push('deprecated/claude-agents', 'deprecated/opencode-agents');
}

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

// Track agents by ID with their metadata
const agentMetadata = new Map(); // agentId -> { files: [], hashes: [], categories: [] }

for (const directory of agentDirectories) {
  const files = await findMarkdownFiles(directory);
  console.log(`📂 Found ${files.length} files in: ${directory}`);

  // Determine category based on directory
  let category = 'other';
  if (directory.includes('codeflow-agents') || directory.includes('opencode-agents')) {
    category = 'canonical';
  } else if (directory.includes('deprecated')) {
    category = 'legacy';
  } else if (
    directory.includes('.claude') ||
    directory.includes('.opencode') ||
    directory.includes('.codeflow')
  ) {
    category = 'user';
  }

  for (const file of files) {
    const basename = path.basename(file, '.md');
    const dirName = path.dirname(file);

    try {
      // Determine format based on directory
      let format = 'base';
      if (dirName.includes('claude')) {
        format = 'claude-code';
      } else if (dirName.includes('opencode')) {
        format = 'opencode';
      }

      const agent = await parseAgentFile(file, format);
      const normalizedData = normalizeAgentForHashing(agent);
      const hash = hashAgentData(normalizedData);

      if (!agentMetadata.has(basename)) {
        agentMetadata.set(basename, { files: [], hashes: [], categories: [] });
      }

      const metadata = agentMetadata.get(basename);
      metadata.files.push({ file, directory: dirName, size: (await readFile(file)).length });
      metadata.hashes.push(hash);
      metadata.categories.push(category);
    } catch (error) {
      console.warn(`⚠️ Could not parse ${file}: ${error.message}`);
    }
  }
}

// Convert to duplicateReport format for backward compatibility
for (const [agentId, metadata] of agentMetadata) {
  duplicateReport[agentId] = metadata.files;
}

console.log(`\n📊 Analysis Summary:`);
console.log(`Total unique agent names: ${Object.keys(duplicateReport).length}`);

// Analyze duplicates using new canonical logic
const duplicates = [];
const exactlyCanonical = [];
const legacyDuplicates = [];
const canonicalConflicts = [];

for (const [agentId, metadata] of agentMetadata) {
  const { files, hashes, categories } = metadata;
  const uniqueHashes = new Set(hashes);
  const hasCanonical = categories.includes('canonical');
  const hasLegacy = categories.includes('legacy');

  if (files.length > 1) {
    if (uniqueHashes.size > 1 && hasCanonical) {
      // Canonical conflict - different hashes in canonical paths
      canonicalConflicts.push({ agentId, files, hashes, categories });
    } else if (hasLegacy && hasCanonical) {
      // Legacy duplicate with canonical
      legacyDuplicates.push({ agentId, files, categories });
    } else if (files.length > 3) {
      // General duplicates
      duplicates.push({ agentId, files, categories });
    }
  }

  if (files.length === 3 && hasCanonical && !hasLegacy) {
    exactlyCanonical.push(agentId);
  }
}

const lessThanThree = Array.from(agentMetadata.entries()).filter(
  ([, metadata]) => metadata.files.length < 3
);

console.log(`Agents with exactly 3 canonical copies: ${exactlyCanonical.length}`);
console.log(`Canonical conflicts (different hashes): ${canonicalConflicts.length}`);
console.log(`Legacy duplicates: ${legacyDuplicates.length}`);
console.log(`General duplicates (>3 copies): ${duplicates.length}`);
console.log(`Agents with missing formats (<3 copies): ${lessThanThree.length}`);

if (canonicalConflicts.length > 0) {
  console.log(`\n❌ Canonical Conflicts (must be resolved):`);
  canonicalConflicts.forEach(({ agentId, files }) => {
    console.log(`\n${agentId}:`);
    files.forEach((file) => console.log(`  - ${file.file}`));
  });
}

if (legacyDuplicates.length > 0) {
  console.log(`\n⚠️ Legacy Duplicates (warnings):`);
  legacyDuplicates.slice(0, 5).forEach(({ agentId, files, categories }) => {
    console.log(`\n${agentId}: ${files.length} copies (${categories.join(', ')})`);
    files.forEach((file) => console.log(`  - ${file.file}`));
  });
  if (legacyDuplicates.length > 5) {
    console.log(`\n... and ${legacyDuplicates.length - 5} more legacy duplicates`);
  }
}

if (duplicates.length > 0) {
  console.log(`\n🔄 General Duplicates (>3 copies):`);
  duplicates.forEach(({ agentId, files }) => {
    console.log(`\n${agentId}: ${files.length} copies`);
    files.forEach((file) => console.log(`  - ${file.file}`));
  });
}

if (lessThanThree.length > 0) {
  console.log(`\n❌ Incomplete Agents (missing formats):`);
  lessThanThree.slice(0, 10).forEach(([agentId, metadata]) => {
    console.log(
      `\n${agentId}: ${metadata.files.length} copies (missing ${3 - metadata.files.length})`
    );
    metadata.files.forEach((file) => console.log(`  - ${file.file}`));
  });

  if (lessThanThree.length > 10) {
    console.log(`\n... and ${lessThanThree.length - 10} more agents with missing formats`);
  }
}

// Check for problem directories
console.log(`\n📂 Directory Analysis:`);
const directoryStats = {};
Object.values(duplicateReport)
  .flat()
  .forEach(({ directory }) => {
    directoryStats[directory] = (directoryStats[directory] || 0) + 1;
  });

Object.entries(directoryStats)
  .sort(([, a], [, b]) => b - a)
  .forEach(([dir, count]) => {
    console.log(`  ${dir}: ${count} agents`);
  });

// Identify canonical structure status
console.log(`\n🏛️ Canonical Structure Status:`);
console.log(`Expected: 42 unique agents × 3 formats = 126 canonical files`);
console.log(`Found: ${Object.keys(duplicateReport).length} unique agents`);

const canonicalAgents = exactlyCanonical.filter((agentId) => {
  const metadata = agentMetadata.get(agentId);
  return (
    metadata.files.some((f) => f.directory.includes('codeflow-agents')) &&
    metadata.files.some((f) => f.directory.includes('opencode-agents'))
  );
});

console.log(`Properly canonical agents: ${canonicalAgents.length}`);
console.log(`Agents needing cleanup: ${agentMetadata.size - canonicalAgents.length}`);

if (canonicalAgents.length > 0) {
  console.log(`\n✅ Properly Canonical Agents (${canonicalAgents.length}):`);
  canonicalAgents.slice(0, 5).forEach((agentId) => {
    console.log(`  - ${agentId}`);
  });
  if (canonicalAgents.length > 5) {
    console.log(`  ... and ${canonicalAgents.length - 5} more`);
  }
}
