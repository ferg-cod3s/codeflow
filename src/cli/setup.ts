import { readdir, mkdir, copyFile, stat, writeFile, readFile } from 'node:fs/promises';
import { join, basename } from 'node:path';
import { existsSync } from 'node:fs';
import {
  validatePath,
  secureFileOperation,
  sanitizeInput,
  applyPermissionInheritance,
} from '../security/validation.js';
import { parseAgentsFromDirectory, serializeAgent } from '../conversion/agent-parser.js';
import { FormatConverter } from '../conversion/format-converter.js';
import {
  applyOpenCodePermissionsToDirectory,
  loadRepositoryOpenCodeConfig,
  DEFAULT_OPENCODE_PERMISSIONS,
} from '../security/opencode-permissions.js';

// Strategy Pattern for Agent Setup
export interface AgentSetupStrategy {
  shouldHandle(setupDir: string): boolean;
  setup(
    sourcePath: string,
    targetDir: string,
    projectType: ProjectType,
    permissionConfig?: any
  ): Promise<AgentSetupResult>;
}

export interface AgentSetupResult {
  success: boolean;
  count: number;
  errors: string[];
  warnings: string[];
}

// Configuration-driven format mapping
// Note: claude-agents/ and opencode-agents/ directories have been deprecated
// Agents are now converted on-demand from codeflow-agents/
export const FORMAT_MAPPINGS = {
  '.claude/agents': 'claude-code',
  '.opencode/agent': 'opencode',
  // Future formats can be added here when converter supports them
  // '.cursor/agents': 'cursor',
  // '.windsurf/agents': 'windsurf',
} as const;

export type SupportedFormat = 'base' | 'claude-code' | 'opencode';

// Utility function for format determination
export function getTargetFormat(setupDir: string): SupportedFormat | null {
  for (const [pattern, format] of Object.entries(FORMAT_MAPPINGS)) {
    if (setupDir.includes(pattern.replace('/agents', ''))) {
      return format as SupportedFormat;
    }
  }
  return null;
}

// Command Setup Strategy - handles direct file copying
export class CommandSetupStrategy implements AgentSetupStrategy {
  shouldHandle(setupDir: string): boolean {
    return setupDir.includes('command');
  }

  async setup(
    sourcePath: string,
    targetDir: string,
    projectType: ProjectType,
    permissionConfig?: any
  ): Promise<AgentSetupResult> {
    const result: AgentSetupResult = {
      success: false,
      count: 0,
      errors: [],
      warnings: [],
    };

    try {
      // For commands, always use the command source directory
      const sourceDir = join(sourcePath, 'command');

      if (!existsSync(sourceDir)) {
        result.errors.push(`Source directory not found: ${sourceDir}`);
        return result;
      }

      // Direct copy for commands
      const files = await readdir(sourceDir, { withFileTypes: true });
      for (const file of files) {
        if (file.isFile() && file.name.endsWith('.md')) {
          const sourcefile = join(sourceDir, file.name);
          const targetFile = join(targetDir, file.name);
          await copyFile(sourcefile, targetFile);
          result.count++;
        }
      }

      result.success = true;
    } catch (error: any) {
      result.errors.push(`Command setup failed: ${error.message}`);
    }

    return result;
  }
}

// Agent Setup Strategy - handles conversion
export class AgentSetupStrategyImpl implements AgentSetupStrategy {
  shouldHandle(setupDir: string): boolean {
    return setupDir.includes('agent');
  }

  async setup(
    sourcePath: string,
    targetDir: string,
    projectType: ProjectType,
    permissionConfig?: any
  ): Promise<AgentSetupResult> {
    const result: AgentSetupResult = {
      success: false,
      count: 0,
      errors: [],
      warnings: [],
    };

    try {
      const targetFormat = getTargetFormat(targetDir);
      if (!targetFormat) {
        result.errors.push(`Could not determine target format for: ${targetDir}`);
        return result;
      }

      const sourceDir = join(sourcePath, 'codeflow-agents');
      if (!existsSync(sourceDir)) {
        result.errors.push(`Source directory not found: ${sourceDir}`);
        return result;
      }

      const count = await copyAgentsWithConversion(
        sourceDir,
        targetDir,
        targetFormat,
        permissionConfig
      );
      result.success = true;
      result.count = count;
    } catch (error: any) {
      result.errors.push(`Agent setup failed: ${error.message}`);
    }

    return result;
  }
}

interface ProjectType {
  name: string;
  detector: (projectPath: string) => Promise<boolean>;
  setupDirs: string[];
  description: string;
  additionalSetup?: (projectPath: string) => Promise<void>;
}

const PROJECT_TYPES: ProjectType[] = [
  {
    name: 'claude-code',
    detector: async (path: string) => {
      // Check for Claude Code indicators
      const indicators = ['.claude/claude_config.json', '.claude/commands', 'claude.json'];
      return indicators.some((indicator) => existsSync(join(path, indicator)));
    },
    setupDirs: ['.claude/commands', '.claude/agents'],
    description: 'Claude Code project with native slash commands',
    additionalSetup: async (projectPath: string) => {
      const configPath = join(projectPath, '.claude/claude_config.json');
      if (!existsSync(configPath)) {
        const config = {
          commands: {
            enabled: true,
            directory: 'commands',
          },
        };
        await writeFile(configPath, JSON.stringify(config, null, 2));
        console.log('  ✓ Created Claude Code configuration');
      }
    },
  },
  {
    name: 'opencode',
    detector: async (path: string) => {
      // Check for OpenCode indicators
      const indicators = ['.opencode', '.opencode/agent', '.opencode/command', 'opencode.json'];
      return indicators.some((indicator) => existsSync(join(path, indicator)));
    },
    setupDirs: ['.opencode/command', '.opencode/agent'],
    description: 'OpenCode project with MCP integration',
  },
  {
    name: 'general',
    detector: async () => true, // Always matches as fallback
    setupDirs: ['.opencode/command', '.opencode/agent', '.claude/commands', '.claude/agents'],
    description: 'General project (supports both Claude Code and MCP)',
    additionalSetup: async (projectPath: string) => {
      console.log('  ℹ️  Set up for both Claude Code and MCP compatibility');
      console.log('  ℹ️  Use /commands in Claude Code, or MCP tools in other clients');
    },
  },
];

async function detectProjectType(projectPath: string): Promise<ProjectType> {
  for (const type of PROJECT_TYPES) {
    if (await type.detector(projectPath)) {
      return type;
    }
  }
  return PROJECT_TYPES[PROJECT_TYPES.length - 1]; // fallback to general
}

async function copyAgentsWithConversion(
  sourceDir: string,
  targetDir: string,
  targetFormat: SupportedFormat,
  permissionConfig?: any
): Promise<number> {
  // Parse base format agents
  const { agents, errors: parseErrors } = await parseAgentsFromDirectory(sourceDir, 'base');

  if (parseErrors.length > 0) {
    console.error(`❌ Failed to parse agents from ${sourceDir}:`);
    for (const error of parseErrors) {
      console.error(`  • ${error.filePath}: ${error.message}`);
    }
    return 0;
  }

  if (agents.length === 0) {
    console.log(`⚠️  No agents found in ${sourceDir}`);
    return 0;
  }

  // Convert to target format
  const converter = new FormatConverter();
  const convertedAgents = converter.convertBatch(agents, targetFormat);

  // Serialize and write
  let writeCount = 0;
  for (const agent of convertedAgents) {
    try {
      // Calculate relative path to preserve folder structure
      const relativePath = agent.filePath.replace(sourceDir, '').replace(/^\//, '');
      const pathParts = relativePath.split('/').slice(0, -1); // Remove filename
      const categoryDir = pathParts.length > 0 ? pathParts[0] : null;

      // For Claude agents, preserve folder structure by category
      let targetSubDir = targetDir;
      if (targetFormat === 'claude-code' && categoryDir) {
        targetSubDir = join(targetDir, categoryDir);
        // Ensure the category directory exists
        await mkdir(targetSubDir, { recursive: true });
      }

      const filename = `${agent.frontmatter.name}.md`;
      const targetFile = join(targetSubDir, filename);
      const serialized = serializeAgent(agent);
      await writeFile(targetFile, serialized);

      const displayPath =
        targetFormat === 'claude-code' && categoryDir
          ? `${targetFormat}/${categoryDir}/${filename}`
          : `${targetFormat}/${filename}`;
      console.log(`  ✓ Converted and copied: ${displayPath}`);
      writeCount++;
    } catch (error: any) {
      console.error(`❌ Failed to write ${agent.frontmatter.name}: ${error.message}`);
    }
  }

  // Apply permissions after writing files
  if (targetFormat === 'opencode' && permissionConfig) {
    try {
      console.log(`  🔐 Applying OpenCode permissions to ${targetDir}...`);
      await applyOpenCodePermissionsToDirectory(targetDir, permissionConfig);
      console.log(`  ✅ Applied OpenCode permissions`);
    } catch (error: any) {
      console.log(`  ⚠️  Failed to apply OpenCode permissions: ${error.message}`);
    }
  } else if (permissionConfig) {
    try {
      console.log(`  🔐 Applying standard permissions to ${targetDir}...`);
      await applyPermissionInheritance(targetDir, 'subagent', {
        directories: permissionConfig.osPermissions?.directories || 0o755,
        agentFiles: permissionConfig.osPermissions?.agentFiles || 0o644,
        commandFiles: permissionConfig.osPermissions?.commandFiles || 0o644,
      });
      console.log(`  ✅ Applied standard permissions`);
    } catch (error: any) {
      console.log(`  ⚠️  Failed to apply standard permissions: ${error.message}`);
    }
  }

  return writeCount;
}

// Performance optimizations for large agent sets
async function processAgentsInBatches<T>(
  agents: T[],
  batchSize: number,
  processor: (batch: T[]) => Promise<void>
): Promise<void> {
  for (let i = 0; i < agents.length; i += batchSize) {
    const batch = agents.slice(i, i + batchSize);
    await processor(batch);

    // Optional: Add progress reporting for large sets
    if (agents.length > 50) {
      console.log(
        `  📊 Processed ${Math.min(i + batchSize, agents.length)}/${agents.length} agents`
      );
    }
  }
}

// Memory-efficient streaming for very large agent sets
async function streamAgentConversion(
  sourceDir: string,
  targetDir: string,
  targetFormat: SupportedFormat
): Promise<number> {
  const files = await readdir(sourceDir, { withFileTypes: true });
  const agentFiles = files.filter((f) => f.isFile() && f.name.endsWith('.md'));

  let processedCount = 0;

  for (const file of agentFiles) {
    try {
      // Process one agent at a time to minimize memory usage
      const sourceFile = join(sourceDir, file.name);
      const content = await readFile(sourceFile, 'utf8');

      // Parse single agent
      const frontmatterMatch = content.match(/^---\\s*\\n([\\s\\S]*?)\\n---\\s*\\n/);
      if (frontmatterMatch) {
        const frontmatter = frontmatterMatch[1];
        // Basic validation - could be enhanced
        if (frontmatter.includes('name:')) {
          // Simulate conversion by adding format markers
          const convertedContent = content.replace(
            /^---\\s*\\n([\\s\\S]*?)\\n---\\s*\\n/,
            `---\\n$1\\nformat: ${targetFormat}\\n---\\n`
          );

          const targetFile = join(targetDir, file.name);
          await writeFile(targetFile, convertedContent);
          processedCount++;
        }
      }
    } catch (error: any) {
      console.error(`Failed to process ${file.name}: ${error.message}`);
    }
  }

  return processedCount;
}

async function copyCommands(
  sourcePath: string,
  targetPath: string,
  projectType: ProjectType,
  permissionConfig?: any
): Promise<number> {
  let fileCount = 0;
  const strategies: AgentSetupStrategy[] = [
    new CommandSetupStrategy(),
    new AgentSetupStrategyImpl(),
  ];

  for (const setupDir of projectType.setupDirs) {
    const targetDir = join(targetPath, setupDir);

    // Create target directory
    if (!existsSync(targetDir)) {
      await mkdir(targetDir, { recursive: true });
      console.log(`  ✓ Created directory: ${setupDir}`);
    }

    // Find appropriate strategy and execute
    const strategy = strategies.find((s) => s.shouldHandle(setupDir));
    if (strategy) {
      const result = await strategy.setup(sourcePath, targetDir, projectType, permissionConfig);

      if (result.success) {
        fileCount += result.count;
        console.log(`  ✓ Processed ${result.count} files for ${setupDir}`);
      } else {
        console.log(`  ⚠️  Failed to process ${setupDir}:`);
        result.errors.forEach((error) => console.log(`    • ${error}`));
      }

      if (result.warnings.length > 0) {
        result.warnings.forEach((warning) => console.log(`    ⚠️  ${warning}`));
      }
    } else {
      console.log(`  ⚠️  No strategy found for ${setupDir}`);
    }
  }

  return fileCount;
}

async function createProjectReadme(projectPath: string, projectType: ProjectType): Promise<void> {
  const readmePath = join(projectPath, 'README.md');
  let readmeContent = '';

  if (existsSync(readmePath)) {
    // Check if codeflow section already exists
    const existingContent = await readFile(readmePath, 'utf-8');
    if (existingContent.includes('## Codeflow Workflow')) {
      console.log('  ℹ️  README already contains Codeflow Workflow section');
      return;
    }
    readmeContent = existingContent + '\n\n';
  } else {
    readmeContent = `# ${basename(projectPath)}\n\n`;
  }

  // Add appropriate section based on project type
  if (projectType.name === 'claude-code') {
    readmeContent += `## Codeflow Workflow - Claude Code

This project is set up for Claude Code with native slash commands.

### Available Commands

- \`/research\` - Comprehensive codebase and documentation analysis
- \`/plan\` - Create detailed implementation plans
- \`/execute\` - Implement plans with verification
- \`/test\` - Generate comprehensive test suites
- \`/document\` - Create user guides and API documentation
- \`/commit\` - Create structured git commits
- \`/review\` - Validate implementations against plans

### Usage

Simply use the slash commands directly in Claude Code:

\`\`\`
/research "Analyze the authentication system for potential OAuth integration"

/plan "Create implementation plan based on the research findings"

/execute "Implement the OAuth integration following the plan"
\`\`\`

Commands are located in \`.claude/commands/\` and can be customized for this project.
`;
  } else if (projectType.name === 'opencode') {
    readmeContent += `## Codeflow Workflow - MCP Integration

This project is set up for MCP integration with OpenCode and other compatible AI clients.

### Available Tools

- \`research\` - Comprehensive codebase and documentation analysis
- \`plan\` - Create detailed implementation plans
- \`execute\` - Implement plans with verification
- \`test\` - Generate comprehensive test suites
- \`document\` - Create user guides and API documentation
- \`commit\` - Create structured git commits
- \`review\` - Validate implementations against plans

### MCP Server Setup

1. **Start MCP Server**:
   \`\`\`bash
   # From this project directory
   bun run /path/to/codeflow/mcp/codeflow-server.mjs
   \`\`\`

2. **Configure AI Client** (e.g., Claude Desktop):
   \`\`\`json
   {
     "mcpServers": {
       "codeflow-tools": {
         "command": "bun",
         "args": ["run", "/path/to/codeflow/mcp/codeflow-server.mjs"]
       }
     }
   }
   \`\`\`

### Usage

Use MCP tools in your AI client:

\`\`\`
Use tool: research
Input: "Analyze the authentication system for potential OAuth integration"

Use tool: plan
Input: "Create implementation plan based on the research findings"

Use tool: execute
Input: "Implement the OAuth integration following the plan"
\`\`\`

Commands are located in \`.opencode/command/\` and can be customized for this project.
`;
  } else {
    readmeContent += `## Codeflow Workflow - Multi-Platform

This project supports both Claude Code and MCP integration.

### Claude Code Users

Use native slash commands:
- \`/research\`, \`/plan\`, \`/execute\`, \`/test\`, \`/document\`, \`/commit\`, \`/review\`

Commands are in \`.claude/commands/\`.

### Other AI Platforms (OpenCode, Claude Desktop, etc.)

Use MCP tools:
- \`research\`, \`plan\`, \`execute\`, \`test\`, \`document\`, \`commit\`, \`review\`

**Setup MCP Server**:
\`\`\`bash
bun run /path/to/codeflow/mcp/codeflow-server.mjs
\`\`\`

Commands are in \`.opencode/command/\`.

### Universal Workflow

1. **Research** → 2. **Plan** → 3. **Execute** → 4. **Test** → 5. **Document** → 6. **Commit** → 7. **Review**
`;
  }

  await writeFile(readmePath, readmeContent);
  console.log('  ✓ Updated README.md with usage instructions');
}

export async function setup(
  projectPath: string | undefined,
  options: { force?: boolean; type?: string } = {}
) {
  // Validate and sanitize inputs
  if (options.type) {
    options.type = sanitizeInput(options.type);
  }

  // Resolve and validate project path
  const inputPath = projectPath ? projectPath : process.cwd();
  const pathValidation = await validatePath(inputPath);

  if (!pathValidation.isValid) {
    console.error(`❌ Invalid project path: ${pathValidation.error}`);
    process.exit(1);
  }

  const resolvedPath = pathValidation.sanitizedPath!;

  if (!existsSync(resolvedPath)) {
    console.error(`❌ Directory does not exist: ${resolvedPath}`);
    process.exit(1);
  }

  console.log(`🔍 Analyzing project: ${resolvedPath}`);

  // Detect or use specified project type
  let projectType: ProjectType;
  if (options.type) {
    projectType =
      PROJECT_TYPES.find((t) => t.name === options.type) || PROJECT_TYPES[PROJECT_TYPES.length - 1];
    console.log(`📋 Using specified type: ${projectType.description}`);
  } else {
    projectType = await detectProjectType(resolvedPath);
    console.log(`📋 Detected type: ${projectType.description}`);
  }

  // Check if already set up (unless force is specified)
  if (!options.force) {
    const hasExistingSetup = projectType.setupDirs.some((dir) =>
      existsSync(join(resolvedPath, dir))
    );
    if (hasExistingSetup) {
      console.log('⚠️  Project appears to already have codeflow setup.');
      console.log("   Use --force to overwrite, or 'codeflow status .' to check current state.");
      return;
    }
  }

  // Get codeflow source directory
  const codeflowDir = join(import.meta.dir, '../..');

  console.log(`📦 Setting up ${projectType.name} configuration...\n`);

  // Use default OpenCode permission configuration (permissions must be set in agent file frontmatter)
  let opencodePermissions = DEFAULT_OPENCODE_PERMISSIONS;

  try {
    // Copy commands and agents
    const fileCount = await copyCommands(
      codeflowDir,
      resolvedPath,
      projectType,
      opencodePermissions
    );

    // Run additional setup if needed
    if (projectType.additionalSetup) {
      await projectType.additionalSetup(resolvedPath);
    }

    // Create/update README
    await createProjectReadme(resolvedPath, projectType);

    // Ensure .codeflow scaffold exists for developer workflows
    const codeflowScaffoldDirs = ['.codeflow', '.codeflow/agent', '.codeflow/command'];
    for (const d of codeflowScaffoldDirs) {
      const targetDir = join(resolvedPath, d);
      if (!existsSync(targetDir)) {
        await mkdir(targetDir, { recursive: true });
        console.log(`  ✓ Created directory: ${d}`);
      }
    }

    // Create appropriate .gitignore entries
    const gitignorePath = join(resolvedPath, '.gitignore');
    let gitignoreContent = '';

    if (existsSync(gitignorePath)) {
      gitignoreContent = await readFile(gitignorePath, 'utf-8');
    }

    const neededEntries = [];
    if (
      projectType.setupDirs.some((dir) => dir.includes('.claude')) &&
      !gitignoreContent.includes('!.claude/')
    ) {
      neededEntries.push('# Keep codeflow Claude Code commands', '!.claude/');
    }
    if (
      projectType.setupDirs.some((dir) => dir.includes('.opencode')) &&
      !gitignoreContent.includes('!.opencode/')
    ) {
      neededEntries.push('# Keep codeflow OpenCode commands and agents', '!.opencode/');
    }

    if (neededEntries.length > 0) {
      if (!gitignoreContent.endsWith('\n')) {
        gitignoreContent += '\n';
      }
      gitignoreContent += '\n' + neededEntries.join('\n') + '\n';
      await writeFile(gitignorePath, gitignoreContent);
      console.log('  ✓ Updated .gitignore to preserve codeflow files');
    }

    console.log(`\n✅ Successfully set up ${projectType.name} project!`);
    console.log(`📁 Installed ${fileCount} files`);

    // Show next steps based on project type
    console.log('\n📋 Next steps:');
    if (projectType.name === 'claude-code') {
      console.log('  1. Open this project in Claude Code');
      console.log('  2. Use slash commands: /research, /plan, /execute, etc.');
      console.log('  3. Commands are ready to use immediately!');
    } else if (projectType.name === 'opencode') {
      console.log('  1. Configure your MCP client (Claude Desktop, OpenCode, etc.)');
      console.log('  2. Start MCP server: bun run /path/to/codeflow/mcp/codeflow-server.mjs');
      console.log('  3. Use MCP tools: research, plan, execute, etc.');
    } else {
      console.log('  For Claude Code:');
      console.log('    • Use slash commands: /research, /plan, /execute, etc.');
      console.log('  For other AI platforms:');
      console.log('    • Configure MCP client and start server');
      console.log('    • Use MCP tools: research, plan, execute, etc.');
    }

    console.log('\n🔍 Verify setup: codeflow status .');
  } catch (error: any) {
    console.error(`❌ Setup failed: ${error.message}`);
    process.exit(1);
  }
}
