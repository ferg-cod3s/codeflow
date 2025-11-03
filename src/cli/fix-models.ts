#!/usr/bin/env bun

/**
 * Fix model configurations for OpenCode and Claude Code
 * This ensures all agents and commands use the correct model format for each platform
 *
 * Usage:
 *   bun run src/cli/fix-models.ts --global          # Fix global Claude Code agents/commands
 *   bun run src/cli/fix-models.ts --global --all-projects  # Fix all OpenCode projects + global
 *   bun run src/cli/fix-models.ts --local           # Fix local project agents/commands
 *   bun run src/cli/fix-models.ts --dry-run        # Preview changes without applying
 *   bun run src/cli/fix-models.ts --verbose        # Show detailed output
 */

import { readFile, writeFile } from 'fs/promises';
import { existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { execSync } from 'child_process';
import { ModelFixer } from '../catalog/model-fixer.js';

interface FixOptions {
  dryRun?: boolean;
  verbose?: boolean;
  global?: boolean;
  allProjects?: boolean;
}

interface FixResult {
  fixed: number;
  skipped: number;
  errors: number;
  details: string[];
}

export async function fixModels(options: FixOptions = {}): Promise<void> {
  const isGlobal = options.global !== false; // Default to global
  const modelFixer = new ModelFixer(process.cwd());

  console.log(`\n🔧 Fixing Model Configurations${isGlobal ? ' (Global)' : ' (Local)'}...\n`);

  if (options.dryRun) {
    console.log('🔍 Dry run mode - no changes will be made\n');
  }

  const results: Record<string, FixResult> = {};

  // Fix models
  if (isGlobal) {
    // Fix OpenCode global directories
    results.openCodeCommands = await fixDirectory(
      join(homedir(), '.config', 'opencode', 'command'),
      'opencode',
      'command',
      modelFixer,
      options
    );

    results.openCodeAgents = await fixDirectory(
      join(homedir(), '.config', 'opencode', 'agent'),
      'opencode',
      'agent',
      modelFixer,
      options
    );

    results.openCodeSkills = await fixDirectory(
      join(homedir(), '.config', 'opencode', 'skills'),
      'opencode',
      'skill',
      modelFixer,
      options
    );

    // Fix Claude Code global directories
    results.claudeCommands = await fixDirectory(
      join(homedir(), '.claude', 'commands'),
      'claude-code',
      'command',
      modelFixer,
      options
    );

    results.claudeAgents = await fixDirectory(
      join(homedir(), '.claude', 'agents'),
      'claude-code',
      'agent',
      modelFixer,
      options
    );

    if (options.allProjects) {
      // Also fix OpenCode agents/commands in all discovered projects
      await fixAllOpenCodeProjects(modelFixer, options, results);
    }
  }

  // Print summary
  printSummary(results, options);
}

async function fixDirectory(
  dirPath: string,
  target: 'claude-code' | 'opencode',
  itemType: 'agent' | 'command' | 'skill',
  modelFixer: ModelFixer,
  options: FixOptions
): Promise<FixResult> {
  const result: FixResult = {
    fixed: 0,
    skipped: 0,
    errors: 0,
    details: [],
  };

  if (!existsSync(dirPath)) {
    if (options.verbose) {
      console.log(`⏭️  Skipping ${dirPath} (directory doesn't exist)`);
    }
    return result;
  }

  const targetName = target === 'claude-code' ? 'Claude Code' : 'OpenCode';
  console.log(`📂 Processing ${targetName} ${itemType}s: ${dirPath}`);

  try {
    const files = readdirSync(dirPath).filter((f) => f.endsWith('.md'));

    for (const file of files) {
      const filePath = join(dirPath, file);

      try {
        const content = await readFile(filePath, 'utf-8');
        const fixedContent = modelFixer.fixModel(content, target, itemType);

        if (content !== fixedContent) {
          if (!options.dryRun) {
            await writeFile(filePath, fixedContent, 'utf-8');
          }
          result.fixed++;
          result.details.push(`✓ Fixed ${file}`);
          if (options.verbose) {
            console.log(`  ✓ Fixed ${file}`);
          }
        } else {
          result.skipped++;
        }
      } catch (error) {
        result.errors++;
        result.details.push(`✗ Error processing ${file}: ${error}`);
        if (options.verbose) {
          console.error(`  ✗ Error processing ${file}: ${error}`);
        }
      }
    }
  } catch (error) {
    console.error(`  ✗ Error reading directory: ${error}`);
  }

  if (result.fixed === 0 && !options.verbose) {
    console.log('  ✓ All models already correct');
  }

  return result;
}

async function fixAllOpenCodeProjects(
  modelFixer: ModelFixer,
  options: FixOptions,
  results: Record<string, FixResult>
): Promise<void> {
  console.log('🔍 Searching for OpenCode projects...');

  try {
    // Find all .opencode directories in user's home directory
    const searchPaths = [
      join(homedir(), 'src'),
      join(homedir(), 'projects'),
      join(homedir(), 'development'),
      homedir(),
    ];

    const opencodeProjects: string[] = [];

    for (const searchPath of searchPaths) {
      if (!existsSync(searchPath)) continue;

      try {
        const output = execSync(
          `find "${searchPath}" -name ".opencode" -type d 2>/dev/null | head -20`,
          { encoding: 'utf-8', maxBuffer: 1024 * 1024 }
        );

        const projects = output
          .trim()
          .split('\n')
          .filter(
            (path) => (path && existsSync(join(path, 'agent'))) || existsSync(join(path, 'command'))
          )
          .map((path) => path.replace('/.opencode', ''));

        opencodeProjects.push(...projects);
      } catch (error) {
        // Find command failed, continue
      }
    }

    if (opencodeProjects.length === 0) {
      console.log('  No OpenCode projects found');
      return;
    }

    console.log(`  Found ${opencodeProjects.length} OpenCode projects`);

    for (let i = 0; i < opencodeProjects.length; i++) {
      const projectPath = opencodeProjects[i];
      const projectName = projectPath.split('/').pop() || `project-${i + 1}`;

      console.log(`\n📂 Processing project: ${projectName}`);

      // Fix agents
      const agentResult = await fixDirectory(
        join(projectPath, '.opencode', 'agent'),
        'opencode',
        'agent',
        modelFixer,
        options
      );

      // Fix commands
      const commandResult = await fixDirectory(
        join(projectPath, '.opencode', 'command'),
        'opencode',
        'command',
        modelFixer,
        options
      );

      results[`openCodeProject_${projectName}_agents`] = agentResult;
      results[`openCodeProject_${projectName}_commands`] = commandResult;
    }
  } catch (error) {
    console.error('  ✗ Error searching for OpenCode projects:', error);
  }
}

function printSummary(results: Record<string, FixResult>, options: FixOptions): void {
  console.log('\n📊 Summary:');
  console.log('═══════════════════════════════════');

  let totalFixed = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  for (const [key, result] of Object.entries(results)) {
    if (result.fixed > 0 || result.errors > 0 || options.verbose) {
      const name = key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^local /, 'Local ')
        .replace(/^open Code/, 'OpenCode')
        .replace(/^claude/, 'Claude')
        .trim();

      console.log(`\n${name}:`);
      console.log(`  Fixed: ${result.fixed}`);
      console.log(`  Skipped: ${result.skipped}`);
      if (result.errors > 0) {
        console.log(`  Errors: ${result.errors}`);
      }
    }

    totalFixed += result.fixed;
    totalSkipped += result.skipped;
    totalErrors += result.errors;
  }

  console.log('\n═══════════════════════════════════');
  console.log(`Total: ${totalFixed} fixed, ${totalSkipped} already correct, ${totalErrors} errors`);

  if (options.dryRun) {
    console.log('\n🔍 Dry run complete - no files were modified');
  } else if (totalFixed > 0) {
    console.log('\n✅ Model configurations fixed successfully!');
    console.log('🎯 Claude Code agents and commands should now work correctly');
    console.log('ℹ️  OpenCode also supports per-project agents/commands with --all-projects');
  } else if (totalErrors === 0) {
    console.log('\n✅ All model configurations are already correct!');
  }

  if (totalErrors > 0) {
    console.log('\n⚠️  Some errors occurred during processing');
    console.log('   Run with --verbose for detailed error information');
  }
}

// CLI entry point
if (import.meta.main) {
  const args = process.argv.slice(2);
  const options: FixOptions = {
    dryRun: args.includes('--dry-run'),
    verbose: args.includes('--verbose') || args.includes('-v'),
    global: !args.includes('--local'),
    allProjects: args.includes('--all-projects'),
  };

  await fixModels(options);
}
