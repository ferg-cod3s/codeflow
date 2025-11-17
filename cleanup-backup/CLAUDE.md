# CLAUDE.md



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


This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Core Project Knowledge

**Import shared development knowledge**: See @AGENTS.md for:
- Build, test, and lint commands
- Code style guidelines
- Agent catalog and usage patterns
- Getting started workflows
- Documentation references

The information below is specific to Claude Code features and patterns.

## Claude Code-Specific Patterns

### Using Subagents

Claude Code provides native subagent support. When working in this codebase, leverage specialized subagents from `.claude/agents/`:

**Research Pattern** (always follow this order):
1. Run locator subagents first (in parallel):
   - `codebase-locator` - Find WHERE files exist
   - `research-locator` - Find existing documentation

2. Then run analyzer subagents:
   - `codebase-analyzer` - Understand HOW code works
   - `research-analyzer` - Extract insights from docs
   - `codebase-pattern-finder` - Find similar patterns

**Critical Rule**: Never run analyzer subagents before locators. Locators gather context; analyzers consume it.

### Agent Invocation

Claude Code automatically delegates to subagents based on task descriptions. You can also explicitly request them:

```
"Use the codebase-locator subagent to find authentication files"
"Use the security-scanner subagent to check for vulnerabilities"
```

### Slash Commands Available

After running `codeflow setup`, these workflow commands are available:

- `/research` - Comprehensive codebase and documentation analysis
- `/plan` - Creates detailed implementation plans
- `/execute` - Implements plans with verification
- `/test` - Generates comprehensive test suites
- `/document` - Creates user guides and API docs
- `/commit` - Creates commits with structured messages
- `/review` - Validates implementations against plans
- `/continue` - Resume execution from last completed step
- `/help` - Get detailed development guidance

## Architecture for Claude Code Context

### Model Inheritance

All Claude Code subagents use `model: inherit` to automatically adapt to the model you're currently using:
- **Sonnet** in normal/plan mode
- **Haiku** in code mode
- **Opus** when you explicitly select it

This means agents seamlessly use the right model for the task without hardcoding model preferences. No configuration needed!

### Critical: Single Source of Truth Pattern

**NEVER directly edit platform-specific agent directories**. This is the most important architectural principle:

```
base-agents/                    # ← EDIT HERE (single source of truth)
  ├── development/
  ├── operations/
  ├── quality-testing/
  └── ...

        ↓ Automatic Conversion ↓

.claude/agents/                 # ← NEVER EDIT (auto-generated)
.opencode/agent/                # ← NEVER EDIT (auto-generated)
```

**Workflow**:
1. Edit agents in `base-agents/[category]/agent-name.md`
2. Validate: `codeflow validate`
3. Convert: `codeflow sync` or `codeflow convert`
4. Generated files appear in `.claude/agents/`

### Project Structure for Navigation

```
src/cli/index.ts               # Main CLI entry point
src/cli/*.ts                   # Individual CLI commands
src/conversion/agent-parser.ts # Agent format definitions
src/adapters/                  # Platform-specific converters
base-agents/                   # Single source of truth for agents
tests/                         # Comprehensive test suite
  ├── unit/                    # Fast, isolated tests
  ├── integration/             # Multi-component tests
  └── e2e/                     # End-to-end workflows
```

### Agent Format Reference

Agents in `base-agents/` use this YAML frontmatter format:

```yaml
---
name: agent-name
description: Brief description
mode: subagent
temperature: 0.1
model: anthropic/claude-sonnet-4
category: development
tags: [typescript, testing]
tools:
  read: true
  write: true
  bash: true
---

Agent system prompt content here...
```

**For Claude Code**: The conversion process transforms this into `.claude/agents/` format with:
- `tools` as comma-separated string (not object)
- `model` as `sonnet`, `opus`, `haiku`, or `inherit`

## Development Workflow with Claude Code

### Before Making Changes

1. **Research first**: Use `/research` or `codebase-locator` + `codebase-analyzer` subagents
2. **Understand patterns**: Use `codebase-pattern-finder` to see similar implementations
3. **Check documentation**: Use `research-locator` + `research-analyzer` for existing decisions

### When Adding Agents

1. Create in `base-agents/[category]/agent-name.md`
2. Use BaseAgent YAML format (see above)
3. Validate: `codeflow validate`
4. Test conversion: `codeflow sync --dry-run`
5. Generate: `codeflow sync`
6. Test the agent in Claude Code

### Before Committing

```bash
bun run typecheck    # Type check
bun run lint         # Lint check
bun run test         # All tests
```

## Path Security Pattern

This codebase implements strict path validation. When working with file operations, note that:

- All user-provided paths go through `safeResolve()` validation
- Directory traversal (`..`) is prevented
- Paths are validated against allowed root directories
- This pattern is in `src/cli/index.ts` and used throughout

## Multi-Runtime Support

The project supports both Bun (preferred) and Node.js:

```bash
# Bun (preferred)
bun run typecheck
bun run test

# Node.js (fallback)
npm run typecheck:node
npm run test:node
```

All npm scripts have `:node` equivalents for compatibility.

## Key Files to Understand

**Read First**:
- `src/cli/index.ts` - CLI structure and command routing
- `src/conversion/agent-parser.ts` - Agent format definitions
- `base-agents/development/codebase-analyzer.md` - Example agent
- `@AGENTS.md` - Complete agent catalog and commands

**Never Edit**:
- `.claude/agents/*` - Auto-generated
- `.opencode/agent/*` - Auto-generated
- `AGENT_MANIFEST.json` - Auto-generated

## Testing Philosophy

- **Unit tests** (`tests/unit/`) - Fast, isolated, pure functions
- **Integration tests** (`tests/integration/`) - Multi-component interactions
- **E2E tests** (`tests/e2e/`) - Complete workflows

Run specific test types with:
```bash
bun run test:unit
bun run test:integration
bun run test:e2e
```

Or filter by name/path:
```bash
bun run run-tests.ts agent       # Tests matching "agent"
bun test path/to/specific.test.ts
```

## MCP Integration Notes

The project includes MCP (Model Context Protocol) server implementation in `packages/agentic-mcp/`. This enables:
- Research workflow orchestration
- Agent spawning and coordination
- Quality validation for outputs

MCP server can be started with:
```bash
bun run mcp:server
bun run mcp:dev  # Watch mode
```

## Common Pitfalls to Avoid

1. ❌ Editing `.claude/agents/` directly → ✅ Edit `base-agents/` and convert
2. ❌ Forgetting to validate agents → ✅ Run `codeflow validate` before committing
3. ❌ Running analyzers before locators → ✅ Always run locators first
4. ❌ Skipping type checking → ✅ Run `bun run typecheck` before commits
5. ❌ Manual path manipulation → ✅ Use `safeResolve()` for all user paths

## Documentation

- **@AGENTS.md** - Agent catalog, commands, code style (imported above)
- **README.md** - Project overview and quick start
- **COMPLIANCE.md** - Platform format specifications
- **docs/AGENT_REGISTRY.md** - Complete agent capabilities reference
- **docs/TROUBLESHOOTING.md** - Common issues and solutions

---

**Remember**: This codebase distributes 123+ agents to thousands of developers. Always validate changes, maintain backward compatibility, and test across both Bun and Node.js runtimes.
