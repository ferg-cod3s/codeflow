import { join, basename, dirname } from 'node:path';
import { existsSync } from 'node:fs';
import { readdir, mkdir, copyFile, writeFile, readFile } from 'node:fs/promises';
import {
  parseAgentsFromDirectory,
  serializeAgent,
  parseCommandFile,
  serializeCommand,
  Command,
  BaseCommand,
  OpenCodeCommand,
} from '../conversion/agent-parser.ts';
import { FormatConverter } from '../conversion/format-converter.ts';

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

  // Primary source: command/ directory (check in current working directory first)
  const cwdCommandDir = join(process.cwd(), 'command');
  if (existsSync(cwdCommandDir)) {
    sourceDirs.push(cwdCommandDir);
  } else {
    sourceDirs.push(join(sourcePath, 'command'));
  }

  // Fallback sources based on target format
  if (targetDir.includes('.claude')) {
    // For Claude Code, also check if there are commands in claude-agents or other locations
    const cwdClaudeAgentsDir = join(process.cwd(), 'claude-agents');
    if (existsSync(cwdClaudeAgentsDir)) {
      sourceDirs.push(cwdClaudeAgentsDir);
    } else {
      sourceDirs.push(join(sourcePath, 'claude-agents'));
    }
  } else if (targetDir.includes('.opencode')) {
    // For OpenCode, check opencode-agents or other locations
    const cwdOpenCodeAgentsDir = join(process.cwd(), 'opencode-agents');
    if (existsSync(cwdOpenCodeAgentsDir)) {
      sourceDirs.push(cwdOpenCodeAgentsDir);
    } else {
      sourceDirs.push(join(sourcePath, 'opencode-agents'));
    }
  }

  return sourceDirs;
}

async function copyCommands(
  converter: FormatConverter,
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
      console.log(`Source dirs: ${sourceDirs.join(', ')}`);
      let commandsCopied = 0;
      let copyErrors = 0;

      for (const sourceDir of sourceDirs) {
        if (existsSync(sourceDir)) {
          try {
            const files = await readdir(sourceDir, { withFileTypes: true });
            console.log(`Found ${files.length} files in ${sourceDir}`);
            for (const file of files) {
              if (file.isFile() && file.name.endsWith('.md')) {
                try {
                  const sourceFile = join(sourceDir, file.name);
                  const targetFile = join(targetDir, file.name);

                  // Convert command if target is OpenCode
                  if (targetDir.includes('.opencode')) {
                    try {
                      const command = await parseCommandFile(sourceFile, 'base');
                      const convertedCommand = converter.baseCommandToOpenCode(command);
                      const serialized = serializeCommand(convertedCommand);
                      await writeFile(targetFile, serialized);
                    } catch (error: any) {
                      console.error(`❌ Failed to convert command ${file.name}: ${error.message}`);
                      copyErrors++;
                      continue;
                    }
                  } else {
                    await copyFile(sourceFile, targetFile);
                  }
                  commandsCopied++;
                } catch (error: any) {
                  console.error(`❌ Failed to copy command ${file.name}: ${error.message}`);
                  copyErrors++;
                }
              }
            }
          } catch (error: any) {
            console.error(`❌ Failed to read source directory ${sourceDir}: ${error.message}`);
            copyErrors++;
          }
        }
      }

      if (commandsCopied > 0) {
        console.log(`✅ Copied ${commandsCopied} commands`);
      } else {
        console.log(`⚠️  No command files found for ${setupDir}`);
        console.log(`   Searched: ${sourceDirs.join(', ')}`);
      }
      fileCount += commandsCopied;
    }
  }

  return fileCount;
}

export async function setup(
  inputPath: string,
  options: {
    global?: boolean;
    force?: boolean;
    type?: string;
  }
): Promise<void> {
  // Determine project types based on options
  const projectTypes: SupportedFormat[] = [];

  if (options && options.type) {
    if (options.type === 'claude-code' || options.type === 'opencode') {
      projectTypes.push(options.type);
    } else {
      console.error(`❌ Unknown project type: ${options.type}`);
      process.exit(1);
    }
  } else {
    // Default to both if no type specified
    projectTypes.push('claude-code', 'opencode');
  }

  const setupDirs = projectTypes.map((type) => {
    switch (type) {
      case 'claude-code':
        return '.claude/commands';
      case 'opencode':
        return '.opencode/command';
      default:
        return './command';
    }
  });

  const sourcePath = join(process.cwd(), 'command');
  const targetPath = inputPath;

  try {
    console.log(`🚀 Setting up Codeflow for ${projectTypes.join(' and ')}...`);
    console.log(`📁 Source: ${sourcePath}`);
    console.log(`📁 Target: ${targetPath}`);

    // Initialize converter
    const converter = new FormatConverter();

    // Copy commands
    const fileCount = await copyCommands(converter, sourcePath, targetPath, setupDirs);

    // Create agent directories for each platform
    for (const type of projectTypes) {
      const agentDir = type === 'claude-code' ? '.claude/agents' : '.opencode/agent';
      const fullAgentDir = join(targetPath, agentDir);
      if (!existsSync(fullAgentDir)) {
        await mkdir(fullAgentDir, { recursive: true });
        console.log(`  ✓ Created directory: ${agentDir}`);
      }
    }

    // Create or update README
    const readmePath = join(targetPath, 'README.md');
    const typeDescription = projectTypes.length > 1 ? 'multi-platform' : projectTypes[0];
    let readmeContent = '';
    let skipReadmeUpdate = false;

    if (existsSync(readmePath)) {
      readmeContent = await readFile(readmePath, 'utf-8');
      if (readmeContent.includes('Generated by Codeflow CLI')) {
        // Already updated, skip README modification entirely
        console.log(`  ✓ README.md already contains Codeflow workflow documentation`);
        skipReadmeUpdate = true;
      } else {
        readmeContent += '\n\n';
      }
    } else {
      readmeContent = `# ${typeDescription.charAt(0).toUpperCase() + typeDescription.slice(1)} Project\n\n`;
    }

    if (!skipReadmeUpdate) {
      readmeContent += '## Codeflow Workflow\n\n';
      readmeContent += '### Available Commands\n\n';
      readmeContent += '- `/research` - Comprehensive codebase and documentation analysis\n';
      readmeContent += '- `/plan` - Create detailed implementation plans\n';
      readmeContent += '- `/execute` - Implement plans with verification\n';
      readmeContent += '- `/test` - Generate comprehensive test suites\n';
      readmeContent += '- `/document` - Create user guides and API documentation\n';
      readmeContent += '- `/commit` - Create structured git commits\n';
      readmeContent += '- `/review` - Validate implementations against plans\n';
      readmeContent += '- `/project-docs` - Generate complete project documentation\n\n';

      if (projectTypes.includes('claude-code')) {
        readmeContent +=
          '### Claude Code Integration\n\n' + 'Commands are located in `.claude/commands/`.\n\n';
      }

      if (projectTypes.includes('opencode')) {
        readmeContent +=
          '### OpenCode Integration\n\n' + 'Commands are located in `.opencode/command/`.\n';
      }

      readmeContent += '\nGenerated by Codeflow CLI\n';

      await writeFile(readmePath, readmeContent);
      console.log(`  ✓ Created/updated README.md with ${typeDescription} usage instructions`);
    }

    console.log(
      `\n✅ Successfully set up ${projectTypes.length > 1 ? 'multi-platform' : projectTypes[0]} project!`
    );
    console.log(`📁 Installed ${fileCount} files`);
  } catch (error: any) {
    console.error(`❌ Setup failed: ${error.message}`);
    throw error;
  }
}

export function getAgentSourceDirs(sourcePath: string, targetFormat: SupportedFormat): string[] {
  const sourceDirs: string[] = [];

  // Primary source: codeflow-agents directory (check in current working directory first)
  const cwdAgentsDir = join(process.cwd(), 'codeflow-agents');
  if (existsSync(cwdAgentsDir)) {
    sourceDirs.push(cwdAgentsDir);
  } else {
    sourceDirs.push(join(sourcePath, 'codeflow-agents'));
  }

  // Fallback sources based on target format
  if (targetFormat === 'claude-code') {
    const cwdClaudeAgentsDir = join(process.cwd(), 'claude-agents');
    if (existsSync(cwdClaudeAgentsDir)) {
      sourceDirs.push(cwdClaudeAgentsDir);
    } else {
      sourceDirs.push(join(sourcePath, 'claude-agents'));
    }
  } else if (targetFormat === 'opencode') {
    const cwdOpenCodeAgentsDir = join(process.cwd(), 'opencode-agents');
    if (existsSync(cwdOpenCodeAgentsDir)) {
      sourceDirs.push(cwdOpenCodeAgentsDir);
    } else {
      sourceDirs.push(join(sourcePath, 'opencode-agents'));
    }
  }

  return sourceDirs;
}

export async function copyAgentsWithConversion(
  sourcePath: string,
  targetPath: string,
  targetFormat: SupportedFormat
): Promise<number> {
  const converter = new FormatConverter();
  const sourceDirs = getAgentSourceDirs(sourcePath, targetFormat);
  let agentsConverted = 0;

  for (const sourceDir of sourceDirs) {
    if (existsSync(sourceDir)) {
      try {
        const { agents } = await parseAgentsFromDirectory(sourceDir, 'base');
        for (const agent of agents) {
          try {
            const convertedAgent = converter.convert(agent, targetFormat);
            const serialized = serializeAgent(convertedAgent);
            const targetFile = join(targetPath, `${agent.name}.md`);
            await writeFile(targetFile, serialized);
            agentsConverted++;
          } catch (error: any) {
            console.error(`❌ Failed to convert agent ${agent.name}: ${error.message}`);
          }
        }
      } catch (error: any) {
        console.error(`❌ Failed to parse agents from ${sourceDir}: ${error.message}`);
      }
    }
  }

  return agentsConverted;
}
