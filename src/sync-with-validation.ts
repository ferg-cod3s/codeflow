#!/usr/bin/env bun

/**
 * Enhanced Sync Script with YAML Validation
 * Ensures all files have valid YAML before syncing to local and global directories
 */

import { readdir, readFile, writeFile, mkdir, copyFile, stat } from 'fs/promises';
import { existsSync } from 'fs';
import { join, basename } from 'path';
import { homedir } from 'os';
import { validateMarkdownYAML, fixYAMLFile } from './utils/yaml-validator';

interface SyncOptions {
  global?: boolean;
  fix?: boolean;
  validate?: boolean;
  verbose?: boolean;
}

interface SyncResult {
  copied: number;
  fixed: number;
  skipped: number;
  errors: string[];
}

class SyncManager {
  private projectRoot: string;
  private homeDir: string;

  constructor() {
    this.projectRoot = process.cwd();
    this.homeDir = homedir();
  }

  /**
   * Get all sync paths for both local and global
   */
  private getPaths(global: boolean = false) {
    const base = global ? this.homeDir : this.projectRoot;

    return {
      agents: {
        source: join(this.projectRoot, 'codeflow-agents'),
        claude: join(base, '.claude', 'agents'),
        opencode: join(base, '.opencode', 'agent'),
        globalClaude: join(this.homeDir, '.config', 'claude', 'agents'),
        globalOpenCode: join(this.homeDir, '.config', 'opencode', 'agent'),
      },
      commands: {
        source: join(this.projectRoot, 'command'),
        claude: join(base, '.claude', 'commands'),
        opencode: join(base, '.opencode', 'command'),
        globalClaude: join(this.homeDir, '.config', 'claude', 'commands'),
        globalOpenCode: join(this.homeDir, '.config', 'opencode', 'command'),
      },
    };
  }

  /**
   * Sync a single file with validation
   */
  private async syncFile(
    sourcePath: string,
    targetPath: string,
    options: SyncOptions
  ): Promise<'copied' | 'fixed' | 'skipped' | 'error'> {
    try {
      let wasFixed = false;

      // Validate source file
      if (options.validate !== false) {
        const validation = await validateMarkdownYAML(sourcePath);

        if (!validation.valid) {
          if (options.fix) {
            // Try to fix the source file
            const fixed = await fixYAMLFile(sourcePath);
            if (!fixed) {
              if (options.verbose) {
                console.error(`  ❌ Cannot fix YAML in ${basename(sourcePath)}`);
              }
              return 'error';
            }
            if (options.verbose) {
              console.log(`  🔧 Fixed YAML in ${basename(sourcePath)}`);
            }
            wasFixed = true;
          } else {
            if (options.verbose) {
              console.error(`  ⚠️  Skipping ${basename(sourcePath)} - invalid YAML`);
            }
            return 'skipped';
          }
        } else if (validation.fixed) {
          wasFixed = true;
        }
      }

      // Read the (potentially fixed) source file
      const content = await readFile(sourcePath, 'utf-8');

      // Ensure target directory exists
      const targetDir = join(targetPath, '..');
      if (!existsSync(targetDir)) {
        await mkdir(targetDir, { recursive: true });
      }

      // Write to target
      await writeFile(targetPath, content, 'utf-8');

      if (options.verbose) {
        console.log(`  ✅ ${basename(sourcePath)} → ${targetPath}`);
      }

      return wasFixed ? 'fixed' : 'copied';
    } catch (error: any) {
      if (options.verbose) {
        console.error(`  ❌ Error syncing ${basename(sourcePath)}: ${error.message}`);
      }
      return 'error';
    }
  }

  /**
   * Sync a directory of files
   */
  private async syncDirectory(
    sourceDir: string,
    targetDirs: string[],
    options: SyncOptions
  ): Promise<SyncResult> {
    const result: SyncResult = {
      copied: 0,
      fixed: 0,
      skipped: 0,
      errors: [],
    };

    if (!existsSync(sourceDir)) {
      result.errors.push(`Source directory not found: ${sourceDir}`);
      return result;
    }

    const files = await readdir(sourceDir);
    const mdFiles = files.filter((f) => f.endsWith('.md'));

    for (const file of mdFiles) {
      const sourcePath = join(sourceDir, file);

      for (const targetDir of targetDirs) {
        const targetPath = join(targetDir, file);
        const status = await this.syncFile(sourcePath, targetPath, options);

        switch (status) {
          case 'copied':
            result.copied++;
            break;
          case 'fixed':
            result.fixed++;
            result.copied++;
            break;
          case 'skipped':
            result.skipped++;
            break;
          case 'error':
            result.errors.push(`Failed to sync ${file} to ${targetDir}`);
            break;
        }
      }
    }

    return result;
  }

  /**
   * Main sync function
   */
  async sync(options: SyncOptions = {}): Promise<void> {
    console.log('🔄 Codeflow Sync with Validation\n');

    const paths = this.getPaths(options.global);
    const results = {
      agents: { copied: 0, fixed: 0, skipped: 0, errors: [] as string[] },
      commands: { copied: 0, fixed: 0, skipped: 0, errors: [] as string[] },
    };

    // Sync agents
    console.log('📦 Syncing agents...');
    const agentTargets = options.global
      ? [paths.agents.globalClaude, paths.agents.globalOpenCode]
      : [paths.agents.claude, paths.agents.opencode];

    const agentResult = await this.syncDirectory(paths.agents.source, agentTargets, options);
    results.agents = agentResult;

    // Sync commands
    console.log('\n📦 Syncing commands...');
    const commandTargets = options.global
      ? [paths.commands.globalClaude, paths.commands.globalOpenCode]
      : [paths.commands.claude, paths.commands.opencode];

    const commandResult = await this.syncDirectory(paths.commands.source, commandTargets, options);
    results.commands = commandResult;

    // Print summary
    console.log('\n📊 Sync Summary:');
    console.log('─'.repeat(40));

    const totalCopied = results.agents.copied + results.commands.copied;
    const totalFixed = results.agents.fixed + results.commands.fixed;
    const totalSkipped = results.agents.skipped + results.commands.skipped;
    const totalErrors = results.agents.errors.length + results.commands.errors.length;

    console.log(`✅ Copied: ${totalCopied} files`);
    if (totalFixed > 0) {
      console.log(`🔧 Fixed: ${totalFixed} files`);
    }
    if (totalSkipped > 0) {
      console.log(`⏭️  Skipped: ${totalSkipped} files (invalid YAML)`);
    }
    if (totalErrors > 0) {
      console.log(`❌ Errors: ${totalErrors}`);

      if (results.agents.errors.length > 0) {
        console.log('\nAgent sync errors:');
        results.agents.errors.forEach((err) => console.log(`  - ${err}`));
      }

      if (results.commands.errors.length > 0) {
        console.log('\nCommand sync errors:');
        results.commands.errors.forEach((err) => console.log(`  - ${err}`));
      }
    }

    if (options.global) {
      console.log('\n✨ Global sync complete!');
      console.log('   Files synced to ~/.config/claude and ~/.config/opencode');
    } else {
      console.log('\n✨ Local sync complete!');
      console.log('   Files synced to .claude and .opencode directories');
    }

    if (totalSkipped > 0 && !options.fix) {
      console.log('\n💡 Tip: Use --fix flag to automatically fix YAML issues');
    }
  }

  /**
   * Validate all files without syncing
   */
  async validateAll(): Promise<void> {
    console.log('🔍 Validating all files...\n');

    const paths = this.getPaths();
    let hasErrors = false;

    // Validate agents
    console.log('📦 Validating agents...');
    const agentFiles = existsSync(paths.agents.source) ? await readdir(paths.agents.source) : [];

    for (const file of agentFiles.filter((f) => f.endsWith('.md'))) {
      const filePath = join(paths.agents.source, file);
      const result = await validateMarkdownYAML(filePath);

      if (!result.valid) {
        console.log(`  ❌ ${file}: ${result.errors.join(', ')}`);
        hasErrors = true;
      } else if (result.warnings.length > 0) {
        console.log(`  ⚠️  ${file}: ${result.warnings.join(', ')}`);
      } else {
        console.log(`  ✅ ${file}`);
      }
    }

    // Validate commands
    console.log('\n📦 Validating commands...');
    const commandFiles = existsSync(paths.commands.source)
      ? await readdir(paths.commands.source)
      : [];

    for (const file of commandFiles.filter((f) => f.endsWith('.md'))) {
      const filePath = join(paths.commands.source, file);
      const result = await validateMarkdownYAML(filePath);

      if (!result.valid) {
        console.log(`  ❌ ${file}: ${result.errors.join(', ')}`);
        hasErrors = true;
      } else if (result.warnings.length > 0) {
        console.log(`  ⚠️  ${file}: ${result.warnings.join(', ')}`);
      } else {
        console.log(`  ✅ ${file}`);
      }
    }

    if (hasErrors) {
      console.log('\n❌ Validation failed! Use --fix flag to auto-fix issues.');
      process.exit(1);
    } else {
      console.log('\n✅ All files have valid YAML!');
    }
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help')) {
    console.log(`
Codeflow Sync with Validation

Usage:
  bun run sync-with-validation.ts [options]

Options:
  --global      Sync to global directories (~/.config/claude and ~/.config/opencode)
  --fix         Automatically fix YAML issues before syncing
  --validate    Validate all files without syncing
  --no-validate Skip validation (not recommended)
  --verbose     Show detailed output
  --help        Show this help message

Examples:
  bun run sync-with-validation.ts              # Local sync with validation
  bun run sync-with-validation.ts --global     # Global sync with validation
  bun run sync-with-validation.ts --fix        # Fix YAML issues and sync
  bun run sync-with-validation.ts --validate   # Validate only, don't sync
`);
    process.exit(0);
  }

  const manager = new SyncManager();

  if (args.includes('--validate')) {
    await manager.validateAll();
  } else {
    const options: SyncOptions = {
      global: args.includes('--global'),
      fix: args.includes('--fix'),
      validate: !args.includes('--no-validate'),
      verbose: args.includes('--verbose'),
    };

    await manager.sync(options);
  }
}

// Run if called directly
if (import.meta.main) {
  main().catch((error) => {
    console.error('❌ Sync failed:', error.message);
    process.exit(1);
  });
}
