import { readdir, mkdir, copyFile, stat, writeFile, readFile } from "node:fs/promises";
import { join, basename } from "node:path";
import { existsSync } from "node:fs";
import { validatePath, secureFileOperation, sanitizeInput } from "../security/validation.js";

interface ProjectType {
  name: string;
  detector: (projectPath: string) => Promise<boolean>;
  setupDirs: string[];
  description: string;
  additionalSetup?: (projectPath: string) => Promise<void>;
}

const PROJECT_TYPES: ProjectType[] = [
  {
    name: "claude-code",
    detector: async (path: string) => {
      // Check for Claude Code indicators
      const indicators = [
        ".claude/claude_config.json",
        ".claude/commands",
        "claude.json"
      ];
      return indicators.some(indicator => existsSync(join(path, indicator)));
    },
    setupDirs: [".claude/commands"],
    description: "Claude Code project with native slash commands",
    additionalSetup: async (projectPath: string) => {
      const configPath = join(projectPath, ".claude/claude_config.json");
      if (!existsSync(configPath)) {
        const config = {
          "commands": {
            "enabled": true,
            "directory": "commands"
          }
        };
        await writeFile(configPath, JSON.stringify(config, null, 2));
        console.log("  ✓ Created Claude Code configuration");
      }
    }
  },
  {
    name: "opencode",
    detector: async (path: string) => {
      // Check for OpenCode indicators
      const indicators = [
        ".opencode",
        ".opencode/agent",
        ".opencode/command",
        "opencode.json"
      ];
      return indicators.some(indicator => existsSync(join(path, indicator)));
    },
    setupDirs: [".opencode/command", ".opencode/agent"],
    description: "OpenCode project with MCP integration",
  },
  {
    name: "general",
    detector: async () => true, // Always matches as fallback
    setupDirs: [".opencode/command", ".opencode/agent", ".claude/commands"],
    description: "General project (supports both Claude Code and MCP)",
    additionalSetup: async (projectPath: string) => {
      console.log("  ℹ️  Set up for both Claude Code and MCP compatibility");
      console.log("  ℹ️  Use /commands in Claude Code, or MCP tools in other clients");
    }
  }
];

async function detectProjectType(projectPath: string): Promise<ProjectType> {
  for (const type of PROJECT_TYPES) {
    if (await type.detector(projectPath)) {
      return type;
    }
  }
  return PROJECT_TYPES[PROJECT_TYPES.length - 1]; // fallback to general
}

async function copyCommands(sourcePath: string, targetPath: string, projectType: ProjectType): Promise<number> {
  let fileCount = 0;
  
  for (const setupDir of projectType.setupDirs) {
    const targetDir = join(targetPath, setupDir);
    
    // Create target directory
    if (!existsSync(targetDir)) {
      await mkdir(targetDir, { recursive: true });
      console.log(`  ✓ Created directory: ${setupDir}`);
    }
    
    // Determine source directory based on target
    let sourceDir: string;
    if (setupDir.includes(".claude")) {
      sourceDir = join(sourcePath, "command"); // Claude uses command files
    } else if (setupDir.includes("command")) {
      sourceDir = join(sourcePath, "command");
    } else if (setupDir.includes("agent")) {
      sourceDir = join(sourcePath, "agent");
    } else {
      continue;
    }
    
    if (!existsSync(sourceDir)) {
      console.log(`  ⚠️  Skipping ${setupDir} - source directory not found`);
      continue;
    }
    
    // Copy files
    const files = await readdir(sourceDir, { withFileTypes: true });
    for (const file of files) {
      if (file.isFile() && file.name.endsWith('.md')) {
        const sourcefile = join(sourceDir, file.name);
        const targetFile = join(targetDir, file.name);
        await copyFile(sourcefile, targetFile);
        console.log(`  ✓ Copied: ${setupDir}/${file.name}`);
        fileCount++;
      }
    }
  }
  
  return fileCount;
}

async function createProjectReadme(projectPath: string, projectType: ProjectType): Promise<void> {
  const readmePath = join(projectPath, "README.md");
  let readmeContent = "";
  
  if (existsSync(readmePath)) {
    // Check if codeflow section already exists
    const existingContent = await readFile(readmePath, "utf-8");
    if (existingContent.includes("## Codeflow Workflow")) {
      console.log("  ℹ️  README already contains Codeflow Workflow section");
      return;
    }
    readmeContent = existingContent + "\n\n";
  } else {
    readmeContent = `# ${basename(projectPath)}\n\n`;
  }
  
  // Add appropriate section based on project type
  if (projectType.name === "claude-code") {
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
  } else if (projectType.name === "opencode") {
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
  console.log("  ✓ Updated README.md with usage instructions");
}

export async function setup(projectPath: string | undefined, options: { force?: boolean, type?: string } = {}) {
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
    projectType = PROJECT_TYPES.find(t => t.name === options.type) || PROJECT_TYPES[PROJECT_TYPES.length - 1];
    console.log(`📋 Using specified type: ${projectType.description}`);
  } else {
    projectType = await detectProjectType(resolvedPath);
    console.log(`📋 Detected type: ${projectType.description}`);
  }
  
  // Check if already set up (unless force is specified)
  if (!options.force) {
    const hasExistingSetup = projectType.setupDirs.some(dir => existsSync(join(resolvedPath, dir)));
    if (hasExistingSetup) {
      console.log("⚠️  Project appears to already have codeflow setup.");
      console.log("   Use --force to overwrite, or 'codeflow status .' to check current state.");
      return;
    }
  }
  
  // Get codeflow source directory
  const codeflowDir = join(import.meta.dir, "../..");
  
  console.log(`📦 Setting up ${projectType.name} configuration...\n`);
  
  try {
    // Copy commands and agents
    const fileCount = await copyCommands(codeflowDir, resolvedPath, projectType);
    
    // Run additional setup if needed
    if (projectType.additionalSetup) {
      await projectType.additionalSetup(resolvedPath);
    }
    
    // Create/update README
    await createProjectReadme(resolvedPath, projectType);
    
    // Ensure .codeflow scaffold exists for developer workflows
    const codeflowScaffoldDirs = [".codeflow", ".codeflow/agent", ".codeflow/command"]; 
    for (const d of codeflowScaffoldDirs) {
      const targetDir = join(resolvedPath, d);
      if (!existsSync(targetDir)) {
        await mkdir(targetDir, { recursive: true });
        console.log(`  ✓ Created directory: ${d}`);
      }
    }
    
    // Create appropriate .gitignore entries
    const gitignorePath = join(resolvedPath, ".gitignore");
    let gitignoreContent = "";
    
    if (existsSync(gitignorePath)) {
      gitignoreContent = await readFile(gitignorePath, "utf-8");
    }
    
    const neededEntries = [];
    if (projectType.setupDirs.some(dir => dir.includes(".claude")) && !gitignoreContent.includes("!.claude/")) {
      neededEntries.push("# Keep codeflow Claude Code commands", "!.claude/");
    }
    if (projectType.setupDirs.some(dir => dir.includes(".opencode")) && !gitignoreContent.includes("!.opencode/")) {
      neededEntries.push("# Keep codeflow OpenCode commands and agents", "!.opencode/");
    }
    
    if (neededEntries.length > 0) {
      if (!gitignoreContent.endsWith('\n')) {
        gitignoreContent += '\n';
      }
      gitignoreContent += '\n' + neededEntries.join('\n') + '\n';
      await writeFile(gitignorePath, gitignoreContent);
      console.log("  ✓ Updated .gitignore to preserve codeflow files");
    }
    
    console.log(`\n✅ Successfully set up ${projectType.name} project!`);
    console.log(`📁 Installed ${fileCount} files`);
    
    // Show next steps based on project type
    console.log("\n📋 Next steps:");
    if (projectType.name === "claude-code") {
      console.log("  1. Open this project in Claude Code");
      console.log("  2. Use slash commands: /research, /plan, /execute, etc.");
      console.log("  3. Commands are ready to use immediately!");
    } else if (projectType.name === "opencode") {
      console.log("  1. Configure your MCP client (Claude Desktop, OpenCode, etc.)");
      console.log("  2. Start MCP server: bun run /path/to/codeflow/mcp/codeflow-server.mjs");
      console.log("  3. Use MCP tools: research, plan, execute, etc.");
    } else {
      console.log("  For Claude Code:");
      console.log("    • Use slash commands: /research, /plan, /execute, etc.");
      console.log("  For other AI platforms:");
      console.log("    • Configure MCP client and start server");
      console.log("    • Use MCP tools: research, plan, execute, etc.");
    }
    
    console.log("\n🔍 Verify setup: codeflow status .");
    
  } catch (error: any) {
    console.error(`❌ Setup failed: ${error.message}`);
    process.exit(1);
  }
}