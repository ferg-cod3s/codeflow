# MCP Integration Documentation

## Overview

The Agentic Workflow CLI now includes **Model Context Protocol (MCP)** integration, enabling AI clients to access agentic commands and agents directly through a standardized server interface. This allows seamless integration with MCP-compatible AI systems like Claude Desktop, providing dynamic access to all workflow components.

## Architecture

### MCP Server Implementation

The MCP server is implemented in `mcp/agentic-server.mjs` and provides:

- **Dynamic Tool Discovery**: Automatically registers all commands and agents as MCP tools
- **Stable Naming**: Provides both unique IDs and stable semantic names for consistency
- **Parameterized Access**: Enables direct retrieval of specific commands/agents by name
- **Cross-Platform Compatibility**: Works with any MCP-compatible AI client

### Key Components

```javascript
// Core server setup
const server = new McpServer({ name: "agentic-tools", version: "0.1.0" });
const transport = new StdioServerTransport();

// Dynamic tool registration from filesystem
const toolEntries = await buildTools();
```

### Tool Categories

**Core Workflow Commands** (`/command/*.md`):
- The 7 essential agentic workflow commands
- Registered with stable names like `agentic.command.research`
- Works from any repository that has been set up with `agentic pull`

**Note**: Agents are internal implementation details used by commands and are not exposed as MCP tools. The commands handle all orchestration of specialized agents automatically.

## New Dependencies

### Package Updates

```json
{
  "devDependencies": {
    "@modelcontextprotocol/sdk": "^1.17.4",
    "zod": "^4.1.1"
  }
}
```

- **@modelcontextprotocol/sdk**: Official MCP SDK for server implementation
- **zod**: Schema validation and type safety for MCP operations

## Tool Registration System

### Unique ID Generation

```javascript
function toUniqueId(prefix, filePath) {
  const slug = toSlug(filePath);
  const hash = crypto.createHash("sha1").update(filePath).digest("hex").slice(0, 8);
  return `${prefix}.${slug}__${hash}`;
}
```

Each tool gets both a unique ID (with hash for collision prevention) and a stable semantic name for predictable access.

### Stable Name Aliases

```javascript
// Commands: agentic.command.{slug}
// Core Agents: agentic.agent.{slug}  
// OpenCode Agents: agentic.agent.opencode.{slug}
```

This dual naming system ensures tools remain accessible even if file paths change.

## Available MCP Tools

### Core Workflow Commands

- `research` - Comprehensive codebase and documentation analysis
- `plan` - Creates detailed implementation plans from tickets
- `execute` - Implements plans with verification  
- `test` - Generates comprehensive test suites
- `document` - Creates user guides and API documentation
- `commit` - Creates structured git commits
- `review` - Validates implementations against plans

### Parameterized Access Tool

```javascript
// Direct command retrieval by name
get_command({ name: "research" })
get_command({ name: "plan" })
get_command({ name: "execute" })
```

**Note**: Agents (codebase-locator, codebase-analyzer, etc.) are internal components used by the commands and are not exposed as separate MCP tools. Each command automatically orchestrates the appropriate agents based on the task requirements.

## Usage Examples

### MCP Client Integration

```javascript
// Access research command
const researchCommand = await client.callTool("research");

// Get specific command by name
const planCommand = await client.callTool("get_command", {
  name: "plan"
});

// Execute workflow command
const executeCommand = await client.callTool("execute");
```

### Claude Desktop Configuration

Add to Claude Desktop's MCP settings:

```json
{
  "mcpServers": {
    "agentic-tools": {
      "command": "node",
      "args": ["/path/to/agentic/mcp/agentic-server.mjs"],
      "env": {}
    }
  }
}
```

## Technical Implementation Details

### File System Scanning

```javascript
async function buildTools() {
  const tools = [];
  
  // Scan command directory
  const commandFiles = await loadMarkdownFiles(COMMAND_DIR);
  
  // Scan agent directories (core + opencode)
  const agentFiles = [
    ...(await loadMarkdownFiles(AGENT_DIR)),
    ...(await loadMarkdownFiles(path.join(AGENT_DIR, "opencode"))),
  ];
  
  return tools;
}
```

### Cross-Repository Support

The MCP server now works from any directory or repository:

```javascript
function findAgenticPaths() {
  const cwd = process.cwd();
  const cwdCommandDir = path.join(cwd, ".opencode", "command");
  const cwdClaudeCommandDir = path.join(cwd, ".claude", "commands");
  const agenticCommandDir = path.join(agenticRoot, "command");
  
  return {
    // Priority: .opencode/command, .claude/commands, then agentic/command
    commandDirs: [cwdCommandDir, cwdClaudeCommandDir, agenticCommandDir]
  };
}
```

The server searches for commands in this priority order, enabling usage from any project directory.

### Command Filtering

```javascript
const coreCommands = [
  'research', 'plan', 'execute', 'test', 'document', 'commit', 'review'
];

// Only register core workflow commands
if (!coreCommands.includes(base)) {
  continue;
}
```

Only the essential 7 workflow commands are exposed as MCP tools, keeping the interface clean and focused.

### Error Handling

The server includes comprehensive error handling for:
- Missing files or directories
- Invalid markdown content
- Tool registration collisions
- Client communication errors

### Process Management

```javascript
// Keep process alive for MCP communication
await new Promise((resolve) => {
  process.stdin.resume();
  process.stdin.on("end", resolve);
  process.on("SIGINT", resolve);
  process.on("SIGTERM", resolve);
});
```

The server maintains a persistent connection for real-time tool access.

## Integration Benefits

### For AI Clients

1. **Focused Interface**: Clean 7-command interface without internal implementation complexity
2. **Cross-Repository Access**: Works from any project directory after `agentic pull` setup
3. **Semantic Naming**: Predictable tool names for reliable automation
4. **Rich Metadata**: Each tool includes descriptive information about its purpose

### For Development Workflows

1. **Seamless Integration**: Use agentic workflows directly from any MCP-compatible AI
2. **Project-Aware**: Automatically finds commands in current project or falls back to global installation
3. **Complete Workflow**: Full research → plan → execute → test → document → commit → review cycle
4. **Cross-Platform Support**: Works with Claude Desktop, OpenCode, and other MCP clients

## Future Enhancements

### Planned Features

1. **Tool Composition**: Chaining multiple tools for complex workflows
2. **State Management**: Persistent context across tool calls
3. **Streaming Responses**: Real-time output for long-running commands
4. **Authentication**: Secure access control for sensitive operations
5. **Telemetry**: Usage tracking and performance monitoring

### Extension Points

1. **Custom Tool Registration**: Plugin system for domain-specific tools
2. **External Integration**: Connect to issue trackers, CI/CD systems
3. **Multi-Repository Support**: Workspace-aware tool routing
4. **Advanced Caching**: Intelligent result caching for performance

## Troubleshooting

### Common Issues

**Server Won't Start**:
- Check Node.js/Bun installation
- Verify file permissions in `/mcp` directory
- Ensure dependencies are installed (`bun install`)

**Tools Not Appearing**:
- Verify markdown files exist in `/command` and `/agent` directories
- Check file extensions are `.md`
- Review server logs for registration errors

**Connection Issues**:
- Validate MCP client configuration
- Check stdio transport setup
- Verify server process is running

### Debug Mode

Run the server with additional logging:

```bash
DEBUG=* bun run mcp/agentic-server.mjs
```

This provides detailed information about tool registration and client interactions.

## Security Considerations

### File System Access

The MCP server has read access to:
- `/command` directory for workflow commands
- `/agent` directory for workflow agents
- No write access or external system access

### Sandboxing

Tools return markdown content only - actual command execution happens in the AI client context with appropriate safeguards.

### Validation

All tool inputs are validated using Zod schemas to prevent malformed requests.

## Migration Guide

### From CLI-Only Usage

Existing CLI workflows (`agentic pull`, `agentic status`) continue to work unchanged. MCP provides an additional access method without breaking existing functionality.

### Agent Updates

When agents are updated in the filesystem, the MCP server automatically reflects changes on the next tool call - no server restart required.

### Backward Compatibility

All existing agent and command files work with MCP without modification. The server adapts to the existing file structure and naming conventions.