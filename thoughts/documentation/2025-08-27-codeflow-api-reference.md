---
title: Codeflow - CLI & MCP API Reference
audience: api
version: 0.1.0
date: 2025-08-27
---

# Codeflow API Reference

Complete reference for Codeflow CLI commands and MCP tools.

## CLI Command Reference

### Global Options

All commands support these global flags:
- `--help, -h` - Show help information
- `--version` - Show version information

### Project Management Commands

#### `codeflow setup [project-path]`

Smart setup for Claude Code or MCP integration.

**Arguments:**
- `project-path` (optional) - Target project directory. Defaults to current directory.

**Options:**
- `--force, -f` - Force overwrite existing setup
- `--type, -t <type>` - Specify project type: `claude-code`, `opencode`, `general`
- `--dry-run` - Show what would be done without making changes

**Examples:**
```bash
codeflow setup ~/my-project
codeflow setup . --type claude-code --force
codeflow setup ../other-project --dry-run
```

**Exit Codes:**
- `0` - Success
- `1` - Error (invalid path, permission denied, etc.)

#### `codeflow pull [project-path]`

Pull agents and commands to existing .opencode directory.

**Arguments:**
- `project-path` (optional) - Target project directory

**Examples:**
```bash
codeflow pull ~/existing-project
```

#### `codeflow status [project-path]`

Check which files are up-to-date or outdated.

**Arguments:**
- `project-path` (optional) - Project directory to check

**Options:**
- `--verbose` - Show detailed status information
- `--global` - Check global configuration status

**Output Format:**
```
✅ Up to date: filename.md (hash: abc123...)
❌ Outdated: filename.md (local: def456..., source: ghi789...)
⚠️  Not found: filename.md
```

**Examples:**
```bash
codeflow status ~/my-project
codeflow status . --verbose
codeflow status --global
```

### Agent Management Commands

#### `codeflow convert <source> <target> <format>`

Convert agents between formats.

**Arguments:**
- `source` (required) - Source directory path
- `target` (required) - Target directory path  
- `format` (required) - Target format: `base`, `claude-code`, `opencode`

**Options:**
- `--validate` - Validate agents during conversion (default: true)
- `--dry-run` - Show what would be converted without writing files

**Examples:**
```bash
codeflow convert ./agent ./claude-agents claude-code
codeflow convert /path/to/agents /path/to/output opencode --dry-run
```

#### `codeflow convert-all [project-path]`

Convert all agent formats in project.

**Arguments:**
- `project-path` (optional) - Project directory

**Options:**
- `--validate` - Validate agents during conversion (default: true)
- `--dry-run` - Show what would be converted without writing files

**Output:**
- Conversion summary with file counts
- Validation results with error/warning counts
- Round-trip conversion test results

#### `codeflow sync-formats [direction]`

Ensure all formats have the same agents.

**Arguments:**
- `direction` (optional) - Sync direction: `to-all`, `from-opencode`, `bidirectional`

**Options:**
- `--validate` - Validate during sync (default: true)
- `--dry-run` - Preview changes without writing

#### `codeflow sync-global`

Sync agents to global directories.

**Options:**
- `--validate` - Validate during sync (default: true)
- `--dry-run` - Preview changes without writing

**Global Directories:**
- `~/.claude/agents/claude-code/`
- `~/.claude/agents/opencode/`
- `~/.claude/agents/base/`

#### `codeflow list-differences [project-path]`

Show differences between agent formats.

#### `codeflow show-format-differences`

Detailed format difference analysis.

### MCP Server Commands

#### `codeflow mcp <action>`

Manage MCP server.

**Actions:**

##### `codeflow mcp start`
Start MCP server for current project.

**Options:**
- `--background, -b` - Run server in background
- `--port <port>` - Specify port (optional)

**Examples:**
```bash
codeflow mcp start
codeflow mcp start --background
```

##### `codeflow mcp stop`
Stop background MCP server.

##### `codeflow mcp status`
Check MCP server status.

**Output:**
```
✅ MCP Server is running (PID: 12345)
✅ Claude Desktop is configured for codeflow
```

##### `codeflow mcp configure <client>`
Configure MCP client.

**Supported Clients:**
- `claude-desktop` - Configure Claude Desktop

**Options:**
- `--remove, -r` - Remove MCP client configuration

**Examples:**
```bash
codeflow mcp configure claude-desktop
codeflow mcp configure claude-desktop --remove
```

##### `codeflow mcp list`
List available MCP tools and usage.

### File Watching Commands

#### `codeflow watch <action>`

Manage automatic file synchronization daemon.

**Actions:**

##### `codeflow watch start [options]`
Start automatic file synchronization daemon.

**Options:**
- `--global, -g` - Watch global directories
- `--projects <paths>, -p <paths>` - Comma-separated project directories
- `--auto-convert` - Enable automatic format conversion (default: true)
- `--health-check <minutes>` - Health check interval (default: 15)

**Examples:**
```bash
codeflow watch start
codeflow watch start --global
codeflow watch start --projects ~/proj1,~/proj2
```

##### `codeflow watch stop`
Stop file watching daemon.

##### `codeflow watch status`
Show daemon status and activity.

**Options:**
- `--json` - Output status in JSON format

##### `codeflow watch logs [options]`
View daemon logs.

**Options:**
- `--follow` - Follow logs in real-time
- `--lines <count>` - Number of log lines (default: 50)
- `--clear` - Clear log file

##### `codeflow watch restart [options]`
Restart the daemon with new options.

### Information Commands

#### `codeflow commands`
List available slash commands.

#### `codeflow version`
Show the version of codeflow.

#### `codeflow help`
Show help message.

## MCP Tool Reference

When running as an MCP server, Codeflow exposes these tools:

### Core Workflow Tools

All workflow tools return markdown content enhanced with agent orchestration context.

#### `research`
Comprehensive codebase and documentation analysis.

**Input Schema:** `{}`

**Returns:**
- `content[].type`: "text"
- `content[].text`: Enhanced research command with available agents

**Agent Context Added:**
- Available agent categories (codebase, research, operations, etc.)
- Agent execution functions
- Total agent count

#### `plan`
Create detailed implementation plans.

**Input Schema:** `{}`

#### `execute`  
Implement plans with verification.

**Input Schema:** `{}`

#### `test`
Generate comprehensive test suites.

**Input Schema:** `{}`

#### `document`
Create user guides and API documentation.

**Input Schema:** `{}`

#### `commit`
Create structured git commits.

**Input Schema:** `{}`

#### `review`
Validate implementations against plans.

**Input Schema:** `{}`

### Utility Tools

#### `get_command`
Return command markdown by name.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "description": "Command name to retrieve"
    }
  },
  "required": ["name"]
}
```

**Examples:**
```bash
# In MCP client
Use tool: get_command
Input: {"name": "research"}
```

## Agent Registry API

### Internal Agent System

The MCP server loads 54+ agents internally with this priority order:

1. Project-specific OpenCode agents (`.opencode/agent/`)
2. Project-specific Claude agents (`.claude/agents/`)
3. Global user agents (`~/.claude/agents/`)
4. Built-in codeflow agents

### Agent Categories

**Codebase Analysis:**
- `codebase-locator`, `codebase-analyzer`, `codebase-pattern-finder`

**Research & Documentation:**
- `thoughts-locator`, `thoughts-analyzer`, `web-search-researcher`

**Development Specializations:**
- `development_migrations_specialist` - Database migrations
- `development_accessibility_pro` - Accessibility compliance
- `development_performance_engineer` - Performance optimization
- `development_system_architect` - System architecture

**Operations:**
- `operations_incident_commander` - Incident response
- `operations_deployment_wizard` - Deployment automation
- `operations_infrastructure_builder` - Infrastructure as code

**Quality & Testing:**
- `quality-testing_performance_tester` - Performance testing
- `quality-testing_security_scanner` - Security analysis

**Business & Strategy:**
- `product-strategy_market_analyst` - Market analysis
- `product-strategy_growth_engineer` - Growth optimization
- `business-analytics_compliance_expert` - Regulatory compliance

### Agent Execution Functions

These functions are available to workflow commands:

- `spawnAgent(agentId, task)` - Execute single agent
- `parallelAgents(agentIds, tasks)` - Execute multiple agents in parallel
- `suggestAgents(taskDescription)` - Get agent recommendations
- `executeResearchWorkflow(domain, query)` - Run research workflow
- `executePlanningWorkflow(requirements, context)` - Run planning workflow

## Error Handling

### CLI Error Codes

- `0` - Success
- `1` - General error (invalid arguments, file not found, etc.)
- `-1` - Timeout (for background operations)

### Common Error Messages

**Setup Errors:**
```
❌ Invalid project path: [reason]
❌ Directory does not exist: [path]
❌ Setup failed: [error message]
```

**MCP Server Errors:**
```
❌ MCP Server not found: [path]
❌ MCP server failed to start
❌ MCP client name required
```

**Format Conversion Errors:**
```
❌ Invalid format 'format-name'
❌ convert requires source, target, and format arguments
⚠️ Found [N] parsing errors: [details]
```

### MCP Protocol Errors

The MCP server follows standard MCP error handling:

- Invalid method calls return JSON-RPC error responses
- Tool execution errors are returned as error content
- Server startup failures are logged to stderr

## Performance Specifications

### Expected Response Times
- CLI help commands: < 100ms
- Project setup: < 5s
- Status checks: < 2s  
- Format conversion: < 5s for 50+ agents
- Agent registry loading: < 200ms
- MCP server startup: < 3s

### Resource Usage
- Memory: ~50MB for CLI operations
- Memory: ~100MB for MCP server with agent registry
- Disk: ~10MB for full installation with 54+ agents
- Network: Minimal (only for git operations if applicable)

## Integration Examples

### Claude Desktop Configuration
```json
{
  "mcpServers": {
    "codeflow-tools": {
      "command": "bun",
      "args": ["run", "/path/to/codeflow/mcp/codeflow-server.mjs"],
      "env": {}
    }
  }
}
```

### GitHub Actions Integration
```yaml
- name: Setup Codeflow
  run: |
    cd codeflow
    bun install && bun run install

- name: Test Project Setup
  run: |
    codeflow setup . --dry-run
    codeflow convert-all --dry-run
```

### Programmatic Usage
```bash
# Batch project setup
for project in ~/projects/*/; do
  codeflow setup "$project" --type general
done

# Health monitoring
codeflow watch status --json | jq '.status'
```