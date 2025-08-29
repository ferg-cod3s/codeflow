import { join } from "node:path";
import { existsSync } from "node:fs";
import { writeFile, readdir } from "node:fs/promises";
import { parseAgentsFromDirectory, serializeAgent } from "../conversion/agent-parser";
import { FormatConverter } from "../conversion/format-converter";
import { AgentValidator } from "../conversion/validator";

interface SyncFormatsOptions {
  validate?: boolean;
  dryRun?: boolean;
  direction?: 'to-all' | 'from-opencode' | 'bidirectional';
}

/**
 * Ensure all agent formats have the same agents
 */
export async function syncAllFormats(options: SyncFormatsOptions = {}) {
  const {
    validate = true,
    dryRun = false,
    direction = 'from-opencode'
  } = options;

  console.log("🔄 Synchronizing agents across all formats...");
  console.log(`📋 Direction: ${direction}`);
  if (dryRun) console.log("🔍 Dry run mode - no files will be written");
  console.log("");

  const codeflowDir = join(import.meta.dir, "../..");
  
  const directories = {
    base: join(codeflowDir, "agent"),
    claudeCode: join(codeflowDir, "claude-agents"),
    opencode: join(codeflowDir, "opencode-agents")
  };

  // Parse agents from all directories
  const agentsByFormat: Record<string, any[]> = {};
  const allErrors: any[] = [];

  console.log("📦 Loading agents from all formats...");
  
  for (const [format, path] of Object.entries(directories)) {
    const formatKey = format === 'claudeCode' ? 'claude-code' : format;
    
    if (existsSync(path)) {
      const { agents, errors } = await parseAgentsFromDirectory(path, formatKey as any);
      agentsByFormat[format] = agents;
      allErrors.push(...errors);
      console.log(`  ${format}: ${agents.length} agents`);
      
      if (errors.length > 0) {
        console.log(`    ⚠️  ${errors.length} parsing errors`);
      }
    } else {
      agentsByFormat[format] = [];
      console.log(`  ${format}: directory not found`);
    }
  }

  if (allErrors.length > 0) {
    console.log(`\n⚠️  Total parsing errors: ${allErrors.length}`);
  }

  // Create master agent list based on direction
  let masterAgents: any[] = [];
  let sourceFormat = '';

  switch (direction) {
    case 'from-opencode':
      masterAgents = agentsByFormat.opencode;
      sourceFormat = 'opencode';
      console.log(`\n📋 Using OpenCode as master (${masterAgents.length} agents)`);
      break;
      
    case 'bidirectional':
      // Merge all unique agents
      const allAgents = [
        ...agentsByFormat.base,
        ...agentsByFormat.claudeCode,
        ...agentsByFormat.opencode
      ];
      
      // Remove duplicates by name
      const uniqueAgents = new Map();
      for (const agent of allAgents) {
        if (!uniqueAgents.has(agent.name)) {
          uniqueAgents.set(agent.name, agent);
        }
      }
      
      masterAgents = Array.from(uniqueAgents.values());
      sourceFormat = 'merged';
      console.log(`\n📋 Using merged unique agents (${masterAgents.length} total)`);
      break;
      
    case 'to-all':
    default:
      // Find the format with the most agents
      const counts = {
        base: agentsByFormat.base.length,
        claudeCode: agentsByFormat.claudeCode.length,
        opencode: agentsByFormat.opencode.length
      };
      
      const maxFormat = Object.entries(counts).reduce((a, b) => 
        counts[a[0] as keyof typeof counts] > counts[b[0] as keyof typeof counts] ? a : b
      )[0];
      
      masterAgents = agentsByFormat[maxFormat];
      sourceFormat = maxFormat;
      console.log(`\n📋 Using ${maxFormat} as master (${masterAgents.length} agents)`);
      break;
  }

  // Show what's missing in each format
  console.log("\n📊 Agent coverage analysis:");
  const masterNames = new Set(masterAgents.map(a => a.name));
  
  for (const [format, agents] of Object.entries(agentsByFormat)) {
    const currentNames = new Set(agents.map((a: any) => a.name));
    const missing = Array.from(masterNames).filter(name => !currentNames.has(name));
    const extra = Array.from(currentNames).filter(name => !masterNames.has(name));
    
    console.log(`  ${format}: ${agents.length}/${masterAgents.length} agents`);
    if (missing.length > 0) {
      console.log(`    Missing: ${missing.length} (${missing.slice(0, 3).join(', ')}${missing.length > 3 ? '...' : ''})`);
    }
    if (extra.length > 0 && direction !== 'bidirectional') {
      console.log(`    Extra: ${extra.length} (${extra.slice(0, 3).join(', ')}${extra.length > 3 ? '...' : ''})`);
    }
  }

  // Sync agents to all formats
  const converter = new FormatConverter();
  const validator = new AgentValidator();
  
  let totalSynced = 0;
  let totalErrors = 0;

  console.log("\n🔄 Synchronizing agents...");

  for (const [targetFormat, targetPath] of Object.entries(directories)) {
    const targetFormatKey = targetFormat === 'claudeCode' ? 'claude-code' : targetFormat;
    const currentAgents = agentsByFormat[targetFormat];
    const currentNames = new Set(currentAgents.map((a: any) => a.name));
    
    // Find agents that need to be added
    const missingAgents = masterAgents.filter(agent => !currentNames.has(agent.name));
    
    if (missingAgents.length === 0) {
      console.log(`  ${targetFormat}: Already up to date`);
      continue;
    }

    console.log(`  ${targetFormat}: Adding ${missingAgents.length} missing agents`);

    for (const agent of missingAgents) {
      try {
        // Convert to target format
        let convertedAgent = agent;
        if (agent.format !== targetFormatKey) {
          convertedAgent = converter.convertTo(agent, targetFormatKey as any);
        }

        // Validate if requested
        if (validate) {
          const validation = validator.validateAgent(convertedAgent);
          if (!validation.valid) {
            console.log(`    ⚠️  Validation failed for ${agent.name}: ${validation.errors[0]?.message}`);
            totalErrors++;
            continue;
          }
        }

        // Write to target directory
        if (!dryRun) {
          const filename = `${convertedAgent.name}.md`;
          const filePath = join(targetPath, filename);
          const serialized = serializeAgent(convertedAgent);
          
          await writeFile(filePath, serialized);
        }

        totalSynced++;
        console.log(`    ✓ ${agent.name}`);

      } catch (error: any) {
        console.log(`    ❌ Failed to sync ${agent.name}: ${error.message}`);
        totalErrors++;
      }
    }
  }

  console.log(`\n✅ Format synchronization complete!`);
  console.log(`📊 Summary: ${totalSynced} agents synced, ${totalErrors} errors`);
  
  if (dryRun) {
    console.log("🔍 Dry run complete - no files were written");
  } else if (totalSynced > 0) {
    console.log("");
    console.log("💡 MCP Server Restart:");
    console.log("   If you're using MCP integration, restart the server to use updated agents:");
    console.log("   codeflow mcp restart");
  }

  return {
    synced: totalSynced,
    errors: totalErrors,
    master: masterAgents.length
  };
}

/**
 * Show detailed differences between formats
 */
export async function showFormatDifferences() {
  const codeflowDir = join(import.meta.dir, "../..");
  
  const directories = {
    base: join(codeflowDir, "agent"),
    'claude-code': join(codeflowDir, "claude-agents"),
    opencode: join(codeflowDir, "opencode-agents")
  };

  console.log("📊 Detailed format differences analysis...\n");

  // Parse agents from all directories
  const agentsByFormat: Record<string, any[]> = {};
  
  for (const [format, path] of Object.entries(directories)) {
    if (existsSync(path)) {
      const { agents } = await parseAgentsFromDirectory(path, format as any);
      agentsByFormat[format] = agents;
    } else {
      agentsByFormat[format] = [];
    }
  }

  // Get all unique agent names
  const allNames = new Set<string>();
  for (const agents of Object.values(agentsByFormat)) {
    for (const agent of agents) {
      allNames.add(agent.name);
    }
  }

  console.log("📋 Agent presence by format:\n");

  // Show presence matrix
  const sortedNames = Array.from(allNames).sort();
  const formats = Object.keys(agentsByFormat);
  
  // Header
  console.log(`${'Agent Name'.padEnd(40)} | ${formats.map(f => f.padEnd(12)).join(' | ')}`);
  console.log(`${'-'.repeat(40)} | ${formats.map(() => '-'.repeat(12)).join(' | ')}`);

  // Rows
  for (const name of sortedNames.slice(0, 20)) { // Show first 20 for readability
    const row = name.padEnd(40) + ' | ';
    const presence = formats.map(format => {
      const hasAgent = agentsByFormat[format].some((a: any) => a.name === name);
      return (hasAgent ? '✓' : '✗').padEnd(12);
    }).join(' | ');
    
    console.log(row + presence);
  }

  if (sortedNames.length > 20) {
    console.log(`... and ${sortedNames.length - 20} more agents`);
  }

  // Summary statistics
  console.log(`\n📊 Summary:`);
  for (const [format, agents] of Object.entries(agentsByFormat)) {
    console.log(`  ${format}: ${agents.length} agents`);
  }

  // Find unique agents per format
  console.log(`\n🔍 Unique agents per format:`);
  for (const [format, agents] of Object.entries(agentsByFormat)) {
    const otherAgents = Object.entries(agentsByFormat)
      .filter(([f]) => f !== format)
      .flatMap(([_, a]) => a.map((agent: any) => agent.name));
    
    const unique = agents.filter((agent: any) => !otherAgents.includes(agent.name));
    
    if (unique.length > 0) {
      console.log(`  ${format}: ${unique.length} unique`);
      for (const agent of unique.slice(0, 5)) {
        console.log(`    • ${agent.name}`);
      }
      if (unique.length > 5) {
        console.log(`    ... and ${unique.length - 5} more`);
      }
    } else {
      console.log(`  ${format}: No unique agents`);
    }
  }

  return {
    total: sortedNames.length,
    byFormat: Object.fromEntries(
      Object.entries(agentsByFormat).map(([format, agents]) => [format, agents.length])
    )
  };
}