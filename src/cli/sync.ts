import { existsSync } from 'node:fs';
import { writeFile, readdir, copyFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { getGlobalPaths, setupGlobalAgents } from './global';
import { parseAgentsFromDirectory, serializeAgent } from '../conversion/agent-parser';
import { FormatConverter } from '../conversion/format-converter';
import { AgentValidator } from '../conversion/validator';

interface SyncOptions {
  includeSpecialized?: boolean;
  includeWorkflow?: boolean;
  format?: 'all' | 'claude-code' | 'opencode';
  validate?: boolean;
  dryRun?: boolean;
}

/**
 * Sync commands to global directories
 */
async function syncGlobalCommands(): Promise<void> {
  const codeflowDir = join(import.meta.dir, '../..');
  const globalPaths = getGlobalPaths();

  // Source command directory
  const sourceCommandPath = join(codeflowDir, 'command');

  // Target command directory
  const targetCommandPath = globalPaths.commands;

  // Ensure target directory exists
  await mkdir(targetCommandPath, { recursive: true });

  // Check if source directory exists
  if (!existsSync(sourceCommandPath)) {
    console.log(`⚠️  Source command directory not found: ${sourceCommandPath}`);
    return;
  }

  // Get all command files
  const commandFiles = await readdir(sourceCommandPath);
  const mdFiles = commandFiles.filter((file) => file.endsWith('.md'));

  if (mdFiles.length === 0) {
    console.log(`ℹ️  No command files found in ${sourceCommandPath}`);
    return;
  }

  console.log(`📋 Syncing ${mdFiles.length} commands to global directory...`);

  let syncedCount = 0;
  for (const file of mdFiles) {
    try {
      const sourceFile = join(sourceCommandPath, file);
      const targetFile = join(targetCommandPath, file);

      await copyFile(sourceFile, targetFile);
      syncedCount++;
    } catch (error: any) {
      console.log(`❌ Failed to sync command ${file}: ${error.message}`);
    }
  }

  console.log(`✅ Synced ${syncedCount} commands to global directory`);
}

/**
 * Sync agents to global directories with format conversion
 * Now uses single source of truth (codeflow-agents/) approach
 */
export async function syncGlobalAgents(options: SyncOptions = {}) {
  const {
    includeSpecialized = true,
    includeWorkflow = true,
    format = 'all',
    validate = true,
    dryRun = false,
  } = options;

  console.log('🌐 Synchronizing agents to global directories...');
  console.log('🎯 Using single source of truth: codeflow-agents/');
  console.log('⚠️  Deprecated: claude-agents/ and opencode-agents/ moved to /deprecated/');

  if (dryRun) console.log('🔍 Dry run mode - no files will be written');
  console.log('');

  // Ensure global directories exist
  if (!existsSync(getGlobalPaths().global)) {
    await setupGlobalAgents();
  }

  const codeflowDir = join(import.meta.dir, '../..');
  const globalPaths = getGlobalPaths();

  // Use codeflow-agents as the single source of truth
  const sourcePath = join(codeflowDir, 'codeflow-agents');

  // Check if source directory exists
  if (!existsSync(sourcePath)) {
    console.log(`❌ Source directory not found: ${sourcePath}`);
    console.log(`   Please ensure codeflow-agents/ directory exists`);
    process.exit(1);
  }

  console.log(`📦 Processing base agents from ${sourcePath}`);

  // Parse agents from source directory
  const { agents, errors } = await parseAgentsFromDirectory(sourcePath, 'base');

  if (errors.length > 0) {
    console.log(`⚠️  Found ${errors.length} parsing errors`);
    for (const error of errors) {
      console.log(`  • ${error.filePath}: ${error.message}`);
    }
  }

  if (agents.length === 0) {
    console.log(`  ℹ️  No agents found in source directory`);
    return;
  }

  // Filter agents based on options
  let filteredAgents = agents;

  if (!includeSpecialized) {
    // Filter out specialized domain agents (those with underscores in names)
    filteredAgents = agents.filter((agent) => !agent.name.includes('_'));
  }

  if (!includeWorkflow) {
    // Filter out workflow agents (basic codebase analysis agents)
    const workflowAgents = [
      'codebase-analyzer',
      'codebase-locator',
      'codebase-pattern-finder',
      'thoughts-analyzer',
      'thoughts-locator',
    ];
    filteredAgents = filteredAgents.filter((agent) => !workflowAgents.includes(agent.name));
  }

  console.log(`  📋 Selected ${filteredAgents.length}/${agents.length} agents for sync`);

  // Determine target formats to sync
  const targetFormats: ('claude-code' | 'opencode')[] =
    format === 'all'
      ? ['claude-code', 'opencode']
      : format === 'claude-code'
        ? ['claude-code']
        : format === 'opencode'
          ? ['opencode']
          : ['claude-code', 'opencode'];

  let totalSynced = 0;
  let totalErrors = 0;

  // Initialize converter and validator
  const converter = new FormatConverter();
  const validator = new AgentValidator();

  // Sync to target formats
  for (const targetFormat of targetFormats) {
    const targetPath =
      globalPaths.agents[targetFormat === 'claude-code' ? 'claudeCode' : targetFormat];

    console.log(`    🔄 Syncing to ${targetFormat} format...`);

    let syncCount = 0;

    for (const agent of filteredAgents) {
      try {
        // Convert to target format if needed
        let convertedAgent = agent;
        if (agent.format !== targetFormat) {
          convertedAgent = converter.convert(agent, targetFormat);
        }

        // Validate if requested
        if (validate) {
          const validation = validator.validateAgent(convertedAgent);
          if (!validation.valid) {
            console.log(
              `    ⚠️  Validation failed for ${agent.name}: ${validation.errors[0]?.message}`
            );
            totalErrors++;
            continue;
          }
        }

        // Write to global directory
        if (!dryRun) {
          const filename = `${convertedAgent.name}.md`;
          const filePath = join(targetPath, filename);
          const serialized = serializeAgent(convertedAgent);

          await writeFile(filePath, serialized);
        }

        syncCount++;
      } catch (error: any) {
        console.log(`    ❌ Failed to sync ${agent.name}: ${error.message}`);
        totalErrors++;
      }
    }

    console.log(`    ✅ Synced ${syncCount} agents to ${targetFormat}`);
    totalSynced += syncCount;
  }

  // Sync commands to global directory
  if (!dryRun) {
    console.log('');
    await syncGlobalCommands();
  }

  if (dryRun) {
    console.log('🔍 Dry run complete - no files were written');
  } else {
    console.log(`✅ Global sync complete!`);

    // Provide MCP restart guidance if agents were synced
    if (totalSynced > 0) {
      console.log('');
      console.log('💡 MCP Server Restart:');
      console.log("   If you're using MCP integration, restart the server to use updated agents:");
      console.log('   codeflow mcp restart');
    }
  }

  console.log(`📊 Summary: ${totalSynced} agents synced, ${totalErrors} errors`);
}

/**
 * Check which agents need syncing (updated for single source approach)
 */
export async function checkGlobalSync(): Promise<{
  needsSync: boolean;
  summary: {
    source: number;
    global: { claudeCode: number; opencode: number };
  };
}> {
  const codeflowDir = join(import.meta.dir, '../..');
  const globalPaths = getGlobalPaths();

  const summary = {
    source: 0,
    global: { claudeCode: 0, opencode: 0 },
  };

  // Count source agents
  const sourcePath = join(codeflowDir, 'codeflow-agents');
  if (existsSync(sourcePath)) {
    try {
      const { agents } = await parseAgentsFromDirectory(sourcePath, 'base');
      summary.source = agents.length;
    } catch (e) {
      // Ignore parse errors
    }
  }

  // Count global agents
  const globalDirs = [
    { path: globalPaths.agents.claudeCode, key: 'claudeCode' as const },
    { path: globalPaths.agents.opencode, key: 'opencode' as const },
  ];

  for (const dir of globalDirs) {
    if (existsSync(dir.path)) {
      try {
        const files = await readdir(dir.path);
        summary.global[dir.key] = files.filter(
          (f: string) => f.endsWith('.md') && !f.startsWith('README')
        ).length;
      } catch (e) {
        // Ignore read errors
      }
    }
  }

  // Check if sync is needed
  const needsSync =
    summary.source !== summary.global.claudeCode || summary.source !== summary.global.opencode;

  return { needsSync, summary };
}
