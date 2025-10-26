# Usage Guide

## Overview

The Codeflow workflow system provides a structured approach to AI-assisted software development across multiple platforms. It consists of specialized agents and commands that work together to help you research, plan, implement, and review code changes systematically.

**Supported Platforms:**

- **Claude Code** (.claude.ai/code) - Native argument parsing
- **OpenCode** (opencode.ai) - YAML frontmatter format
- **MCP-Compatible Clients** (Cursor, VS Code, etc.) - JSON parameter format

## Getting Started

### Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/yourusername/agentic.git
cd agentic
bun install
bun link  # Makes 'agentic' command available globally
```

### Setting Up a Project

Navigate to your project and set up the agents and commands for your preferred platform:

```bash
cd ~/projects/my-app

# For Claude Code
codeflow setup . --type claude-code

# For OpenCode
codeflow setup . --type opencode

# For MCP-compatible clients
codeflow setup . --type mcp
```

This creates the appropriate directory structure (`.claude/`, `.opencode/`, or MCP configuration) in your project containing all the agents and commands.

### Verifying Setup

Check the status of your agents and commands:

```bash
agentic status
```

This shows which files are up-to-date, outdated, or missing.

## Development Workflow

The Agentic system follows a structured workflow for implementing features or fixing issues:

### 1. Create a Ticket

Create a ticket file in `research/tickets/` describing what needs to be done:

```markdown
# research/tickets/feature-123.md

## Feature: Add User Authentication

### Description

Implement OAuth-based user authentication with Google provider.

### Requirements

- Support Google OAuth 2.0
- Store user sessions
- Provide login/logout endpoints
```

### 2. Research Phase

Start a new session in your preferred platform and use the **research** command:

```
/research research/tickets/feature-123.md - analyze the authentication system and find all relevant code
```

This produces a research document in `research/research/` with findings about:

- Current implementation details
- Relevant files and components
- Architecture patterns to follow
- Integration points

### 3. Planning Phase

Create an implementation plan using the **plan** command:

```
/plan research/tickets/feature-123.md research/research/2025-01-15_auth-research.md
```

This creates a detailed plan in `research/plans/` with:

- Phased implementation approach
- Specific file changes
- Success criteria
- Testing strategy

### 4. Implementation Phase

Execute the plan using the **execute** command:

```
/execute research/plans/auth-implementation.md
```

The agent will:

- Implement each phase of the plan
- Run tests and verification
- Update progress checkmarks in the plan

### 5. Commit Phase

Once implementation is complete, use the **commit** command:

```
/commit
```

The agent will:

- Review all changes
- Generate a meaningful commit message
- Create the git commit

### 6. Review Phase

Validate that the implementation matches the plan using the **review** command:

```
/review research/plans/auth-implementation.md
```

This ensures:

- All planned changes were implemented
- No unintended drift occurred
- Success criteria are met

## Key Concepts

### Context Windows

Each phase should typically start with a fresh context session to maximize performance and quality. The agents use context compression to pass only essential information between phases, regardless of platform.

### Thoughts Directory

The `research/` directory maintains project knowledge:

- `architecture/` - System design and decisions
- `tickets/` - Work items and feature requests
- `research/` - Analysis and findings
- `plans/` - Implementation specifications
- `reviews/` - Post-implementation validation

### Agents vs Commands

- **Commands** (research, plan, execute, etc.) are high-level workflows you invoke using platform-specific syntax (e.g., `/research` in Claude Code/OpenCode, or tool calls in MCP clients)
- **Agents** are specialized sub-tasks that commands use internally for specific operations

### How Commands Work

When you run `codeflow setup`, files from the `command/` directory are copied to the appropriate platform directory in your project:

- **Claude Code**: Files go to `.claude/commands/` and are available as slash commands
- **OpenCode**: Files go to `.opencode/command/` and are available as slash commands
- **MCP Clients**: Commands are available via MCP tool calls with JSON parameters

Each platform automatically recognizes these files and makes them available using the appropriate invocation method.

## Best Practices

1. **Review Each Phase**: Don't blindly accept agent output. Review research and plans before proceeding.

2. **Start Fresh**: Begin each major phase with a new context window for best results.

3. **Be Specific**: Provide clear, detailed tickets to get better research and plans.

4. **Trust but Verify**: The system helps maintain quality, but human review is essential.

5. **Iterate**: Use follow-up questions to refine research and plans before implementation.

## Next Steps

- Learn about the [Agentic CLI](./agentic.md)
- Understand [workflow phases](./workflow.md) in detail
- Explore [AGENTS](../AGENTS.md) and [commands](./commands.md)
- Set up your [research directory](./research.md)
