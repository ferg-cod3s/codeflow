# MCP Quick Start Guide

Get up and running with Agentic Workflow MCP integration in 5 minutes.

## Prerequisites

- **Bun Runtime** installed ([get it here](https://bun.sh))
- **Claude Desktop** or other MCP-compatible AI client
- **Agentic Workflow** system cloned locally

## 1. Install Dependencies

```bash
cd /path/to/agentic
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
bun run mcp/agentic-server.mjs
```

**Server Status**: Look for "MCP server started" message. Server runs on stdio transport.

## 3. Configure Claude Desktop

Add to your Claude Desktop settings (`~/Claude/mcp_settings.json`):

```json
{
  "mcpServers": {
    "agentic-tools": {
      "command": "bun",
      "args": ["run", "/full/path/to/agentic/mcp/agentic-server.mjs"]
    }
  }
}
```

**Important**: Use the full absolute path to the server file.

## 4. Restart Claude Desktop

Completely quit and restart Claude Desktop for MCP configuration to take effect.

## 5. Verify Integration

In a new Claude Desktop conversation:

```
I want to see what agentic workflow tools are available. Can you list the available MCP tools?
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
chmod +x mcp/agentic-server.mjs

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
bun run agentic commands

# Install to project
bun run agentic pull ~/my-project
```

## Support

- **Issues**: Check server logs and Claude Desktop console
- **Updates**: New agents/commands automatically available (restart server)
- **Customization**: Add `.md` files to `/agent` or `/command` directories

---

**🎉 You're ready!** Start using the agentic workflow system through MCP integration for powerful AI-assisted development.