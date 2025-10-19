# Codeflow - AI Agent & Command Distribution Platform

A comprehensive TypeScript-based CLI platform for distributing 123+ specialized AI agents and 15+ workflow commands across Claude Code, OpenCode, and MCP-compatible clients. Built with Bun for maximum performance and reliability.

## Quick Start

```bash
# Install dependencies and link CLI globally
bun install && bun run install

# Setup 123+ agents and 15+ commands in your project
codeflow setup [project-path]

# Check status and compliance
codeflow status [project-path]

# Sync with latest agents and commands
codeflow sync [project-path]

# Start automatic file watching
codeflow watch start

# Execute research workflow
codeflow research "analyze authentication system"
```

## Platform Support

**Claude Code (v2.x.x)**: Native integration with YAML frontmatter format
**OpenCode**: Full support with mode, temperature, and allowed_directories
**Cursor**: MCP integration with JSON parameter format
**MCP Clients**: JSON parameter format for VS Code and other MCP-compatible editors

See [COMPLIANCE.md](./COMPLIANCE.md) for detailed format specifications and migration guide.

## Available Commands

### Workflow Commands

- `/research` - Comprehensive codebase and documentation analysis
- `/plan` - Create detailed implementation plans from tickets and research
- `/execute` - Implement plans with proper verification
- `/test` - Generate comprehensive test suites for implemented features
- `/document` - Create user guides, API docs, and technical documentation
- `/commit` - Create commits with structured messages
- `/review` - Validate implementations against original plans
- `/continue` - Resume execution from last completed step
- `/help` - Get detailed development guidance and workflow information
- `/refactor` - Systematic code improvement with validation
- `/debug` - Systematic debugging and issue resolution
- `/deploy` - Automated deployment with validation
- `/ticket` - Create structured development tickets

### Platform Integration

- **Claude Code**: Commands in `.claude/commands/` with YAML frontmatter
- **OpenCode**: Commands in `.opencode/command/` with enhanced YAML configuration
- **Cursor**: MCP integration with commands in `.cursor/commands/` and agents in `.cursor/agents/`
- **MCP Clients**: JSON parameter format for VS Code and other MCP-compatible editors

## Architecture

### Single Source of Truth

All 123+ agents are defined once in `codeflow-agents/` using a unified BaseAgent format:

**Agent Categories:**

- `development/` (57 agents) - Full-stack, backend, frontend, mobile development
- `operations/` (15 agents) - DevOps, infrastructure, monitoring, incident response
- `quality-testing/` (13 agents) - Testing, QA, performance, security scanning
- `ai-innovation/` (8 agents) - LLM integration, AI agents, prompt engineering
- `business-analytics/` (18 agents) - Data analysis, metrics, business intelligence
- `design-ux/` (5 agents) - UI/UX, accessibility, design systems
- `product-strategy/` (1 agent) - Product management, growth, requirements
- `generalist/` (6 agents) - General purpose agents and orchestrators

### Automatic Platform Conversion

The CLI automatically converts BaseAgent format to platform-specific formats:

- **Claude Code**: `.claude/agents/` and `.claude/commands/` (YAML with name, description, tools, model)
- **OpenCode**: `.opencode/agent/` and `.opencode/command/` (YAML with mode, temperature, allowed_directories)
- **Cursor**: `.cursor/agents/` and `.cursor/commands/` (MCP integration with JSON parameter format)
- **MCP Clients**: JSON parameter format for VS Code and other MCP-compatible editors

### Core Workflow Agents

Essential agents for development workflows:

- `codebase-locator` - Finds WHERE files and components exist
- `codebase-analyzer` - Understands HOW specific code works
- `codebase-pattern-finder` - Discovers similar implementation patterns
- `thoughts-locator` - Discovers existing documentation about topics
- `thoughts-analyzer` - Extracts insights from specific documents
- `web-search-researcher` - Performs targeted web research

## Features

- **123+ Specialized Agents**: Covering development, operations, testing, AI, analytics, design, and business domains
- **15+ Workflow Commands**: Complete development workflow from research to deployment
- **Multi-Platform Support**: Claude Code, OpenCode, Cursor, and MCP-compatible clients
- **Automatic Validation**: Ensures compliance with platform specifications
- **Real-time Sync**: Keep projects updated with `codeflow sync` and `codeflow watch start`
- **Interactive Dashboard**: Monitor agent status and system health
- **CLI Research**: Execute deep research workflows directly from command line
- **Format Conversion**: Seamless conversion between platform formats

## CLI Commands

**Core Commands:**

- `setup [project-path]` - Initialize agents and commands in project
- `status [project-path]` - Check sync status and compliance
- `sync [project-path]` - Synchronize with latest agents/commands
- `watch start` - Start automatic file synchronization
- `research "<query>"` - Execute research workflow from CLI

**Management Commands:**

- `list [path]` - List installed agents and commands
- `info <item-name>` - Show detailed agent/command information
- `validate [path]` - Validate agents and commands
- `fix-models` - Fix model configurations
- `clean [path]` - Clean up cache and temp files
- `build-manifest [options]` - Build or rebuild the agent manifest file

**Utility Commands:**

- `convert <source> <target> <format>` - Convert between formats
- `export [path]` - Export project setup
- `update` - Check for CLI updates

Run `codeflow help` for complete documentation.

## Documentation

**Core Documentation:**

- [COMPLIANCE.md](./COMPLIANCE.md) - Format specifications and migration guide
- [DEVELOPMENT.md](./DEVELOPMENT.md) - Development setup and contributing guide
- [CLAUDE.md](./CLAUDE.md) - Claude Code integration guidance
- [ARCHITECTURE_OVERVIEW.md](./docs/ARCHITECTURE_OVERVIEW.md) - System architecture and design

**Guides & Reference:**

- [AGENT_REGISTRY.md](./AGENT_REGISTRY.md) - Complete agent capabilities and usage
- [MCP_QUICKSTART.md](./docs/MCP_QUICKSTART.md) - MCP integration guide
- [SLASH_COMMANDS.md](./docs/SLASH_COMMANDS.md) - Command reference
- [docs/](./docs/) - Architecture, workflow, and implementation details

## License

MIT - See [LICENSE](./LICENSE)

---

**Version**: 0.14.2 | **Agents**: 123+ | **Commands**: 15+ | **Platforms**: Claude Code, OpenCode, Cursor, MCP