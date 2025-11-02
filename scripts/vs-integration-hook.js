#!/usr/bin/env node

/**
 * CodeFlow VS Integration Hook
 *
 * Automatically validates and integrates verbalized sampling
 * into agents, commands, and skills during development
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

const VS_CLI_PATH = 'src/verbalized-sampling/cli.ts';

function runVSValidation() {
  console.log('🔍 Running VS Integration Validation...');

  try {
    // Check if VS CLI exists
    if (!existsSync(VS_CLI_PATH)) {
      console.log('⚠️  VS CLI not found, skipping validation');
      return;
    }

    // Run validation on changed files
    const changedFiles = getChangedFiles();
    const vsFiles = changedFiles.filter(
      (file) =>
        file.includes('base-agents/') ||
        file.includes('commands-simplified/') ||
        file.includes('base-skills/') ||
        file.includes('.cursor/agents/') ||
        file.includes('.cursor/commands/') ||
        file.includes('.cursor/skills/')
    );

    if (vsFiles.length > 0) {
      console.log(`📁 Validating ${vsFiles.length} VS-related files...`);

      // Run VS validation
      execSync(`bun run ${VS_CLI_PATH} validate . --strict`, {
        stdio: 'inherit',
        cwd: process.cwd(),
      });

      console.log('✅ VS validation passed');
    } else {
      console.log('ℹ️  No VS-related files changed');
    }
  } catch (error) {
    console.error('❌ VS validation failed:', error.message);
    process.exit(1);
  }
}

function getChangedFiles() {
  try {
    const output = execSync('git diff --cached --name-only', {
      encoding: 'utf8',
      cwd: process.cwd(),
    });
    return output.trim().split('\n').filter(Boolean);
  } catch {
    return [];
  }
}

function autoInjectVS() {
  console.log('💉 Running VS Auto-Injection...');

  try {
    const changedFiles = getChangedFiles();
    const newVSFiles = changedFiles.filter(
      (file) =>
        (file.includes('base-agents/') || file.includes('.cursor/agents/')) &&
        file.endsWith('.md') &&
        !readFileSync(file, 'utf8').includes('VERBALIZED SAMPLING')
    );

    for (const file of newVSFiles) {
      console.log(`📝 Injecting VS into: ${file}`);

      // Extract component name and type
      const fileName = file.split('/').pop()?.replace('.md', '') || 'unknown';
      const isAgent = file.includes('agents');
      const componentType = isAgent ? 'agent' : 'command';

      // Generate problem description
      const problem = `Analyze and understand the ${fileName} ${componentType} functionality and implementation`;

      // Inject VS
      execSync(
        `bun run ${VS_CLI_PATH} inject "${file}" "${problem}" --type research --platform opencode`,
        {
          stdio: 'inherit',
          cwd: process.cwd(),
        }
      );
    }
  } catch (error) {
    console.log('⚠️  VS auto-injection failed, continuing...');
  }
}

// Run hooks
if (process.argv.includes('--validate')) {
  runVSValidation();
}

if (process.argv.includes('--inject')) {
  autoInjectVS();
}

if (process.argv.length === 2) {
  // Run both by default
  runVSValidation();
  autoInjectVS();
}
