# CodeFlow Agent Registry



<!-- VERBALIZED SAMPLING INTEGRATION -->
<!-- ================================ -->

**Selected Strategy**: Code-Path Analysis
**Confidence**: 71.0%

**Available Strategies**:
1. **Code-Path Analysis** (Confidence: 71.0%)
   - Plan: Identify entry points and main execution flows, Trace key decision branches and conditional logic...
2. **Pattern Discovery** (Confidence: 71.0%)
   - Plan: Scan codebase for repeated code structures, Identify naming conventions and architectural patterns...
3. **Architecture Mapping** (Confidence: 71.0%)
   - Plan: Identify major components and modules, Map data flow and dependencies between components...


---

## Canonical Agent Directory Policy

- `/codeflow-agents/` is the ONLY source-of-truth agent directory for base agent definitions.
- All agent configuration, schema, and updates must be made exclusively in this directory.
- Platform-specific agent directories (`.claude/agents/`, `.opencode/agent/`) are now tracked in version control to ensure proper conversion and consistency across formats.
- Agent conversions are validated and committed to ensure all platforms have synchronized, up-to-date agents.

**Tracked Agent Directories:**

```
# Source of truth (base format)
/codeflow-agents/

# Platform-specific converted formats (tracked)
/.claude/agents/         # Claude Code format agents
/.opencode/agent/        # OpenCode format agents
```

**Directory Structure:**
- Base agents in `/codeflow-agents/` use the full BaseAgent format with all fields
- Claude Code agents in `/.claude/agents/` use minimal format (name, description, tools, model only)
- OpenCode agents in `/.opencode/agent/` use OpenCode specification format with permissions

---

This file catalogs all available agents in the CodeFlow system, organized by category and capability. All agents are stored in the `codeflow-agents/` directory using the unified `BaseAgent` format and are automatically converted to platform-specific formats as needed.

## 🎯 **Single Format Architecture**

All agents are defined once in the `BaseAgent` format and automatically converted to:

- **Claude Code Format** (`.claude/agents/`) - For Claude Code subagents (minimal format: name, description, optional tools)
- **OpenCode Format** (`.opencode/agent/`) - For OpenCode platform

## 🔧 **Registry Management & QA**

### **Canonical Scan Order**

Agents are loaded in priority order to ensure deterministic behavior:

1. **Canonical Sources** (highest priority):
   - `codeflow-agents/` - Base agent definitions (source of truth)
   - `opencode-agents/` - OpenCode-specific agents

2. **Legacy Sources** (when `CODEFLOW_INCLUDE_LEGACY=1`):
   - `deprecated/claude-agents/` - Legacy Claude Code agents
   - `deprecated/opencode-agents/` - Legacy OpenCode agents

3. **User/Project Sources** (lowest priority):
   - `~/.codeflow/agents/`, `~/.claude/agents/`, `~/.config/opencode/agent/`
   - Project-specific: `.claude/agents/`, `.opencode/agent/`

### **Duplicate Resolution Policy**

- **Canonical Conflicts**: Same agent ID in multiple canonical directories with different content → **Fail with error**
- **Legacy Duplicates**: Agent exists in both canonical and legacy directories → **Warn and prefer canonical**
- **Hash-based Detection**: Uses SHA256 of normalized core fields (`model`, `tools`, `allowed_directories`, `inputs`, `outputs`)

### **QA & Validation**

Registry QA is available via:

- **MCP Tool**: `codeflow.registry.qa` - Structured JSON report with issues and remediation
- **CLI**: `codeflow validate` - Fails on critical issues, warns on legacy duplicates

### **Environment Flags**

- `CODEFLOW_INCLUDE_LEGACY=1` - Include deprecated directories in scan
- `CODEFLOW_FS_READ_DEFAULT_ALLOW_REPO_ROOT=0` - Default filesystem read scope
- `CODEFLOW_VALIDATE_STRICT=1` - Treat warnings as errors

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

### **research-locator**

- **Purpose**: Discover what documents exist in the research directory
- **When to use**: Finding existing documentation, decisions, and architectural thoughts
- **Always run before**: research-analyzer
- **Format**: BaseAgent (auto-converted to all platforms)

### **research-analyzer**

- **Purpose**: Extract key insights from specific documents
- **When to use**: Analyzing the most relevant documents found by research-locator
- **Run after**: research-locator
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

- **Model**: opencode/grok-code-fast
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

- **Model**: opencode/grok-code-fast
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

- **Model**: opencode/grok-code-fast
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
- **smart-subagent-orchestrator**: Complex multi-domain project coordination with advanced orchestration patterns
- **ux-optimizer**: User experience and conversion optimization (consolidated from mobile-optimizer and integration-master)
- **system-architect**: System design and architecture planning
- **monitoring-expert**: Observability and monitoring systems
- **devops-operations-specialist**: DevOps and infrastructure automation
- **infrastructure-builder**: Infrastructure as code and cloud architecture
- **deployment-wizard**: Deployment strategies and CI/CD optimization

### **smart-subagent-orchestrator (Enhanced)**

**Major Enhancement**: Now includes 6 comprehensive orchestration patterns and 6 advanced coordination strategies.

- **Model**: github-copilot/gpt-4.1
- **Purpose**: Advanced orchestration agent that coordinates existing specialized subagents for complex multi-domain projects
- **New Orchestration Patterns**:
  1. **Research-Driven Development**: Parallel discovery → analysis → architecture → implementation → quality gates → documentation
  2. **Production Incident Response**: Immediate assessment → root cause → fix → verification → post-mortem
  3. **Database Schema Evolution**: Analysis → migration design → implementation → testing → deployment
  4. **Large-Scale Refactoring**: Discovery → pattern analysis → incremental refactoring → validation → documentation
  5. **Growth & Analytics Implementation**: Strategy → planning → implementation → validation → monitoring
  6. **Security Remediation**: Assessment → impact analysis → remediation → verification → compliance
- **Advanced Coordination Strategies**:
  1. **Parallel vs Sequential Decision Framework**: When to parallelize vs sequence agent execution
  2. **Context Window Management**: Staged context reduction, hierarchical summarization, selective rehydration
  3. **Error Recovery & Adaptive Re-planning**: Gap assessment, recovery patterns, clarification loops
  4. **Risk-Based Quality Gates**: Critical path blocking, high-priority tracking, decision frameworks
  5. **Agent Selection by Complexity & Permissions**: Complexity assessment, permission-based routing
  6. **Specialized Domain Coordination**: Operations, security, performance, data, internationalization
- **Selection Heuristics**: Extended table with 10 common scenarios and recommended agent sequences
- **When to use**: Complex projects requiring coordination across multiple domains, large-scale implementations
- **Format**: BaseAgent (auto-converted to all platforms with enhanced content)

### **ux-optimizer**

**Consolidated Agent Notice**: This agent consolidates all capabilities previously covered by the deprecated `mobile-optimizer` and `integration-master` agents. These legacy agents have been deprecated in favor of this unified UX optimization approach.

- **Model**: github-copilot/gpt-5
- **Purpose**: Comprehensive user experience optimization covering mobile UX, integration flows, conversion optimization, accessibility, analytics, and behavioral design
- **Capabilities**:
  - **Mobile UX**: Touch-friendly interactions, responsive design, mobile-first optimization, gesture navigation, and cross-platform consistency
  - **Integration Flows**: Seamless user onboarding, API integration UX, third-party service connections, and complex workflow optimization
  - **Conversion Optimization**: A/B testing, landing page optimization, funnel analysis, persuasive design, and conversion rate improvement
  - **Accessibility**: WCAG compliance, inclusive design, keyboard navigation, screen reader optimization, and multi-modal interfaces
  - **Analytics & Data**: User behavior analysis, heatmaps, session recordings, cohort analysis, and UX-focused metrics tracking
  - **Behavioral Design**: User psychology, persuasive patterns, gamification, trust signals, and behavioral economics
- **When to use**: UX improvements, conversion optimization, mobile experience enhancement, accessibility compliance, user research integration
- **Do not use**: Deep content writing (use content-writer agent instead), technical implementation without UX context
- **Format**: BaseAgent (auto-converted to all platforms)

## 📋 **Agent Selection Guidelines**

### **For Research Phase**

1. **Always start with locators**: Run codebase-locator and research-locator in parallel
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
- **Deep Technical**: opencode/grok-code-fast (migrations, performance, SEO)
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
