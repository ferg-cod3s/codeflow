import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { CanonicalSyncer } from '../sync/canonical-syncer.js';
import { homedir } from 'node:os';

export interface SyncOptions {
  projectPath?: string;
  force?: boolean;
  verbose?: boolean;
  format?: string;
  validate?: boolean;
  includeSpecialized?: boolean;
  includeWorkflow?: boolean;
  dryRun?: boolean;
  global?: boolean;
  target?: 'project' | 'global' | 'all';
}

/**
 * Unified sync function using CanonicalSyncer
 * Syncs agents, commands, and skills with proper format conversion
 * - OpenCode: Flat structure (no subdirectories)
 * - Claude: Flat or nested structure (both supported)
 */
export async function sync(projectPath?: string, options: SyncOptions = {}) {
  // Determine sync target
  const target = options.target || (options.global ? 'global' : 'project');

  // For global sync, we don't need a specific project path
  const cwd = process.cwd() || '.';
  const resolvedPath = target === 'global' ? homedir() : projectPath || cwd;

  // Check if we have an agent manifest
  const manifestPath = join(cwd, 'AGENT_MANIFEST.json');
  const hasManifest = existsSync(manifestPath);

  if (!hasManifest && target !== 'global') {
    console.error(
      '❌ No AGENT_MANIFEST.json found. This directory does not appear to be a codeflow project.'
    );
    console.log('💡 Run this command from the codeflow project root directory.');
    process.exit(1);
  }

  // Use CanonicalSyncer for all sync operations
  const syncer = new CanonicalSyncer();

  try {
    console.log(`🔄 Syncing to ${target} directories...\n`);

    const result = await syncer.syncFromCanonical({
      projectPath: target === 'project' ? resolvedPath : undefined,
      target,
      sourceFormat: 'base',
      dryRun: options.dryRun || false,
      force: options.force || false,
    });

    // Report results
    if (result.synced.length > 0) {
      console.log(`\n✅ Synced ${result.synced.length} files:`);
      if (options.verbose) {
        result.synced.forEach((sync) => {
          console.log(`  ✓ ${sync.agent}: ${sync.from} → ${sync.to}`);
        });
      }
    }

    if (result.skipped.length > 0 && options.verbose) {
      console.log(`\n⏭️ Skipped ${result.skipped.length} files:`);
      result.skipped.forEach((skip) => {
        console.log(`  ⏭️ ${skip.agent}: ${skip.reason}`);
      });
    }

    if (result.errors.length > 0) {
      console.log(`\n❌ Errors (${result.errors.length}):`);
      result.errors.forEach((error) => {
        console.log(`  ❌ ${error.agent}: ${error.message}`);
        if (error.suggestion && options.verbose) {
          console.log(`     💡 ${error.suggestion}`);
        }
      });
    }

    const totalProcessed = result.synced.length + result.skipped.length + result.errors.length;
    console.log(`\n📊 Summary: ${result.synced.length}/${totalProcessed} files synced successfully`);

    if (result.errors.length > 0) {
      process.exit(1);
    }
  } catch (error: any) {
    console.error(`❌ Sync failed: ${error.message}`);
    if (options.verbose && error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

/**
 * Sync to global directories (alias for backward compatibility)
 */
export async function syncGlobalAgents(options: SyncOptions = {}) {
  return sync(options.projectPath, { ...options, target: 'global' });
}

/**
 * Check if global sync is needed
 */
export async function checkGlobalSync(): Promise<{
  needsSync: boolean;
  needsUpdate: boolean;
  message: string;
}> {
  // This is a placeholder for future implementation
  // Could compare timestamps or hashes to determine if sync is needed
  return {
    needsSync: false,
    needsUpdate: false,
    message: 'Global sync check not fully implemented yet',
  };
}
