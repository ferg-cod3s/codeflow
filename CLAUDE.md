# Claude AI Assistant Guide for CodeFlow CLI

This document provides guidance for Claude AI assistants working with the CodeFlow CLI project.

## Project Overview

**CodeFlow CLI** is a TypeScript-based command-line tool that converts base-agents, commands, and skills from a custom format to the OpenCode format. It provides validation, batch processing, and comprehensive conversion capabilities.

**Key Purpose**: Simplify migration from legacy agent/command/skill formats to the standardized OpenCode format.

**Agent Philosophy**: All 141 agents are designed as **subagents** - specialized AI assistants meant to be invoked for specific tasks, domains, or use cases. They are not primary interactive agents but focused experts that can be called upon when needed.

## Project Structure

```
codeflow/
├── src/
│   ├── cli/                 # CLI commands (convert, migrate, validate)
│   ├── converters/          # Conversion logic for agents, commands, skills
│   ├── types/               # TypeScript type definitions
│   ├── utils/               # Utility functions (file operations, YAML parsing)
│   └── validators/          # OpenCode format validation
├── base-agents/             # Source agent definitions (categorized)
│   ├── ai-innovation/
│   ├── business-analytics/
│   ├── design-ux/
│   ├── development/
│   ├── generalist/
│   ├── operations/
│   ├── product-strategy/
│   └── quality-testing/
├── base-skills/             # Source skill definitions
│   ├── development/
│   ├── mcp/
│   └── operations/
├── commands/                # Source command definitions
├── tests/                   # Test suites
├── dist/                    # Compiled JavaScript output
└── test-project/            # Test fixtures and examples
```

## Core Functionality

### 1. Agent Conversion

Converts base-agents (custom format) to OpenCode agents:

**Base Agent Format**:
```yaml
---
name: python_pro
description: Master Python 3.12+ development
mode: subagent
temperature: 0.1
category: development
tags: [python]
primary_objective: Master Python 3.x
anti_objectives: [...]
intended_followups: [...]
allowed_directories: [${WORKSPACE}]
tools:
  write: true
  edit: true
  bash: true
permission:
  file_write: allow
---
[Agent prompt body]
```

**OpenCode Agent Format** (file: `python_pro.md`):
```yaml
---
description: Master Python 3.12+ development
mode: subagent
temperature: 0.1
tools:
  write: true
  edit: true
  bash: true
permission:
  file_write: allow
prompt: |
  **primary_objective**: Master Python 3.x
  **category**: development
  **tags**: python

  [Agent prompt body]
---
```

**Key Mapping**:
- `name` → Filename (e.g., `python_pro.md`)
- `description` → **Required** field in frontmatter
- `mode` → Direct mapping (defaults to `subagent` in converter if not specified)
- `temperature`, `model` → Direct mapping
- `tools`, `permission` → Direct mapping
- `category`, `tags`, `primary_objective`, `anti_objectives`, `intended_followups`, `allowed_directories` → Integrated into `prompt` field
- Frontmatter body → `prompt` field content

**Note**: The converter defaults to `mode: subagent` for agents without an explicit mode, as all CodeFlow agents are designed as specialized subagents.

### 2. Command Conversion

Converts command definitions to OpenCode format:
- Frontmatter becomes command metadata
- Body becomes command template
- Preserves agent and model assignments

### 3. Skill Conversion

Converts skill definitions to OpenCode format:
- Frontmatter becomes skill metadata
- Body becomes skill prompt
- Preserves `noReply` setting

## CLI Commands

### Convert
```bash
codeflow convert agents --output ./opencode-agents
codeflow convert commands --output ./opencode-commands
codeflow convert skills --output ./opencode-skills
```

Options:
- `-o, --output <dir>`: Output directory (default: ./converted)
- `-d, --dry-run`: Preview without writing files
- `-v, --validation <level>`: Validation level (strict, lenient, off)

### Migrate
```bash
codeflow migrate --output ./converted
codeflow migrate --agents-only
codeflow migrate --commands-only
codeflow migrate --skills-only
```

Options: Same as convert, plus:
- `--agents-only`, `--commands-only`, `--skills-only`: Selective migration

### Validate
```bash
codeflow validate ./opencode-agents --format opencode-agent
codeflow validate ./converted --format opencode-skill --report report.json
```

Options:
- `-f, --format <type>`: Format type (opencode-agent, opencode-command, opencode-skill)
- `-r, --report <file>`: Save validation report

## Development Workflow

### Building
```bash
npm run build        # Compile TypeScript
npm run build:cli    # Compile and make CLI executable
npm run dev          # Watch mode for development
```

### Testing
```bash
npm test             # Run tests with Bun
npm run test:watch   # Watch mode
npm run typecheck    # Type checking only
```

### Publishing
```bash
npm run prepublishOnly  # Runs typecheck, build, and tests
```

## Working with This Codebase

### When Making Changes

1. **Type Safety**: All code uses TypeScript with strict mode enabled
   - Check types in `src/types/base-types.ts` and `src/types/opencode-types.ts`
   - Run `npm run typecheck` before committing

2. **Testing**: Use Bun test runner (not Jest)
   - Tests are in `tests/` directory
   - Run `npm test` to verify changes
   - See recent commits for Jest → Bun migration context

3. **Code Structure**:
   - Converters in `src/converters/`: Handle format transformation
   - CLI commands in `src/cli/`: Define user-facing commands
   - Validators in `src/validators/`: Validate OpenCode format compliance
   - Utils in `src/utils/`: Shared utilities (file I/O, YAML parsing)

4. **File Operations**:
   - Use utilities from `src/utils/file-utils.ts`
   - YAML parsing via `src/utils/yaml-utils.ts`
   - Glob patterns for batch file discovery

### Common Tasks

#### Adding New Agent Categories
1. Create directory under `base-agents/`
2. Add agent markdown files with proper frontmatter
3. Converter will automatically discover and process them

#### Modifying Conversion Logic
1. Update converter classes in `src/converters/`
2. Update type definitions if schema changes
3. Add/update tests in `tests/`
4. Verify with `npm test` and `npm run typecheck`

#### Adding Validation Rules
1. Modify `src/validators/opencode-validator.ts`
2. Add new validation checks for required fields, types, formats
3. Test with `codeflow validate` command

## Key Files Reference

- `src/cli/index.ts:14` - CLI entry point
- `src/converters/agent-converter.ts:6` - AgentConverter class
- `src/converters/command-converter.ts` - CommandConverter class
- `src/converters/skill-converter.ts` - SkillConverter class
- `src/types/base-types.ts:2` - BaseAgent interface
- `src/types/opencode-types.ts:2` - OpenCodeAgent interface
- `src/validators/opencode-validator.ts` - Validation logic

## Important Notes

1. **Test Runner**: Project uses Bun, not Jest (migrated in recent commits)
2. **Node Version**: Requires Node.js 20+ (uses ES modules)
3. **Package Manager**: Compatible with npm and bun
4. **License**: MIT
5. **Repository**: https://github.com/ferg-cod3s/codeflow

## Agent Categories

The project includes extensive pre-built agents in these categories:
- **AI Innovation**: AI/ML specialized agents
- **Business Analytics**: Data analysis and business intelligence
- **Design/UX**: Design and user experience
- **Development**: Programming language experts (Python, JavaScript, Rust, Go, etc.)
- **Generalist**: General-purpose agents
- **Operations**: DevOps, cloud, infrastructure
- **Product Strategy**: Product management and strategy
- **Quality/Testing**: QA and testing specialists

See `AGENTS.md` for detailed agent inventory.

## Git Workflow

When working on this project:
1. Develop on feature branches starting with `claude/`
2. Write clear, descriptive commit messages
3. Run `npm run typecheck && npm test` before committing
4. Push to designated branch when complete

## Getting Help

- GitHub Issues: https://github.com/ferg-cod3s/codeflow/issues
- README.md: User-facing documentation
- This file (CLAUDE.md): AI assistant reference
- AGENTS.md: Agent inventory and descriptions
