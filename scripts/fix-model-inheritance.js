#!/usr/bin/env bun

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { parse, stringify } from 'yaml';

const INVALID_MODELS = [
  'opencode/claude-sonnet-4',
  'opencode/claude-opus-4-1',
  'opencode/claude-3-5-haiku',
  'github-copilot/gpt-4.1',
];

const ORCHESTRATOR_AGENT = 'smart-subagent-orchestrator';

function findMarkdownFiles(dir, files = []) {
  const entries = readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && !entry.name.startsWith('.')) {
        findMarkdownFiles(fullPath, files);
      }
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(fullPath);
    }
  }

  return files;
}

function fixAgentModel(filePath) {
  const content = readFileSync(filePath, 'utf-8');

  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) {
    console.log(`Skipping ${filePath}: No frontmatter found`);
    return false;
  }

  const frontmatter = parse(frontmatterMatch[1]);
  const agentName = frontmatter.name;

  const currentModel = frontmatter.model;
  if (!currentModel) {
    console.log(`${filePath}: No model specified (will inherit)`);
    return false;
  }

  let needsUpdate = false;
  let action = '';

  if (agentName === ORCHESTRATOR_AGENT) {
    if (currentModel !== 'opencode/grok-code') {
      frontmatter.model = 'opencode/grok-code';
      needsUpdate = true;
      action = `Set orchestrator to opencode/grok-code (was ${currentModel})`;
    }
  } else if (INVALID_MODELS.includes(currentModel)) {
    delete frontmatter.model;
    needsUpdate = true;
    action = `Removed invalid model ${currentModel} (will inherit)`;
  } else if (currentModel === 'github-copilot/gpt-4.1') {
    frontmatter.model = 'opencode/grok-code';
    needsUpdate = true;
    action = `Changed github-copilot/gpt-4.1 to opencode/grok-code`;
  }

  if (needsUpdate) {
    const updatedFrontmatter = stringify(frontmatter);
    const newContent = content.replace(
      /^---\n[\s\S]*?\n---/,
      `---\n${updatedFrontmatter.trim()}\n---`
    );
    writeFileSync(filePath, newContent, 'utf-8');
    console.log(`✓ ${filePath}: ${action}`);
    return true;
  }

  return false;
}

function main() {
  console.log('Fixing model configurations in agent files...\n');

  const agentFiles = findMarkdownFiles(join(process.cwd(), 'codeflow-agents'));

  let updated = 0;
  let skipped = 0;

  for (const file of agentFiles) {
    if (fixAgentModel(file)) {
      updated++;
    } else {
      skipped++;
    }
  }

  console.log(`\nSummary:`);
  console.log(`  Updated: ${updated} files`);
  console.log(`  Skipped: ${skipped} files`);
}

main();
