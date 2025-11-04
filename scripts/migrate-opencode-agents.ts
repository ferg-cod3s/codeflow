#!/usr/bin/env bun

/**
 * Migration script to flatten OpenCode agent directory structure
 *
 * This script fixes the issue where OpenCode agents are organized in subdirectories,
 * which is invalid according to OpenCode's requirements. OpenCode expects a flat
 * structure where all agent files are directly in the ~/.config/opencode/agent/ directory.
 */

import { readdir, stat, writeFile, mkdir, rm } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { homedir } from 'os';
import { getGlobalPaths } from '../src/cli/global.js';

interface MigrationResult {
  movedAgents: string[];
  removedDirs: string[];
  errors: string[];
  backupPath?: string;
}

class OpenCodeAgentMigrator {
  private opencodeAgentDir: string;
  private backupDir: string;

  constructor() {
    const globalPaths = getGlobalPaths();
    this.opencodeAgentDir = globalPaths.agents.opencode;
    this.backupDir = path.join(path.dirname(this.opencodeAgentDir), 'agent.backup');
  }

  /**
   * Check if migration is needed
   */
  async needsMigration(): Promise<boolean> {
    if (!existsSync(this.opencodeAgentDir)) {
      console.log('❌ OpenCode agent directory does not exist');
      console.log(`   Expected: ${this.opencodeAgentDir}`);
      return false;
    }

    try {
      const entries = await readdir(this.opencodeAgentDir);
      // Check for subdirectories
      const subdirs = [];
      for (const entry of entries) {
        const fullPath = path.join(this.opencodeAgentDir, entry);
        try {
          const stats = await stat(fullPath);
          if (stats.isDirectory()) {
            subdirs.push(entry);
          }
        } catch {
          // Ignore errors
        }
      }

      return subdirs.length > 0;
    } catch (error) {
      console.error(`Error checking directory: ${(error as Error).message}`);
      return false;
    }
  }

  /**
   * Create backup before migration
   */
  async createBackup(): Promise<string> {
    console.log('📦 Creating backup...');

    if (existsSync(this.backupDir)) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      this.backupDir = `${this.backupDir}-${timestamp}`;
    }

    await mkdir(this.backupDir, { recursive: true });

    // Copy entire directory to backup
    await this.copyDirectory(this.opencodeAgentDir, this.backupDir);

    console.log(`✅ Backup created: ${this.backupDir}`);
    return this.backupDir;
  }

  /**
   * Copy directory recursively
   */
  private async copyDirectory(src: string, dest: string): Promise<void> {
    const { copyFile, readdir } = await import('fs/promises');

    await mkdir(dest, { recursive: true });
    const entries = await readdir(src);

    for (const entry of entries) {
      const srcPath = path.join(src, entry);
      const destPath = path.join(dest, entry);
      const stats = await stat(srcPath);

      if (stats.isDirectory()) {
        await this.copyDirectory(srcPath, destPath);
      } else {
        await copyFile(srcPath, destPath);
      }
    }
  }

  /**
   * Perform the migration
   */
  async migrate(): Promise<MigrationResult> {
    const result: MigrationResult = {
      movedAgents: [],
      removedDirs: [],
      errors: [],
    };

    console.log('🔄 Starting OpenCode agent migration...');
    console.log(`   Source: ${this.opencodeAgentDir}`);

    try {
      // Create backup first
      result.backupPath = await this.createBackup();

      // Find all agent files in subdirectories
      const entries = await readdir(this.opencodeAgentDir);

      for (const entry of entries) {
        const entryPath = path.join(this.opencodeAgentDir, entry);

        try {
          const stats = await stat(entryPath);

          if (stats.isDirectory()) {
            // Process subdirectory
            await this.processSubdirectory(entry, entryPath, result);
          } else if (entry.endsWith('.md')) {
            console.log(`✅ Agent already in correct location: ${entry}`);
          }
        } catch (error) {
          result.errors.push(`Failed to process ${entry}: ${(error as Error).message}`);
        }
      }

      // Remove empty subdirectories
      await this.cleanupEmptyDirectories(result);

      console.log('\n📊 Migration Summary:');
      console.log(`  Agents moved: ${result.movedAgents.length}`);
      console.log(`  Directories removed: ${result.removedDirs.length}`);
      console.log(`  Errors: ${result.errors.length}`);

      if (result.errors.length > 0) {
        console.log('\n❌ Errors encountered:');
        result.errors.forEach((error) => console.log(`  • ${error}`));
      }

      if (result.movedAgents.length > 0) {
        console.log('\n✅ Moved agents:');
        result.movedAgents.forEach((agent) => console.log(`  • ${agent}`));
      }
    } catch (error) {
      result.errors.push(`Migration failed: ${(error as Error).message}`);
    }

    return result;
  }

  /**
   * Process a subdirectory containing agents
   */
  private async processSubdirectory(
    dirName: string,
    dirPath: string,
    result: MigrationResult
  ): Promise<void> {
    try {
      const entries = await readdir(dirPath);

      for (const entry of entries) {
        if (entry.endsWith('.md')) {
          const srcPath = path.join(dirPath, entry);
          const destPath = path.join(this.opencodeAgentDir, entry);

          // Check if destination already exists
          if (existsSync(destPath)) {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const newName = `${path.parse(entry).name}-${timestamp}.md`;
            const uniqueDestPath = path.join(this.opencodeAgentDir, newName);

            await this.moveAgent(srcPath, uniqueDestPath, `${dirName}/${entry}`, result);
          } else {
            await this.moveAgent(srcPath, destPath, `${dirName}/${entry}`, result);
          }
        }
      }

      // Try to remove the subdirectory if it's empty
      try {
        await rm(dirPath, { recursive: true, force: true });
        result.removedDirs.push(dirName);
        console.log(`🗑️  Removed empty directory: ${dirName}`);
      } catch {
        // Directory might not be empty, that's okay
      }
    } catch (error) {
      result.errors.push(`Failed to process directory ${dirName}: ${(error as Error).message}`);
    }
  }

  /**
   * Move an agent file to the flat structure
   */
  private async moveAgent(
    srcPath: string,
    destPath: string,
    originalLocation: string,
    result: MigrationResult
  ): Promise<void> {
    try {
      const content = await import('fs/promises').then((fs) => fs.readFile(srcPath, 'utf-8'));
      await writeFile(destPath, content);
      result.movedAgents.push(`${originalLocation} → ${path.basename(destPath)}`);
    } catch (error) {
      result.errors.push(`Failed to move ${originalLocation}: ${(error as Error).message}`);
    }
  }

  /**
   * Clean up empty directories after migration
   */
  private async cleanupEmptyDirectories(result: MigrationResult): Promise<void> {
    try {
      const entries = await readdir(this.opencodeAgentDir);

      for (const entry of entries) {
        const entryPath = path.join(this.opencodeAgentDir, entry);

        try {
          const stats = await stat(entryPath);

          if (stats.isDirectory()) {
            // Check if directory is empty
            const subEntries = await readdir(entryPath);

            if (subEntries.length === 0) {
              await rm(entryPath, { recursive: true, force: true });
              result.removedDirs.push(entry);
            }
          }
        } catch {
          // Ignore errors
        }
      }
    } catch (error) {
      result.errors.push(`Cleanup failed: ${(error as Error).message}`);
    }
  }

  /**
   * Rollback migration if needed
   */
  async rollback(): Promise<void> {
    if (!existsSync(this.backupDir)) {
      console.log('❌ No backup found for rollback');
      return;
    }

    console.log('🔄 Rolling back migration...');

    try {
      // Remove current directory
      if (existsSync(this.opencodeAgentDir)) {
        await rm(this.opencodeAgentDir, { recursive: true, force: true });
      }

      // Restore from backup
      await this.copyDirectory(this.backupDir, this.opencodeAgentDir);

      console.log('✅ Rollback completed successfully');
    } catch (error) {
      console.error(`❌ Rollback failed: ${(error as Error).message}`);
    }
  }
}

/**
 * CLI interface
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  const migrator = new OpenCodeAgentMigrator();

  switch (command) {
    case 'check':
      console.log('🔍 Checking if OpenCode agent migration is needed...');
      const needsMigration = await migrator.needsMigration();

      if (needsMigration) {
        console.log('✅ Migration is needed (agents found in subdirectories)');
        console.log('   Run: bun run migrate-opencode-agents migrate');
      } else {
        console.log('✅ No migration needed (agents already in flat structure)');
      }
      break;

    case 'migrate':
      const needsMigrate = await migrator.needsMigration();

      if (!needsMigrate) {
        console.log('✅ No migration needed');
        process.exit(0);
      }

      const result = await migrator.migrate();

      if (result.errors.length === 0) {
        console.log('\n🎉 Migration completed successfully!');
        console.log('   OpenCode agents are now in the correct flat structure');
        console.log(`   Backup available at: ${result.backupPath}`);
      } else {
        console.log('\n⚠️  Migration completed with errors');
        console.log('   Check the errors above and consider running rollback');
        console.log('   Rollback: bun run migrate-opencode-agents rollback');
      }
      break;

    case 'rollback':
      await migrator.rollback();
      break;

    default:
      console.log('OpenCode Agent Migration Tool');
      console.log('');
      console.log('Usage:');
      console.log('  bun run migrate-opencode-agents <command>');
      console.log('');
      console.log('Commands:');
      console.log('  check     - Check if migration is needed');
      console.log('  migrate   - Perform migration to flat structure');
      console.log('  rollback  - Rollback to backup (if available)');
      console.log('');
      console.log('This tool fixes OpenCode agent directory structure issues');
      console.log('by moving agents from subdirectories to a flat structure.');
      break;
  }
}

if (import.meta.main) {
  main().catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  });
}
