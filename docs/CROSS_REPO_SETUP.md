# Cross-Repository MCP Setup Guide



<!-- VERBALIZED SAMPLING INTEGRATION -->
<!-- ================================ -->

**Selected Strategy**: Code-Path Analysis
**Confidence**: 71.0%

**Available Strategies**:
1. **Code-Path Analysis** (Confidence: 71.0%)
   - Plan: Identify entry points and main execution flows, Trace key decision branches and conditional logic...
2. **Pattern Discovery** (Confidence: 71.0%)
   - Plan: Scan codebase for repeated code structures, Identify naming conventions and architectural patterns...
3. **Architecture Mapping** (Confidence: 71.0%)
   - Plan: Identify major components and modules, Map data flow and dependencies between components...


This guide explains how to use the Agentic Workflow MCP server from any repository or project directory.

## Overview

The MCP server is designed to work from any directory by following this priority order:

1. **Current project commands**: `{project}/.opencode/command/`
2. **Claude commands**: `{project}/.claude/commands/`  
3. **Global agentic installation**: `{agentic-repo}/command/`

## Setup Steps

### 1. Install Agentic CLI Globally

```bash
# Clone agentic repo (if not already done)
git clone <agentic-repo-url>
cd agentic

# Install dependencies and link CLI globally
bun install
bun run install
```

### 2. Install Commands to Your Project

From your target project directory:

```bash
# Navigate to your project
cd ~/my-project

# Install agentic commands to your project
agentic pull .

# This creates:
# .opencode/command/research.md
# .opencode/command/plan.md  
# .opencode/command/execute.md
# .opencode/command/test.md
# .opencode/command/document.md
# .opencode/command/commit.md
# .opencode/command/review.md
```

### 3. Configure Claude Desktop MCP

Add to your Claude Desktop MCP settings (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "agentic-tools": {
      "command": "bun",
      "args": ["run", "/full/path/to/agentic/mcp/agentic-server.mjs"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

**Important**: Use the absolute path to your agentic installation.

### 4. Start MCP Server From Project Directory

```bash
# Navigate to your project (where you want to work)
cd ~/my-project

# Start the MCP server from this directory
bun run /path/to/agentic/mcp/agentic-server.mjs

# Or use the npm script (if you're in agentic repo)
cd /path/to/agentic
bun run mcp:server
```

## How It Works

### Path Resolution Logic

The MCP server automatically detects where you're running it from and looks for commands in this order:

```javascript
// 1. Check current working directory for OpenCode commands
const cwdCommandDir = path.join(process.cwd(), ".opencode", "command");

// 2. Check current working directory for Claude commands  
const cwdClaudeCommandDir = path.join(process.cwd(), ".claude", "commands");

// 3. Fall back to agentic installation
const agenticCommandDir = path.join(agenticRoot, "command");
```

### What This Means

- **Run from project**: Uses project-specific commands (customized versions)
- **Run from anywhere**: Falls back to global agentic commands
- **Always works**: At minimum, uses the original agentic commands

## Different Usage Scenarios

### Scenario 1: Per-Project Customization

If you want to customize commands for specific projects:

```bash
cd ~/my-special-project
agentic pull .

# Edit commands for this project's needs
vim .opencode/command/research.md

# Start MCP server from this directory
bun run /path/to/agentic/mcp/agentic-server.mjs
```

The server will use your customized commands.

### Scenario 2: Global Commands

If you want to use standard commands everywhere:

```bash
cd ~/any-project
# No need to run agentic pull

# Start MCP server - will use global commands
bun run /path/to/agentic/mcp/agentic-server.mjs
```

### Scenario 3: Claude Desktop Integration

Configure Claude Desktop once, then switch between projects:

```bash
# Work on project A
cd ~/project-a
# (MCP server automatically finds project-a commands if they exist)

# Work on project B  
cd ~/project-b
# (MCP server automatically finds project-b commands if they exist)
```

## Recommended Workflow

### Option A: Global MCP Server (Recommended)

1. **Start MCP server once** from your main working directory
2. **Switch projects** - MCP server adapts automatically
3. **Customize per project** by running `agentic pull` in specific repos

### Option B: Per-Project MCP Server

1. **Start MCP server** from each project directory
2. **Restart server** when switching projects
3. **More control** but requires manual management

## Testing Your Setup

### 1. Verify Commands Are Available

```bash
cd ~/your-project
ls .opencode/command/
# Should show: research.md, plan.md, execute.md, etc.
```

### 2. Test MCP Server

```bash
cd ~/your-project
bun run /path/to/agentic/mcp/agentic-server.mjs
# Should start without errors
```

### 3. Test in Claude Desktop

In Claude Desktop:

```
List the available MCP tools
```

You should see: `research`, `plan`, `execute`, `test`, `document`, `commit`, `review`, `get_command`

### 4. Test Command Execution

```
Use the research command to analyze this project's structure.

Use tool: research
Input: "Analyze the project structure and identify the main components"
```

## Advanced Configuration

### Environment Variables

You can set environment variables for the MCP server:

```json
{
  "mcpServers": {
    "agentic-tools": {
      "command": "bun",
      "args": ["run", "/path/to/agentic/mcp/agentic-server.mjs"],
      "env": {
        "AGENTIC_DEBUG": "true",
        "AGENTIC_COMMAND_DIR": "/custom/command/path"
      }
    }
  }
}
```

### Custom Command Directories

If you want to override the search paths, you can modify the MCP server:

```javascript
// In mcp/agentic-server.mjs
const customPaths = {
  commandDirs: [
    "/path/to/custom/commands",
    path.join(cwd, ".opencode", "command"),
    // ... rest of default paths
  ]
};
```

### Multiple Project Support

You can run multiple MCP servers for different project types:

```json
{
  "mcpServers": {
    "agentic-web": {
      "command": "bun",
      "args": ["run", "/path/to/agentic/mcp/agentic-server.mjs"],
      "env": {"PROJECT_TYPE": "web"}
    },
    "agentic-mobile": {
      "command": "bun", 
      "args": ["run", "/path/to/agentic/mcp/agentic-server.mjs"],
      "env": {"PROJECT_TYPE": "mobile"}
    }
  }
}
```

## Troubleshooting

### Commands Not Found

```bash
# Check if commands exist in project
ls .opencode/command/

# If not, install them
agentic pull .

# Check status
agentic status .
```

### Server Won't Start from Project Directory

```bash
# Check permissions
ls -la .opencode/command/

# Check file format
file .opencode/command/research.md
# Should show: UTF-8 Unicode text

# Test from agentic directory
cd /path/to/agentic
bun run mcp:server
```

### Claude Desktop Not Showing Tools

1. **Restart Claude Desktop completely**
2. **Check MCP config path** (use absolute paths)
3. **Check server logs** for errors
4. **Test server manually** before configuring Claude

### Wrong Commands Being Used

The server uses the first directory it finds with commands:

```bash
# Check what directory has commands
ls -la .opencode/command/
ls -la .claude/commands/
ls -la /path/to/agentic/command/

# Remove unwanted commands if needed
rm -rf .opencode/command/  # Use global commands
```

## Best Practices

### 1. Project Setup
- Always run `agentic pull .` when setting up new projects
- Commit `.opencode/` to version control for team consistency
- Document any project-specific command customizations

### 2. MCP Server Management
- Use absolute paths in Claude Desktop config
- Start server from your main working directory
- Keep server running while working on multiple projects

### 3. Command Customization
- Edit commands in `.opencode/command/` for project-specific needs
- Test changes by restarting MCP server
- Share customizations with team via version control

### 4. Team Collaboration
- Include `.opencode/` in repository
- Document MCP setup in project README
- Use consistent agentic version across team

This setup ensures the agentic workflow system works seamlessly across all your projects while maintaining the flexibility to customize per-project as needed.