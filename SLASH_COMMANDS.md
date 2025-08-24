# Slash Commands Guide

This document explains the slash commands available in the agentic workflow system for both Claude Code and OpenCode platforms.

## Available Commands

### Core Workflow Commands

#### `/research` 
**Purpose**: Conduct comprehensive research across codebase and documentation  
**Usage**: `/research [research query or ticket path]`  
**Model**: GPT-5 (OpenCode), Claude Sonnet-4 (Claude Code)  
**Process**:
- Spawns specialized locator and analyzer agents in parallel
- Searches codebase, thoughts directory, and uses domain-specific agents when relevant  
- Generates timestamped research document with findings and references
- Synthesizes insights from multiple sources

#### `/plan`
**Purpose**: Create detailed implementation plans from tickets and research  
**Usage**: `/plan [ticket path and research documents]`  
**Model**: GPT-5  
**Process**:
- Interactive, iterative planning process
- Analyzes existing codebase patterns and constraints  
- Breaks work into phases with automated and manual success criteria
- Skeptical analysis with user collaboration for quality assurance

#### `/execute`
**Purpose**: Execute implementation plans systematically  
**Usage**: `/execute [plan file path]`  
**Model**: Claude Sonnet-4  
**Process**:
- Phase-by-phase implementation following plan specifications
- Runs automated tests and manual validation after each phase
- Maintains code quality and follows existing patterns
- Stops execution if success criteria are not met

#### `/commit`
**Purpose**: Create git commits with proper messaging  
**Usage**: `/commit`  
**Model**: GPT-5  
**Process**:
- Analyzes current staged and unstaged changes
- Drafts commit message following repository conventions
- Includes standard co-authorship attribution
- Handles pre-commit hooks and validation

#### `/test`
**Purpose**: Generate comprehensive tests for implemented features  
**Usage**: `/test [plan file path or feature description]`  
**Model**: Claude Sonnet-4  
**Process**:
- Analyzes implementation and identifies testing needs
- Creates unit, integration, and end-to-end tests
- Follows project testing patterns and frameworks
- Ensures comprehensive coverage of functionality and edge cases

#### `/document`
**Purpose**: Create comprehensive documentation for features  
**Usage**: `/document [plan file path or feature description]`  
**Model**: GPT-5  
**Process**:
- Generates user guides, API docs, and technical documentation
- Creates inline code comments and README updates
- Follows documentation standards and accessibility guidelines
- Updates existing documentation for consistency

#### `/review`
**Purpose**: Review implementations against original plans  
**Usage**: `/review [plan file path]`  
**Model**: Claude Sonnet-4  
**Process**:
- Validates implementation adherence to plan specifications
- Tests all automated and manual success criteria
- Identifies deviations and categorizes their severity
- Generates comprehensive review report with recommendations

## Platform-Specific Formats

### Claude Code (`.claude/commands/*.md`)
```markdown
---
description: Brief description of what the command does
---

Command prompt content with $ARGUMENTS placeholder for user input.
```

### OpenCode (`.opencode/command/*.md`)
```markdown
---
description: Brief description of what the command does
agent: agent_name
model: model_identifier
---

Command prompt content with $ARGUMENTS placeholder and !shell commands support.
```

## Usage Examples

### Research Command
```bash
# Claude Code
/research thoughts/tickets/feature-auth.md

# OpenCode  
/research "investigate user authentication system for OAuth integration"
```

### Planning Command
```bash
# Both platforms
/plan thoughts/tickets/feature-auth.md thoughts/research/2025-01-15_auth-research.md
```

### Execution Command  
```bash
# Both platforms
/execute thoughts/plans/oauth-integration-plan.md
```

### Test Command
```bash
# Both platforms
/test thoughts/plans/oauth-integration-plan.md
/test "user authentication system with OAuth integration"
```

### Document Command
```bash
# Both platforms  
/document thoughts/plans/oauth-integration-plan.md
/document "OAuth integration feature and API endpoints"
```

### Commit Command
```bash
# Both platforms (no arguments needed)
/commit
```

### Review Command
```bash
# Both platforms
/review thoughts/plans/oauth-integration-plan.md
```

## Agent Integration

Commands automatically select appropriate specialized agents:

**Research Phase Agents**:
- `codebase-locator` - Find WHERE components exist
- `codebase-analyzer` - Understand HOW code works
- `thoughts-locator` - Discover existing documentation  
- `operations_incident_commander` - For operational issues
- `development_migrations_specialist` - For database changes
- `programmatic_seo_engineer` - For SEO architecture
- `content_localization_coordinator` - For i18n workflows
- `quality-testing_performance_tester` - For performance analysis

**Planning & Execution**:
- Uses domain-appropriate agents based on implementation scope
- Follows agent handoff patterns for complex scenarios
- Respects model tier routing (GPT-5 for strategy, Claude Sonnet-4 for technical work)

## Installation & Management

### Install Commands to Project
```bash
# Copy all agents and commands to project
agentic pull ~/path/to/project

# Check what's available
agentic commands

# Check sync status
agentic status ~/path/to/project
```

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
2. **Use Appropriate Models**: Research & documentation use GPT-5, technical work uses Claude Sonnet-4  
3. **Run Fresh Research**: Always start with current codebase analysis
4. **Test Before Committing**: Generate comprehensive tests to prevent regressions
5. **Document Everything**: Create user guides and technical docs for maintainability
6. **Validate Success Criteria**: Complete both automated and manual checks
7. **Review Before Finalizing**: Use `/review` to validate implementation quality

## Troubleshooting

**Commands Not Found**: Run `agentic pull` to install commands to your project  
**Agent Errors**: Check that agents are properly installed with `agentic status`  
**Model Access**: Ensure you have access to the required models (GPT-5, Claude Sonnet-4)  
**Permission Issues**: Verify write access to project directories

## Extending Commands

To create custom commands:
1. Add `.md` files to `.claude/commands/` or `.opencode/command/`
2. Use proper YAML frontmatter format for each platform
3. Include `$ARGUMENTS` placeholder for user input
4. Test with `agentic commands` to verify recognition