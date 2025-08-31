import { join } from "node:path";
import { existsSync } from "node:fs";
import { writeFile, mkdir } from "node:fs/promises";
import { parseAgentsFromDirectory, serializeAgent } from "../conversion/agent-parser";
import { FormatConverter } from "../conversion/format-converter";
import { AgentValidator } from "../conversion/validator";
import { resolveProjectPath } from "./utils";

interface ConvertOptions {
  source: string;
  target: string;
  format: 'base' | 'claude-code' | 'opencode';
  validate?: boolean;
  dryRun?: boolean;
}

/**
 * Convert agents between different formats
 */
export async function convert(options: ConvertOptions) {
  const { source, target, format, validate = true, dryRun = false } = options;

  console.log(`🔄 Converting agents from ${source} to ${target}`);
  console.log(`📋 Target format: ${format}`);
  if (dryRun) console.log("🔍 Dry run mode - no files will be written");
  console.log("");

  // Validate source directory exists
  if (!existsSync(source)) {
    console.error(`❌ Source directory does not exist: ${source}`);
    process.exit(1);
  }

  // Determine source format based on directory name
  let sourceFormat: 'base' | 'claude-code' | 'opencode';
  if (source.includes('claude-agents')) {
    sourceFormat = 'claude-code';
  } else if (source.includes('opencode-agents')) {
    sourceFormat = 'opencode';
  } else if (source.includes('agent')) {
    sourceFormat = 'base';
  } else {
    console.error(`❌ Cannot determine source format from path: ${source}`);
    console.error("Expected path to contain 'agent', 'claude-agents', or 'opencode-agents'");
    process.exit(1);
  }

  console.log(`📁 Source format: ${sourceFormat}`);

  // Parse agents from source directory
  const { agents, errors: parseErrors } = await parseAgentsFromDirectory(source, sourceFormat);

  if (parseErrors.length > 0) {
    console.error(`❌ Found ${parseErrors.length} parsing errors:`);
    for (const error of parseErrors) {
      console.error(`  • ${error.filePath}: ${error.message}`);
    }
    if (agents.length === 0) {
      process.exit(1);
    }
  }

  if (agents.length === 0) {
    console.log("ℹ️  No agents found to convert");
    return;
  }

  console.log(`📦 Found ${agents.length} agents to convert`);

  // Validate source agents if requested
  if (validate) {
    const validator = new AgentValidator();
    const { results, summary } = validator.validateBatch(agents);

    console.log(`✅ Validation: ${summary.valid} valid, ${summary.errors} errors, ${summary.warnings} warnings`);

    if (summary.errors > 0) {
      console.log("\n⚠️  Validation errors found:");
      for (const result of results) {
        if (result.errors.length > 0) {
          console.log(`  ${result.agent.name}:`);
          for (const error of result.errors) {
            console.log(`    • ${error.message}`);
          }
        }
      }
      console.log("");
    }
  }

  // Convert agents
  const converter = new FormatConverter();
  const convertedAgents = converter.convertBatch(agents, format);

  console.log(`🔄 Converted ${convertedAgents.length} agents to ${format} format`);

  // Validate converted agents if requested
  if (validate) {
    const validator = new AgentValidator();
    const { results, summary } = validator.validateBatch(convertedAgents);

    console.log(`✅ Post-conversion validation: ${summary.valid} valid, ${summary.errors} errors, ${summary.warnings} warnings`);

    if (summary.errors > 0) {
      console.log("\n⚠️  Post-conversion validation errors:");
      for (const result of results) {
        if (result.errors.length > 0) {
          console.log(`  ${result.agent.name}:`);
          for (const error of result.errors) {
            console.log(`    • ${error.message}`);
          }
        }
      }
      console.log("");
    }
  }

  // Test round-trip conversion for a few samples
  const sampleSize = Math.min(5, agents.length);
  const sampleAgents = agents.slice(0, sampleSize);

  console.log(`🔄 Testing round-trip conversion on ${sampleSize} sample agents...`);

  let roundTripErrors = 0;
  for (const agent of sampleAgents) {
    const roundTripResult = converter.testRoundTrip(agent);
    if (!roundTripResult.success) {
      roundTripErrors++;
      console.log(`⚠️  Round-trip issues for ${agent.name}:`);
      for (const error of roundTripResult.errors) {
        console.log(`    • ${error}`);
      }
    }
  }

  if (roundTripErrors === 0) {
    console.log("✅ All round-trip conversions successful");
  } else {
    console.log(`⚠️  ${roundTripErrors}/${sampleSize} agents had round-trip issues`);
  }

  // Write converted agents to target directory
  if (!dryRun) {
    // Create target directory if it doesn't exist
    if (!existsSync(target)) {
      await mkdir(target, { recursive: true });
      console.log(`📁 Created target directory: ${target}`);
    }

    let writeCount = 0;
    let writeErrors = 0;

    for (const agent of convertedAgents) {
      try {
        const filename = `${agent.name}.md`;
        const filePath = join(target, filename);
        const serialized = serializeAgent(agent);

        await writeFile(filePath, serialized);
        writeCount++;
      } catch (error: any) {
        writeErrors++;
        console.error(`❌ Failed to write ${agent.name}: ${error.message}`);
      }
    }

    console.log(`\n✅ Successfully converted ${writeCount} agents`);
    if (writeErrors > 0) {
      console.log(`❌ Failed to write ${writeErrors} agents`);
    }
  } else {
    console.log("\n🔍 Dry run complete - no files were written");
  }

  console.log(`\n📋 Conversion Summary:`);
  console.log(`  Source: ${source} (${sourceFormat})`);
  console.log(`  Target: ${target} (${format})`);
  console.log(`  Agents: ${agents.length} found, ${convertedAgents.length} converted`);
  if (!dryRun) {
    console.log(`  Files: Written to ${target}`);
  }
}

/**
 * Batch convert all agent formats in current project
 */
export async function convertAll(projectPath?: string, options: { validate?: boolean; dryRun?: boolean } = {}) {
  const resolvedPath = resolveProjectPath(projectPath);
  const codeflowDir = join(import.meta.dir, "../..");

  console.log(`🔄 Converting all agent formats for project: ${resolvedPath}`);
  console.log("");

  const conversions = [
    // Convert base to other formats
    { source: join(codeflowDir, "agent"), target: join(codeflowDir, "claude-agents"), format: 'claude-code' as const },
    { source: join(codeflowDir, "agent"), target: join(codeflowDir, "opencode-agents"), format: 'opencode' as const },

    // Convert claude-code to other formats (if it has unique agents)
    { source: join(codeflowDir, "claude-agents"), target: join(codeflowDir, "codeflow-agents"), format: 'base' as const },
    { source: join(codeflowDir, "claude-agents"), target: join(codeflowDir, "opencode-agents"), format: 'opencode' as const },

    // Convert opencode to other formats (if it has unique agents)
    { source: join(codeflowDir, "opencode-agents"), target: join(codeflowDir, "codeflow-agents"), format: 'base' as const },
    { source: join(codeflowDir, "opencode-agents"), target: join(codeflowDir, "claude-agents"), format: 'claude-code' as const }
  ];

  for (const conversion of conversions) {
    if (existsSync(conversion.source)) {
      try {
        await convert({
          source: conversion.source,
          target: conversion.target,
          format: conversion.format,
          validate: options.validate,
          dryRun: options.dryRun
        });
        console.log("");
      } catch (error: any) {
        console.error(`❌ Conversion failed: ${error.message}`);
      }
    } else {
      console.log(`⚠️  Skipping conversion from ${conversion.source} (directory not found)`);
    }
  }
}

/**
 * List differences between agent formats
 */
export async function listDifferences(projectPath?: string) {
  const codeflowDir = join(import.meta.dir, "../..");

  console.log("📊 Analyzing differences between agent formats...\n");

  const directories = [
    { path: join(codeflowDir, "codeflow-agents"), format: 'base' as const },
    { path: join(codeflowDir, "claude-agents"), format: 'claude-code' as const },
    { path: join(codeflowDir, "opencode-agents"), format: 'opencode' as const }
  ];

  const agentsByFormat: Record<string, Set<string>> = {};

  for (const dir of directories) {
    if (existsSync(dir.path)) {
      const { agents } = await parseAgentsFromDirectory(dir.path, dir.format);
      agentsByFormat[dir.format] = new Set(agents.map(a => a.name));
      console.log(`📁 ${dir.format}: ${agents.length} agents`);
    } else {
      agentsByFormat[dir.format] = new Set();
      console.log(`📁 ${dir.format}: directory not found`);
    }
  }

  console.log("");

  // Find unique agents in each format
  const allAgentNames = new Set<string>();
  Object.values(agentsByFormat).forEach(names => {
    names.forEach(name => allAgentNames.add(name));
  });

  const uniqueToFormat: Record<string, string[]> = {
    base: [],
    'claude-code': [],
    opencode: []
  };

  const commonToAll: string[] = [];

  for (const agentName of allAgentNames) {
    const formats = Object.entries(agentsByFormat)
      .filter(([_, names]) => names.has(agentName))
      .map(([format, _]) => format);

    if (formats.length === 3) {
      commonToAll.push(agentName);
    } else if (formats.length === 1) {
      uniqueToFormat[formats[0] as keyof typeof uniqueToFormat].push(agentName);
    }
  }

  console.log("📋 Format Analysis:");
  console.log(`  Common to all formats: ${commonToAll.length}`);
  console.log(`  Unique to base: ${uniqueToFormat.base.length}`);
  console.log(`  Unique to claude-code: ${uniqueToFormat['claude-code'].length}`);
  console.log(`  Unique to opencode: ${uniqueToFormat.opencode.length}`);

  if (uniqueToFormat.opencode.length > 0) {
    console.log("\n📝 Agents unique to OpenCode format:");
    for (const agent of uniqueToFormat.opencode.slice(0, 10)) {
      console.log(`  • ${agent}`);
    }
    if (uniqueToFormat.opencode.length > 10) {
      console.log(`  ... and ${uniqueToFormat.opencode.length - 10} more`);
    }
  }
}
