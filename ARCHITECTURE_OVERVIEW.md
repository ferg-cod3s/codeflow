# Agentic Workflow Architecture Overview

## Two Integration Approaches

The Agentic Workflow system supports two different integration methods depending on the AI platform's capabilities:

### 1. Native Slash Commands (Claude Code)

**For platforms with built-in slash command support:**

- **Location**: `.claude/commands/*.md`
- **Format**: YAML frontmatter + prompt content
- **Usage**: `/research`, `/plan`, `/execute` (native slash commands)
- **Integration**: Direct platform integration, no server needed
- **Example**:
  ```markdown
  ---
  description: Comprehensive codebase and documentation analysis
  ---
  
  You are tasked with conducting research...
  ```

### 2. MCP Server Integration (Other AI Platforms)

**For platforms without native slash command support:**

- **Location**: `.opencode/command/*.md` (or fallback to global commands)
- **Format**: Same markdown files, exposed via MCP protocol
- **Usage**: MCP tools like `research`, `plan`, `execute`
- **Integration**: Requires MCP server (`mcp/agentic-server.mjs`)
- **Platforms**: OpenCode, custom AI clients, any MCP-compatible system

## Platform Support Matrix

| Platform | Integration Method | Command Format | Server Required |
|----------|-------------------|----------------|-----------------|
| **Claude Code** | Native slash commands | `.claude/commands/*.md` | ❌ No |
| **Claude Desktop** | MCP integration | `.opencode/command/*.md` | ✅ Yes |
| **OpenCode** | MCP integration | `.opencode/command/*.md` | ✅ Yes |
| **Custom AI Clients** | MCP integration | `.opencode/command/*.md` | ✅ Yes |
| **Other MCP Clients** | MCP integration | `.opencode/command/*.md` | ✅ Yes |

## File Structure

```
your-project/
├── .claude/
│   └── commands/           # Native slash commands (Claude Code)
│       ├── research.md
│       ├── plan.md
│       └── execute.md
├── .opencode/
│   ├── command/           # MCP-exposed commands (other platforms)
│   │   ├── research.md
│   │   ├── plan.md
│   │   └── execute.md
│   └── agent/            # Sub-agents (used internally by commands)
│       ├── codebase-locator.md
│       └── codebase-analyzer.md
```

## Usage Examples

### Claude Code (Native Slash Commands)
```
/research thoughts/tickets/auth-feature.md - analyze authentication requirements

/plan thoughts/research/2025-08-25_auth-research.md - create implementation plan

/execute thoughts/plans/auth-implementation-plan.md - implement the feature
```

### Claude Desktop/OpenCode (MCP Integration)
```
Use tool: research
Input: "thoughts/tickets/auth-feature.md - analyze authentication requirements"

Use tool: plan  
Input: "thoughts/research/2025-08-25_auth-research.md - create implementation plan"

Use tool: execute
Input: "thoughts/plans/auth-implementation-plan.md - implement the feature"
```

## Why Two Approaches?

### Native Slash Commands Advantages:
- **Zero setup** - works immediately in Claude Code
- **Seamless UX** - natural `/command` syntax
- **No server required** - direct platform integration
- **Faster execution** - no MCP overhead

### MCP Integration Advantages:
- **Universal compatibility** - works with any MCP-capable AI
- **Standardized protocol** - follows MCP specifications
- **Flexible deployment** - can run as standalone server
- **Cross-platform** - same interface across different AI clients

## Command Content Consistency

**Important**: The actual command content (the prompts and logic) are **identical** between both approaches. The agentic CLI (`agentic pull`) copies the same source commands to both locations:

- Source: `{agentic-repo}/command/*.md`
- Claude Code: `{project}/.claude/commands/*.md`
- MCP Integration: `{project}/.opencode/command/*.md`

This ensures **consistent behavior** regardless of which platform you're using.

## MCP Server Role

The MCP server (`mcp/agentic-server.mjs`) acts as a **bridge** that:

1. **Discovers commands** in the appropriate directories
2. **Exposes them as MCP tools** with clean names (`research`, `plan`, etc.)
3. **Handles cross-repository access** (works from any project directory)
4. **Provides parameterized access** (`get_command` utility)
5. **Manages agent orchestration** (keeps agents internal, exposes only commands)

## Setup Requirements

### For Claude Code Users:
```bash
# One-time setup per project
agentic pull /path/to/your/project

# Commands available immediately as /research, /plan, etc.
```

### For Other AI Platform Users:
```bash
# One-time setup per project  
agentic pull /path/to/your/project

# Configure MCP client (e.g., Claude Desktop)
# Start MCP server: bun run /path/to/agentic/mcp/agentic-server.mjs

# Commands available as MCP tools: research, plan, etc.
```

## Development Workflow

### Command Development:
1. **Edit source commands** in `{agentic-repo}/command/*.md`
2. **Test in Claude Code** directly (if available)
3. **Deploy to projects** with `agentic pull`
4. **Test MCP integration** with server restart

### Agent Development:
1. **Edit agents** in `{agentic-repo}/agent/*.md`
2. **Commands automatically use updated agents** (internal orchestration)
3. **No separate deployment needed** for agents

## Best Practices

### For Teams Using Claude Code:
- **Commit `.claude/commands/`** to version control
- **Customize commands per project** if needed
- **Use native slash commands** for best UX

### For Teams Using Other Platforms:
- **Commit `.opencode/`** to version control  
- **Set up MCP server** as part of project onboarding
- **Document MCP configuration** in project README

### For Mixed Teams:
- **Deploy to both locations** with `agentic pull`
- **Keep commands synchronized** across both formats
- **Test on multiple platforms** before releases

This architecture provides **maximum flexibility** while maintaining **consistency** across different AI platforms and development workflows.