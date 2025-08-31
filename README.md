# CodeFlow CLI -  Intelligent AI Workflow Management

A powerful command-line interface for managing AI agents across different platforms and formats.

## 🎯 **Single Format Architecture**

CodeFlow uses a **single source of truth** approach for agent definitions. All agents are stored in the `codeflow-agents/` directory using a unified `BaseAgent` format, which gets automatically converted to platform-specific formats as needed.

### **Benefits of Single Format**

- ✅ **Single Source of Truth** - No more duplicate agent definitions
- ✅ **Easier Maintenance** - Update once, convert everywhere
- ✅ **Consistent Validation** - One validation schema for all agents
- ✅ **Format Flexibility** - Easy to add new output formats
- ✅ **Reduced Errors** - No more sync issues between formats

### **Agent Format Structure**

```markdown
---
name: your-agent-name
description: Description of when this agent should be invoked
mode: subagent  # Optional: subagent or primary
temperature: 0.7  # Optional: 0-2 range
model: claude-3-5-sonnet  # Optional: model identifier
tools:  # Optional: object with boolean values
  read: true
  write: true
  edit: true
  bash: true
  grep: true
  glob: true
  list: true

# OpenCode-specific fields (optional)
usage: When to use this agent
do_not_use_when: When NOT to use this agent
escalation: How to escalate if needed
examples: Example usage scenarios
prompts: Suggested prompts
constraints: Usage constraints

---

Your agent's system prompt and instructions go here...
```

## 🚀 **Quick Start**

### **Installation**

```bash
# Clone the repository
git clone https://github.com/your-org/codeflow.git
cd codeflow

# Install dependencies
pnpm install

# Link the CLI globally
pnpm link

# Verify installation
codeflow --version
```

### **Basic Usage**

```bash
# Set up a new project
codeflow setup

# Pull global agents to your project
codeflow pull

# Check project status
codeflow status

# List available commands
codeflow commands

# Convert agents to different formats
codeflow convert-all --format claude-code
codeflow convert-all --format opencode

# Sync formats across directories
codeflow sync-formats
```

## 📁 **Directory Structure**

```
codeflow/
├── codeflow-agents/          # Single source of truth (BaseAgent format)
│   ├── full-stack-developer.md
│   ├── code-reviewer.md
│   └── debugger.md
├── claude-agents/            # Auto-generated Claude Code format
├── opencode-agents/          # Auto-generated OpenCode format
├── src/
│   ├── cli/                  # CLI implementation
│   ├── conversion/           # Format conversion engine
│   └── validation/           # Agent validation
└── tests/                    # Test suite
```

## 🔄 **Format Conversion**

### **Supported Formats**

1. **Base Format** (`codeflow-agents/`) - Single source of truth
2. **Claude Code Format** (`claude-agents/`) - For Claude Code subagents
3. **OpenCode Format** (`opencode-agents/`) - For OpenCode platform

### **Conversion Commands**

```bash
# Convert all agents to a specific format
codeflow convert-all --format claude-code
codeflow convert-all --format opencode
codeflow convert-all --format base

# Convert individual agents
codeflow convert agent-name --format claude-code

# Sync formats between directories
codeflow sync-formats

# Sync with global agents
codeflow sync-global
```

### **Conversion Rules**

- **Base → Claude Code**: Tools converted from object to comma-separated string
- **Base → OpenCode**: Full structure preserved with model format conversion
- **Claude Code → Base**: Tools converted from string to object, missing fields set to undefined
- **OpenCode → Base**: Full structure preserved

## 🛠️ **CLI Commands**

### **Core Commands**

| Command | Description |
|---------|-------------|
| `setup` | Initialize a new CodeFlow project |
| `pull` | Pull global agents to current project |
| `status` | Show project status and agent counts |
| `commands` | List available slash commands |
| `mcp` | Manage MCP server connections |

### **Conversion Commands**

| Command | Description |
|---------|-------------|
| `convert` | Convert individual agent to target format |
| `convert-all` | Convert all agents in directory to target format |
| `sync-formats` | Synchronize agent formats across directories |
| `sync-global` | Sync with global CodeFlow agents |

### **Utility Commands**

| Command | Description |
|---------|-------------|
| `watch` | Watch for file changes and auto-sync |
| `version` | Show CLI version |
| `help` | Show help information |

## 🔧 **Configuration**

### **Project Configuration**

Create a `.codeflow` file in your project root:

```json
{
  "name": "my-project",
  "agents": {
    "source": "codeflow-agents",
    "formats": ["claude-code", "opencode"]
  },
  "mcp": {
    "servers": ["sentry", "memory"]
  }
}
```

### **Global Configuration**

Global settings are stored in `~/.codeflow/config.json`:

```json
{
  "agents": {
    "globalPath": "~/.codeflow/agents",
    "autoSync": true
  },
  "conversion": {
    "defaultFormat": "base",
    "preserveMetadata": true
  }
}
```

## 🔌 **Platform Integration**

CodeFlow supports three different integration methods depending on your coding environment:

### **Claude Code (.ai)**
- **Agents**: Global directory `~/.claude/agents/` (accessible via Task tool)
- **Commands**: Project-specific `.claude/commands/` (slash commands like `/research`)
- **Setup**: `codeflow setup --type claude-code`
- **Usage**: Type `/research`, `/plan`, `/execute` directly in Claude Code interface

### **OpenCode**
- **Agents**: Global directory `~/.config/opencode/agent/` (native agent selection)
- **Commands**: Global `~/.config/opencode/command/` + project `.opencode/command/`
- **Setup**: `codeflow setup --type opencode`
- **Usage**: Use slash commands in OpenCode terminal interface

### **MCP (Model Context Protocol)**
- **Purpose**: For coding assistants like **Cursor, VS Code extensions, etc.** that lack native agent systems
- **Provides**: Agents as MCP tools for clients supporting MCP protocol
- **Setup**: `codeflow mcp start` then configure your MCP client
- **Usage**: Tools appear in Cursor/VS Code when MCP server is running

```bash
# Set up for Claude Code
codeflow setup . --type claude-code

# Set up for OpenCode  
codeflow setup . --type opencode

# Start MCP server for Cursor/VS Code
codeflow mcp start --background
codeflow mcp configure cursor
```

## 🧪 **Testing**

```bash
# Run all tests
pnpm test

# Run type checking
pnpm typecheck

# Run specific test suites
pnpm test:unit
pnpm test:integration
pnpm test:e2e
```

## 📚 **Development**

### **Architecture Overview**

```
CLI Commands → Format Converter → Agent Parser → File System
     ↓              ↓              ↓           ↓
  User Input → Format Validation → Agent Types → Markdown Files
```

### **Key Components**

1. **CLI Module** (`src/cli/`) - Command parsing and execution
2. **Conversion Engine** (`src/conversion/`) - Format transformation
3. **Validation** (`src/validation/`) - Agent schema validation
4. **Agent Parser** (`src/agent-parser/`) - Markdown frontmatter parsing

### **Adding New Formats**

1. Extend the `BaseAgent` interface with new fields
2. Add conversion methods in `FormatConverter`
3. Update validation rules in `AgentValidator`
4. Add tests for the new format

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

### **Development Setup**

```bash
# Install dependencies
pnpm install

# Link CLI for development
pnpm link

# Run in development mode
pnpm dev

# Build for production
pnpm build
```

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 **Acknowledgments**

- Built with [Bun](https://bun.sh/) for fast JavaScript/TypeScript execution
- Inspired by [Claude Code](https://docs.anthropic.com/en/docs/claude-code/sub-agents) subagents
- Compatible with [OpenCode](https://opencode.dev/) platform
- Uses [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) for tool integration
