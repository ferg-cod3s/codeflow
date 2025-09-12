import { join } from 'node:path';
import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { parseAgentsFromDirectory, serializeAgent } from '../conversion/agent-parser';
import { FormatConverter } from '../conversion/format-converter';

export async function convert(source: string, target: string, format: 'claude-code' | 'opencode') {
  console.log(`🔄 Converting agents from ${source} to ${target}`);
  console.log(`📋 Target format: ${format}\n`);

  // Validate source directory exists
  if (!existsSync(source)) {
    console.error(`❌ Source directory does not exist: ${source}`);
    process.exit(1);
  }

  // Parse agents from source directory
  const { agents, errors: parseErrors } = await parseAgentsFromDirectory(source, 'base');

  if (parseErrors.length > 0) {
    console.error(`❌ Failed to parse agents from ${source}`);
    return;
  }

  if (agents.length === 0) {
    console.log('ℹ️  No agents found to convert');
    return;
  }

  console.log(`📦 Found ${agents.length} agents to convert`);

  // Convert agents
  const converter = new FormatConverter();
  const convertedAgents = converter.convertBatch(agents, format);

  console.log(`🔄 Converted ${convertedAgents.length} agents to ${format} format`);

  // Create target directory if it doesn't exist
  if (!existsSync(target)) {
    await mkdir(target, { recursive: true });
    console.log(`📁 Created target directory: ${target}`);
  }

  // Write converted agents
  let writeCount = 0;
  let writeErrors = 0;

  for (const agent of convertedAgents) {
    try {
      const filename = `${agent.frontmatter.name}.md`;
      const filePath = join(target, filename);
      const serialized = serializeAgent(agent);
      await Bun.write(filePath, serialized);
      writeCount++;
    } catch (error: any) {
      writeErrors++;
      console.error(`❌ Failed to write ${agent.frontmatter.name}: ${error.message}`);
    }
  }

  console.log(`\n✅ Successfully converted ${writeCount} agents`);
  if (writeErrors > 0) {
    console.log(`❌ Failed to write ${writeErrors} agents`);
  }

  console.log(`\n📋 Conversion Summary:`);
  console.log(`  Source: ${source}`);
  console.log(`  Target: ${target} (${format})`);
  console.log(`  Agents: ${agents.length} found, ${convertedAgents.length} converted`);
}
