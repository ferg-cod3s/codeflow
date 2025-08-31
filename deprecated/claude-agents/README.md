# Claude Code Agent Registry

This directory contains agents specifically designed for Claude Code. These agents have their own YAML frontmatter format and directory structure, separate from OpenCode and MCP agents.

## Directory Structure

```
claude-agents/
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

## Claude Code Agent Format

Claude Code agents use a simplified YAML frontmatter format:

```yaml
---
name: agent-name
description: Brief description of the agent's purpose and capabilities
---

Agent context and instructions go here...
```

## Key Differences from Other Formats

### **Claude Code Format Features:**
- **name**: Required field for agent identification
- **description**: Brief description of agent capabilities
- **Simplified structure**: No mode, model, temperature, or tools configuration needed

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

### **vs MCP Format:**
```yaml
---
description: Agent description
mode: subagent | primary | all
model: provider/model-name
temperature: 0.1-1.0
category: directory-name
tags: [tag1, tag2, tag3]
tools:
  write: true/false
  edit: true/false
  # ...
---
```

## Agent Categories

### **Development** (`development/`)
Core development and engineering agents:
- `analytics-engineer.md` - Analytics implementation and data tracking
- `api-builder.md` - API design and development
- `code-reviewer.md` - Code quality and review
- `codebase-analyzer.md` - Code analysis and understanding
- `codebase-locator.md` - File and component location
- `codebase-pattern-finder.md` - Code pattern discovery
- `database-expert.md` - Database optimization and design
- `development-migrations-specialist.md` - Database migrations
- `full-stack-developer.md` - End-to-end development
- `performance-engineer.md` - Performance optimization
- `system-architect.md` - System architecture design

### **Generalist** (`generalist/`)
Cross-functional and coordination agents:
- `agent-architect.md` - Agent creation and design
- `smart-subagent-orchestrator.md` - Project coordination
- `thoughts-analyzer.md` - Research document analysis
- `thoughts-locator.md` - Research document discovery
- `web-search-researcher.md` - Web research and information gathering

### **AI Innovation** (`ai-innovation/`)
AI and machine learning agents:
- `ai-integration-expert.md` - AI/ML implementation and integration

### **Operations** (`operations/`)
DevOps and infrastructure agents:
- `deployment-wizard.md` - CI/CD and deployment automation
- `devops-operations-specialist.md` - Operations strategy and coordination
- `infrastructure-builder.md` - Cloud infrastructure design
- `monitoring-expert.md` - System monitoring and observability
- `operations-incident-commander.md` - Incident response coordination

### **Quality Testing** (`quality-testing/`)
Testing and quality assurance agents:
- `security-scanner.md` - Security assessment and implementation
- `quality-testing-performance-tester.md` - Performance testing and analysis

### **Business Analytics** (`business-analytics/`)
Business and analytics agents:
- `growth-engineer.md` - User growth and engagement optimization
- `programmatic-seo-engineer.md` - Programmatic SEO systems

### **Design & UX** (`design-ux/`)
User experience and design agents:
- `accessibility-pro.md` - Accessibility compliance and optimization
- `ux-optimizer.md` - User experience optimization and conversion

### **Product Strategy** (`product-strategy/`)
Product management and strategy agents:
- `content-localization-coordinator.md` - Localization and internationalization

## Usage

Claude Code agents are automatically discovered and loaded by the Claude Code system. They can be:

- **Suggested automatically** based on task descriptions
- **Categorized** by domain for easier discovery
- **Organized** in subdirectories while maintaining searchability

## Creating New Agents

1. Choose appropriate category directory
2. Create `.md` file with Claude Code YAML format
3. Use meaningful names for discoverability
4. Keep descriptions concise and focused

Example:
```bash
# Create a new frontend development agent
vim claude-agents/design-ux/frontend-specialist.md
```

## Migration Notes

This directory structure was reorganized from a flat file structure to match the organization used in the MCP agents directory. All agents now have:

- Proper `name` field in YAML frontmatter
- Organized placement in appropriate category subdirectories
- Consistent formatting and structure
- Clear separation of concerns by domain


