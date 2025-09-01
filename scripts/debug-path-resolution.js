#!/usr/bin/env node

import path from 'node:path';
import os from 'node:os';
import { existsSync } from 'node:fs';

/**
 * Debug script to check path resolution in agent registry
 */

const cwd = process.cwd();
const codeflowRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');

console.log('🔍 Path Resolution Debug:');
console.log(`Current working directory: ${cwd}`);
console.log(`Codeflow root: ${codeflowRoot}`);
console.log(`Home directory: ${os.homedir()}`);
console.log('');

// Define agent directories in priority order (lower priority first)
const agentDirs = [
  // Global codeflow agents (lowest priority)
  {
    dir: path.join(codeflowRoot, 'codeflow-agents'),
    format: 'base',
    label: 'Global codeflow agents',
  },
  // Deprecated directories (for backward compatibility)
  {
    dir: path.join(codeflowRoot, 'deprecated', 'claude-agents'),
    format: 'claude-code',
    label: 'Deprecated Claude agents',
  },
  {
    dir: path.join(codeflowRoot, 'deprecated', 'opencode-agents'),
    format: 'opencode',
    label: 'Deprecated OpenCode agents',
  },

  // Global user agents (medium priority)
  {
    dir: path.join(os.homedir(), '.codeflow', 'agents'),
    format: 'base',
    label: 'Global user codeflow agents',
  },
  {
    dir: path.join(os.homedir(), '.claude', 'agents'),
    format: 'claude-code',
    label: 'Global user Claude agents',
  },
  {
    dir: path.join(os.homedir(), '.config', 'opencode', 'agent'),
    format: 'opencode',
    label: 'Global user OpenCode agents',
  },

  // Project-specific agents (highest priority)
  {
    dir: path.join(cwd, '.claude', 'agents'),
    format: 'claude-code',
    label: 'Project Claude agents',
  },
  {
    dir: path.join(cwd, '.config', 'opencode', 'agent'),
    format: 'opencode',
    label: 'Project .config OpenCode agents',
  },
  {
    dir: path.join(cwd, '.opencode', 'agent'),
    format: 'opencode',
    label: 'Project .opencode OpenCode agents',
  },
];

console.log('📂 Agent directory priority order:');
agentDirs.forEach(({ dir, format, label }, index) => {
  const exists = existsSync(dir);
  console.log(`${index + 1}. ${label}`);
  console.log(`   Path: ${dir}`);
  console.log(`   Format: ${format}`);
  console.log(`   Exists: ${exists ? '✅' : '❌'}`);
  console.log('');
});

console.log('🎯 Priority order: Later directories override earlier ones');
console.log(
  '💡 The agent-architect should be loaded from the highest priority directory that exists and contains it'
);
