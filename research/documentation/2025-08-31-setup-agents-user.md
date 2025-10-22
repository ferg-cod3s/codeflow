---
title: Setup Agents - User Guide
audience: user
version: v0.4.0
feature: setup-agents
---

## Overview

The `codeflow setup` command now automatically copies and converts agents for your project type, eliminating the need for manual agent management.

## What's New

**Before**: Setup only copied commands, agents had to be managed separately
**After**: Setup copies both commands AND agents with automatic format conversion

## Quick Start

### Claude Code Projects

```bash
codeflow setup . --type claude-code
```

**Result**: Creates `.claude/commands/` and `.claude/agents/` with 29 converted agents

### OpenCode Projects

```bash
codeflow setup . --type opencode
```

**Result**: Creates `.opencode/command/` and `.opencode/agent/` with 29 converted agents

### General Projects (Both Platforms)

```bash
codeflow setup . --type general
```

**Result**: Creates both Claude Code and OpenCode directories (72 total files)

## What Gets Installed

### Commands (7 files)

- `/research` - Comprehensive codebase analysis
- `/plan` - Create implementation plans
- `/execute` - Implement plans with verification
- `/test` - Generate test suites
- `/document` - Create documentation
- `/commit` - Structured git commits
- `/review` - Validate implementations

### Agents (29 files)

All available agents are automatically converted to the appropriate format:

- `codebase-analyzer`, `codebase-locator`, `code-reviewer`
- `api-builder`, `database-expert`, `full-stack-developer`
- `performance-engineer`, `security-scanner`, `ui-optimizer`
- And 20+ more specialized agents

## Performance

- **29 agents**: ~9ms setup time
- **100 agents**: ~31ms setup time
- **1000 agents**: ~0.3s setup time

Setup time is essentially instantaneous for normal use cases.

## Existing Projects

### First-Time Setup

```bash
codeflow setup .
```

Creates all necessary directories and files.

### Update Existing Setup

```bash
codeflow setup . --force
```

Overwrites existing setup with latest agents and commands.

### Check Current Status

```bash
codeflow status .
```

Shows which files are up-to-date or need updating.

## Troubleshooting

### Setup Fails with "Source directory not found"

**Cause**: Codeflow installation is incomplete
**Fix**: Run `codeflow pull` first to ensure source files exist

### Agents Not Appearing in Claude Code

**Cause**: Claude Code not configured to use project agents
**Fix**: Ensure `.claude/claude_config.json` exists and points to commands directory

### Performance Issues with Large Agent Sets

**Cause**: Processing many agents simultaneously
**Fix**: The system automatically uses batch processing for optimal performance

## Architecture Benefits

- **No Storage Bloat**: Single source of truth prevents duplicate files
- **Automatic Conversion**: Agents are converted to correct format on-demand
- **Future-Proof**: Easy to add new AI client formats
- **Fast Setup**: Conversion overhead is negligible (< 1 second)
