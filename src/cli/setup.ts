import { readdir, mkdir, copyFile, writeFile, readFile } from 'node:fs/promises';
import { join, basename } from 'node:path';
import { existsSync } from 'node:fs';
import { parseAgentsFromDirectory, serializeAgent } from '../conversion/agent-parser.js';
import { FormatConverter } from '../conversion/format-converter.js';

export type SupportedFormat = 'claude-code' | 'opencode';

export function getTargetFormat(setupDir: string): SupportedFormat | null {
  if (setupDir.includes('.claude')) {
    return 'claude-code';
  }
  if (setupDir.includes('.opencode')) {
    return 'opencode';
  }
  return null;
}

function getCommandSourceDirs(sourcePath: string, targetDir: string): string[] {
  const sourceDirs: string[] = [];

  // Primary source: command/ directory
  sourceDirs.push(join(sourcePath, 'command'));

  // Fallback sources based on target format
  if (targetDir.includes('.claude')) {
    // For Claude Code, also check if there are commands in claude-agents or other locations
    sourceDirs.push(join(sourcePath, 'claude-agents'));
  } else if (targetDir.includes('.opencode')) {
    // For OpenCode, check opencode-agents or other locations
    sourceDirs.push(join(sourcePath, 'opencode-agents'));
  }

  return sourceDirs;
}

function getAgentSourceDirs(sourcePath: string, targetFormat: SupportedFormat): string[] {
  const sourceDirs: string[] = [];

  // Primary source: codeflow-agents/ directory (base format)
  sourceDirs.push(join(sourcePath, 'codeflow-agents'));

  // Format-specific fallbacks
  if (targetFormat === 'claude-code') {
    sourceDirs.push(join(sourcePath, 'claude-agents'));
  } else if (targetFormat === 'opencode') {
    sourceDirs.push(join(sourcePath, 'opencode-agents'));
  }

  return sourceDirs;
}

async function copyCommands(
  sourcePath: string,
  targetPath: string,
  setupDirs: string[]
): Promise<number> {
  let fileCount = 0;

  for (const setupDir of setupDirs) {
    const targetDir = join(targetPath, setupDir);

    // Create target directory
    if (!existsSync(targetDir)) {
      await mkdir(targetDir, { recursive: true });
      console.log(`  ✓ Created directory: ${setupDir}`);
    }

    // Copy commands with format-aware source resolution
    if (setupDir.includes('command')) {
      console.log(`📋 Copying commands to ${setupDir}...`);
      const sourceDirs = getCommandSourceDirs(sourcePath, setupDir);
      let commandsCopied = 0;
      let copyErrors = 0;

      for (const sourceDir of sourceDirs) {
        if (existsSync(sourceDir)) {
          try {
            const files = await readdir(sourceDir, { withFileTypes: true });
            for (const file of files) {
              if (file.isFile() && file.name.endsWith('.md')) {
                try {
                  const sourceFile = join(sourceDir, file.name);
                  const targetFile = join(targetDir, file.name);
                  await copyFile(sourceFile, targetFile);
                  commandsCopied++;
                  fileCount++;
                } catch (error: any) {
                  console.error(`❌ Failed to copy ${file.name}: ${error.message}`);
                  copyErrors++;
                }
              }
            }
          } catch (error: any) {
            console.error(`❌ Failed to read source directory ${sourceDir}: ${error.message}`);
          }
        }
      }

      if (commandsCopied === 0) {
        console.log(`⚠️  No command files found for ${setupDir}`);
        console.log(`   Searched: ${sourceDirs.join(', ')}`);
      } else {
        if (copyErrors > 0) {
          console.log(`⚠️  Copied ${commandsCopied} commands, ${copyErrors} failed`);
        } else {
          console.log(`✅ Copied ${commandsCopied} commands`);
        }
      }
    }

    // Copy and convert agents with format-aware source resolution
    if (setupDir.includes('agent')) {
      const targetFormat = getTargetFormat(setupDir);
      if (targetFormat) {
        const count = await copyAgentsWithConversion(sourcePath, targetDir, targetFormat);
        fileCount += count;
      }
    }
  }

  return fileCount;
}

async function copyAgentsWithConversion(
  sourcePath: string,
  targetDir: string,
  targetFormat: SupportedFormat
): Promise<number> {
  console.log(`🔄 Converting agents to ${targetFormat} format...`);

  // Try multiple source directories with format-aware fallbacks
  const sourceDirs = getAgentSourceDirs(sourcePath, targetFormat);
  let sourceDir = null;

  for (const dir of sourceDirs) {
    if (existsSync(dir)) {
      sourceDir = dir;
      console.log(`📂 Using agent source: ${dir}`);
      break;
    }
  }

  if (!sourceDir) {
    console.log(`⚠️  No agent source directory found. Searched: ${sourceDirs.join(', ')}`);
    console.log(`   This is normal if no agents are available for this format.`);
    return 0;
  }

  try {
    // Parse base format agents
    console.log(`📖 Parsing agents from ${sourceDir}...`);
    const { agents, errors: parseErrors } = await parseAgentsFromDirectory(sourceDir, 'base');

    if (parseErrors.length > 0) {
      console.error(`❌ Agent parsing errors (${parseErrors.length}):`);
      parseErrors.forEach((error, index) => {
        console.error(`   ${index + 1}. ${error.message || error}`);
      });
      console.log(`⚠️  Continuing with ${agents.length} successfully parsed agents...`);
    }

    if (agents.length === 0) {
      console.log(`⚠️  No valid agents found in ${sourceDir}`);
      return 0;
    }

    console.log(`✅ Found ${agents.length} agents to convert`);

    // Convert to target format
    console.log(`🔄 Converting ${agents.length} agents to ${targetFormat} format...`);
    const converter = new FormatConverter();
    const convertedAgents = converter.convertBatch(agents, targetFormat);

    if (convertedAgents.length === 0) {
      console.log(`⚠️  No agents were successfully converted`);
      return 0;
    }

    console.log(`✅ Successfully converted ${convertedAgents.length} agents`);

    // Write converted agents
    console.log(`💾 Writing converted agents to ${targetDir}...`);
    let writeCount = 0;
    let writeErrors = 0;

    for (const agent of convertedAgents) {
      try {
        const filename = `${agent.frontmatter.name}.md`;
        const targetFile = join(targetDir, filename);
        const serialized = serializeAgent(agent);
        await writeFile(targetFile, serialized);
        writeCount++;
      } catch (error: any) {
        console.error(`❌ Failed to write ${agent.frontmatter.name}: ${error.message}`);
        writeErrors++;
      }
    }

    if (writeErrors > 0) {
      console.log(`⚠️  ${writeErrors} agents failed to write, ${writeCount} succeeded`);
    } else {
      console.log(`✅ Successfully wrote ${writeCount} agents`);
    }

    return writeCount;
  } catch (error: any) {
    console.error(`❌ Unexpected error during agent conversion: ${error.message}`);
    console.error(`   Source: ${sourceDir}`);
    console.error(`   Target: ${targetDir}`);
    console.error(`   Format: ${targetFormat}`);
    return 0;
  }
}

async function createProjectReadme(projectPath: string, projectType: string): Promise<void> {
  const readmePath = join(projectPath, 'README.md');
  let readmeContent = '';

  if (existsSync(readmePath)) {
    const existingContent = await readFile(readmePath, 'utf-8');
    if (existingContent.includes('## Codeflow Workflow')) {
      return;
    }
    readmeContent = existingContent + '\n\n';
  } else {
    readmeContent = `# ${basename(projectPath)}\n\n`;
  }

  readmeContent += `## Codeflow Workflow

This project supports multiple AI workflow integrations.

`;

  if (projectType === 'claude-code') {
    readmeContent += `### Claude Code Integration

This project is set up for Claude Code with native slash commands.

#### Available Commands

- \`/research\` - Comprehensive codebase and documentation analysis
- \`/plan\` - Create detailed implementation plans
- \`/execute\` - Implement plans with verification
- \`/test\` - Generate comprehensive test suites
- \`/document\` - Create user guides and API documentation
- \`/commit\` - Create structured git commits
- \`/review\` - Validate implementations against plans

Commands are located in \`.claude/commands/\`.

`;
  } else if (projectType === 'opencode') {
    readmeContent += `### OpenCode Integration

This project is set up for MCP integration.

#### Available Tools

- \`research\` - Comprehensive codebase and documentation analysis
- \`plan\` - Create detailed implementation plans
- \`execute\` - Implement plans with verification
- \`test\` - Generate comprehensive test suites
- \`document\` - Create user guides and API documentation
- \`commit\` - Create structured git commits
- \`review\` - Validate implementations against plans

Commands are located in \`.opencode/command/\`.

`;
  }

  await writeFile(readmePath, readmeContent);
  console.log(`  ✓ Updated README.md with ${projectType} usage instructions`);
}

export async function setup(
  projectPath?: string,
  options: { force?: boolean; type?: string; global?: boolean } = {}
) {
  const inputPath = projectPath || process.cwd();

  if (!existsSync(inputPath)) {
    console.error(`❌ Directory does not exist: ${inputPath}`);
    process.exit(1);
  }

  console.log(`🔍 Setting up project: ${inputPath}`);

  // Determine project type and setup directories
  let projectTypes: string[] = [];
  let setupDirs: string[] = [];

  if (options.type) {
    // Explicit type specified
    if (options.type === 'claude-code') {
      projectTypes = ['claude-code'];
      setupDirs = ['.claude/commands', '.claude/agents'];
    } else if (options.type === 'opencode') {
      projectTypes = ['opencode'];
      setupDirs = ['.opencode/command', '.opencode/agent'];
    } else if (options.type === 'general') {
      projectTypes = ['claude-code', 'opencode'];
      setupDirs = ['.claude/commands', '.claude/agents', '.opencode/command', '.opencode/agent'];
    } else {
      console.error(`❌ Invalid type: ${options.type}`);
      console.error('Valid types: claude-code, opencode, general');
      process.exit(1);
    }
  } else {
    // No type specified - detect existing or create both
    const hasClaude = existsSync(join(inputPath, '.claude'));
    const hasOpenCode = existsSync(join(inputPath, '.opencode'));

    if (hasClaude && hasOpenCode) {
      projectTypes = ['claude-code', 'opencode'];
      setupDirs = ['.claude/commands', '.claude/agents', '.opencode/command', '.opencode/agent'];
    } else if (hasClaude) {
      projectTypes = ['claude-code'];
      setupDirs = ['.claude/commands', '.claude/agents'];
    } else if (hasOpenCode) {
      projectTypes = ['opencode'];
      setupDirs = ['.opencode/command', '.opencode/agent'];
    } else {
      // No existing setup - create both
      projectTypes = ['claude-code', 'opencode'];
      setupDirs = ['.claude/commands', '.claude/agents', '.opencode/command', '.opencode/agent'];
    }
  }

  // Check if already set up (unless force is specified)
  if (!options.force) {
    const hasExistingSetup = setupDirs.some((dir) => existsSync(join(inputPath, dir)));
    if (hasExistingSetup) {
      console.log('⚠️  Project appears to already have codeflow setup.');
      console.log('   Use --force to overwrite existing files.');
      return;
    }
  }

  const codeflowDir = join(import.meta.dir, '../..');
  const typeDescription = projectTypes.length > 1 ? 'multi-format' : projectTypes[0];
  console.log(`📦 Setting up ${typeDescription} configuration...\n`);

  try {
    // Copy commands and agents
    const fileCount = await copyCommands(codeflowDir, inputPath, setupDirs);

    // Create/update README for each project type
    for (const projectType of projectTypes) {
      await createProjectReadme(inputPath, projectType);
    }

    console.log(`\n✅ Successfully set up ${typeDescription} project!`);
    console.log(`📁 Installed ${fileCount} files`);

    if (projectTypes.includes('claude-code')) {
      console.log('\n📋 Claude Code setup:');
      console.log('  1. Open this project in Claude Code');
      console.log('  2. Use slash commands: /research, /plan, /execute, etc.');
    }

    if (projectTypes.includes('opencode')) {
      console.log('\n📋 OpenCode setup:');
      console.log('  1. Configure your MCP client');
      console.log('  2. Start MCP server');
      console.log('  3. Use MCP tools: research, plan, execute, etc.');
    }
  } catch (error: any) {
    console.error(`❌ Setup failed: ${error.message}`);
    process.exit(1);
  }
}
