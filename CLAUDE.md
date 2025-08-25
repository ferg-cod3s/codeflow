# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Type checking**: `npm run typecheck` or `bun run typecheck` - Runs TypeScript compiler without emitting files
- **Installation**: `bun install && bun run install` - Installs dependencies and links the CLI globally

## Architecture Overview

This is an **Agentic Workflow CLI** built with **Bun** and **TypeScript** that manages opencode agents and commands for AI-assisted development workflows.

### Core Structure

- **CLI Entry Point**: `src/cli/index.ts` - Main CLI with `pull`, `status`, and `version` commands
- **Agent Definitions**: `/agent/` - Specialized subagents for codebase analysis and research
- **Command Prompts**: `/command/` - Complex workflow commands that orchestrate multiple agents
- **Workflow Documentation**: `/README.md` - Contains the full agentic workflow process

### Key Components

**CLI Commands**:
- `agentic pull [project-path]` - Copies agents and commands to a project's `.opencode` directory
- `agentic status [project-path]` - Checks which files are up-to-date or outdated

**Core Workflow Agent Types**:
- `codebase-locator` - Finds WHERE files and components exist
- `codebase-analyzer` - Understands HOW specific code works  
- `codebase-pattern-finder` - Discovers similar implementation patterns
- `thoughts-locator` - Discovers existing documentation about topics
- `thoughts-analyzer` - Extracts insights from specific documents
- `web-search-researcher` - Performs targeted web research

**Specialized Domain Agents** (Claude Code format):
- `operations_incident_commander` - Incident response leadership and coordination
- `development_migrations_specialist` - Database schema migrations and data backfills
- `quality-testing_performance_tester` - Performance testing and bottleneck analysis
- `programmatic_seo_engineer` - Large-scale SEO architecture and content generation
- `content_localization_coordinator` - i18n/l10n workflow coordination

**Additional OpenCode Format Agents** (in `/agent/opencode/`):
- `agent-architect` - Meta-agent for creating specialized AI agents
- `smart-subagent-orchestrator` - Complex multi-domain project coordination
- `ai-integration-expert`, `api-builder`, `database-expert`, `full-stack-developer`
- `growth-engineer`, `security-scanner`, `ux-optimizer` and others

**Command Workflows**:
- `/research` - Comprehensive codebase and documentation analysis
- `/plan` - Creates detailed implementation plans from tickets and research
- `/execute` - Implements plans with proper verification
- `/test` - Generates comprehensive test suites for implemented features
- `/document` - Creates user guides, API docs, and technical documentation
- `/commit` - Creates commits with structured messages
- `/review` - Validates implementations against original plans

**Slash Commands Available**:
- **Claude Code**: Commands in `.claude/commands/` (YAML frontmatter format)
- **OpenCode**: Commands in `.opencode/command/` (YAML frontmatter with agent/model specs)
- Use `agentic commands` to list all available slash commands and their descriptions
- Commands are automatically copied to projects via `agentic pull [project-path]`

### Workflow Philosophy

The system emphasizes **context compression** and **fresh analysis** over caching. Each phase uses specialized agents to gather only the essential information needed for the next phase, enabling complex workflows within context limits.

**Critical Patterns**: 
- Always run locator agents first in parallel, then run analyzer agents only after locators complete. This prevents premature analysis without proper context.
- Use specialized domain agents selectively based on the research or implementation domain (operations, database migrations, performance, SEO, localization)
- Agents have defined handoff targets for complex scenarios - follow escalation paths when needed

### MCP Integration

The system now includes **Model Context Protocol (MCP)** support:

- **MCP Server**: `mcp/agentic-server.mjs` - Provides dynamic access to all workflow components
- **Tool Discovery**: Auto-registers commands and agents as MCP tools
- **Stable Naming**: Semantic tool names for predictable access (e.g., `agentic.command.research`)
- **Client Support**: Compatible with Claude Desktop, OpenCode, and other MCP clients

### Development Notes

- Uses **Bun runtime** for fast TypeScript execution
- CLI binary linked via `bun link` for global access
- TypeScript configured for ES modules with Bun-specific types
- **MCP Dependencies**: `@modelcontextprotocol/sdk`, `zod` for server implementation
- No test framework currently configured
- See `AGENT_REGISTRY.md` for complete agent capabilities and usage guidelines
- See `MCP_INTEGRATION.md` for MCP server setup and tool reference