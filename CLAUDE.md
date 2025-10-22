# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Global Development Standards

**IMPORTANT**: All coding must follow the centralized development standards. These are the single source of truth for all projects:

- **[Global Rules](../../docs/global-rules.md)** - Overview and core development principles
- **[Git Workflow](../../docs/git-workflow.md)** - Branch strategy, commit conventions, PR process, versioning
- **[Testing Standards](../../docs/testing-standards.md)** - TDD practices, testing patterns, frameworks, coverage requirements
- **[Security Guidelines](../../docs/security-guidelines.md)** - Authentication, data protection, OWASP compliance, secure coding
- **[Code Quality](../../docs/code-quality.md)** - SOLID principles, naming conventions, function complexity, code organization
- **[Accessibility](../../docs/accessibility.md)** - WCAG 2.2 AA compliance, keyboard navigation, screen readers, ARIA
- **[Communication Style](../../docs/communication-style.md)** - AI agent interaction patterns, intellectual honesty, clarification guidelines

## Development Commands

- **Type checking**: `npm run typecheck` or `bun run typecheck` - Runs TypeScript compiler without emitting files
- **Installation**: `bun install && bun run install` - Installs dependencies and links the CLI globally

## Architecture Overview

This is a **Codeflow Automation Enhancement CLI** built with **Bun** and **TypeScript** that manages agents and commands for AI-assisted development workflows.

### Core Structure

- **CLI Entry Point**: `src/cli/index.ts` - Main CLI with core MVP commands
- **Agent Definitions**: `/agent/` - Specialized subagents for codebase analysis and research
- **Command Prompts**: `/command/` - Complex workflow commands that orchestrate multiple agents
- **Workflow Documentation**: `/README.md` - Contains the full codeflow automation process

### Key Components

**CLI Commands** (MVP):

- `codeflow setup [project-path]` - Sets up codeflow directory structure and copies agents/commands
- `codeflow status [project-path]` - Checks which files are up-to-date or outdated
- `codeflow sync [project-path]` - Synchronizes agents and commands with global configuration
- `codeflow convert` - Converts agents between different formats
- `codeflow watch start` - Starts file watching for automatic synchronization

**Core Workflow Agent Types**:

- `codebase-locator` - Finds WHERE files and components exist
- `codebase-analyzer` - Understands HOW specific code works
- `codebase-pattern-finder` - Discovers similar implementation patterns
- `research-locator` - Discovers existing documentation about topics
- `research-analyzer` - Extracts insights from specific documents
- `web-search-researcher` - Performs targeted web research

**Specialized Domain Agents** (Claude Code format):

- `operations_incident_commander` - Incident response leadership and coordination
- `development_migrations_specialist` - Database schema migrations and data backfills
- `quality-testing_performance_tester` - Performance testing and bottleneck analysis
- `programmatic_seo_engineer` - Large-scale SEO architecture and content generation
- `content_localization_coordinator` - i18n/l10n workflow coordination

**Base Agent Architecture**:

- **Source of Truth**: `codeflow-agents/` - Base agents in hierarchical structure by domain
- **Platform Conversion**: Agents are converted to platform-specific formats on setup
- **Claude Code Format**: Converted to `.claude/agents/` with YAML frontmatter
- **OpenCode Format**: Converted to `.opencode/agent/` with proper permissions and configuration

**Agent Categories** (Base Format):

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
- **Cursor**: Rules in `.cursorrules` (plain text format for AI context)
- **OpenCode**: Commands in `.opencode/command/` (YAML frontmatter with agent/model specs)
- Use `codeflow commands` to list all available slash commands and their descriptions
- Commands are automatically copied to projects via `codeflow setup [project-path]`

### Workflow Philosophy

The system emphasizes **context compression** and **fresh analysis** over caching. Each phase uses specialized agents to gather only the essential information needed for the next phase, enabling complex workflows within context limits.

**Critical Patterns**:

- Always run locator agents first in parallel, then run analyzer agents only after locators complete. This prevents premature analysis without proper context.
- Use specialized domain agents selectively based on the research or implementation domain (operations, database migrations, performance, SEO, localization)
- Agents have defined handoff targets for complex scenarios - follow escalation paths when needed

### Development Notes

- Uses **Bun runtime** for fast TypeScript execution
- CLI binary linked via `bun link` for global access
- TypeScript configured for ES modules with Bun-specific types
- Comprehensive test framework with unit, integration, and E2E tests
- See `AGENT_REGISTRY.md` for complete agent capabilities and usage guidelines

## Subagent Usage Guidelines

### Platform-Specific Agent Patterns

#### Claude Code (.claude.ai/code)

Claude Code subagents are defined in `.claude/agents/` with YAML frontmatter:

```yaml
---
name: code-reviewer
description: Expert code reviewer. Use proactively after code changes.
tools: Read, Grep, Glob, Bash
model: sonnet
---
You are a senior code reviewer ensuring high standards of code quality and security.
```

**Key Features**:

- **File locations**: `.claude/agents/` (project) or `~/.claude/agents/` (user)
- **Tools**: Granular control with comma-separated tool names
- **Models**: `sonnet`, `opus`, `haiku`, or `'inherit'`
- **Management**: Use `/agents` command for interactive management

#### Cursor (.cursor/rules)

Cursor uses `.cursorrules` files for AI context and behavior guidance:

```plaintext
# .cursorrules
You are an expert React developer. Always use TypeScript, follow our design system, and write comprehensive tests.

## Code Style
- Use functional components with hooks
- Follow our naming conventions
- Add JSDoc comments for complex functions

## Testing
- Write unit tests for all utilities
- Integration tests for components
- E2E tests for critical user flows
```

**Key Features**:

- **Single file**: `.cursorrules` in project root
- **Plain text**: No YAML frontmatter required
- **Context-aware**: Automatically loaded by Cursor IDE
- **Project-specific**: Can be committed to version control

#### OpenCode (opencode.ai)

OpenCode agents use YAML frontmatter with model specifications:

```yaml
---
name: research
mode: agent
model: anthropic/claude-sonnet-4
temperature: 0.1
scope: codebase
---
Research agent specialized in codebase analysis.
```

### Argument Handling & Defaults

#### Claude Code Command Arguments

Claude Code supports dynamic arguments in slash commands:

```bash
# All arguments
$ARGUMENTS - captures all arguments passed to the command

# Individual arguments
$1, $2, $3 - positional arguments (similar to shell scripts)
```

**Example Command**:

```yaml
---
argument-hint: [pr-number] [priority] [assignee]
description: Review pull request
---

Review PR #$1 with priority $2 and assign to $3.
```

#### Cursor Rules Context

Cursor rules are automatically applied to all AI interactions in the project:

- **No explicit invocation**: Rules are always active in the Cursor IDE
- **File references**: Use `@filename` to reference specific files
- **Directory references**: Use `@directory/` to reference entire directories
- **Context limits**: Rules help AI understand project conventions and constraints

#### OpenCode Arguments

OpenCode uses YAML frontmatter for configuration:

```yaml
---
name: research
mode: command
scope: codebase
depth: deep
model: anthropic/claude-sonnet-4
temperature: 0.1
---
Research query here...
```

**Default Values**:

- `scope`: `"both"` (codebase + thoughts)
- `depth`: `"medium"`
- `model`: `"anthropic/claude-sonnet-4"`
- `temperature`: `0.1`

### Date Formatting

Both platforms use current date for research documents:

- **Format**: `YYYY-MM-DDTHH:MM:SSZ` (ISO 8601)
- **Source**: Current system time when command executes
- **Example**: `2025-09-27T12:00:00Z` (not `2025-01-26T...`)

### Platform Documentation References

**Claude Code**:

- **Subagents**: https://docs.anthropic.com/claude/docs/claude-code/sub-agents
- **Slash Commands**: https://docs.anthropic.com/claude/docs/claude-code/slash-commands
- **Overview**: https://docs.anthropic.com/claude/docs/claude-code/overview

**Cursor**:

- **Rules**: https://docs.cursor.com/context/rules-for-ai
- **Agents**: https://docs.cursor.com/features#agent
- **Commands**: https://cursor.com/docs

**Cursor**:

- **Rules**: https://docs.cursor.com/context/rules-for-ai
- **Agents**: https://docs.cursor.com/features#agent
- **Commands**: https://cursor.com/docs

**OpenCode**:

- **Commands**: https://opencode.ai/docs/commands
- **Agents**: https://opencode.ai/docs/agents
- **YAML Frontmatter**: https://opencode.ai/docs/yaml-format

## Cursor Rules Integration

### Cursor Rules (.cursorrules)

Cursor uses `.cursorrules` files to provide AI context and behavioral guidance:

#### File Location

- **Project Rules**: `.cursorrules` in project root
- **Global Rules**: `~/.cursorrules` (user-wide defaults)
- **Priority**: Project rules override global rules

#### Format

Plain text file with markdown-style sections:

```plaintext
# Project Coding Standards

You are an expert developer working on a React/TypeScript application.

## Code Style
- Use functional components with hooks
- Follow TypeScript strict mode
- Use descriptive variable names
- Add JSDoc comments for public APIs

## Architecture
- Implement proper error boundaries
- Use custom hooks for shared logic
- Follow atomic design principles
- Implement proper TypeScript interfaces

## Testing
- Write unit tests for utilities
- Integration tests for components
- E2E tests for critical flows
- Maintain >80% code coverage
```

#### Key Features

- **Automatic Loading**: Cursor IDE automatically reads `.cursorrules` files
- **Context Awareness**: Rules apply to all AI interactions in the project
- **Version Control**: Can be committed to git for team consistency
- **Plain Text**: No special syntax required
- **IDE Integration**: Works seamlessly with Cursor's AI features

#### Best Practices

- **Be Specific**: Include concrete examples and constraints
- **Team Alignment**: Ensure rules match team coding standards
- **Regular Updates**: Keep rules current with project evolution
- **Complementary**: Works alongside Claude Code subagents and OpenCode agents

**ALWAYS use the appropriate specialized subagents** for complex tasks instead of attempting to handle everything directly. This ensures thorough, accurate, and efficient execution.

### When to Use Subagents

#### Claude Code Subagents

- **Automatic Delegation**: Claude Code proactively delegates based on task description and subagent expertise
- **Explicit Invocation**: Request specific subagents with "Use the [subagent-name] subagent"
- **Context Preservation**: Each subagent operates in its own context window
- **Tool Isolation**: Subagents can have restricted tool access for security

#### Cursor Agents

- **Context-Aware**: Agents automatically understand project rules and conventions
- **IDE Integration**: Seamlessly work within the Cursor development environment
- **File References**: Use `@` for file references and context
- **Command Integration**: Work alongside slash commands for complex workflows

#### OpenCode Agents

- **Research Tasks**: Use `codebase-locator` + `research-locator` first, then `codebase-analyzer` + `research-analyzer`
- **Code Analysis**: Use `codebase-analyzer` for understanding implementation details
- **Testing**: Use `test-generator` for creating comprehensive test suites
- **Documentation**: Use `research-analyzer` for synthesizing information into structured docs
- **Complex Multi-step Tasks**: Use `smart-subagent-orchestrator` for coordination
- **Web Research**: Use `web-search-researcher` for external information gathering
- **Architecture Decisions**: Use `system-architect` for design and planning

### Subagent Coordination Best Practices

#### Claude Code Best Practices

1. **Use `/agents` Command**: Interactive interface for managing subagents
2. **Granular Tool Permissions**: Only grant necessary tools to each subagent
3. **Descriptive Names**: Clear, action-oriented descriptions for automatic delegation
4. **Model Selection**: Choose appropriate models (`sonnet`, `opus`, `haiku`, or `'inherit'`)

#### Cross-Platform Coordination

1. **Start with Locators**: Always run locator agents first to gather comprehensive context
2. **Parallel Execution**: Run same-type agents concurrently when possible
3. **Sequential Analysis**: Run analyzers only after locators complete
4. **Specialized Domains**: Use domain-specific agents (security-scanner, database-expert, etc.) for specialized tasks
5. **Complex Orchestration**: Use `smart-subagent-orchestrator` for multi-domain coordination
6. **Quality Validation**: Use `code-reviewer` for code quality assessment

### Common Subagent Patterns

#### Claude Code Patterns

- **Code Review**: `code-reviewer` subagent with Read, Grep, Glob, Bash tools
- **Debugging**: `debugger` subagent with specialized debugging instructions
- **Testing**: `test-runner` subagent for automated test execution

#### Cross-Platform Patterns

- **Codebase Research**: `codebase-locator` → `codebase-analyzer` → `codebase-pattern-finder`
- **Documentation Tasks**: `research-locator` → `research-analyzer` → document synthesis
- **Implementation**: `system-architect` → `full-stack-developer` → `code-reviewer`
- **Testing**: `test-generator` → integration testing → `quality-testing-performance-tester`
- **Web Research**: `web-search-researcher` for external information gathering

### Subagent Selection Criteria

- **Task Complexity**: Use specialized agents for complex, multi-step tasks
- **Domain Expertise**: Choose agents with relevant domain knowledge
- **Output Requirements**: Select agents that produce the required output format
- **Context Limits**: Use agents to work within context constraints efficiently

**Remember**: Subagents are designed to handle specific types of work better than general assistance. Always leverage their specialized capabilities for optimal results.

## Development Standards Quick Reference

For detailed guidelines, always refer to the centralized documentation in `../../docs/`:

- **Git Workflow**: See [../../docs/git-workflow.md](../../docs/git-workflow.md)
- **Testing**: See [../../docs/testing-standards.md](../../docs/testing-standards.md)
- **Security**: See [../../docs/security-guidelines.md](../../docs/security-guidelines.md)
- **Code Quality**: See [../../docs/code-quality.md](../../docs/code-quality.md)
- **Accessibility**: See [../../docs/accessibility.md](../../docs/accessibility.md)
- **Communication**: See [../../docs/communication-style.md](../../docs/communication-style.md)

### Platform-Specific Quick Setup

#### Claude Code Setup

```bash
# Install Claude Code
npm install -g @anthropic-ai/claude-code

# Create subagent
mkdir -p .claude/agents
echo '---
name: code-reviewer
description: Expert code reviewer. Use proactively after code changes.
tools: Read, Grep, Glob, Bash
model: sonnet
---

You are a senior code reviewer...' > .claude/agents/code-reviewer.md

# Create command
mkdir -p .claude/commands
echo '---
allowed-tools: Bash(git:*)
description: Create a git commit
---

Create a commit with message: $ARGUMENTS' > .claude/commands/commit.md
```

#### Cursor Rules Setup

```bash
# Create project rules
cat > .cursorrules << 'EOF'
# Project Rules for AI Assistant

You are an expert developer on this team.

## Code Standards
- Use TypeScript strict mode
- Follow functional programming principles
- Write comprehensive tests
- Document complex business logic

## Architecture Decisions
- Prefer composition over inheritance
- Use custom hooks for shared logic
- Implement proper error handling
- Follow domain-driven design
EOF
```

#### OpenCode Setup

```bash
# Setup is handled by codeflow CLI
codeflow setup [project-path]

# Commands are automatically configured
# Agents are converted from base format
```
