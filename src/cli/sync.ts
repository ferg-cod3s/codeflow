import { join } from "node:path";
import { existsSync } from "node:fs";
import { writeFile, readdir } from "node:fs/promises";
import { getGlobalPaths, setupGlobalAgents } from "./global";
import { parseAgentsFromDirectory, serializeAgent } from "../conversion/agent-parser";
import { FormatConverter } from "../conversion/format-converter";
import { AgentValidator } from "../conversion/validator";

interface SyncOptions {
  includeSpecialized?: boolean;
  includeWorkflow?: boolean;
  format?: 'all' | 'base' | 'claude-code' | 'opencode';
  validate?: boolean;
  dryRun?: boolean;
  sourceOfTruth?: 'base' | 'claude-code' | 'opencode' | 'auto';
}

/**
 * Sync agents to global directories with format conversion
 */
export async function syncGlobalAgents(options: SyncOptions = {}) {
  const {
    includeSpecialized = true,
    includeWorkflow = true,
    format = 'all',
    validate = true,
    dryRun = false,
    sourceOfTruth = 'auto'
  } = options;
  
  console.log("🌐 Synchronizing agents to global directories...");
  if (dryRun) console.log("🔍 Dry run mode - no files will be written");
  console.log("");
  
  // Ensure global directories exist
  if (!existsSync(getGlobalPaths().global)) {
    await setupGlobalAgents();
  }
  
  const codeflowDir = join(import.meta.dir, "../..");
  const globalPaths = getGlobalPaths();
  
  // Define all possible source directories
  const allSourceDirs = [
    { path: join(codeflowDir, "agent"), format: 'base' as const },
    { path: join(codeflowDir, "claude-agents"), format: 'claude-code' as const },
    { path: join(codeflowDir, "opencode-agents"), format: 'opencode' as const }
  ];
  
  // Filter source directories based on source-of-truth setting
  let sourceDirs = allSourceDirs;
  if (sourceOfTruth !== 'auto') {
    sourceDirs = allSourceDirs.filter(dir => dir.format === sourceOfTruth);
    console.log(`🎯 Using ${sourceOfTruth} as source of truth`);
  }
  
  // Define target formats to sync
  const targetFormats: ('base' | 'claude-code' | 'opencode')[] = 
    format === 'all' ? ['base', 'claude-code', 'opencode'] : [format];
  
  const converter = new FormatConverter();
  const validator = new AgentValidator();
  
  let totalSynced = 0;
  let totalErrors = 0;
  
  for (const sourceDir of sourceDirs) {
    if (!existsSync(sourceDir.path)) {
      console.log(`⚠️  Skipping ${sourceDir.format}: directory not found`);
      continue;
    }
    
    console.log(`📦 Processing ${sourceDir.format} agents from ${sourceDir.path}`);
    
    // Parse agents from source directory
    const { agents, errors } = await parseAgentsFromDirectory(sourceDir.path, sourceDir.format);
    
    if (errors.length > 0) {
      console.log(`⚠️  Found ${errors.length} parsing errors in ${sourceDir.format}`);
      totalErrors += errors.length;
    }
    
    if (agents.length === 0) {
      console.log(`  ℹ️  No agents found in ${sourceDir.format}`);
      continue;
    }
    
    // Filter agents based on options
    let filteredAgents = agents;
    
    if (!includeSpecialized) {
      // Filter out specialized domain agents (those with underscores in names)
      filteredAgents = agents.filter(agent => !agent.name.includes('_'));
    }
    
    if (!includeWorkflow) {
      // Filter out workflow agents (basic codebase analysis agents)
      const workflowAgents = ['codebase-analyzer', 'codebase-locator', 'codebase-pattern-finder', 'thoughts-analyzer', 'thoughts-locator'];
      filteredAgents = filteredAgents.filter(agent => !workflowAgents.includes(agent.name));
    }
    
    console.log(`  📋 Selected ${filteredAgents.length}/${agents.length} agents for sync`);
    
    // Sync to target formats
    for (const targetFormat of targetFormats) {
      const targetPath = globalPaths.agents[targetFormat === 'claude-code' ? 'claudeCode' : targetFormat];
      
      console.log(`    🔄 Syncing to ${targetFormat} format...`);
      
      let syncCount = 0;
      
      for (const agent of filteredAgents) {
        try {
          // Convert to target format if needed
          let convertedAgent = agent;
          if (agent.format !== targetFormat) {
            convertedAgent = converter.convertTo(agent, targetFormat);
          }
          
          // Validate if requested
          if (validate) {
            const validation = validator.validateAgent(convertedAgent);
            if (!validation.valid) {
              console.log(`    ⚠️  Validation failed for ${agent.name}: ${validation.errors[0]?.message}`);
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
    
    console.log("");
  }
  
  if (dryRun) {
    console.log("🔍 Dry run complete - no files were written");
  } else {
    console.log(`✅ Global sync complete!`);
    
    // Provide MCP restart guidance if agents were synced
    if (totalSynced > 0) {
      console.log("");
      console.log("💡 MCP Server Restart:");
      console.log("   If you're using MCP integration, restart the server to use updated agents:");
      console.log("   codeflow mcp restart");
    }
  }
  
  console.log(`📊 Summary: ${totalSynced} agents synced, ${totalErrors} errors`);
}

/**
 * Check which agents need syncing
 */
export async function checkGlobalSync(): Promise<{
  needsSync: boolean;
  summary: {
    local: { base: number; claudeCode: number; opencode: number };
    global: { base: number; claudeCode: number; opencode: number };
  };
}> {
  const codeflowDir = join(import.meta.dir, "../..");
  const globalPaths = getGlobalPaths();
  
  const summary = {
    local: { base: 0, claudeCode: 0, opencode: 0 },
    global: { base: 0, claudeCode: 0, opencode: 0 }
  };
  
  // Count local agents
  const localDirs = [
    { path: join(codeflowDir, "agent"), key: 'base' as const },
    { path: join(codeflowDir, "claude-agents"), key: 'claudeCode' as const },
    { path: join(codeflowDir, "opencode-agents"), key: 'opencode' as const }
  ];
  
  for (const dir of localDirs) {
    if (existsSync(dir.path)) {
      try {
        const files = await readdir(dir.path);
        summary.local[dir.key] = files.filter(f => f.endsWith('.md') && !f.startsWith('README')).length;
      } catch (e) {
        // Ignore read errors
      }
    }
  }
  
  // Count global agents
  const globalDirs = [
    { path: globalPaths.agents.base, key: 'base' as const },
    { path: globalPaths.agents.claudeCode, key: 'claudeCode' as const },
    { path: globalPaths.agents.opencode, key: 'opencode' as const }
  ];
  
  for (const dir of globalDirs) {
    if (existsSync(dir.path)) {
      try {
        const files = await readdir(dir.path);
        summary.global[dir.key] = files.filter(f => f.endsWith('.md')).length;
      } catch (e) {
        // Ignore read errors
      }
    }
  }
  
  // Simple check: if global has fewer agents than local, needs sync
  const localTotal = summary.local.base + summary.local.claudeCode + summary.local.opencode;
  const globalTotal = summary.global.base + summary.global.claudeCode + summary.global.opencode;
  
  return {
    needsSync: globalTotal < localTotal,
    summary
  };
}

/**
 * Remove agents from global directories
 */
export async function cleanGlobalAgents(options: { confirm?: boolean } = {}) {
  const { confirm = false } = options;
  
  if (!confirm) {
    console.log("⚠️  This will remove all global agents. Use --confirm to proceed.");
    return;
  }
  
  const globalPaths = getGlobalPaths();
  const { rmdir } = await import("node:fs/promises");
  
  console.log("🧹 Cleaning global agent directories...");
  
  for (const [format, path] of Object.entries(globalPaths.agents)) {
    if (existsSync(path)) {
      try {
        await rmdir(path, { recursive: true });
        console.log(`  ✓ Removed ${format} agents`);
      } catch (error: any) {
        console.log(`  ❌ Failed to remove ${format}: ${error.message}`);
      }
    }
  }
  
  console.log("✅ Global agent cleanup complete");
}