# Codeflow Documentation Index



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


This directory contains comprehensive documentation for the Codeflow project. The project also includes deeper design and planning under `research/`.

## Getting Started & Core Documentation

- **Getting Started & CLI usage**: See the root `README.md`
- **User Guide**: `./2025-08-27-codeflow-user-guide.md` - Complete usage instructions and workflows
- **API Reference**: `./2025-08-27-codeflow-api-reference.md` - CLI commands, MCP tools, and schemas
- **Developer Guide**: `./2025-08-27-codeflow-developer-guide.md` - Architecture and development details
- **Documentation Summary**: `./2025-08-27-documentation-summary.md` - Overview of all documentation

## Strategic & Governance Documentation

- **Product Requirements Document (PRD)**: `./PRODUCT_REQUIREMENTS_DOCUMENT.md` - Product vision, requirements, and success criteria
- **Global Development Rules**: `./GLOBAL_RULES.md` - Development standards, architectural principles, and workflows
- **Product Strategy & Roadmap**: `./PRODUCT_STRATEGY.md` - Market analysis, competitive landscape, and business strategy

## Platform Integration

- **Cross-Repository Setup**: `./CROSS_REPO_SETUP.md` - Use codeflow from any project
- **Platform Best Practices**:
  - `./OPENCODE_BEST_PRACTICES.md` - OpenCode command development
  - `./OPENCODE_CODEFLOW_BEST_PRACTICES.md` - OpenCode for CI/CD workflows
  - `./CLAUDE_CODE_BEST_PRACTICES.md` - Claude Code slash commands
  - `./CURSOR_BEST_PRACTICES.md` - Cursor commands and rules

## Development & Operations

- **Architecture Overview**: `./ARCHITECTURE_OVERVIEW.md` - System architecture and design
- **Troubleshooting**: `./TROUBLESHOOTING.md` - Fix common issues
- **Migration Guide**: `./MIGRATION.md` - Transition from "agentic" to "codeflow"
- **NPM Deployment Guide**: `./NPM_DEPLOYMENT_GUIDE.md` - Package deployment instructions
- **Contributing Guidelines**: `./CONTRIBUTING.md` - How to contribute to the project

## Agent System

- **Agent Registry**: `./AGENT_REGISTRY.md` - Technical agent system details
- **Agent Template**: `./AGENT.template.md` - Template for creating new agents
- **Agent Manifest**: `./AGENT_MANIFEST.json` - Agent registry data
- **Slash Commands**: `./SLASH_COMMANDS.md` - Command reference and usage

## Development Tools

- **Dev Tools Setup**: `./development/dev-tools.md`
- **Testing Strategy**: `./development/testing-strategy.md`

## Project Management

- **Changelog**: `./CHANGELOG.md` - Version history and changes
- **TODO**: `./TODO.md` - Development tracking and upcoming work
- **Thoughts System**: `./THOUGHTS.md` - Understanding the research directory structure
- **Agent Synchronization**: `./scripts/README.md` - Agent sync system documentation

## AI-Specific Documentation (Root Directory)

The following AI-specific documentation remains in the root directory:

- `../CLAUDE.md` - Claude integration guide
- `../codeflow-agents/README.md` - Codeflow agents documentation
- `../WARP.md` - Warp integration guide

## Internal Planning & Research

For internal planning and deeper technical docs, see `research/`:

- `../research/architecture/` - Architectural decisions and designs
- `../research/research/` - Research findings and analysis
- `../research/plans/` - Implementation plans
- `../research/documentation/` - Documentation for implemented plan
- `../research/review/` - Reviews completed

## Quick Navigation

| Need                  | Document                      |
| --------------------- | ----------------------------- |
| Install & Setup       | User Guide                    |
| CLI Commands          | API Reference                 |
| Architecture          | Developer Guide               |
| Troubleshooting       | Troubleshooting Guide         |
| Migration             | Migration Guide               |
| Contributing          | Contributing Guidelines       |
| Agent Development     | Agent Template + Registry     |
| Product Strategy      | Product Strategy & Roadmap    |
| Development Standards | Global Development Rules      |
| Product Requirements  | Product Requirements Document |
