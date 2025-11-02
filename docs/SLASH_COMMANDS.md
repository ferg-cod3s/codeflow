# Slash Commands Guide



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


This document explains the slash commands available in the codeflow workflow system for both Claude Code and OpenCode platforms.

## Setup Commands

### `codeflow setup`

**Purpose**: Install all agents and commands to your project
**Usage**: `codeflow setup [project-path]`
**Options**:

- `--type claude-code`: Install for Claude Code (.claude/commands)
- `--type opencode`: Install for OpenCode (.opencode/command)
- `--global`: Install to global directories
- `--force`: Force overwrite existing setup

**Examples**:

```bash
codeflow setup .                    # Setup current directory
codeflow setup --type opencode      # Setup for OpenCode
codeflow setup --type claude-code   # Setup for Claude Code
codeflow setup --global             # Setup global directories
```

## Available Commands

### Core Workflow Commands

#### `/research`

**Purpose**: Conduct comprehensive research across codebase and documentation
**Usage**: `/research [research query or ticket path]`
**Model**: anthropic/claude-sonnet-4-20250514 (OpenCode), claude-sonnet-4-20250514 (Claude Code)
**Process**:

- Spawns specialized locator and analyzer agents in parallel
- Searches codebase, research directory, and uses domain-specific agents when relevant
- Generates timestamped research document with findings and references
- Synthesizes insights from multiple sources

#### `/plan`

**Purpose**: Create detailed implementation plans from tickets and research
**Usage**: `/plan [ticket path and research documents]`
**Model**: anthropic/claude-sonnet-4-20250514
**Process**:

- Interactive, iterative planning process
- Analyzes existing codebase patterns and constraints
- Breaks work into phases with automated and manual success criteria
- Skeptical analysis with user collaboration for quality assurance

#### `/execute`

**Purpose**: Execute implementation plans systematically
**Usage**: `/execute [plan file path]`
**Model**: claude-sonnet-4-20250514
**Process**:

- Phase-by-phase implementation following plan specifications
- Runs automated tests and manual validation after each phase
- Maintains code quality and follows existing patterns
- Stops execution if success criteria are not met

#### `/commit`

**Purpose**: Create git commits with proper messaging
**Usage**: `/commit`
**Model**: anthropic/claude-sonnet-4-20250514
**Process**:

- Analyzes current staged and unstaged changes
- Drafts commit message following repository conventions
- Includes standard co-authorship attribution
- Handles pre-commit hooks and validation

#### `/test`

**Purpose**: Generate comprehensive tests for implemented features
**Usage**: `/test [plan file path or feature description]`
**Model**: claude-sonnet-4-20250514
**Process**:

- Analyzes implementation and identifies testing needs
- Creates unit, integration, and end-to-end tests
- Follows project testing patterns and frameworks
- Ensures comprehensive coverage of functionality and edge cases

#### `/document`

**Purpose**: Create comprehensive documentation for features
**Usage**: `/document [plan file path or feature description]`
**Model**: anthropic/claude-sonnet-4-20250514
**Process**:

- Generates user guides, API docs, and technical documentation
- Creates inline code comments and README updates
- Follows documentation standards and accessibility guidelines
- Updates existing documentation for consistency

#### `/review`

**Purpose**: Review implementations against original plans
**Usage**: `/review [plan file path]`
**Model**: claude-sonnet-4-20250514
**Process**:

- Validates implementation adherence to plan specifications
- Tests all automated and manual success criteria
- Identifies deviations and categorizes their severity
- Generates comprehensive review report with recommendations

#### `/project-docs`

**Purpose**: Generate comprehensive project documentation including PRD, security docs, user flows, and more
**Usage**: `/project-docs [project prompt or --analyze-existing]`
**Model**: anthropic/claude-sonnet-4-20250514
**Process**:

- Orchestrates multiple specialized agents to generate complete project documentation
- Creates PRD, security documentation, user flows, API docs, architecture docs, and deployment guides
- Analyzes project prompts or existing project structure
- Generates structured documentation with consistent formatting

## Platform-Specific Formats

### Claude Code (`.claude/commands/*.md`)

```markdown
---
description: Brief description of what the command does
---

Command prompt content with {{variable}} placeholder for user input.
```

### OpenCode (`.opencode/command/*.md`)

```markdown
---
description: Brief description of what the command does
agent: agent_name
model: model_identifier
---

Command prompt content with {{variable}} placeholder and !shell commands support.
```

### MCP-Compatible Clients (Cursor, VS Code, etc.)

MCP clients use JSON parameter format for tool calls:

```json
{
  "tool": "research",
  "parameters": {
    "query": "Research question or topic",
    "scope": "codebase|research|both",
    "depth": "shallow|medium|deep",
    "ticket": "path/to/ticket.md"
  }
}
```

## Usage Examples

### Research Command

```bash
# Claude Code
/research research/tickets/feature-auth.md
/research "investigate user authentication system" --scope=codebase --depth=deep

# OpenCode
/research "investigate user authentication system for OAuth integration"

# MCP Client (JSON format)
{
  "tool": "research",
  "parameters": {
    "query": "investigate user authentication system",
    "scope": "codebase",
    "depth": "deep"
  }
}
```

### Planning Command

```bash
# Both platforms
/plan research/tickets/feature-auth.md research/research/2025-01-15_auth-research.md
```

### Execution Command

```bash
# Both platforms
/execute research/plans/oauth-integration-plan.md
```

### Test Command

```bash
# Both platforms
/test research/plans/oauth-integration-plan.md
/test "user authentication system with OAuth integration"
```

### Document Command

```bash
# Both platforms
/document research/plans/oauth-integration-plan.md
/document "OAuth integration feature and API endpoints"
```

### Commit Command

```bash
# Both platforms (no arguments needed)
/commit
```

### Review Command

````bash
# Both platforms
/review research/plans/oauth-integration-plan.md
### Project Documentation Command

```bash
# Generate comprehensive project documentation from a prompt
/project-docs "Create a task management application with user authentication, team collaboration, and real-time updates"

# Generate documentation by analyzing existing project structure
/project-docs --analyze-existing
````

````

## Agent Integration

Commands automatically select appropriate specialized agents:

**Research Phase Agents**:

- `codebase-locator` - Find WHERE components exist
- `codebase-analyzer` - Understand HOW code works
- `research-locator` - Discover existing documentation
- `operations_incident_commander` - For operational issues
- `development_migrations_specialist` - For database changes
- `programmatic_seo_engineer` - For SEO architecture
- `content_localization_coordinator` - For i18n workflows
- `quality-testing_performance_tester` - For performance analysis

**Planning & Execution**:

- Uses domain-appropriate agents based on implementation scope
- Follows agent handoff patterns for complex scenarios
- Respects model tier routing (anthropic/claude-sonnet-4-20250514 for strategy, claude-sonnet-4-20250514 for technical work)

## Installation & Management

### Install Commands to Project

```bash
# Copy all agents and commands to project
codeflow sync --project ~/path/to/project

# Check sync status
codeflow status ~/path/to/project
````

### Directory Structure After Installation

```
your-project/
├── .claude/
│   └── commands/
│       ├── research.md
│       ├── plan.md
│       ├── execute.md
│       ├── commit.md
│       └── review.md
├── .opencode/
│   ├── agent/
│   │   ├── [20+ specialized agents]
│   └── command/
│       ├── research.md
│       ├── plan.md
│       ├── execute.md
│       ├── commit.md
│       └── review.md
```

## Best Practices

1. **Follow the Complete Workflow Order**: research → plan → execute → test → document → commit → review
2. **Use Appropriate Models**: Research & documentation use anthropic/claude-sonnet-4-20250514, technical work uses claude-sonnet-4-20250514
3. **Run Fresh Research**: Always start with current codebase analysis
4. **Test Before Committing**: Generate comprehensive tests to prevent regressions
5. **Document Everything**: Create user guides and technical docs for maintainability
6. **Validate Success Criteria**: Complete both automated and manual checks
7. **Review Before Finalizing**: Use `/review` to validate implementation quality

## Troubleshooting

**Commands Not Found**: Run `codeflow sync --project` to install commands to your project
**Agent Errors**: Check that agents are properly installed with `codeflow status`
**Model Access**: Ensure you have access to the required models (anthropic/claude-sonnet-4-20250514, claude-sonnet-4-20250514)
**Permission Issues**: Verify write access to project directories

## Extending Commands

To create custom commands:

1. Add `.md` files to `.claude/commands/` or `.opencode/command/`
2. Use proper YAML frontmatter format for each platform
3. Include `{{variable}}` placeholder for user input
4. Test with `codeflow commands` to verify recognition
