# CodeFlow Agents

This document provides a comprehensive overview of all agents available in the CodeFlow system.

## Quick Reference

### 🔍 **Core Research Agents**

- **codebase-locator** - Find WHERE files and components exist
- **codebase-analyzer** - Understand HOW specific code works
- **codebase-pattern-finder** - Discover similar implementation patterns
- **research-locator** - Find existing documentation and decisions
- **research-analyzer** - Extract insights from specific documents
- **web-search-researcher** - Perform targeted web research

### 🏗️ **Specialized Domain Agents**

- **operations-incident-commander** - Incident response leadership
- **development-migrations-specialist** - Database schema migrations
- **quality-testing-performance-tester** - Performance testing and analysis
- **programmatic-seo-engineer** - Large-scale SEO implementation
- **content-localization-coordinator** - i18n/l10n workflow coordination

### 🚀 **Development & Engineering**

- **full-stack-developer** - Cross-functional development
- **api-builder** - API design and implementation
- **database-expert** - Database optimization and design
- **security-scanner** - Vulnerability assessment
- **ux-optimizer** - User experience optimization

### 🧠 **Meta & Orchestration**

- **smart-subagent-orchestrator** - Complex multi-agent workflows
- **agent-architect** - Create custom agents
- **system-architect** - System design and architecture

## Agent Configuration

### OpenCode Model Inheritance

All agents are configured as `subagents` with `mode: subagent`. They **do not specify model fields** and instead inherit the model from:

- Global OpenCode configuration (via TUI or CLI)
- Parent `build` or `plan` agents in `opencode.jsonc`

**Benefits:**

- ✅ Easily switch models globally without editing 137+ agent files
- ✅ Test different models across all agents instantly
- ✅ Consistent model usage across the entire agent ecosystem
- ✅ Simpler agent definitions and maintenance

**To change the model for all agents:**

```bash
# OpenCode CLI
opencode config set model provider/model-name

# Or edit ~/.config/opencode/opencode.jsonc
{
  "model": "anthropic/claude-sonnet-4",
  "agent": {
    "build": { "mode": "primary" },
    "plan": { "mode": "primary" }
  }
}
```

## Build/Lint/Test Commands

```bash
# Build
bun build src/cli/index.ts --target bun
esbuild src/cli/index.ts --bundle --platform=node --target=node18 --outfile=dist/cli.js

# Lint & Format
eslint . --fix && prettier --write .

# Type Check
bun run typecheck  # or: tsc --noEmit

# Test All
bun run test

# Single Test (by name/type)
bun run run-tests.ts [filter]  # e.g., bun run run-tests.ts unit
bun run test:unit              # Unit tests only
bun run test:integration       # Integration tests only
bun run test:e2e              # E2E tests only
bun run test --coverage       # With coverage report

# Agent Management
codeflow validate             # Validate agent definitions
codeflow convert-all         # Generate platform formats
```

## Code Style Guidelines

**TypeScript**: Strict mode, ESNext, bundler resolution, composite projects
**Formatting**: Single quotes, semicolons, trailing commas (es5), 100 char width
**Imports**: ES modules, synthetic defaults allowed, JSON modules enabled
**Naming**: camelCase (vars/functions), PascalCase (types/interfaces), \_prefix (unused)
**Error Handling**: Comprehensive typed errors, proper async/await patterns
**Testing**: Unit (tests/unit/), Integration (tests/integration/), E2E (tests/e2e/)

## Cursor Rules (.cursorrules)

- **Agent Management**: Define in `base-agents/`, validate with `codeflow validate`
- **Platform Conversion**: Auto-generate Claude/OpenCode formats via `codeflow convert-all`
- **Development**: TypeScript strict, Bun runtime, comprehensive testing required
- **Architecture**: CLI core in `src/cli/`, agents in `base-agents/`, docs in `docs/`

## Getting Started

```bash
# Research existing code
/research "authentication implementation"

# Plan new features
/plan "add OAuth2 authentication"

# Execute with specialists
/execute "implement authentication flow"
```

## Documentation

### CodeFlow Documentation

- [Agent Registry](./docs/AGENT_REGISTRY.md) - Complete agent catalog
- [Development Standards](./docs/) - Coding guidelines and best practices
- [Cursor Rules](./.cursorrules) - Project development standards

### Official Platform Documentation

- [OpenCode Agents](https://opencode.ai/docs/agents/) - OpenCode agent configuration and usage
- [OpenCode Commands](https://opencode.ai/docs/commands/) - OpenCode command syntax and patterns
- [Claude Code Documentation](https://docs.claude.com/en/docs/claude-code/overview) - Claude Code features and guides
- [Cursor Agent Modes](https://cursor.com/docs/agent/modes) - Cursor agent modes and subagent configuration
- [Cursor Commands](https://cursor.com/docs/agent/chat/commands) - Cursor chat commands and slash command syntax

## Version History

### v0.17.4 (Current)

- ✅ **Node.js Compatibility**: Fixed Bun.write() → writeFile() for Node.js runtime
- ✅ **Agent Categorization**: Implemented 8 categories (ai-innovation, business-analytics, design-ux, development, generalist, operations, product-strategy, quality-testing)
- ✅ **Platform Support**: Claude Code (categorized dirs) + OpenCode (flat structure)
- ✅ **Agent Count**: 137 agents + 58 commands
- ✅ **Directory Structure**: Proper categorization with platform-specific handling

### Previous Versions

- v0.17.3: Initial agent ecosystem with 135+ agents
- v0.17.2: MCP integration and command system
- v0.17.1: Platform conversion framework
- v0.17.0: Core CLI and agent management

---

_This document serves as the main AGENTS.md file for the CodeFlow project, providing quick access to all available agents and their usage patterns._
