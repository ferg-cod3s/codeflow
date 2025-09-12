# CodeFlow CLI - Intelligent AI Workflow Management

A powerful command-line interface for managing AI agents across different platforms and formats.

---

## ⚠️ **Migration Notice**

**Upgrading from previous versions?** This release focuses on core MVP functionality. Advanced features like MCP server integration, REST API, and diagnostic commands have been removed to streamline the codebase. If you were using these features, please see the [Migration Guide](./docs/MIGRATION.md) for alternatives.

---

## Canonical Agent Directory Policy

- `/codeflow-agents/` is the ONLY agent directory that should exist in the repository and is the single source of truth for all agent definitions.
- All agent configuration, schema, and updates must be made exclusively in this directory.
- Platform-specific agent directories such as `.claude/agents/`, `opencode-agents/`, etc. are NOT maintained in the repository. They are automatically generated as build artifacts during the `codeflow sync` CLI process and should not be manually edited or committed.
- Only `/codeflow-agents/` should be tracked in version control. Platform-specific agent directories should be listed in `.gitignore` to prevent accidental commits.

**Example `.gitignore` Entries:**

```
# Ignore generated agent directories (do not commit these)
.claude/agents/
opencode-agents/
```

---

## 🎯 **Base Agent Architecture**

CodeFlow uses a **base agent architecture** where `codeflow-agents/` contains the canonical agent definitions. These base agents are:

- ✅ **Source of Truth** for all agent definitions
- ✅ **Converted on-demand** to platform-specific formats (OpenCode, Claude Code, etc.)
- ✅ **Hierarchically organized** by domain (development/, operations/, etc.)

### **Benefits of Single Format**

- ✅ **Single Source of Truth** - No more duplicate agent definitions
- ✅ **Easier Maintenance** - Update once, convert everywhere
- ✅ **Consistent Validation** - One validation schema for all agents
- ✅ **Format Flexibility** - Easy to add new output formats
- ✅ **Reduced Errors** - No more sync issues between formats

### **Agent Consolidation & Unified Capabilities**

CodeFlow maintains a streamlined agent ecosystem through strategic consolidation:

- **UX Optimization Consolidation**: The `ux-optimizer` agent now provides unified coverage for mobile UX, integration flows, conversion optimization, accessibility, analytics, and behavioral design. This consolidates capabilities previously split across deprecated `mobile-optimizer` and `integration-master` agents.
- **Unified Scope**: Each agent focuses on a specific domain while maintaining comprehensive coverage within that domain, reducing complexity and improving specialization.
- **Future-Ready Architecture**: New capabilities are integrated into existing agents rather than creating new specialized agents, ensuring maintainable and focused agent responsibilities.

### **Agent Format Structure**

```markdown
---
name: your-agent-name
description: Description of when this agent should be invoked
mode: subagent # Optional: subagent or primary
temperature: 0.7 # Optional: 0-2 range
model: claude-3-5-sonnet # Optional: model identifier
tools: # Optional: object with boolean values
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

# Check project status
codeflow status

# Sync agents to project
codeflow sync

# Convert agents to different formats
codeflow convert --type claude-code
codeflow convert --type opencode

# Watch for changes and auto-sync
codeflow watch start
```

## 📁 **Directory Structure**

```
codeflow/
├── codeflow-agents/          # Base agents (source of truth)
│   ├── development/          # Development-focused agents
│   ├── operations/           # Operations & DevOps agents
│   ├── generalist/           # General-purpose agents
│   └── ...                   # Other domain categories
├── src/
│   ├── cli/                  # CLI implementation
│   ├── conversion/           # Format conversion engine
│   └── validation/           # Agent validation
└── tests/                    # Test suite

# Generated on setup:
project/
├── .opencode/agent/         # OpenCode format (converted from base)
└── .opencode/command/       # Workflow commands
```

## 🔄 **Format Conversion**

### **Conversion Workflow**

1. **Base Agents** (`codeflow-agents/`) - Source of truth with hierarchical organization
2. **Platform Setup** - Agents converted automatically during `codeflow setup`
3. **Format Sync** - Convert and sync agents to target platforms

### **Setup Commands**

```bash
# Setup for OpenCode (converts base agents automatically)
codeflow setup --type opencode

# Setup for Claude Code (converts base agents automatically)
codeflow setup --type claude-code

# Check conversion status
codeflow status
```

### **Conversion Rules**

- **Base → Claude Code**: Tools converted from object to comma-separated string
- **Base → OpenCode**: Full structure preserved with model format conversion
- **Claude Code → Base**: Tools converted from string to object, missing fields set to undefined
- **OpenCode → Base**: Full structure preserved

## 🛠️ **CLI Commands**

### **Core Commands**

| Command   | Description                          |
| --------- | ------------------------------------ |
| `setup`   | Initialize a new CodeFlow project    |
| `status`  | Show project status and agent counts |
| `sync`    | Sync agents to current project       |
| `convert` | Convert agents to target format      |
| `watch`   | Watch for file changes and auto-sync |

### **Command Flags**

| Flag         | Description                                 |
| ------------ | ------------------------------------------- |
| `--force`    | Force overwrite existing files              |
| `--project`  | Specify project path                        |
| `--global`   | Use global agent directory                  |
| `--type`     | Target platform type (claude-code/opencode) |
| `--validate` | Validate agents before conversion           |
| `--dry-run`  | Preview changes without applying them       |

## 🔧 **Configuration**

### **Project Configuration**

Create a `.codeflow` file in your project root:

```json
{
  "name": "my-project",
  "agents": {
    "source": "codeflow-agents",
    "formats": ["claude-code", "opencode"]
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

CodeFlow supports two main integration methods:

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

```bash
# Set up for Claude Code
codeflow setup --type claude-code

# Set up for OpenCode
codeflow setup --type opencode
```

## 🔍 **Agent Registry QA**

CodeFlow includes comprehensive agent registry validation and QA:

### **QA Tools**

- **CLI Validation**: `codeflow validate` - Fails on critical issues, warns on duplicates
- **Duplicate Detection**: Automatic detection of canonical conflicts and legacy duplicates

### **Registry Policies**

- **Canonical First**: Agents in `codeflow-agents/` are source of truth
- **Legacy Opt-in**: Deprecated agents included only with `CODEFLOW_INCLUDE_LEGACY=1`
- **Hash-based Validation**: SHA256 comparison of normalized agent definitions
- **Structured Errors**: Detailed remediation steps for all validation issues

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


## Codeflow Workflow

This project is set up for MCP integration.

### Available Tools

- `research` - Comprehensive codebase and documentation analysis
- `plan` - Create detailed implementation plans
- `execute` - Implement plans with verification
- `test` - Generate comprehensive test suites
- `document` - Create user guides and API documentation
- `commit` - Create structured git commits
- `review` - Validate implementations against plans

Commands are located in `.opencode/command/`.
