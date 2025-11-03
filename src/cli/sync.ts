import { existsSync } from 'node:fs';
import { readdir, copyFile, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parseAgentsFromDirectory, serializeAgent, Agent } from '../conversion/agent-parser.js';
import { FormatConverter } from '../conversion/format-converter.js';
import { CanonicalSyncer } from '../sync/canonical-syncer.js';
import { homedir } from 'node:os';
// import { parse as loadYaml } from 'yaml';
import { CommandValidator } from '../yaml/command-validator.js';
import { getCodeflowRoot } from '../utils/path-resolver.js';
import { SyncManager } from '../sync-with-validation.js';
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
 * Validate if a markdown file is a valid command file
 */
async function isValidCommandFile(filePath: string): Promise<boolean> {
  try {
    const validator = new CommandValidator();
    const result = await validator.validateFile(filePath, 'opencode');
    return result.valid;
  } catch {
    return false;
  }
}
export async function sync(projectPath?: string, options: SyncOptions = {}) {
  // Determine sync target
  const target = options.target || (options.global ? 'global' : 'project');

  // For global sync, we don't need a specific project path
  const cwd = process.cwd() || '.';
  const resolvedPath = target === 'global' ? homedir() : projectPath || cwd;

  // Check if we should use the new canonical syncer or legacy sync
  const manifestPath = join(cwd, 'AGENT_MANIFEST.json');
  const hasManifest = existsSync(manifestPath);

  if (hasManifest) {
    // Use new canonical syncer for agents
    const syncer = new CanonicalSyncer();

    try {
      const result = await syncer.syncFromCanonical({
        projectPath: target === 'project' ? resolvedPath : undefined,
        target,
        sourceFormat: 'base',
        dryRun: options.dryRun || false,
        force: options.force || false,
      });

      // Report results
      console.log(`🔄 Syncing to ${target} directories...`);

      if (result.synced.length > 0) {
        console.log(`\n✅ Synced ${result.synced.length} files:`);
        result.synced.forEach((sync) => {
          console.log(`  ✓ ${sync.agent}: ${sync.from} → ${sync.to}`);
        });
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
        });
      }

      const totalProcessed = result.synced.length + result.skipped.length + result.errors.length;
      console.log(
        `\n📊 Agent Summary: ${result.synced.length}/${totalProcessed} files synced successfully`
      );
    } catch (error: any) {
      console.error(`❌ Canonical sync failed: ${error.message}`);
      process.exit(1);
    }

    // Always sync skills using SyncManager (even with manifest)
    try {
      const skillsSyncManager = new SyncManager();
      await skillsSyncManager.sync({
        global: target === 'global',
        force: options.force,
        dryRun: options.dryRun,
        verbose: true,
      });
    } catch (error: any) {
      console.error(`❌ Skills sync failed: ${error.message}`);
      // Don't exit for skills sync failure, just report it
    }

    return;
  }

  // Use SyncManager for global sync
  if (target === 'global') {
    const syncManager = new SyncManager();
    await syncManager.sync({
      global: true,
      force: options.force,
      dryRun: options.dryRun,
      verbose: true,
    });
    return;
  }

  if (!existsSync(resolvedPath)) {
    console.error(`❌ Directory does not exist: ${resolvedPath}`);
    process.exit(1);
  }

  const codeflowDir = getCodeflowRoot();
  console.log(`🔄 Syncing from: ${codeflowDir}`);
  console.log(`📦 Syncing to: ${resolvedPath}\n`);

  let totalSynced = 0;

  try {
    // Sync commands
    const sourceCommandDir = join(codeflowDir, 'command');
    const targetCommandDir = join(resolvedPath, '.opencode/command');

    if (existsSync(sourceCommandDir)) {
      // Create target directory
      if (!existsSync(targetCommandDir)) {
        await mkdir(targetCommandDir, { recursive: true });
        console.log(`  ✓ Created directory: .opencode/command`);
      }

      const files = await readdir(sourceCommandDir);
      const mdFiles = files.filter((f) => f.endsWith('.md'));

      for (const file of mdFiles) {
        const sourceFile = join(sourceCommandDir, file);
        const targetFile = join(targetCommandDir, file);

        // Check if target file exists and is corrupted
        const targetExists = existsSync(targetFile);
        let needsOverwrite = !targetExists || options.force;

        if (targetExists && !options.force) {
          // Validate existing target file
          const isValid = await isValidCommandFile(targetFile);
          if (!isValid) {
            console.log(`  ⚠️  Target file corrupted, will overwrite: ${file}`);
            needsOverwrite = true;
          }
        }

        if (needsOverwrite) {
          try {
            await copyFile(sourceFile, targetFile);
            const action = targetExists ? 'Overwrote' : 'Synced';
            console.log(`  ✓ ${action} command: ${file}`);
            totalSynced++;
          } catch (error: any) {
            console.error(`  ❌ Failed to sync command ${file}: ${error.message}`);
          }
        } else {
          console.log(`  ⏭️ Skipped command (already exists): ${file}`);
        }
      }
    }

    // Sync agents
    const sourceAgentDir = join(codeflowDir, 'codeflow-agents');
    const targetAgentDir = join(resolvedPath, '.opencode/agent');

    if (existsSync(sourceAgentDir)) {
      // Create target directory
      if (!existsSync(targetAgentDir)) {
        await mkdir(targetAgentDir, { recursive: true });
        console.log(`  ✓ Created directory: .opencode/agent`);
      }

      // Parse and convert agents
      const { agents, errors: parseErrors } = await parseAgentsFromDirectory(
        sourceAgentDir,
        'base'
      );

      if (parseErrors.length > 0) {
        console.error(`❌ Failed to parse agents from ${sourceAgentDir}`);
        return;
      }

      if (agents.length === 0) {
        console.log(`⚠️  No agents found in ${sourceAgentDir}`);
        return;
      }

      // Convert to OpenCode format (filter out commands)
      const converter = new FormatConverter();
      const agentOnly = agents.filter(
        (item): item is Agent => 'mode' in item.frontmatter && item.frontmatter.mode !== 'command'
      );
      const convertedAgents = converter.convertBatch(agentOnly, 'opencode');

      // Write converted agents
      for (const agent of convertedAgents) {
        try {
          const filename = `${agent.frontmatter.name}.md`;
          const targetFile = join(targetAgentDir, filename);
          const serialized = serializeAgent(agent);
          await writeFile(targetFile, serialized, 'utf-8');
          console.log(`  ✓ Synced agent: ${filename}`);
          totalSynced++;
        } catch (error: any) {
          console.error(`  ❌ Failed to sync agent ${agent.frontmatter.name}: ${error.message}`);
        }
      }
    }

    console.log(`\n✅ Sync complete! ${totalSynced} files synced`);
  } catch (error: any) {
    console.error(`❌ Sync failed: ${error.message}`);
    process.exit(1);
  }
}

export async function syncGlobalAgents(options: SyncOptions = {}) {
  // For now, this is an alias to the main sync function
  // This could be expanded to support global agent synchronization
  return sync(options.projectPath);
}

export async function checkGlobalSync(): Promise<{
  needsSync: boolean;
  needsUpdate: boolean;
  message: string;
}> {
  // This is a placeholder implementation
  // In a full implementation, this would check if global agents need updates
  return {
    needsSync: false,
    needsUpdate: false,
    message: 'Global sync check not fully implemented yet',
  };
}
