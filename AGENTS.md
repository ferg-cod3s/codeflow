# CodeFlow Base Agents

This document provides a comprehensive inventory of all base agents included in the CodeFlow CLI project. These agents are designed to be converted to OpenCode format using the `codeflow convert agents` command.

## Overview

CodeFlow includes **141 specialized agents** organized into **8 categories**, each designed for specific domains and use cases. These agents represent best practices and expert knowledge in their respective fields.

### Agent Statistics by Category

| Category | Agent Count | Description |
|----------|-------------|-------------|
| Development | 62 | Programming language experts and development specialists |
| Business Analytics | 18 | Business functions, marketing, SEO, and specialized domains |
| Operations | 17 | DevOps, infrastructure, deployment, and monitoring |
| Quality/Testing | 15 | QA, testing, security, code review, and performance |
| AI Innovation | 11 | AI/ML, data science, and emerging technologies |
| Generalist | 9 | Agent management, research, and cross-functional tasks |
| Design/UX | 5 | Design, UX, accessibility, and visual validation |
| Product Strategy | 4 | Domain-specific specialization (fintech, healthcare, e-commerce) |

## Agent Categories

### 1. AI Innovation (11 agents)

Agents specializing in artificial intelligence, machine learning, and emerging technologies.

**Agents**:
- `ai_engineer` - AI engineering and development
- `ai_integration_expert` - Integrate AI into systems
- `ar_vr_developer` - Augmented and virtual reality development
- `computer_vision_engineer` - Computer vision and image processing
- `data_engineer` - Data pipeline and engineering
- `data_scientist` - Data science and ML modeling
- `ml_engineer` - Machine learning engineering
- `mlops_engineer` - MLOps and model deployment
- `prompt_engineer` - Expert prompt engineering
- `quant_analyst` - Quantitative analysis and modeling
- `quantum_computing_developer` - Quantum computing development

### 2. Business Analytics (18 agents)

Agents focused on business functions, marketing, SEO, and specialized business domains.

**Agents**:
- `blockchain_developer` - Blockchain and Web3 development
- `business_analyst` - Business process analysis
- `content_marketer` - Content marketing and strategy
- `customer_support` - Customer support operations
- `growth_engineer` - Growth hacking and optimization
- `legal_advisor` - Legal compliance and guidance
- `payment_integration` - Payment system integration
- `programmatic_seo_engineer` - Automated SEO at scale
- `risk_manager` - Risk assessment and management
- `sales_automator` - Sales automation and tools
- `seo_cannibalization_detector` - Detect SEO cannibalization issues
- `seo_content_auditor` - SEO content auditing
- `seo_content_planner` - SEO content planning
- `seo_content_refresher` - Update and refresh SEO content
- `seo_content_writer` - SEO-optimized content writing
- `seo_keyword_strategist` - Keyword research and strategy
- `seo_meta_optimizer` - Meta tags and descriptions optimization
- `seo_snippet_hunter` - Featured snippet optimization

### 3. Design/UX (5 agents)

Agents specializing in design, user experience, accessibility, and SEO authority.

**Agents**:
- `accessibility_pro` - Web accessibility (WCAG, a11y) expert
- `seo_authority_builder` - Build domain and page authority
- `ui_ux_designer` - UI/UX design and research
- `ui_visual_validator` - Visual UI validation and testing
- `ux_optimizer` - UX optimization and improvement

### 4. Development (62 agents)

The largest category, containing programming language experts and specialized developers.

#### Language-Specific Agents

**Backend Languages**:
- `python_pro` - Python 3.12+ expert (FastAPI, async, modern tooling)
- `java_pro` - Java development expert
- `golang_pro` - Go programming specialist
- `rust_pro` - Rust systems programming
- `c_pro` - C programming expert
- `cpp_pro` - C++ development
- `csharp_pro` - C# and .NET development
- `ruby_pro` - Ruby programming
- `elixir_pro` - Elixir and Erlang
- `scala_pro` - Scala development
- `php_pro` - PHP development

**Frontend Languages**:
- `javascript_pro` - JavaScript expert
- `typescript_pro` - TypeScript specialist

**Database**:
- `sql_pro` - SQL and database queries

#### Framework-Specific Agents

**Backend Frameworks**:
- `django_pro` - Django framework expert
- `fastapi_pro` - FastAPI specialist
- `rails_expert` - Ruby on Rails development
- `laravel_vue_developer` - Laravel + Vue.js
- `graphql_architect` - GraphQL API design

**Frontend Frameworks**:
- `astro_pro` - Astro framework
- `svelte_pro` - Svelte and SvelteKit

**Mobile**:
- `flutter_expert` - Flutter cross-platform development
- `ios_developer` - iOS development
- `mobile_developer` - Cross-platform mobile

**Game Development**:
- `unity_developer` - Unity game development
- `minecraft_bukkit_pro` - Minecraft plugin development

**Specialized**:
- `tauri_pro` - Tauri desktop apps
- `webassembly_developer` - WebAssembly development

#### Role-Specific Development Agents

**Architecture & Design**:
- `api_builder` - REST API development
- `api_builder_enhanced` - Advanced API design
- `api_documenter` - API documentation
- `backend_architect` - Backend architecture
- `cloud_architect` - Cloud architecture design
- `database_admin` - Database administration
- `database_expert` - Database design and optimization
- `database_optimizer` - Database performance tuning
- `docs_architect` - Documentation architecture
- `frontend_developer` - Frontend development
- `full_stack_developer` - Full-stack development
- `graphql_architect` - GraphQL architecture
- `hybrid_cloud_architect` - Multi-cloud architecture
- `kubernetes_architect` - Kubernetes and orchestration
- `system_architect` - System design and architecture

**Specialized Development**:
- `analytics_engineer` - Analytics engineering
- `codebase_analyzer` - Codebase analysis
- `codebase_locator` - Code navigation and search
- `codebase_pattern_finder` - Pattern detection
- `context_manager` - Context and state management
- `debugger` - Debugging specialist
- `development_migrations_specialist` - Data migrations
- `documentation_specialist` - Technical writing
- `edge_computing_specialist` - Edge computing
- `error_detective` - Error tracking and resolution
- `hr_pro` - HR systems development
- `incident_responder` - Incident response
- `iot_device_engineer` - IoT device development
- `iot_security_specialist` - IoT security
- `legacy_modernizer` - Legacy code modernization
- `mermaid_expert` - Mermaid diagram creation
- `reference_builder` - Reference documentation
- `search_specialist` - Search functionality
- `seo_structure_architect` - SEO optimization
- `tutorial_engineer` - Tutorial creation

### 5. Generalist (9 agents)

General-purpose agents for cross-functional tasks, agent management, and research.

**Agents**:
- `agent_architect` - Design and architect agent systems
- `agent_ecosystem_manager` - Manage agent ecosystems
- `code_generation_specialist` - Specialized code generation
- `ide_extension_developer` - IDE and editor extension development
- `onboarding_experience_designer` - Design onboarding experiences
- `research_analyzer` - Analyze research and data
- `research_locator` - Find and locate research resources
- `smart_subagent_orchestrator` - Orchestrate multiple subagents
- `web_search_researcher` - Web search and research

### 6. Operations (17 agents)

DevOps, infrastructure, deployment, monitoring, and system operations specialists.

**Agents**:
- `cost_optimizer` - Cost optimization and management
- `deployment_engineer` - Deployment engineering
- `deployment_wizard` - Deployment automation and wizardry
- `devops_operations_specialist` - DevOps operations expert
- `devops_troubleshooter` - DevOps troubleshooting
- `dx_optimizer` - Developer experience optimization
- `error_monitoring_specialist` - Error monitoring and tracking
- `github_operations_specialist` - GitHub operations and automation
- `infrastructure_builder` - Infrastructure building and IaC
- `monitoring_expert` - Monitoring and observability expert
- `network_engineer` - Network design and management
- `observability_engineer` - Observability and telemetry
- `operations_incident_commander` - Incident command and response
- `release_manager` - Release management
- `sentry-incident-commander` - Sentry incident management
- `sentry-release-manager` - Sentry release tracking
- `terraform_specialist` - Terraform and IaC specialist

### 7. Product Strategy (4 agents)

Product management, domain-specific specialization, and strategic planning.

**Agents**:
- `content_localization_coordinator` - Content localization and internationalization
- `ecommerce_specialist` - E-commerce platforms and strategy
- `fintech_engineer` - Financial technology engineering
- `healthcare_it_specialist` - Healthcare IT and compliance

### 8. Quality/Testing (15 agents)

Quality assurance, testing, security, code review, and performance.

**Agents**:
- `architect_review` - Architecture review and validation
- `backend_security_coder` - Backend security best practices
- `code_reviewer` - Code review and quality
- `compliance_expert` - Regulatory compliance
- `frontend_security_coder` - Frontend security best practices
- `mobile_security_coder` - Mobile security best practices
- `performance_engineer` - Performance optimization engineering
- `quality_testing_performance_tester` - Performance testing specialist
- `security_auditor` - Security audits and assessments
- `security_scanner` - Security scanning and vulnerability detection
- `sentry-error-analyst` - Sentry error analysis and triage
- `sentry-performance-expert` - Sentry performance monitoring
- `tdd_orchestrator` - Test-driven development orchestration
- `test_automator` - Test automation specialist
- `test_generator` - Automated test generation

## Agent Format

Each agent is defined using markdown with YAML frontmatter:

```yaml
---
name: agent_name
description: Brief description of agent capabilities
mode: primary | subagent
temperature: 0.0 - 1.0
category: category_name
tags: [tag1, tag2]
primary_objective: Main goal of the agent
anti_objectives:
  - Things the agent should not do
intended_followups:
  - Suggested next agents to invoke
allowed_directories:
  - ${WORKSPACE}
tools:
  write: true/false
  edit: true/false
  bash: true/false
  read: true/false
  grep: true/false
  glob: true/false
  list: true/false
  webfetch: true/false
permission:
  file_write: allow/deny/ask
  bash_execution: allow/deny/ask
---

[Agent prompt body containing detailed instructions and capabilities]
```

## Using Agents

### Convert to OpenCode Format

```bash
# Convert all agents
codeflow convert agents --output ./opencode-agents

# Convert specific category
codeflow convert agents --output ./dev-agents base-agents/development

# Dry run to preview
codeflow convert agents --dry-run
```

### Validate Converted Agents

```bash
# Validate agent files
codeflow validate ./opencode-agents --format opencode-agent

# Generate validation report
codeflow validate ./opencode-agents --format opencode-agent --report validation.json
```

## Agent Capabilities

### Tool Access

Agents can be configured with various tool permissions:
- **write**: Create new files
- **edit**: Modify existing files
- **bash**: Execute shell commands
- **read**: Read file contents
- **grep**: Search file contents
- **glob**: Pattern-based file finding
- **list**: List directory contents
- **webfetch**: Fetch web content

### Permission Levels

- **allow**: Tool can be used freely
- **deny**: Tool is blocked
- **ask**: User approval required

## Best Practices

1. **Choose the Right Agent**: Select agents based on specific task requirements
2. **Chain Agents**: Use `intended_followups` to create agent workflows
3. **Scope Appropriately**: Use `allowed_directories` to limit file system access
4. **Temperature Settings**: Lower for deterministic tasks (0.0-0.3), higher for creative work (0.7-1.0)
5. **Mode Selection**:
   - `primary`: Main agent for direct user interaction
   - `subagent`: Specialized agent invoked by other agents

## Contributing New Agents

To add a new agent:

1. Create a markdown file in the appropriate category directory
2. Include complete YAML frontmatter with all required fields
3. Write detailed prompt body with capabilities and guidelines
4. Test conversion: `codeflow convert agents --dry-run`
5. Validate: `codeflow validate <output> --format opencode-agent`

## Related Documentation

- **README.md**: User guide and CLI documentation
- **CLAUDE.md**: AI assistant reference guide
- **Source Code**: `src/converters/agent-converter.ts` for conversion logic

## License

All agents are distributed under the MIT License.
