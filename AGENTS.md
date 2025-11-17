# CodeFlow Base Agents

This document provides a comprehensive inventory of all base agents included in the CodeFlow CLI project. These agents are designed to be converted to OpenCode format using the `codeflow convert agents` command.

## Overview

CodeFlow includes **141 specialized agents** organized into **8 categories**, each designed for specific domains and use cases. These agents represent best practices and expert knowledge in their respective fields.

### Agent Statistics by Category

| Category | Agent Count | Description |
|----------|-------------|-------------|
| Development | 62 | Programming language experts and development specialists |
| Business Analytics | 18 | Data analysis, BI, and business intelligence |
| Operations | 17 | DevOps, infrastructure, cloud, and system operations |
| Quality/Testing | 15 | QA, testing, security, and compliance |
| AI Innovation | 11 | AI/ML, data science, and emerging technologies |
| Generalist | 9 | General-purpose and cross-functional agents |
| Design/UX | 5 | Design, UX, and creative work |
| Product Strategy | 4 | Product management and strategy |

## Agent Categories

### 1. AI Innovation (11 agents)

Agents specializing in artificial intelligence, machine learning, and emerging technologies.

**Agents**:
- `ai_agent_builder` - Build and optimize AI agents
- `ai_automation_engineer` - Automate workflows with AI
- `ai_governance_specialist` - AI ethics and governance
- `ai_integration_architect` - Integrate AI into systems
- `ai_prompt_engineer` - Expert prompt engineering
- `data_scientist` - Data science and ML modeling
- `llm_expert` - Large language model specialist
- `ml_engineer` - Machine learning engineering
- `ml_ops_engineer` - MLOps and model deployment
- `nlp_engineer` - Natural language processing
- `semantic_search_engineer` - Semantic search and embeddings

### 2. Business Analytics (18 agents)

Agents focused on data analysis, business intelligence, and analytics.

**Agents**:
- `analyst` - General business analysis
- `bi_developer` - Business intelligence development
- `business_analyst` - Business process analysis
- `business_intelligence_analyst` - BI and reporting
- `competitive_intelligence_analyst` - Market and competitor analysis
- `cost_optimization_analyst` - Cost reduction and optimization
- `customer_insights_analyst` - Customer behavior analysis
- `data_analyst` - Data analysis and visualization
- `data_engineer` - Data pipeline and ETL
- `data_governance_specialist` - Data quality and governance
- `data_warehouse_architect` - Data warehouse design
- `financial_analyst` - Financial modeling and analysis
- `fraud_detection_specialist` - Fraud detection and prevention
- `marketing_analyst` - Marketing analytics
- `predictive_analyst` - Predictive modeling
- `reporting_specialist` - Report generation and automation
- `risk_analyst` - Risk assessment and management
- `supply_chain_analyst` - Supply chain optimization

### 3. Design/UX (5 agents)

Agents specializing in design, user experience, and creative work.

**Agents**:
- `accessibility_specialist` - Web accessibility (WCAG, a11y)
- `design_system_architect` - Design system creation
- `frontend_designer` - Frontend design and prototyping
- `ui_ux_designer` - UI/UX design and research
- `visual_designer` - Visual design and branding

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

General-purpose agents for cross-functional tasks.

**Agents**:
- `architect` - General software architecture
- `code_reviewer` - Code review and quality
- `consultant` - Technical consulting
- `educator` - Teaching and training
- `mentor` - Mentorship and guidance
- `problem_solver` - General problem solving
- `researcher` - Research and investigation
- `technical_writer` - Technical documentation
- `translator` - Code and documentation translation

### 6. Operations (17 agents)

DevOps, infrastructure, cloud, and system operations specialists.

**Agents**:
- `cicd_engineer` - CI/CD pipeline development
- `cloud_cost_optimizer` - Cloud cost management
- `cloud_migration_specialist` - Cloud migration
- `cloud_security_engineer` - Cloud security
- `configuration_manager` - Configuration management
- `containerization_specialist` - Docker and containers
- `devops_engineer` - DevOps practices
- `disaster_recovery_specialist` - DR and backup
- `infrastructure_engineer` - Infrastructure as code
- `monitoring_specialist` - Monitoring and observability
- `network_engineer` - Network design and management
- `platform_engineer` - Platform engineering
- `release_manager` - Release management
- `site_reliability_engineer` - SRE practices
- `system_administrator` - System administration
- `terraform_specialist` - Terraform and IaC
- `troubleshooter` - System troubleshooting

### 7. Product Strategy (4 agents)

Product management and strategic planning.

**Agents**:
- `innovation_strategist` - Innovation and strategy
- `product_manager` - Product management
- `product_strategist` - Product strategy
- `roadmap_planner` - Product roadmap planning

### 8. Quality/Testing (15 agents)

Quality assurance, testing, security, and compliance.

**Agents**:
- `accessibility_tester` - Accessibility testing
- `automation_tester` - Test automation
- `compliance_expert` - Regulatory compliance
- `load_tester` - Performance and load testing
- `penetration_tester` - Security testing
- `privacy_specialist` - Privacy and data protection
- `qa_engineer` - Quality assurance
- `security_auditor` - Security audits
- `security_engineer` - Security engineering
- `test_architect` - Test strategy and architecture
- `test_automation_engineer` - Automated testing
- `test_data_engineer` - Test data management
- `usability_tester` - Usability testing
- `validation_engineer` - Validation and verification
- `vulnerability_scanner` - Vulnerability detection

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
