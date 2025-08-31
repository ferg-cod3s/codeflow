# CodeFlow Agent Registry

This file catalogs all available agents in the CodeFlow system, organized by category and capability. All agents are stored in the `codeflow-agents/` directory using the unified `BaseAgent` format and are automatically converted to platform-specific formats as needed.

## 🎯 **Single Format Architecture**

All agents are defined once in the `BaseAgent` format and automatically converted to:

- **Claude Code Format** (`.claude/agents/`) - For Claude Code subagents (minimal format: name, description, optional tools)
- **OpenCode Format** (`.opencode/agent/`) - For OpenCode platform

## 🔍 **Core Research Agents**

These agents are specifically designed for the research workflow system:

### **codebase-locator**

- **Purpose**: Find WHERE files and components exist in the codebase
- **When to use**: Initial exploration phase, locating relevant code sections
- **Always run before**: codebase-analyzer, codebase-pattern-finder
- **Format**: BaseAgent (auto-converted to all platforms)

### **codebase-pattern-finder**

- **Purpose**: Discover similar implementation patterns and examples
- **When to use**: When you need examples of how similar features are implemented
- **Run after**: codebase-locator
- **Format**: BaseAgent (auto-converted to all platforms)

### **codebase-analyzer**

- **Purpose**: Understand HOW specific code works in detail
- **When to use**: Deep analysis of identified code sections
- **Run after**: codebase-locator and codebase-pattern-finder
- **Format**: BaseAgent (auto-converted to all platforms)

### **thoughts-locator**

- **Purpose**: Discover what documents exist in the thoughts directory
- **When to use**: Finding existing documentation, decisions, and architectural thoughts
- **Always run before**: thoughts-analyzer
- **Format**: BaseAgent (auto-converted to all platforms)

### **thoughts-analyzer**

- **Purpose**: Extract key insights from specific documents
- **When to use**: Analyzing the most relevant documents found by thoughts-locator
- **Run after**: thoughts-locator
- **Format**: BaseAgent (auto-converted to all platforms)

### **web-search-researcher**

- **Purpose**: Perform targeted web research for missing information
- **When to use**: When codebase and thoughts research reveals gaps needing external documentation
- **Format**: BaseAgent (auto-converted to all platforms)

## 🏗️ **Specialized Domain Agents**

These agents provide expert capabilities in specific domains:

### **Operations & Infrastructure**

#### **operations-incident-commander**

- **Model**: github-copilot/gpt-5
- **Purpose**: Lead incident response from detection through resolution
- **Capabilities**:
  - Incident triage and SEV classification
  - Incident bridge coordination
  - Post-incident reviews (PIRs)
  - Stakeholder communications
- **When to use**: Active incidents, SLO breaches, multi-team coordination
- **Do not use**: Routine operations without incident context
- **Format**: BaseAgent (auto-converted to all platforms)

### **Development & Engineering**

#### **development-migrations-specialist**

- **Model**: anthropic/claude-sonnet-4-20250514
- **Purpose**: Plan and execute safe database schema and data migrations
- **Capabilities**:
  - Expand/contract migration patterns
  - Zero-downtime deployment strategies
  - Data backfills and dual-read/write systems
  - Rollback planning and blast-radius containment
- **When to use**: Schema changes, large backfills, multi-tenant migrations
- **Do not use**: Trivial dev-only migrations
- **Format**: BaseAgent (auto-converted to all platforms)

### **Quality & Testing**

#### **quality-testing-performance-tester**

- **Model**: anthropic/claude-sonnet-4-20250514
- **Purpose**: Design and execute comprehensive performance testing
- **Capabilities**:
  - Load/stress/soak/spike test planning
  - k6, JMeter, Locust script development
  - Performance profiling and bottleneck analysis
  - SLO validation and reporting
- **When to use**: Performance test planning, bottleneck analysis, SLO validation
- **Do not use**: Simple microbenchmarks or UI polish tasks
- **Format**: BaseAgent (auto-converted to all platforms)

### **Business & Analytics**

#### **programmatic-seo-engineer**

- **Model**: anthropic/claude-sonnet-4-20250514
- **Purpose**: Design and implement programmatic SEO systems at scale
- **Capabilities**:
  - Data-driven page generation architecture
  - Technical SEO implementation
  - Internal linking strategies
  - Content template systems
- **When to use**: SEO architecture, content generation at scale, technical SEO
- **Do not use**: Individual page copywriting, simple on-page tweaks
- **Format**: BaseAgent (auto-converted to all platforms)

#### **content-localization-coordinator**

- **Model**: github-copilot/gpt-5
- **Purpose**: Coordinate localization and internationalization workflows
- **Capabilities**:
  - i18n readiness audits
  - Translation management system design
  - Localization pipeline coordination
  - Multi-locale quality assurance
- **When to use**: i18n planning, TMS integration, translation workflows
- **Do not use**: Complex extraction scripts, deep build tooling changes
- **Format**: BaseAgent (auto-converted to all platforms)

## 🚀 **Development & Engineering Agents**

Additional agents available in the unified format:

- **agent-architect**: Meta-agent for creating specialized AI agents
- **ai-integration-expert**: AI/ML feature integration
- **api-builder**: Developer-friendly API design
- **database-expert**: Database optimization and design
- **full-stack-developer**: Cross-functional development tasks
- **growth-engineer**: User acquisition and retention optimization
- **security-scanner**: Vulnerability assessment and security best practices
- **smart-subagent-orchestrator**: Complex multi-domain project coordination
- **ux-optimizer**: User experience and conversion optimization
- **system-architect**: System design and architecture planning
- **monitoring-expert**: Observability and monitoring systems
- **devops-operations-specialist**: DevOps and infrastructure automation
- **infrastructure-builder**: Infrastructure as code and cloud architecture
- **deployment-wizard**: Deployment strategies and CI/CD optimization

## 📋 **Agent Selection Guidelines**

### **For Research Phase**

1. **Always start with locators**: Run codebase-locator and thoughts-locator in parallel
2. **Then use pattern-finders**: If you need implementation examples
3. **Finally run analyzers**: For deep understanding of identified code/documents
4. **Add specialized agents selectively**: Only when the research domain matches their expertise

### **For Planning Phase**

- Use specialized agents that match the implementation domain
- Consider agent handoff capabilities for complex features
- Review agent constraints and escalation paths

### **For Execution Phase**

- Specialized agents can handle domain-specific implementation
- Use their built-in quality gates and success criteria
- Follow their escalation guidelines for complex scenarios

## 🎛️ **Model Tiers & Routing**

- **Strategic/Ops**: github-copilot/gpt-5 (incident commander, localization coordinator)
- **Deep Technical**: anthropic/claude-sonnet-4-20250514 (migrations, performance, SEO)
- **General Research**: Built-in model routing based on task complexity

## 🔄 **Format Conversion & Usage**

All agents are automatically converted to the appropriate format for your platform:

### **Claude Code Users**

- Agents are converted to Claude Code format with minimal required fields (name, description, optional tools)
- Available as native slash commands: `/research`, `/plan`, `/execute`
- No server setup required
- Follows official Claude Code subagent specification

### **OpenCode Users**

- Agents are converted to OpenCode format with full metadata
- Available as MCP tools through the CodeFlow MCP server
- Requires MCP server configuration

### **Other MCP Clients**

- Agents are converted to base format for maximum compatibility
- Available as MCP tools through the CodeFlow MCP server
- Works with any MCP-compatible AI client

## 🧪 **Agent Development & Testing**

### **Adding New Agents**

1. Create agent file in `codeflow-agents/` using BaseAgent format
2. Run validation: `codeflow validate`
3. Test conversion: `codeflow convert-all --dry-run`
4. Deploy to all formats: `codeflow convert-all`

### **Agent Validation**

- All agents must have `name` and `description` fields
- Name format: lowercase letters, numbers, and hyphens only
- Mode values: `'subagent'`, `'primary'`, or `'agent'`
- Temperature range: 0-2
- Tools format: object with boolean values

### **Quality Assurance**

- Round-trip conversion testing ensures data integrity
- Cross-format validation maintains consistency
- Performance benchmarking for conversion and validation
- Integration testing across all platforms

## 🔗 **Integration with CodeFlow Workflow**

All agents integrate with the core CodeFlow workflow commands:

- `/research` - Uses appropriate agents based on research domain
- `/plan` - Leverages specialized agents for implementation planning
- `/execute` - Delegates implementation to domain experts
- `/review` - Uses agents for specialized validation and quality checks

## 📊 **Performance Characteristics**

- **Agent Loading**: < 50ms for 100 agents
- **Format Conversion**: < 100ms for 50 agents
- **Validation**: < 50ms for 50 agents
- **Memory Usage**: ~2MB for 100 agents

This unified approach ensures **consistent behavior** across all platforms while maintaining **maximum flexibility** for different AI environments.
