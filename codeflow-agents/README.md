# Codeflow Agent Registry

This directory contains agents specifically designed for the Codeflow MCP server. These agents have their own YAML frontmatter format and directory structure, separate from Claude Code and OpenCode agents.

## Directory Structure

```
codeflow-agents/
├── ai-innovation/          # AI/ML and innovation agents
├── business-analytics/     # Business and analytics agents
├── design-ux/             # Design and user experience agents
├── development/           # Core development agents
├── generalist/            # Cross-functional generalist agents
├── operations/            # DevOps and operations agents
├── product-strategy/      # Product management and strategy agents
├── quality-testing/       # Testing and quality assurance agents
└── README.md             # This file
```

## Codeflow Agent Format

MCP agents use a comprehensive YAML frontmatter format:

```yaml
---
description: Brief description of the agent's purpose and capabilities
mode: subagent | primary | all
model: provider/model-name
temperature: 0.1-1.0
category: directory-name (auto-assigned based on location)
tags: [tag1, tag2, tag3]
tools:
  write: true/false
  edit: true/false
  bash: true/false
  patch: true/false
  read: true/false
  grep: true/false
  glob: true/false
  list: true/false
  webfetch: true/false
---

Agent context and instructions go here...
```

## Key Differences from Other Formats

### **Codeflow Format Features:**
- **Category**: Auto-assigned based on directory location
- **Tags**: Array of relevant keywords for agent discovery
- **Comprehensive tools**: Explicit boolean configuration for each tool
- **Subdirectory support**: Agents can be organized in nested folders

### **vs Claude Code Format:**
```yaml
---
name: agent-name
description: Agent description
---
```

### **vs OpenCode Format:**
```yaml
---
description: Agent description
mode: subagent
model: provider/model-name
temperature: 0.2
tools:
  write: true
  edit: true
  # ...
---
```

## Priority System

Codeflow agents are loaded in priority order (later overrides earlier):

1. **codeflow/codeflow-agents/** (lowest priority)
2. **~/.codeflow/agents/** (medium priority - global user agents)
3. **{project}/.codeflow/agents/** (highest priority - project-specific)

## Usage

Codeflow agents are automatically discovered and loaded by the codeflow MCP server. They can be:

- **Suggested automatically** based on task descriptions
- **Categorized** by domain for easier discovery
- **Tagged** for flexible search and filtering
- **Organized** in subdirectories while maintaining searchability

## Creating New Agents

1. Choose appropriate category directory
2. Create `.md` file with Codeflow YAML format
3. Use meaningful tags for discoverability
4. Configure only necessary tools (principle of least privilege)

Example:
```bash
# Create a new frontend development agent
vim codeflow-agents/development/react-specialist.md
```
