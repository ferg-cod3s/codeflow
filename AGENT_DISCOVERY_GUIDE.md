# Agent Discovery Guide

*Inspired by HumanLayer's user-centric approach to agent discoverability*

## Quick Agent Finder

### 🚀 **Starting a New Feature?**
```
/research "your feature idea" → codebase-locator + research-locator
↓
/plan "implementation strategy" → smart-subagent-orchestrator
↓
/execute "build the feature" → full-stack-developer + specialized experts
```

### 🔍 **Need to Understand Existing Code?**
- **Find files**: `codebase-locator` → "Where is the authentication code?"
- **Understand code**: `codebase-analyzer` → "How does this payment flow work?"
- **Find patterns**: `codebase-pattern-finder` → "Show me similar implementations"

### 🐛 **Debugging Issues?**
- **Performance**: `performance-engineer` → Identify bottlenecks and optimization opportunities
- **Security**: `security-scanner` → Find vulnerabilities and security issues
- **Database**: `database-expert` → Query optimization and schema issues

### 📈 **Growing Your Product?**
- **User Growth**: `growth-engineer` → A/B testing, conversion optimization
- **SEO**: `programmatic-seo-engineer` → Large-scale SEO implementation
- **UX**: `ux-optimizer` → User experience and accessibility improvements

## Agent Categories (HumanLayer Style)

### **🔧 Code & Implementation**
| Agent | Best For | Time | Complexity |
|-------|----------|------|------------|
| `full-stack-developer` | Complete feature development | 30-60 min | Advanced |
| `api-builder` | API design and implementation | 15-30 min | Intermediate |
| `database-expert` | Schema design, query optimization | 20-40 min | Intermediate |
| `ai-integration-expert` | Adding AI/ML capabilities | 25-45 min | Advanced |

### **📊 Analysis & Discovery**
| Agent | Best For | Time | Complexity |
|-------|----------|------|------------|
| `codebase-locator` | Find files and components | 2-5 min | Beginner |
| `codebase-analyzer` | Understand specific code | 5-15 min | Beginner |
| `codebase-pattern-finder` | Find similar implementations | 5-10 min | Beginner |
| `performance-engineer` | Performance analysis | 15-30 min | Intermediate |

### **🚀 Operations & Scale**
| Agent | Best For | Time | Complexity |
|-------|----------|------|------------|
| `operations-incident-commander` | Incident response leadership | 20-60 min | Advanced |
| `infrastructure-builder` | Cloud architecture design | 30-60 min | Advanced |
| `security-scanner` | Security vulnerability assessment | 15-25 min | Intermediate |
| `migrations-specialist` | Database migrations | 20-40 min | Intermediate |

### **📈 Business & Growth**
| Agent | Best For | Time | Complexity |
|-------|----------|------|------------|
| `growth-engineer` | User acquisition optimization | 20-40 min | Intermediate |
| `programmatic-seo-engineer` | SEO at scale | 25-45 min | Advanced |
| `ux-optimizer` | User experience improvements | 15-30 min | Intermediate |
| `content-localization-coordinator` | International expansion | 30-60 min | Advanced |

### **🧠 Meta & Orchestration**
| Agent | Best For | Time | Complexity |
|-------|----------|------|------------|
| `agent-architect` | Creating custom agents | 30-90 min | Advanced |
| `smart-subagent-orchestrator` | Complex multi-agent workflows | 45-120 min | Expert |
| `research-locator` | Find documentation | 2-5 min | Beginner |
| `research-analyzer` | Extract insights from docs | 5-15 min | Beginner |

## Workflow Patterns (HumanLayer Inspired)

### **Pattern 1: Feature Development**
```mermaid
graph LR
    A[/research] --> B[/plan]
    B --> C[/execute]
    C --> D[/test]
    D --> E[/document]
    E --> F[/review]
    F --> G[/commit]
```

### **Pattern 2: Bug Investigation**
```mermaid
graph LR
    A[codebase-locator] --> B[codebase-analyzer]
    B --> C[performance-engineer]
    C --> D[security-scanner]
    D --> E[/plan fix]
```

### **Pattern 3: Architecture Review**
```mermaid
graph LR
    A[research-locator] --> B[codebase-pattern-finder]
    B --> C[smart-subagent-orchestrator]
    C --> D[Multiple Specialists]
    D --> E[/document]
```

## Quick Decision Tree

```
What do you want to do?
├── Understand existing code?
│   ├── Find files → codebase-locator
│   ├── Understand implementation → codebase-analyzer
│   └── Find similar patterns → codebase-pattern-finder
├── Build something new?
│   ├── Full feature → /research → /plan → /execute
│   ├── Just API → api-builder
│   ├── Just database → database-expert
│   └── Complex system → smart-subagent-orchestrator
├── Fix a problem?
│   ├── Performance issue → performance-engineer
│   ├── Security concern → security-scanner
│   ├── Database issue → database-expert
│   └── UX problem → ux-optimizer
└── Scale/optimize?
    ├── User growth → growth-engineer
    ├── SEO → programmatic-seo-engineer
    ├── Operations → operations-incident-commander
    └── Infrastructure → infrastructure-builder
```

## Pro Tips (HumanLayer Style)

### **🎯 Agent Selection**
1. **Start simple**: Use `codebase-locator` before complex agents
2. **Be specific**: "Review API security" not "check security"
3. **Layer expertise**: Basic analysis → specialized analysis → implementation
4. **Time box**: Set clear expectations for deliverables

### **⚡ Workflow Optimization**
1. **Parallel research**: Run locator agents simultaneously
2. **Sequential analysis**: Analyzer agents use locator results
3. **Escalation paths**: Know when to switch agents mid-task
4. **Context preservation**: Pass findings between agents

### **🔄 Common Patterns**
- **Discovery → Analysis → Implementation**
- **Parallel Locators → Sequential Analyzers**
- **Research → Plan → Execute → Review**
- **Problem → Investigation → Solution → Validation**

## Examples by Use Case

### **"I need to add authentication to my app"**
```bash
# 1. Research existing patterns
/research "authentication implementation patterns in codebase"

# 2. Plan the implementation
/plan "Add OAuth2 authentication with JWT tokens"

# 3. Execute with API expert
/execute → api-builder + security-scanner
```

### **"Our app is slow, help me optimize"**
```bash
# 1. Identify bottlenecks
performance-engineer "analyze application performance"

# 2. Database optimization
database-expert "optimize slow queries"

# 3. Frontend optimization
ux-optimizer "improve page load times"
```

### **"I'm new to this codebase"**
```bash
# 1. Get overview
codebase-locator "find main application entry points"

# 2. Understand architecture
codebase-analyzer "explain application structure"

# 3. Find documentation
research-locator "discover architecture decisions"
```

## Agent Relationships

### **Core Workflow Agents** (Use First)
- `codebase-locator` → Finds everything
- `research-locator` → Finds documentation
- `web-search-researcher` → External research

### **Analysis Agents** (Use Second)
- `codebase-analyzer` → Understands code
- `research-analyzer` → Understands docs
- `codebase-pattern-finder` → Finds patterns

### **Implementation Agents** (Use Last)
- `full-stack-developer` → General implementation
- Specialist agents → Domain-specific work
- `smart-subagent-orchestrator` → Complex coordination

---

*This guide makes agent discovery intuitive and workflow-oriented, inspired by HumanLayer's user-centric approach while leveraging Codeflow's comprehensive agent ecosystem.*