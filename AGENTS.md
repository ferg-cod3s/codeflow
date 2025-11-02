# CodeFlow Agents

<!-- VERBALIZED SAMPLING INTEGRATION -->
<!-- ================================ -->

**Selected Strategy**: Code-Path Analysis
**Confidence**: 71.0%

**Available Strategies**:

1. **Code-Path Analysis** (Confidence: 71.0%)
   - Plan: Identify entry points and main execution flows, Trace key decision branches and conditional logic...
2. **Pattern Discovery** (Confidence: 71.0%)
   - Plan: Scan codebase for repeated code structures, Identify naming conventions and architectural patterns...
3. **Architecture Mapping** (Confidence: 71.0%)
   - Plan: Identify major components and modules, Map data flow and dependencies between components...

This document provides a comprehensive overview of all agents available in the CodeFlow system.

## Verbalized Sampling Integration

CodeFlow includes a comprehensive **Verbalized Sampling (VS)** system that automatically generates and validates AI agent strategies for consistent, high-quality development across all platforms.

### VS System Overview

The VS integration provides:

- **🎯 Strategy Generation**: AI-powered creation of multiple solution approaches with confidence scoring
- **🔧 Platform Adapters**: Native support for OpenCode, Claude Code, and Cursor platforms
- **📊 Validation Framework**: Automated quality assurance with scoring (0-100)
- **🚀 Batch Injection**: Automated VS integration across entire codebases
- **🔗 Development Workflow**: Git hooks and CI/CD integration for continuous validation

### VS CLI Tools

```bash
# Validate VS integration across codebase
bun run vs:validate

# Test VS generation for specific problems
bun run vs:test "How does authentication work?"

# Inject VS into specific files
bun run vs:inject

# Export VS patterns to global repository
bun run vs:export

# Import VS patterns from global repository
bun run vs:import

# Sync VS patterns across repositories
bun run vs:sync
```

### VS Configuration

The system is configured via `vs-config.json`:

```json
{
  "verbalized_sampling": {
    "enabled": true,
    "platform": "opencode",
    "auto_inject": true,
    "confidence_threshold": 0.7,
    "strategy_count": 3,
    "output_format": "markdown",
    "validation": {
      "strict_mode": true,
      "include_warnings": true,
      "include_suggestions": true,
      "min_quality_score": 80
    }
  }
}
```

### Development Workflow Integration

VS is integrated into the development workflow via:

- **Git Hooks**: Automatic validation on commits (`pre-commit` hook)
- **NPM Scripts**: Dedicated VS management commands
- **CI/CD**: Automated validation in build pipelines
- **Batch Processing**: Tools for large-scale VS integration

### VS Statistics

- **683 valid files** (76% of codebase)
- **220 files pending** review/integration
- **Average quality score**: 80.2/100
- **Platforms supported**: OpenCode, Claude Code, Cursor

### VS Integration Results

Successfully completed comprehensive VS integration across the entire codebase:

- **413 files processed** with automated VS injection
- **Quality scores improved** from 69.0% to 80.2% average (+11.2 points)
- **179 additional files** now pass validation (504 → 683)
- **Git hooks configured** for automatic validation on commits
- **NPM scripts added** for VS management and testing
- **Cross-platform support** validated for all major AI platforms
- **Documentation files** properly excluded from strict validation

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

# VS Integration
bun run vs:validate           # Validate VS integration
bun run vs:test               # Test VS generation
bun run vs:inject             # Inject VS into files
bun run vs:sync               # Sync VS patterns
npm run precommit:vs          # Pre-commit VS validation
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

# VS Integration Setup
./scripts/setup-vs-integration.sh    # Setup VS in development workflow
bun run vs:validate .               # Validate VS integration
bun run vs:test "your problem"      # Test VS generation
```

## Documentation

### CodeFlow Documentation

- [Agent Registry](./docs/AGENT_REGISTRY.md) - Complete agent catalog
- [Development Standards](./docs/) - Coding guidelines and best practices
- [Cursor Rules](./.cursorrules) - Project development standards

### VS Integration Documentation

- [VS CLI Tools](./src/verbalized-sampling/cli.ts) - Command-line interface
- [VS Universal Integration](./src/verbalized-sampling/universal-integration.ts) - Core integration system
- [VS Validation Framework](./src/verbalized-sampling/validation-framework.ts) - Quality assurance
- [VS Platform Adapters](./src/verbalized-sampling/platform-adapters.ts) - Platform support
- [VS Injection Patterns](./src/verbalized-sampling/injection-patterns.ts) - Pattern definitions

### Official Platform Documentation

- [OpenCode Agents](https://opencode.ai/docs/agents/) - OpenCode agent configuration and usage
- [OpenCode Commands](https://opencode.ai/docs/commands/) - OpenCode command syntax and patterns
- [Claude Code Documentation](https://docs.claude.com/en/docs/claude-code/overview) - Claude Code features and guides
- [Cursor Agent Modes](https://cursor.com/docs/agent/modes) - Cursor agent modes and subagent configuration
- [Cursor Commands](https://cursor.com/docs/agent/chat/commands) - Cursor chat commands and slash command syntax

## Release Process

### Automated Publishing

CodeFlow uses GitHub Actions for automated releases via `.github/workflows/release.yml`:

**Triggers:**

- **Tag Push**: `git tag v0.17.4 && git push origin v0.17.4`
- **Manual Dispatch**: GitHub Actions UI with version input

**Process:**

1. ✅ **Type Check**: `bun run typecheck`
2. ✅ **Version Update**: Updates `package.json` automatically
3. ✅ **OIDC Authentication**: Uses GitHub OIDC (no tokens needed)
4. ✅ **NPM Publish**: `npm publish --provenance`
5. ✅ **GitHub Release**: Auto-generated with changelog

**Manual Publishing:**

```bash
# Create and push tag (triggers workflow)
git tag v0.17.4
git push origin v0.17.4

# Or manual workflow dispatch
# Visit: https://github.com/ferg-cod3s/codeflow/actions/workflows/release.yml
```

**Local Publishing (Development):**

```bash
# Requires OTP from authenticator
npm publish --otp=<6-digit-code>
```

## Version History

### v0.17.4 (Current)

- ✅ **Node.js Compatibility**: Fixed Bun.write() → writeFile() for Node.js runtime
- ✅ **Agent Categorization**: Implemented 8 categories (ai-innovation, business-analytics, design-ux, development, generalist, operations, product-strategy, quality-testing)
- ✅ **Platform Support**: Claude Code (categorized dirs) + OpenCode (flat structure)
- ✅ **Agent Count**: 137 agents + 58 commands
- ✅ **Directory Structure**: Proper categorization with platform-specific handling
- ✅ **Automated Publishing**: GitHub Actions workflow with OIDC authentication

### Previous Versions

- v0.17.3: Initial agent ecosystem with 135+ agents
- v0.17.2: MCP integration and command system
- v0.17.1: Platform conversion framework
- v0.17.0: Core CLI and agent management

---

_This document serves as the main AGENTS.md file for the CodeFlow project, providing quick access to all available agents and their usage patterns._
