# MCP Quick Start Guide

Get up and running with Codeflow MCP integration in 5 minutes.

## Prerequisites

- **Bun Runtime** installed ([get it here](https://bun.sh))
- **MCP Client**: Claude Desktop, Warp Terminal, or other MCP-compatible AI client
- **Codeflow** system cloned locally

## 1. Install Dependencies

```bash
cd /path/to/codeflow
bun install
bun run install  # Links CLI globally
```

## 2. Start MCP Server

```bash
# Production mode
bun run mcp:server

# Development mode (auto-restart on changes)
bun run mcp:dev

# Or directly
bun run mcp/codeflow-server.mjs
```

**Server Status**: Look for "MCP server started" message. Server runs on stdio transport.

## 3. Configure Your MCP Client

### Option A: Claude Desktop

Preferred: configure automatically via the CLI

```bash
codeflow mcp configure claude-desktop
```

Manual configuration (macOS path): `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "codeflow-tools": {
      "command": "bun",
      "args": ["run", "/full/path/to/codeflow/mcp/codeflow-server.mjs"]
    }
  }
}
```

### Option B: Warp Terminal

Preferred: configure automatically via the CLI

```bash
codeflow mcp configure warp
```

Or manually add in Warp Settings → AI → Tools (MCP):
- **Name**: codeflow-tools
- **Command**: bun
- **Args**: run /full/path/to/codeflow/mcp/codeflow-server.mjs

### Option C: Cursor IDE

Configure automatically via the CLI

```bash
codeflow mcp configure cursor
```

This sets up MCP configuration in Cursor's settings (similar to Claude Desktop).

### Option D: Claude.ai (Web)

Claude.ai uses slash commands instead of MCP:

```bash
codeflow setup . --type claude-code
```

No MCP server needed - commands work directly in claude.ai.

### Option E: OpenCode

OpenCode uses its own command system:

```bash
codeflow setup . --type opencode
```

No MCP configuration needed.

**Important**: Use the full absolute path to the server file for MCP clients.

## 4. Restart Your Client

Completely quit and restart Claude Desktop or Warp for MCP configuration to take effect.

## 5. Verify Integration

In a new Claude Desktop conversation:

```
I want to see what codeflow workflow tools are available. Can you list the available MCP tools?
```

You should see tools like:
- `research`
- `plan`
- `execute`
- `test`
- `document`
- `commit`
- `review`
- `get_command`

## 6. Try Your First Workflow

### Basic Research Example

```
I want to analyze my project's authentication system. Use the research command to find all authentication-related code, patterns, and documentation.

Use tool: research

Input: "Find and analyze all authentication-related code including login/logout, session management, user models, middleware, and any existing OAuth implementations. Also check for authentication documentation in thoughts/ directories."
```

### Get Specific Command

```
I need to see the plan command documentation.

Use tool: get_command

Input: {
  "name": "plan"
}
```

## Common Issues & Solutions

### ❌ "Tool not found"
- **Check**: Server is running (`bun run mcp:server`)
- **Check**: Claude Desktop restarted after config change
- **Check**: Absolute path in MCP settings is correct

### ❌ Server won't start
```bash
# Check dependencies
bun install

# Check for port conflicts
lsof -i :3000  # If using custom port

# Run with debug output
DEBUG=* bun run mcp:server
```

### ❌ Tools don't appear in Claude
- **Restart Claude Desktop completely**
- **Check MCP settings path**: Use full absolute paths
- **Verify server logs**: Should show tool registrations

### ❌ Permission errors
```bash
# Ensure proper permissions
chmod +x mcp/codeflow-server.mjs

# Check file ownership
ls -la mcp/
```

## Available Tools Overview

### Workflow Commands (7 tools)
- `research` - Comprehensive analysis
- `plan` - Implementation planning
- `execute` - Code implementation
- `test` - Test generation
- `document` - Documentation creation
- `commit` - Git commit management
- `review` - Implementation validation

### Utility Tool (1 tool)
- `get_command` - Get command by name

**Note**: Agents (codebase-locator, codebase-analyzer, etc.) are internal components that commands use automatically. They are not exposed as separate MCP tools to keep the interface clean and focused.

## Next Steps

1. **Explore Commands**: Try the research → plan → execute workflow
2. **Read Full Docs**: See [MCP_INTEGRATION.md](./MCP_INTEGRATION.md) for complete reference
3. **View Examples**: Check [MCP_USAGE_EXAMPLES.md](./MCP_USAGE_EXAMPLES.md) for practical workflows
4. **Customize**: Add your own agents and commands to the system

## Quick Command Reference

```bash
# Start server
bun run mcp:server

# Development mode
bun run mcp:dev

# Check available commands
codeflow commands

# Install to project
codeflow pull ~/my-project
```

## Support

- **Issues**: Check server logs and Claude Desktop console
- **Updates**: New agents/commands automatically available (restart server)
- **Customization**: Add `.md` files to `codeflow-agents/` or `command/` directories

---

**🎉 You're ready!** Start using the codeflow system through MCP integration for powerful AI-assisted development.
