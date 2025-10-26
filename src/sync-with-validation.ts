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
import {
  parseAgentFile,
  parseCommandFile,
  serializeAgent,
  serializeCommand,
  Agent,
  Command,
} from './conversion/agent-parser';
import { FormatConverter } from './conversion/format-converter';

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
        source: join(this.projectRoot, 'base-agents'),
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
   * Recursively find all markdown files in a directory
   */
  private async findAllMarkdownFiles(dir: string): Promise<string[]> {
    const files: string[] = [];

    try {
      const entries = await readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(dir, entry.name);

        if (entry.isDirectory()) {
          const subFiles = await this.findAllMarkdownFiles(fullPath);
          files.push(...subFiles);
        } else if (entry.isFile() && entry.name.endsWith('.md')) {
          files.push(fullPath);
        }
      }
    } catch {
      // Directory doesn't exist or can't be read, skip it
    }

    return files;
  }

  /**
   * Determine target format based on target path
   */
  private getTargetFormat(targetPath: string): 'base' | 'claude-code' | 'opencode' | 'cursor' {
    if (targetPath.includes('.claude')) {
      return 'claude-code';
    } else if (targetPath.includes('.opencode')) {
      return 'opencode';
    } else if (targetPath.includes('.cursor')) {
      return 'cursor';
    }
    return 'base';
  }

  /**
   * Check if a file is a command based on its path
   */
  private isCommandFile(filePath: string): boolean {
    // Check if it's in a command directory
    if (filePath.includes('/command/') || filePath.includes('\\command\\')) {
      return true;
    }

    // Check if it's in the command source directory
    const paths = this.getPaths();
    if (filePath.startsWith(paths.commands.source)) {
      return true;
    }

    // Check if it's in the base-agents command directory (if it exists)
    const commandSourcePath = join(this.projectRoot, 'command');
    if (filePath.startsWith(commandSourcePath)) {
      return true;
    }

    return false;
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

      // Determine target format and convert content
      const targetFormat = this.getTargetFormat(targetPath);
      const isCommand = this.isCommandFile(sourcePath);

      let convertedContent: string;
      try {
        if (isCommand) {
          const command = await parseCommandFile(sourcePath, 'base');
          const converter = new FormatConverter();
          const convertedCommand = converter.convert(command as any, targetFormat);
          convertedContent = serializeCommand(convertedCommand as Command);
        } else {
          const agent = await parseAgentFile(sourcePath, 'base');
          const converter = new FormatConverter();
          const convertedAgent = converter.convert(agent, targetFormat);
          convertedContent = serializeAgent(convertedAgent);
        }
      } catch (conversionError: any) {
        if (options.verbose) {
          console.error(
            `  ❌ Conversion failed for ${basename(sourcePath)}: ${conversionError.message}`
          );
        }
        return 'error';
      }

      // Ensure target directory exists
      const targetDir = join(targetPath, '..');
      if (!existsSync(targetDir)) {
        await mkdir(targetDir, { recursive: true });
      }

      // Write converted content to target
      await writeFile(targetPath, convertedContent, 'utf-8');

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

    // Recursively find all .md files in the source directory and subdirectories
    const mdFiles = await this.findAllMarkdownFiles(sourceDir);

    for (const file of mdFiles) {
      // Get the relative path from the source directory to preserve subdirectory structure
      const relativePath = file.replace(sourceDir + '/', '');
      const sourcePath = join(sourceDir, relativePath);

      for (const targetDir of targetDirs) {
        // Ensure the target directory exists
        if (!existsSync(targetDir)) {
          await mkdir(targetDir, { recursive: true });
        }

        const targetPath = join(targetDir, relativePath);
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
