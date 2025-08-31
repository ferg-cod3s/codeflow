---
date: 2025-08-26T18:29:35-0600
researcher: Claude Code
git_commit: 39d24b3dda1a6a7475374a7dea3ffc320179d849
branch: master
repository: codeflow
topic: 'Automated ways to add Claude agents and commands and OpenCode agents and commands to global configs, and MCP server installation for standalone commands'
tags: [research, codebase, automation, global-config, mcp-integration, agent-distribution]
status: complete
last_updated: 2025-08-26
last_updated_by: Claude Code
---

## Ticket Synopsis

The research ticket asks for automated ways to add Claude Code agents/commands and OpenCode agents/commands to global configurations for each platform, and how the MCP server can be installed to provide standalone commands for coding agents that don't have access to subagents or commands.

## Summary

The codeflow repository has a comprehensive automation system for agent and command distribution that supports multiple AI platforms through:

1. **CLI-based Global Setup**: `agentic setup` command with intelligent project detection
2. **MCP Server Integration**: Standalone MCP server providing 7 core workflow commands
3. **Multi-format Agent Support**: Three distinct agent formats (Base, Claude Code, OpenCode)
4. **Cross-repository Usage**: Global CLI with project-aware command discovery
5. **NPM Package Distribution**: `@agentic-codeflow/mcp` for universal MCP client compatibility

The system is designed to work both with global configurations and standalone deployments for coding agents that lack subagent access.

## Detailed Findings

### Global Configuration Systems

**Claude Code Global Paths** (src/cli/setup.ts:27-39):

- `~/.claude/global_rules.md` - Global development rules and standards
- `~/.config/claude_code/global_rules.md` - Alternative location for global rules
- `~/.claude/commands/` - Personal/global commands directory
- `~/.claude/mcp.json` - Global MCP configuration

**MCP Client Configuration** (src/cli/mcp.ts:15-25):

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%/Claude/claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

**Automated Global Setup Commands**:

```bash
# Install CLI globally
bun install && bun run install

# Configure MCP clients automatically
agentic mcp configure claude-desktop
agentic mcp configure claude-desktop --remove

# Cross-platform MCP server management
agentic mcp start --background
agentic mcp status
```

### CLI Distribution System Architecture

**Smart Project Detection** (src/cli/setup.ts:13-66):

- **Claude Code Projects**: Detects `.claude/claude_config.json`, `.claude/commands`, `claude.json`
- **OpenCode Projects**: Detects `.opencode`, `.opencode/agent`, `.opencode/command`, `opencode.json`
- **General Projects**: Fallback supporting both formats

**Automated Setup Flow** (src/cli/setup.ts:254-354):

1. Project type detection or explicit specification via `--type`
2. Directory structure creation (`.claude/commands/`, `.opencode/command/`, `.opencode/agent/`)
3. Agent and command file distribution from source directories
4. Configuration file generation (`claude_config.json`, etc.)
5. README.md updates with platform-specific usage instructions
6. .gitignore updates to preserve agentic files

**Cross-Repository Discovery** (mcp/agentic-server.mjs:24-29):

```javascript
// Priority order for command discovery
const commandDirs = [
  path.join(cwd, '.opencode', 'command'), // Project-specific
  path.join(cwd, '.claude', 'commands'), // Claude Code
  path.join(agenticRoot, 'command'), // Global fallback
];
```

### MCP Server for Standalone Commands

**Development MCP Server** (mcp/agentic-server.mjs):

- Exposes 7 core workflow commands: `research`, `plan`, `execute`, `test`, `document`, `commit`, `review`
- Project-aware command loading with global fallbacks
- Usage: `bun run mcp/agentic-server.mjs`

**NPM Package MCP Server** (packages/agentic-mcp/):

- Published as `@agentic-codeflow/mcp`
- Standalone with built-in command templates
- No project dependencies required
- Usage: `npx @agentic-codeflow/mcp`

**MCP Client Auto-Configuration** (src/cli/mcp.ts:47-89):

```json
{
  "mcpServers": {
    "agentic-tools": {
      "command": "npx",
      "args": ["@agentic-codeflow/mcp"],
      "description": "Agentic workflow commands"
    }
  }
}
```

### Agent Format Support

**Three Distinct Formats**:

1. **Base Format** (agent/ directory):
   - YAML frontmatter with `tools`, `mode`, `temperature` fields
   - Core workflow agents (codebase-analyzer, thoughts-locator, etc.)

2. **Claude Code Format** (claude-agents/ directory):
   - Simplified frontmatter with `name` and `description`
   - Optimized for Claude Code's Task tool integration
   - 50+ specialized agents categorized by domain

3. **OpenCode Format** (opencode-agents/ directory):
   - Extended frontmatter with `role`, `context`, `usage`, `examples`
   - MCP integration optimized
   - Includes escalation patterns and model specifications

**No Format Conversion**: Files are maintained in parallel with format-specific optimizations rather than automated conversion.

## Code References

- `src/cli/index.ts:78-94` - Main CLI command routing and help system
- `src/cli/setup.ts:254-354` - Intelligent project setup and type detection
- `src/cli/mcp.ts:47-89` - MCP client auto-configuration system
- `mcp/agentic-server.mjs:56-94` - MCP server tool registration and discovery
- `packages/agentic-mcp/src/server.ts` - NPM package MCP server implementation
- `config.json:2-4` - Distribution configuration for included directories
- `src/cli/pull.ts` - File distribution and copying mechanisms
- `src/cli/status.ts` - SHA-256 hash-based file synchronization

## Architecture Insights

**Hierarchical Command Discovery**: The system uses a clear priority hierarchy for command discovery, enabling project-specific customizations while maintaining global fallbacks.

**Platform Abstraction**: The CLI automatically detects and configures for different AI platforms (Claude Code, OpenCode, MCP clients) without requiring manual format selection.

**Security-First Design**: The MCP server includes privacy-safe built-in templates and requires no project file system access for standalone operation.

**Cross-Repository Compatibility**: Global CLI installation combined with project-aware command discovery enables use across multiple projects without per-project setup.

## Historical Context (from thoughts/)

No existing thoughts/ directory found - this is the first research document for this repository.

## Related Research

This is the initial research document for the codeflow repository.

## Open Questions

1. **Global Command Synchronization**: How should updates to global commands propagate to existing projects? Currently requires manual `agentic pull`.

2. **Agent Format Unification**: Should there be automated conversion between the three agent formats, or is parallel maintenance preferred?

3. **Global Agent Distribution**: The current system focuses on commands - should agents also be distributed to global configurations?

4. **MCP Server Discovery**: How should multiple MCP servers handle conflicts when exposing the same tool names?

5. **Cross-Platform Testing**: How can global configuration setup be validated across macOS, Windows, and Linux automatically?

6. **Standalone Agent Access**: For coding agents without subagent access, should individual agents be exposed as separate MCP tools, or is the current command-based approach sufficient?
