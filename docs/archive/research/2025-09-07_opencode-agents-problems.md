---
date: 2025-09-07T19:59:00Z
researcher: John Ferguson
git_commit: 9019bee34bb07675875857705eba3ee1fa01cfe7
branch: master
repository: codeflow
topic: 'OpenCode Agent Invocation Errors and Registry Problems'
tags: [research, codebase, agent-types, registry, documentation, architecture, opencode-compliance]
status: complete
last_updated: 2025-09-07
last_updated_by: John Ferguson
last_updated_note: 'Added follow-up research for OpenCode agent naming and file conventions'
---

## Ticket Synopsis

The ticket describes recurring errors when invoking certain agents (e.g., `innovation-lab`, `automation-builder`, `ui-polisher`, `design-system-builder`). The error is:
`Error: Unknown agent type: <agent-name> is not a valid agent type`
Root causes include missing agent registration, naming inconsistencies, missing implementations, and platform drift. The ticket recommends auditing registered agents, cross-referencing documentation, fixing naming issues, updating documentation, and implementing/deploying critical agents. It provides an example error mapping and long-term recommendations for registry/documentation sync and error reporting.

## Summary

- Multiple agent invocation errors stem from missing implementations, naming inconsistencies, and registry drift.
- Several agent types are documented but not implemented in the codebase.
- Naming conventions for agent types are inconsistent across files, registry, and documentation.
- Recent architectural changes have unified agent format handling, permission templates, and registry logic to address these issues.
- Long-term recommendations focus on single-source agent architecture, role-based permissions, and automated validation.

## Detailed Findings

### Registered Agent Types and Locations

- Agent type definitions, registrations, and implementations are found in:
  - `src/conversion/agent-parser.ts`, `src/conversion/validator.ts`
  - `mcp/agent-registry.mjs`, `mcp/agent-spawner.mjs`, `mcp/codeflow-server.mjs`
  - `packages/agentic-mcp/src/agent-registry.ts`, `packages/agentic-mcp/src/agent-spawner.ts`
  - Agent markdown files in `codeflow-agents/`, `.claude/agents/`, `.opencode/agent/`, and backup/deprecated folders
  - Test files in `tests/`
- Sample agent names found:
  - agent-architect, smart-subagent-orchestrator, ai-integration-expert, api-builder, database-expert, full-stack-developer, growth-engineer, security-scanner, ux-optimizer, development_migrations_specialist, quality-testing_performance_tester, content_localization_coordinator

### Documentation vs. Implementation

- Agent types referenced in documentation (AGENTS.md, research/):
  - agent-architect, smart-subagent-orchestrator, ai-integration-expert, api-builder, database-expert, full-stack-developer, growth-engineer, security-scanner, ux-optimizer, quality-testing_performance_tester, content_localization_coordinator, operations_incident_commander, development_migrations_specialist, programmatic_seo_engineer, codebase-locator, codebase-analyzer, codebase-pattern-finder, research-locator, research-analyzer, web-search-researcher
- Agents documented but NOT implemented as `.md` files:
  - operations_incident_commander (missing in `codeflow-agents/operations/`)
  - development_migrations_specialist (missing in `codeflow-agents/development/`)
  - programmatic_seo_engineer (missing in `codeflow-agents/business-analytics/` or `codeflow-agents/product-strategy/`)
  - codebase-locator, codebase-analyzer, codebase-pattern-finder, web-search-researcher (missing in `codeflow-agents/generalist/`)

### Naming Inconsistencies

- Hyphen-separated (kebab-case) used for agent markdown file names and directories (e.g., `agent-architect.md`)
- Underscore-separated (snake_case) used for registry/config keys and some documentation (e.g., `ai_integration_expert`)
- PascalCase used for class/type names in TypeScript/JavaScript (e.g., `AgentArchitect`)
- Mixed patterns in documentation; both hyphen and underscore styles are used, sometimes in the same list
- Pluralization varies by context

### Platform Drift and Registry Changes

- Unified YAML processor and validation engine now handle all agent formats, eliminating format drift and sync failures
- Permission templates standardized by agent role, replacing legacy ad-hoc formats
- Modular, single-source agent setup in `codeflow-agents/` with on-demand conversion for each platform
- Centralized format registry governs specifications and conversion rules
- Directory creation and validation logic now automated

## Code References

- `src/conversion/agent-parser.ts` - Agent type definitions and parsing logic
- `src/conversion/validator.ts` - Agent validation logic
- `mcp/agent-registry.mjs` - Internal agent registry for MCP server
- `mcp/agent-spawner.mjs` - Agent spawning and execution infrastructure
- `packages/agentic-mcp/src/agent-registry.ts` - Agent registry logic (TypeScript)
- `codeflow-agents/generalist/agent-architect.md` - Example agent definition
- `docs/AGENT_REGISTRY.md` - Master list of agent types and naming conventions

## Architecture Insights

- Single source of truth for agent definitions in `codeflow-agents/`, converted as needed
- Unified YAML processor and validation engine for all agent formats
- Role-based permission templates for security and consistency
- Modular setup logic using strategy/configuration patterns for extensibility
- Centralized format registry for agent specifications and conversion rules
- Automated validation and testing for agent formats and permissions
- Batch processing and streaming for performance and scalability

## Historical Context (from research/)

- `research/plans/frontmatter-architecture-overhaul.md` - Decision to unify YAML processing and validation
- `research/plans/fix-opencode-agent-format-compliance.md` - Conversion to official OpenCode.ai YAML specification
- `research/plans/agent-permissions-audit-and-update.md` - Standardization of permission templates
- `research/plans/setup-agents-modular-implementation-plan.md` - Modular, single-source agent setup
- `research/research/2025-09-02_agent-permissions-gap-analysis.md` - Permission gap analysis and recommendations
- `research/research/2025-08-30_agent-format-validation.md` - Format validation and conversion logic

## Related Research

- `research/research/2025-08-26_automated-global-configs-mcp-integration.md` - MCP integration and agent type registration
- `research/research/2025-08-28_phase-7-completion-gaps-analysis.md` - Analysis of gaps in agent type coverage

## Open Questions

- How should legacy agents and corrupted/non-standard formats be handled during migration?
- What is the best strategy for future agent type versioning and deduplication?
- Where should format and validation specifications be centralized for contributors?
- Should the system converge on fewer agent formats or maintain multi-format flexibility?

## Follow-up Research 2025-09-07T20:00:00Z

### OpenCode Agent Naming & File Structure Conventions

**Agent File Location:**

- Per-project agents: `.opencode/agent/`
- Global agents: `~/.config/opencode/agent/`

**Agent File Naming:**

- The markdown file name (e.g., `review.md`) becomes the agent name (`review`).
- Use lowercase, hyphen-separated (kebab-case) for multi-word agent names (e.g., `security-auditor.md` → `security-auditor`).
- Avoid underscores, spaces, or uppercase in file names.

**Agent Definition Format:**

- YAML frontmatter at the top of the file.
- Required fields: `description`, `mode` (`primary` or `subagent`), `tools` (enabled/disabled), and optionally `model`, `temperature`, `permission`.
- Example:
  ```markdown
  ---
  description: Performs security audits and identifies vulnerabilities
  mode: subagent
  tools:
    write: false
    edit: false
  ---

  You are a security expert. Focus on identifying potential security issues.
  ```

**Agent Name Usage:**

- The agent name is always derived from the file name (e.g., `docs-writer.md` → `docs-writer`).
- All references to agents in configs and documentation should use the kebab-case name.

### Comparison to Current Codebase

**Current Issues:**

- Some agent files use underscores (e.g., `quality_testing_performance_tester.md`), which is not compliant.
- Some agent names in documentation and registry use snake_case or PascalCase.
- Some agent files are missing or not implemented in `.opencode/agent/`.
- Some agent files are duplicated across multiple directories.

**Recommendations:**

- Rename all agent files to kebab-case (e.g., `quality-testing-performance-tester.md`).
- Ensure all agent names in configs and documentation use kebab-case.
- Remove underscores and uppercase from agent file names and references.
- Place all project-specific agents in `.opencode/agent/`.
- Remove duplicate agent files from deprecated or backup directories.
- Update documentation to match file names exactly.

### Action Items for Codebase Alignment

1. Audit `.opencode/agent/` and global agent directories for non-compliant file names.
2. Rename files and update references to kebab-case.
3. Update documentation and registry to use kebab-case agent names.
4. Remove deprecated/duplicate agent files.
5. Ensure all required agents are implemented as markdown files in `.opencode/agent/`.
