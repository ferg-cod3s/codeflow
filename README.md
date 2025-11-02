# Codeflow - AI Agent, Command & Skill Distribution Platform

A comprehensive TypeScript-based CLI platform for distributing 137+ specialized AI agents, 58+ workflow commands, and 9+ MCP skills across Claude Code, OpenCode, and MCP-compatible clients. Built with Bun for maximum performance and reliability.

## Quick Start

```bash
# Install dependencies and link CLI globally
bun install && bun run install

# Setup 137+ agents, 58+ commands, and 9+ skills in your project
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

## Publishing

For maintainers, publishing is streamlined:

```bash
# Patch release with automatic GitHub release
npm run release:publish:patch

# Minor release
npm run release:publish:minor

# Major release
npm run release:publish:major

# Or use the script directly
./scripts/release.sh --bump-patch --publish
```

See [PUBLISHING.md](./PUBLISHING.md) for detailed publishing guide.

## Platform Support

**Claude Code (v2.x.x)**: Native integration with YAML frontmatter format for agents, commands, and skills
**OpenCode**: Full support with mode, temperature, and allowed*directories for all content types
**Cursor**: Full support for creating agents and commands with built-in modes (Agent, Ask, Plan) and custom modes (Beta) configured through Cursor Settings UI
**MCP Clients**: JSON parameter format for VS Code and other MCP-compatible editors with skills* prefixed tools

See [COMPLIANCE.md](./COMPLIANCE.md) for detailed format specifications and migration guide.

## Platform Integration Details

### Claude Code Integration

Claude Code provides comprehensive AI-powered coding assistance with built-in tools and capabilities:

#### Core Features

- **File Analysis**: Automatically reads and analyzes your project files as needed
- **Code Editing**: Makes changes with your approval - always asks permission before modifying files
- **Built-in Documentation**: Claude has access to its own documentation and can answer questions about features
- **Text Editor Tool**: Advanced file manipulation with proper error handling and validation

#### Best Practices

- **Be Specific**: Instead of "fix the bug", try "fix the login bug where users see a blank screen after entering wrong credentials"
- **Step-by-Step**: Break complex tasks into clear steps
- **Let Claude Explore**: Use commands like "analyze the database schema" before making changes
- **Use Shortcuts**: Press `?` for keyboard shortcuts, Tab for completion, ↑ for history, `/` for slash commands

#### File Types

- **Commands**: YAML frontmatter format in `.claude/commands/`
- **Agents**: YAML format in `.claude/agents/` with name, description, tools, and model configuration

### OpenCode Integration

OpenCode provides AI coding assistance with distinct modes and workflow capabilities:

#### Built-in Modes

- **Build Mode**: Default mode for making code changes and implementing features
- **Plan Mode**: Disables changes and instead suggests implementation plans (switch with Tab key)

#### Core Features

- **Interactive Planning**: Use Plan mode to create detailed implementation plans before building
- **Image Analysis**: Can scan and analyze images you provide for design references
- **Undo/Redo**: Use `/undo` and `/redo` commands to revert or reapply changes
- **File References**: Use `@filename` syntax to reference specific files in your requests

#### Workflow Examples

1. **Feature Development**: Switch to Plan mode → Describe feature → Iterate on plan → Switch back to Build mode → Implement
2. **Code Analysis**: Ask specific questions like "How is authentication handled in @packages/functions/src/api/index.ts"
3. **Direct Changes**: For straightforward modifications, ask directly in Build mode with clear context

#### File Types

- **Commands**: Enhanced YAML configuration in `.opencode/command/`
- **Agents**: YAML format in `.opencode/agent/` with mode, temperature, and allowed_directories
- **Skills**: YAML format in `.opencode/skills/` with noReply: true for message insertion persistence
- **Rules**: See `AGENTS.md` for comprehensive agent documentation and project instructions

### Cursor Integration

Cursor provides AI coding assistance with multiple agent modes and customization options:

#### Built-in Agent Modes

- **Agent**: Default mode with all tools enabled for complex coding tasks
- **Ask**: Read-only mode with search tools only
- **Plan**: Creates detailed plans before execution with all tools enabled

#### Custom Modes (Beta)

You can create custom modes through Cursor Settings UI:

1. **Enable**: Cursor Settings → Chat → Custom Modes
2. **Configure**:
   - Select specific tools (Search, Edit & Reapply, Terminal, etc.)
   - Add custom instructions for behavior
3. **Example configurations**:
   - **Learn Mode**: All Search tools + "Focus on explaining concepts thoroughly"
   - **Debug Mode**: All Search + Terminal + Edit & Reapply + "Investigate thoroughly before fixes"
   - **Refactor Mode**: Edit & Reapply tools + "Improve structure without new functionality"

#### File Types

- **Commands**: Plain Markdown (.md) files in `.cursor/commands/`
- **Agents**: Plain Markdown (.md) files in `.cursor/agents/`
- **Skills**: Plain Markdown (.md) files in `.cursor/skills/` with noReply: true frontmatter
- **Custom Modes**: Configured through Cursor Settings UI (not file-based)
- **Switching**: Use mode picker dropdown in Agent or press `Cmd+.` for quick switching

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

## MCP Skills

CodeFlow includes 9+ MCP skills that provide specialized tool integration for enhanced development workflows:

### Development Skills

- **skills_docker-container-management** - Container lifecycle management and operations
- **skills_git-workflow-management** - Git operations, branching, and version control

### MCP Integration Skills

- **skills_context7-documentation-research** - Documentation lookup and research
- **skills_playwright-web-automation** - Browser automation and testing
- **skills_chrome-devtools-inspection** - Browser debugging and inspection
- **skills_coolify-application-management** - Application deployment and management
- **skills_sentry-incident-response** - Error tracking and incident management
- **skills_socket-security-analysis** - Package security and vulnerability analysis

### Operations Skills

- **skills_kubernetes-deployment-automation** - K8s deployment and orchestration

### Skill Requirements

All skills require:

- `noReply: true` in frontmatter (for message insertion persistence)
- `name` field in hyphen-case format
- `description` field (minimum 20 characters)
- Proper YAML frontmatter structure

### Platform Integration

- **Claude Code**: Commands in `.claude/commands/` with YAML frontmatter
- **OpenCode**: Commands in `.opencode/command/` with enhanced YAML configuration
- **Cursor**: Commands in `.cursor/commands/` as Markdown (.md) files, custom modes configured through Cursor Settings UI
- **MCP Clients**: JSON parameter format for VS Code and other MCP-compatible editors

## Architecture

### Single Source of Truth

All 137+ agents, 58+ commands, and 9+ skills are defined once using unified formats:

**Agent Categories:**

- `development/` (57 agents) - Full-stack, backend, frontend, mobile development
- `operations/` (15 agents) - DevOps, infrastructure, monitoring, incident response
- `quality-testing/` (13 agents) - Testing, QA, performance, security scanning
- `ai-innovation/` (8 agents) - LLM integration, AI agents, prompt engineering
- `business-analytics/` (18 agents) - Data analysis, metrics, business intelligence
- `design-ux/` (5 agents) - UI/UX, accessibility, design systems
- `product-strategy/` (1 agent) - Product management, growth, requirements

**Skill Categories:**

- `development/` (2 skills) - Container management, Git workflows
- `mcp/` (6 skills) - MCP service integrations (Sentry, Context7, Coolify, etc.)
- `operations/` (1 skill) - Kubernetes deployment automation
- `generalist/` (6 agents) - General purpose agents and orchestrators

### Automatic Platform Conversion

The CLI automatically converts BaseAgent format to platform-specific formats:

- **Claude Code**: `.claude/agents/` and `.claude/commands/` (YAML with name, description, tools, model)
- **OpenCode**: `.opencode/agent/` and `.opencode/command/` (YAML with mode, temperature, allowed_directories)
- **Cursor**: `.cursor/commands/` (Markdown files), custom modes via Cursor Settings UI
- **MCP Clients**: JSON parameter format for VS Code and other MCP-compatible editors

### Core Workflow Agents

Essential agents for development workflows:

- `codebase-locator` - Finds WHERE files and components exist
- `codebase-analyzer` - Understands HOW specific code works
- `codebase-pattern-finder` - Discovers similar implementation patterns
- `research-locator` - Discovers existing documentation about topics
- `research-analyzer` - Extracts insights from specific documents
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
