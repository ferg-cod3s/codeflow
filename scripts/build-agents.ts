#!/usr/bin/env node

/**
 * Build Agents Script
 * Generates platform-specific agent distributions for npm package:
 * - claude-agents/ - Claude Code format with categorized subdirectories
 * - opencode-agents/ - OpenCode format with flattened structure (no subdirectories)
 */

import { readdir, mkdir, rm, writeFile } from 'node:fs/promises';
import { join, relative, dirname, basename } from 'node:path';
import { existsSync } from 'node:fs';
import { parseAgentFile, serializeAgent } from '../src/conversion/agent-parser.js';
import { FormatConverter } from '../src/conversion/format-converter.js';
import { CommandConverter } from '../src/conversion/command-converter.js';

interface BuildStats {
  claudeAgents: number;
  opencodeAgents: number;
  claudeCommands: number;
  opencodeCommands: number;
  errors: string[];
}

/**
 * Recursively find all markdown files in a directory
 */
async function findMarkdownFiles(dir: string, baseDir: string = dir): Promise<string[]> {
  const files: string[] = [];

  try {
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        const subFiles = await findMarkdownFiles(fullPath, baseDir);
        files.push(...subFiles);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error);
  }

  return files;
}

/**
 * Build Claude Code agents (with subdirectories)
 */
async function buildClaudeAgents(
  sourceDir: string,
  targetDir: string
): Promise<{ count: number; errors: string[] }> {
  const errors: string[] = [];
  let count = 0;

  // Find all markdown files in base-agents
  const files = await findMarkdownFiles(sourceDir);

  for (const sourceFile of files) {
    try {
      // Parse the base agent
      const agent = await parseAgentFile(sourceFile, 'base');

      // Convert to Claude Code format
      const converter = new FormatConverter();
      const claudeAgent = converter.convert(agent, 'claude-code');

      // Preserve directory structure relative to base-agents
      const relativePath = relative(sourceDir, sourceFile);
      const targetFile = join(targetDir, relativePath);

      // Ensure target directory exists
      const targetDirPath = dirname(targetFile);
      if (!existsSync(targetDirPath)) {
        await mkdir(targetDirPath, { recursive: true });
      }

      // Serialize and write
      const content = serializeAgent(claudeAgent);
      await writeFile(targetFile, content, 'utf-8');

      count++;
    } catch (error) {
      errors.push(`Error processing ${sourceFile} for Claude Code: ${error}`);
    }
  }

  return { count, errors };
}

/**
 * Build OpenCode agents (flattened, no subdirectories)
 */
async function buildOpenCodeAgents(
  sourceDir: string,
  targetDir: string
): Promise<{ count: number; errors: string[] }> {
  const errors: string[] = [];
  let count = 0;

  // Find all markdown files in base-agents
  const files = await findMarkdownFiles(sourceDir);

  for (const sourceFile of files) {
    try {
      // Parse the base agent
      const agent = await parseAgentFile(sourceFile, 'base');

      // Convert to OpenCode format
      const converter = new FormatConverter();
      const opencodeAgent = converter.convert(agent, 'opencode');

      // Flatten structure - use only the filename, no subdirectories
      const filename = basename(sourceFile);
      const targetFile = join(targetDir, filename);

      // Serialize and write
      const content = serializeAgent(opencodeAgent);
      await writeFile(targetFile, content, 'utf-8');

      count++;
    } catch (error) {
      errors.push(`Error processing ${sourceFile} for OpenCode: ${error}`);
    }
  }

  return { count, errors };
}

/**
 * Build Claude Code commands (with subdirectories)
 */
async function buildClaudeCommands(
  sourceDir: string,
  targetDir: string
): Promise<{ count: number; errors: string[] }> {
  const errors: string[] = [];
  let count = 0;

  // Find all markdown files in command directory
  const files = await findMarkdownFiles(sourceDir);

  for (const sourceFile of files) {
    try {
      // Convert command using CommandConverter
      const converter = new CommandConverter();
      const claudeCommand = await converter.convertFile(sourceFile, 'claude-code');

      // Preserve directory structure relative to command
      const relativePath = relative(sourceDir, sourceFile);
      const targetFile = join(targetDir, relativePath);

      // Ensure target directory exists
      const targetDirPath = dirname(targetFile);
      if (!existsSync(targetDirPath)) {
        await mkdir(targetDirPath, { recursive: true });
      }

      // Write converted command
      await writeFile(targetFile, claudeCommand, 'utf-8');

      count++;
    } catch (error) {
      errors.push(`Error processing ${sourceFile} for Claude Code command: ${error}`);
    }
  }

  return { count, errors };
}

/**
 * Build OpenCode commands (flattened, no subdirectories)
 */
async function buildOpenCodeCommands(
  sourceDir: string,
  targetDir: string
): Promise<{ count: number; errors: string[] }> {
  const errors: string[] = [];
  let count = 0;

  // Find all markdown files in command directory
  const files = await findMarkdownFiles(sourceDir);

  for (const sourceFile of files) {
    try {
      // Convert command using CommandConverter
      const converter = new CommandConverter();
      const opencodeCommand = await converter.convertFile(sourceFile, 'opencode');

      // Flatten structure - use only filename, no subdirectories
      const filename = basename(sourceFile);
      const targetFile = join(targetDir, filename);

      // Write converted command
      await writeFile(targetFile, opencodeCommand, 'utf-8');

      count++;
    } catch (error) {
      errors.push(`Error processing ${sourceFile} for OpenCode command: ${error}`);
    }
  }

  return { count, errors };
}

/**
 * Main build function
 */
async function main() {
  const projectRoot = process.cwd();
  const baseAgentsDir = join(projectRoot, 'base-agents');
  const commandDir = join(projectRoot, 'command');
  const claudeAgentsDir = join(projectRoot, 'claude-agents');
  const opencodeAgentsDir = join(projectRoot, 'opencode-agents');
  const claudeCommandsDir = join(projectRoot, '.claude', 'commands');
  const opencodeCommandsDir = join(projectRoot, '.opencode', 'command');

  console.log('🏗️  Building agent and command distributions...\n');

  // Clean existing directories
  if (existsSync(claudeAgentsDir)) {
    await rm(claudeAgentsDir, { recursive: true, force: true });
  }
  if (existsSync(opencodeAgentsDir)) {
    await rm(opencodeAgentsDir, { recursive: true, force: true });
  }
  if (existsSync(claudeCommandsDir)) {
    await rm(claudeCommandsDir, { recursive: true, force: true });
  }
  if (existsSync(opencodeCommandsDir)) {
    await rm(opencodeCommandsDir, { recursive: true, force: true });
  }

  // Create fresh directories
  await mkdir(claudeAgentsDir, { recursive: true });
  await mkdir(opencodeAgentsDir, { recursive: true });
  await mkdir(claudeCommandsDir, { recursive: true });
  await mkdir(opencodeCommandsDir, { recursive: true });

  const stats: BuildStats = {
    claudeAgents: 0,
    opencodeAgents: 0,
    claudeCommands: 0,
    opencodeCommands: 0,
    errors: [],
  };

  // Build Claude Code agents (with subdirectories)
  console.log('📁 Building Claude Code agents (with subdirectories)...');
  const claudeResult = await buildClaudeAgents(baseAgentsDir, claudeAgentsDir);
  stats.claudeAgents = claudeResult.count;
  stats.errors.push(...claudeResult.errors);
  console.log(`   ✓ Generated ${claudeResult.count} Claude Code agents\n`);

  // Build OpenCode agents (flattened)
  console.log('📄 Building OpenCode agents (flattened)...');
  const opencodeResult = await buildOpenCodeAgents(baseAgentsDir, opencodeAgentsDir);
  stats.opencodeAgents = opencodeResult.count;
  stats.errors.push(...opencodeResult.errors);
  console.log(`   ✓ Generated ${opencodeResult.count} OpenCode agents\n`);

  // Build Claude Code commands (with subdirectories)
  console.log('📁 Building Claude Code commands...');
  const claudeCommandsResult = await buildClaudeCommands(commandDir, claudeCommandsDir);
  stats.claudeCommands = claudeCommandsResult.count;
  stats.errors.push(...claudeCommandsResult.errors);
  console.log(`   ✓ Generated ${claudeCommandsResult.count} Claude Code commands\n`);

  // Build OpenCode commands (flattened)
  console.log('📄 Building OpenCode commands (flattened)...');
  const opencodeCommandsResult = await buildOpenCodeCommands(commandDir, opencodeCommandsDir);
  stats.opencodeCommands = opencodeCommandsResult.count;
  stats.errors.push(...opencodeCommandsResult.errors);
  console.log(`   ✓ Generated ${opencodeCommandsResult.count} OpenCode commands\n`);

  // Report results
  console.log('✅ Build complete!\n');
  console.log(`📊 Statistics:`);
  console.log(`   - Claude Code agents: ${stats.claudeAgents} (with subdirectories)`);
  console.log(`   - OpenCode agents: ${stats.opencodeAgents} (flattened)`);
  console.log(`   - Claude Code commands: ${stats.claudeCommands}`);
  console.log(`   - OpenCode commands: ${stats.opencodeCommands} (flattened)`);

  if (stats.errors.length > 0) {
    console.log(`\n⚠️  Encountered ${stats.errors.length} errors:`);
    stats.errors.forEach((error) => console.log(`   - ${error}`));
    process.exit(1);
  }

  // Verify both platforms have equal agent counts
  if (stats.claudeAgents !== stats.opencodeAgents) {
    console.log(
      `\n⚠️  Warning: Agent count mismatch! Claude Code: ${stats.claudeAgents}, OpenCode: ${stats.opencodeAgents}`
    );
    console.log('   This suggests conversion issues - both platforms should have same agents.');
    process.exit(1);
  }

  // Verify both platforms have equal command counts
  if (stats.claudeCommands !== stats.opencodeCommands) {
    console.log(
      `\n⚠️  Warning: Command count mismatch! Claude Code: ${stats.claudeCommands}, OpenCode: ${stats.opencodeCommands}`
    );
    console.log('   This suggests conversion issues - both platforms should have same commands.');
    process.exit(1);
  }

  console.log('\n🎉 All agents built successfully!');
  process.exit(0);
}

// Run the build
main().catch((error) => {
  console.error('❌ Build failed:', error);
  process.exit(1);
});
