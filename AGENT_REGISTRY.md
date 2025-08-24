# Agent Registry

This file catalogs all available agents in the agentic workflow system, organized by category and capability.

## Core Workflow Agents

These agents are specifically designed for the agentic workflow system:

### **codebase-locator**
- **Purpose**: Find WHERE files and components exist in the codebase
- **When to use**: Initial exploration phase, locating relevant code sections
- **Always run before**: codebase-analyzer, codebase-pattern-finder

### **codebase-pattern-finder** 
- **Purpose**: Discover similar implementation patterns and examples
- **When to use**: When you need examples of how similar features are implemented
- **Run after**: codebase-locator

### **codebase-analyzer**
- **Purpose**: Understand HOW specific code works in detail
- **When to use**: Deep analysis of identified code sections
- **Run after**: codebase-locator and codebase-pattern-finder

### **thoughts-locator**
- **Purpose**: Discover what documents exist in the thoughts directory
- **When to use**: Finding existing documentation, decisions, and architectural thoughts
- **Always run before**: thoughts-analyzer

### **thoughts-analyzer**
- **Purpose**: Extract key insights from specific documents
- **When to use**: Analyzing the most relevant documents found by thoughts-locator
- **Run after**: thoughts-locator

### **web-search-researcher**
- **Purpose**: Perform targeted web research for missing information
- **When to use**: When codebase and thoughts research reveals gaps needing external documentation

## Specialized Domain Agents

These agents provide expert capabilities in specific domains:

### Operations & Infrastructure

#### **operations_incident_commander**
- **Model**: github-copilot/gpt-5
- **Purpose**: Lead incident response from detection through resolution
- **Capabilities**: 
  - Incident triage and SEV classification
  - Incident bridge coordination
  - Post-incident reviews (PIRs)
  - Stakeholder communications
- **When to use**: Active incidents, SLO breaches, multi-team coordination
- **Do not use**: Routine operations without incident context

### Development & Engineering

#### **development_migrations_specialist**
- **Model**: anthropic/claude-sonnet-4-20250514
- **Purpose**: Plan and execute safe database schema and data migrations
- **Capabilities**:
  - Expand/contract migration patterns
  - Zero-downtime deployment strategies
  - Data backfills and dual-read/write systems
  - Rollback planning and blast-radius containment
- **When to use**: Schema changes, large backfills, multi-tenant migrations
- **Do not use**: Trivial dev-only migrations

### Quality & Testing

#### **quality-testing_performance_tester**
- **Model**: anthropic/claude-sonnet-4-20250514
- **Purpose**: Design and execute comprehensive performance testing
- **Capabilities**:
  - Load/stress/soak/spike test planning
  - k6, JMeter, Locust script development
  - Performance profiling and bottleneck analysis
  - SLO validation and reporting
- **When to use**: Performance test planning, bottleneck analysis, SLO validation
- **Do not use**: Simple microbenchmarks or UI polish tasks

### Business & Analytics

#### **programmatic_seo_engineer**
- **Model**: anthropic/claude-sonnet-4-20250514
- **Purpose**: Design and implement programmatic SEO systems at scale
- **Capabilities**:
  - Data-driven page generation architecture
  - Technical SEO implementation
  - Internal linking strategies
  - Content template systems
- **When to use**: SEO architecture, content generation at scale, technical SEO
- **Do not use**: Individual page copywriting, simple on-page tweaks

#### **content_localization_coordinator**
- **Model**: github-copilot/gpt-5
- **Purpose**: Coordinate localization and internationalization workflows
- **Capabilities**:
  - i18n readiness audits
  - Translation management system design
  - Localization pipeline coordination
  - Multi-locale quality assurance
- **When to use**: i18n planning, TMS integration, translation workflows
- **Do not use**: Complex extraction scripts, deep build tooling changes

## OpenCode Format Agents

Additional agents available in OpenCode format (located in `agent/opencode/`):

- **agent-architect**: Meta-agent for creating specialized AI agents
- **ai-integration-expert**: AI/ML feature integration
- **api-builder**: Developer-friendly API design
- **database-expert**: Database optimization and design
- **full-stack-developer**: Cross-functional development tasks
- **growth-engineer**: User acquisition and retention optimization
- **security-scanner**: Vulnerability assessment and security best practices
- **smart-subagent-orchestrator**: Complex multi-domain project coordination
- **ux-optimizer**: User experience and conversion optimization

## Agent Selection Guidelines

### For Research Phase
1. **Always start with locators**: Run codebase-locator and thoughts-locator in parallel
2. **Then use pattern-finders**: If you need implementation examples
3. **Finally run analyzers**: For deep understanding of identified code/documents
4. **Add specialized agents selectively**: Only when the research domain matches their expertise

### For Planning Phase
- Use specialized agents that match the implementation domain
- Consider agent handoff capabilities for complex features
- Review agent constraints and escalation paths

### For Execution Phase
- Specialized agents can handle domain-specific implementation
- Use their built-in quality gates and success criteria
- Follow their escalation guidelines for complex scenarios

## Model Tiers & Routing

- **Strategic/Ops**: github-copilot/gpt-5 (incident commander, localization coordinator)
- **Deep Technical**: anthropic/claude-sonnet-4-20250514 (migrations, performance, SEO)
- **General Research**: Built-in model routing based on task complexity

## Integration with Agentic Workflow

All agents integrate with the core agentic workflow commands:
- `/research` - Uses appropriate agents based on research domain
- `/plan` - Leverages specialized agents for implementation planning  
- `/execute` - Delegates implementation to domain experts
- `/review` - Uses agents for specialized validation and quality checks