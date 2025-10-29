# Simplified CodeFlow Agent System

## Overview

The simplified system maintains **multi-platform benefits** while dramatically reducing complexity:

- **137 agents → ~20 core agents** (85% reduction)
- **150+ lines → 20-30 lines** per agent (80% reduction)
- **Single source → Auto-generate** platform-specific formats

## Core Agent Set

Instead of 137 specialized agents, we focus on essential roles:

### Research & Analysis

- **researcher** - Codebase analysis and knowledge synthesis
- **locator** - Find where files and components exist
- **analyzer** - Deep dive into specific code areas

### Development & Implementation

- **developer** - General code implementation across languages
- **architect** - System design and technical planning
- **integrator** - API integration and system connection

### Quality & Operations

- **auditor** - Security, performance, and quality review
- **optimizer** - Performance and efficiency improvements
- **deployer** - Deployment and infrastructure setup

## Simplified Agent Format

```markdown
---
name: researcher
description: Research codebase and answer questions by spawning specialized sub-tasks
tools: task, read, write, edit, bash, grep, glob, list
mode: subagent
---

You are a research specialist focused on comprehensive codebase analysis.

## Core Purpose

[Clear, concise statement - 1-2 sentences]

## Key Capabilities

- [Most important capability 1]
- [Most important capability 2]
- [Most important capability 3]

## When to Use

Use this agent when you need to:

- [Specific use case 1]
- [Specific use case 2]
- [Specific use case 3]

## Approach

1. [First key step]
2. [Second key step]
3. [Third key step]
4. [Final validation step]
```

## Multi-Platform Conversion

```bash
# Convert simplified agents to all platforms
codeflow convert-simplified

# Individual conversion
codeflow convert-simplified --agent researcher.md
```

### Platform-Specific Enhancements

| Simplified Base   | Claude Code                | OpenCode                      |
| ----------------- | -------------------------- | ----------------------------- |
| Brief description | Enhanced with capabilities | Enhanced with proactive usage |
| Core purpose      | + Advanced Capabilities    | + Expertise Areas             |
| Simple approach   | + Implementation Strategy  | + Key Deliverables            |

## Benefits

### ✅ **Maintained**

- **Multi-platform support** - Claude Code, OpenCode, MCP
- **Model inheritance** - Global model configuration
- **Tool compatibility** - Full tool ecosystem support
- **Conversion automation** - Single source of truth

### ✅ **Improved**

- **85% fewer agents** - Easier to understand and maintain
- **80% less verbose** - Faster to read and modify
- **Clearer purpose** - Focused, role-based definitions
- **Better onboarding** - Simpler to learn and use

## Migration Strategy

### Phase 1: Core Simplified Agents

1. Create 20 essential simplified agents
2. Test conversion system
3. Validate platform outputs

### Phase 2: Gradual Transition

1. Map existing 137 agents to core roles
2. Update documentation and workflows
3. Deprecate verbose agents

### Phase 3: Enhanced Features

1. Add agent composition for complex tasks
2. Implement smart agent selection
3. Create specialized agent packs

## Example Usage

```bash
# Research phase
/research "How does authentication work?"

# Development phase
/execute "Add OAuth2 authentication to user service"

# Quality phase
/audit "Review authentication implementation for security issues"
```

The simplified approach provides **all the benefits** of the current system with **dramatically reduced complexity**.
