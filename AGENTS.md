# CodeFlow Agents

Comprehensive agent ecosystem with **Verbalized Sampling (VS)** integration for consistent, high-quality AI development across OpenCode, Claude Code, and Cursor platforms.

## Quick Reference

### 🔍 **Core Research**

- **codebase-locator** - Find WHERE files/components exist
- **codebase-analyzer** - Understand HOW specific code works
- **codebase-pattern-finder** - Discover similar implementation patterns
- **research-locator** - Find existing documentation and decisions
- **research-analyzer** - Extract insights from documents
- **web-search-researcher** - Perform targeted web research

### 🏗️ **Development & Engineering**

- **full-stack-developer** - Cross-functional development
- **api-builder** - API design and implementation
- **database-expert** - Database optimization and design
- **security-scanner** - Vulnerability assessment
- **ux-optimizer** - User experience optimization

### 🚀 **Specialized Domains**

- **operations-incident-commander** - Incident response leadership
- **development-migrations-specialist** - Database schema migrations
- **quality-testing-performance-tester** - Performance testing
- **programmatic-seo-engineer** - Large-scale SEO implementation
- **content-localization-coordinator** - i18n/l10n workflows

### 🧠 **Meta & Orchestration**

- **smart-subagent-orchestrator** - Complex multi-agent workflows
- **agent-architect** - Create custom agents
- **system-architect** - System design and architecture

## Verbalized Sampling (VS)

**VS System**: AI-powered strategy generation with confidence scoring, platform adapters, and automated validation.

**CLI Commands**:

```bash
bun run vs:validate    # Validate VS integration
bun run vs:test "query" # Test VS generation
bun run vs:inject      # Inject VS into files
bun run vs:sync        # Sync VS patterns
```

**Results**: 683 valid files (76% of codebase), 80.2/100 average quality score, cross-platform support.

## Configuration

### Model Inheritance

All agents inherit models from global OpenCode configuration - no individual model fields needed. Switch models globally without editing 137+ agent files.

```bash
# Change model for all agents
opencode config set model provider/model-name
```

### Simplified Validation System

**Isolated Environment**: Validation now uses isolated `tmp/validation-{timestamp}/` directories instead of scanning main repository directories.

**Benefits**:

- ✅ Complete isolation from development directories
- ✅ Tests actual conversion process end-to-end
- ✅ Removes complex exclusion logic
- ✅ Uses existing conversion pipeline
- ✅ Simplified, maintainable code structure

**Process**:

1. Parse source agents from `base-agents/` only
2. Create isolated `tmp/validation-{timestamp}/` environment
3. Convert agents to `tmp/claude-agents/` and `tmp/opencode-agents/`
4. Validate only in tmp directories
5. Report results and cleanup automatically

## Development Commands

```bash
# Core Development
bun run typecheck          # Type checking
bun run test              # Run all tests
bun run test:unit         # Unit tests only
bun run test:integration  # Integration tests only
bun run test:e2e         # E2E tests only

# Agent Management
codeflow validate         # Validate agents in isolated tmp environment
codeflow validate --format claude-code  # Validate specific platform format
codeflow validate --format opencode     # Validate OpenCode format
codeflow validate --format all          # Validate all formats
codeflow convert-all     # Generate platform formats

# VS Integration
bun run vs:validate       # Validate VS integration
bun run vs:test "query"   # Test VS generation
bun run vs:inject         # Inject VS into files
bun run vs:sync           # Sync VS patterns

# Build & Lint
bun build src/cli/index.ts --target bun
eslint . --fix && prettier --write .
```

## Getting Started

```bash
# Research existing code
/research "authentication implementation"

# Plan new features
/plan "add OAuth2 authentication"

# Execute with specialists
/execute "implement authentication flow"
```

## Code Style

- **TypeScript**: Strict mode, ESNext, composite projects
- **Formatting**: Single quotes, semicolons, trailing commas, 100 char width
- **Testing**: Unit (tests/unit/), Integration (tests/integration/), E2E (tests/e2e/)
- **Architecture**: CLI in `src/cli/`, agents in `base-agents/`, docs in `docs/`

## Documentation

- **[Agent Registry](./docs/AGENT_REGISTRY.md)** - Complete agent catalog
- **[Development Standards](./docs/)** - Coding guidelines and best practices
- **[VS Integration](./src/verbalized-sampling/)** - Core VS system documentation

## Platform Documentation

- **[OpenCode Agents](https://opencode.ai/docs/agents/)** - Agent configuration and usage
- **[Claude Code](https://docs.claude.com/en/docs/claude-code/overview)** - Features and guides
- **[Cursor Agents](https://cursor.com/docs/agent/modes)** - Agent modes and configuration

## Release Process

Automated releases via GitHub Actions:

```bash
# Create release (triggers workflow)
git tag v0.17.4 && git push origin v0.17.4
```

**Process**: Type check → Version update → OIDC auth → NPM publish → GitHub release

## Current Version (v0.17.4)

- ✅ **137 agents + 58 commands** across 8 categories
- ✅ **Platform support**: Claude Code (categorized) + OpenCode (flat)
- ✅ **Node.js compatibility** and automated publishing
- ✅ **VS integration** with 80.2/100 average quality score

---

_CodeFlow provides quick access to all available agents and their usage patterns._

## Documentation

- **[Agent Registry](./docs/AGENT_REGISTRY.md)** - Complete agent catalog
- **[Development Standards](./docs/)** - Coding guidelines and best practices
- **[VS Integration](./src/verbalized-sampling/)** - Core VS system documentation

## Platform Documentation

- **[OpenCode Agents](https://opencode.ai/docs/agents/)** - Agent configuration and usage
- **[Claude Code](https://docs.claude.com/en/docs/claude-code/overview)** - Features and guides
- **[Cursor Agents](https://cursor.com/docs/agent/modes)** - Agent modes and configuration

## Release Process

Automated releases via GitHub Actions:

```bash
# Create release (triggers workflow)
git tag v0.17.4 && git push origin v0.17.4
```

**Process**: Type check → Version update → OIDC auth → NPM publish → GitHub release

## Current Version (v0.17.4)

- ✅ **137 agents + 58 commands** across 8 categories
- ✅ **Platform support**: Claude Code (categorized) + OpenCode (flat)
- ✅ **Node.js compatibility** and automated publishing
- ✅ **VS integration** with 80.2/100 average quality score

---

_CodeFlow provides quick access to all available agents and their usage patterns._
