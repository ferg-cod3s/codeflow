# CodeFlow Agents

This document provides a comprehensive overview of all agents available in the CodeFlow system.

## Quick Reference

### 🔍 **Core Research Agents**

- **codebase-locator** - Find WHERE files and components exist
- **codebase-analyzer** - Understand HOW specific code works
- **codebase-pattern-finder** - Discover similar implementation patterns
- **research-locator** - Find existing documentation and decisions
- **research-analyzer** - Extract insights from specific documents
- **web-search-researcher** - Perform targeted web research

### 🏗️ **Specialized Domain Agents**

- **operations-incident-commander** - Incident response leadership
- **development-migrations-specialist** - Database schema migrations
- **quality-testing-performance-tester** - Performance testing and analysis
- **programmatic-seo-engineer** - Large-scale SEO implementation
- **content-localization-coordinator** - i18n/l10n workflow coordination

### 🚀 **Development & Engineering**

- **full-stack-developer** - Cross-functional development
- **api-builder** - API design and implementation
- **database-expert** - Database optimization and design
- **security-scanner** - Vulnerability assessment
- **ux-optimizer** - User experience optimization

### 🧠 **Meta & Orchestration**

- **smart-subagent-orchestrator** - Complex multi-agent workflows
- **agent-architect** - Create custom agents
- **system-architect** - System design and architecture

## Directory Structure

```
base-agents/             # Source of truth (base format)
├── ai-innovation/        # AI/ML specialized agents
├── design-ux/           # Design and UX agents
├── development/          # Core development agents
├── generalist/          # Research and orchestration agents
├── operations/          # DevOps and infrastructure agents
├── product-strategy/    # Business and product agents
└── quality-testing/      # Testing and security agents

.claude/agents/          # Claude Code format (auto-generated)
.opencode/agent/         # OpenCode format (auto-generated)
```

## Agent Categories

### **Code & Implementation**

| Agent                   | Purpose                       | Complexity   |
| ----------------------- | ----------------------------- | ------------ |
| `full-stack-developer`  | Complete feature development  | Advanced     |
| `api-builder`           | API design and implementation | Intermediate |
| `database-expert`       | Database optimization         | Intermediate |
| `ai-integration-expert` | AI/ML capabilities            | Advanced     |

### **Analysis & Discovery**

| Agent                     | Purpose                      | Complexity   |
| ------------------------- | ---------------------------- | ------------ |
| `codebase-locator`        | Find files and components    | Beginner     |
| `codebase-analyzer`       | Understand specific code     | Beginner     |
| `codebase-pattern-finder` | Find similar implementations | Beginner     |
| `performance-engineer`    | Performance analysis         | Intermediate |

### **Operations & Scale**

| Agent                               | Purpose             | Complexity   |
| ----------------------------------- | ------------------- | ------------ |
| `operations-incident-commander`     | Incident response   | Advanced     |
| `infrastructure-builder`            | Cloud architecture  | Advanced     |
| `security-scanner`                  | Security assessment | Intermediate |
| `development-migrations-specialist` | Database migrations | Intermediate |

### **Business & Growth**

| Agent                              | Purpose                 | Complexity   |
| ---------------------------------- | ----------------------- | ------------ |
| `growth-engineer`                  | User acquisition        | Intermediate |
| `programmatic-seo-engineer`        | SEO at scale            | Advanced     |
| `ux-optimizer`                     | User experience         | Intermediate |
| `content-localization-coordinator` | International expansion | Advanced     |

## Usage Patterns

### **Research Phase**

1. Start with locators: `codebase-locator` + `research-locator`
2. Add pattern-finder if needed: `codebase-pattern-finder`
3. Deep analysis: `codebase-analyzer` + `research-analyzer`

### **Implementation Phase**

1. Simple features: Use domain-specific agents directly
2. Complex systems: `smart-subagent-orchestrator`
3. Quality assurance: `code-reviewer` + `security-scanner`

### **Incident Response**

1. Immediate assessment: `operations-incident-commander`
2. Technical investigation: Domain specialists
3. Resolution and documentation: Full workflow

## Model Tiers

- **Strategic/Ops**: github-copilot/gpt-5
- **Deep Technical**: opencode/grok-code-fast
- **General Research**: Built-in routing

## Platform Support

All agents are automatically converted to:

- **Claude Code** (`.claude/agents/`) - Native subagents
- **OpenCode** (`.opencode/agent/`) - MCP tools
- **Other MCP** - Universal compatibility

## Getting Started

```bash
# Research existing code
/research "authentication implementation"

# Plan new features
/plan "add OAuth2 authentication"

# Execute with specialists
/execute "implement authentication flow"
```

## Documentation

- [Agent Registry](./docs/AGENT_REGISTRY.md) - Complete agent catalog
- [Agent Discovery Guide](./AGENT_DISCOVERY_GUIDE.md) - Interactive selection guide
- [Development Standards](./docs/) - Coding guidelines and best practices

---

_This document serves as the main AGENTS.md file for the CodeFlow project, providing quick access to all available agents and their usage patterns._
