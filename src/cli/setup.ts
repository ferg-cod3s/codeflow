import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { join, basename } from 'node:path';
import { existsSync } from 'node:fs';
import { parseAgentsFromDirectory, serializeAgent } from '../conversion/agent-parser.js';
import { FormatConverter } from '../conversion/format-converter.js';
import { setupGlobalAgents } from './global.js';
function findCodeflowRoot(): string {
  try {
    const currentFile = fileURLToPath(import.meta.url);
    let currentDir = dirname(currentFile);
    while (currentDir !== '/') {
      if (existsSync(join(currentDir, 'package.json')) && existsSync(join(currentDir, 'command'))) {
        return currentDir;
      }
      currentDir = dirname(currentDir);
    }
  } catch (error) {}
  return process.cwd();
}

export type SupportedFormat = 'claude-code' | 'opencode';

export function getTargetFormat(setupDir: string): SupportedFormat | null {
  if (setupDir.includes('.claude')) {
    return 'claude-code';
  }
  if (setupDir.includes('.opencode')) {
    return 'opencode';
  }
  return null;
}

function getCommandSourceDirs(sourcePath: string, targetDir: string): string[] {
  const sourceDirs: string[] = [];

  // Commands only come from the command/ directory
  sourceDirs.push(join(sourcePath, 'command'));

  return sourceDirs;
}

function getAgentSourceDirs(sourcePath: string, targetFormat: SupportedFormat): string[] {
  const sourceDirs: string[] = [];

  // Primary source: codeflow-agents/ directory (base format)
  sourceDirs.push(join(sourcePath, 'codeflow-agents'));

  // Format-specific fallbacks
  if (targetFormat === 'claude-code') {
    sourceDirs.push(join(sourcePath, 'claude-agents'));
  } else if (targetFormat === 'opencode') {
    sourceDirs.push(join(sourcePath, 'opencode-agents'));
  }

  return sourceDirs;
}

export async function setup(
  projectPath?: string,
  options: { force?: boolean; type?: string; global?: boolean; dryRun?: boolean } = {}
) {
  const inputPath = projectPath || process.cwd();

  if (!existsSync(inputPath)) {
    console.error(`❌ Directory does not exist: ${inputPath}`);
    process.exit(1);
  }

  console.log(options.global ? `🔍 Setting up global directories` : `🔍 Setting up project: ${inputPath}`);

  // Handle global setup
  if (options.global) {
    console.log(`📦 Setting up global configuration...`);
    await setupGlobalAgents(undefined, { dryRun: options.dryRun });
    console.log(`✅ Successfully set up global configuration!`);
    return;
  }

  const codeflowDir = findCodeflowRoot();
  console.log(`📦 Setting up configuration from: ${codeflowDir}`);
}