import { join, dirname } from 'node:path';
import { existsSync } from 'node:fs';
import { readdir, mkdir, copyFile, writeFile, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import {
  parseAgentsFromDirectory,
  serializeAgent,
  parseCommandFile,
  serializeCommand,
  Agent,
} from '../conversion/agent-parser.js';
import { FormatConverter } from '../conversion/format-converter.js';
import { CommandConverter } from '../conversion/command-converter.js';

export type SupportedFormat = 'claude-code' | 'opencode' | 'cursor';

function getPackageRoot(): string {
  try {
    // Get the directory of the current module
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    // Go up from src/cli to the package root
    return dirname(dirname(__dirname));
  } catch {
    // Fallback to cwd
    return process.cwd();
  }
}

export function getTargetFormat(setupDir: string): SupportedFormat | null {
  if (setupDir.includes('.cursor')) {
    return 'cursor';
  }
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

export async function copyCommands(
  converter: FormatConverter | CommandConverter,
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

                  // Convert command based on target format
                  if (targetDir.includes('.opencode')) {
                    try {
                      if (converter instanceof CommandConverter) {
                        const content = await readFile(sourceFile, 'utf-8');
                        const convertedContent = converter.convertToOpenCode(content, sourceFile);
                        await writeFile(targetFile, convertedContent);
                      } else {
                        const command = await parseCommandFile(sourceFile, 'base');
                        const convertedCommand = converter.baseCommandToOpenCode(command);
                        const serialized = serializeCommand(convertedCommand);
                        await writeFile(targetFile, serialized);
                      }
                    } catch (error: any) {
                      console.error(`❌ Failed to convert command ${file.name}: ${error.message}`);
                      // copyErrors++;
                      continue;
                    }
                  } else if (targetDir.includes('.claude')) {
                    try {
                      if (converter instanceof CommandConverter) {
                        const content = await readFile(sourceFile, 'utf-8');
                        const convertedContent = converter.convertToClaudeCode(content, sourceFile);
                        await writeFile(targetFile, convertedContent);
                      } else {
                        // For agent converter, just copy as-is for now
                        await copyFile(sourceFile, targetFile);
                      }
                    } catch (error: any) {
                      console.error(`❌ Failed to convert command ${file.name}: ${error.message}`);
                      // copyErrors++;
                      continue;
                    }
                  } else {
                    await copyFile(sourceFile, targetFile);
                  }
                  commandsCopied++;
                } catch (error: any) {
                  console.error(`❌ Failed to copy command ${file.name}: ${error.message}`);
                  // copyErrors++;
                }
              }
            }
          } catch (error: any) {
            console.error(`❌ Failed to read source directory ${sourceDir}: ${error.message}`);
            // copyErrors++;
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
    } else {
      console.log(`🤖 Converting agents to ${setupDir}...`);
      const targetFormat = getTargetFormat(setupDir);
      if (targetFormat) {
        const agentsConverted = await copyAgentsWithConversion(sourcePath, targetDir, targetFormat);
        console.log(`✅ Converted ${agentsConverted} agents`);
        fileCount += agentsConverted;
      } else {
        console.error(`❌ Could not determine target format for ${setupDir}`);
      }
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
    if (
      options.type === 'claude-code' ||
      options.type === 'opencode' ||
      options.type === 'cursor'
    ) {
      projectTypes.push(options.type);
    } else if (options.type === 'all') {
      projectTypes.push('claude-code', 'opencode', 'cursor');
    } else {
      console.error(`❌ Unknown project type: ${options.type}`);
      console.error(`Valid types: claude-code, opencode, cursor, all`);
      process.exit(1);
    }
  } else {
    // Default to all platforms if no type specified
    projectTypes.push('claude-code', 'opencode', 'cursor');
  }

  const setupDirs = projectTypes.flatMap((type) => {
    const dirs = [];
    switch (type) {
      case 'claude-code':
        dirs.push('.claude/commands', '.claude/agents');
        break;
      case 'opencode':
        dirs.push('.opencode/command', '.opencode/agent');
        break;
      case 'cursor':
        dirs.push('.cursor/commands', '.cursor/agents');
        break;
      default:
        dirs.push('./command');
    }
    return dirs;
  });

  const sourcePath = join(process.cwd(), 'command');
  const targetPath = inputPath;

  try {
    console.log(`🚀 Setting up Codeflow for ${projectTypes.join(' and ')}...`);
    console.log(`📁 Source: ${sourcePath}`);
    console.log(`📁 Target: ${targetPath}`);

    // Initialize converters
    const commandConverter = new CommandConverter();

    // Copy commands
    const fileCount = await copyCommands(commandConverter, sourcePath, targetPath, setupDirs);

    // Create or update README (skip if this is the main codeflow project)
    const readmePath = join(targetPath, 'README.md');
    const isMainProject =
      targetPath === process.cwd() && existsSync(join(targetPath, 'package.json'));

    if (!isMainProject) {
      const typeDescription = projectTypes.length > 1 ? 'multi-platform' : projectTypes[0];
      let readmeContent = '';

      if (existsSync(readmePath)) {
        readmeContent = await readFile(readmePath, 'utf-8');
        if (readmeContent.includes('Generated by Codeflow CLI')) {
          // Already updated, skip
        } else {
          readmeContent += '\n\n';
        }
      } else {
        readmeContent = `# ${typeDescription.charAt(0).toUpperCase() + typeDescription.slice(1)} Project\n\n`;
      }

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

      if (projectTypes.includes('cursor')) {
        readmeContent +=
          '### Cursor Integration\n\n' + 'Commands are located in `.cursor/commands/`.\n';
      }

      readmeContent += '\nGenerated by Codeflow CLI\n';

      await writeFile(readmePath, readmeContent);
      console.log(`  ✓ Created/updated README.md with ${typeDescription} usage instructions`);
    } else {
      console.log(`  ✓ Skipped README.md update (main project)`);
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
  const packageRoot = getPackageRoot();

  // ONLY source: base-agents directory (single source of truth)
  // Pre-converted platform directories (.claude/agents, .opencode/agent, .cursor/agents)
  // are TARGETS, not sources - never include them as sources to avoid double conversion
  // Try in order: cwd, package root, sourcePath
  const baseAgentsCandidates = [
    join(process.cwd(), 'base-agents'),
    join(packageRoot, 'base-agents'),
    join(sourcePath, 'base-agents'),
  ];

  for (const candidate of baseAgentsCandidates) {
    if (existsSync(candidate)) {
      sourceDirs.push(candidate);
      break;
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
        const { agents, errors } = await parseAgentsFromDirectory(sourceDir, 'base');
        console.log(`Found ${agents.length} agents in ${sourceDir}`);
        if (errors.length > 0) {
          console.error(`Parse errors in ${sourceDir}:`, errors);
        }
        for (const item of agents) {
          // Skip commands, only process agents
          if ('mode' in item.frontmatter && item.frontmatter.mode === 'command') {
            continue;
          }
          const agent = item as Agent;
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
