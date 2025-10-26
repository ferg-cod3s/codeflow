# Agent Upgrade Guidelines in CodeFlow

## 1. Executive Summary

Agent upgrades in CodeFlow are central to maintaining a robust, extensible, and high-performing automation ecosystem. The upgrade philosophy is built on a single source of truth for agent definitions, modular architecture, and seamless integration with orchestrator logic. Upgrades ensure agents remain compatible across platforms (Claude Code, OpenCode, MCP), support evolving workflows, and uphold security, reliability, and context management standards. The goal is to enable technical leads to confidently evolve agent capabilities while minimizing risk, maximizing maintainability, and supporting advanced orchestration.

## 2. Architectural Principles

- **Single Source of Truth:** All agents are defined in `codeflow-agents/` using the unified `BaseAgent` format. This eliminates duplication and sync issues.
- **Modularity:** Agents are designed for composability, allowing orchestrators to combine, extend, or specialize capabilities as needed.
- **Context Compression:** Agents and orchestrators use hierarchical context structures, selective filtering, and progressive loading to minimize context bloat and maximize relevance.
- **Orchestrator Compatibility:** Agents expose standardized interfaces, support version negotiation, and advertise capabilities for dynamic discovery and integration.
- **Unified Validation:** A single schema validates all agent formats, ensuring consistency and simplifying migration.

## 3. Agent Orchestration and Integration

- **Orchestrator-Agent Handoff:** Orchestrators (e.g., smart-subagent-orchestrator) decompose complex goals into actionable tasks, select optimal subagents, and provide detailed briefs with context and success criteria.
- **Validation and Monitoring:** Orchestrators monitor agent health, validate outputs, and ensure quality gates are met (e.g., code-reviewer, quality-testing-performance-tester).
- **Multi-Domain Coordination:** Orchestrators manage parallel workstreams, resolve cross-domain conflicts, and synthesize outputs into unified solutions.
- **Lessons Learned:**
  - _Agent-Architect_: Designs new agents by analyzing requirements, combining base capabilities, and ensuring ecosystem fit.
  - _Smart-Subagent-Orchestrator_: Excels at task decomposition, optimal specialist selection, and real-time coordination across domains.
- **Best Practices:**
  - Always start with context-gathering agents (codebase-locator, research-locator).
  - Use parallel agents for comprehensive analysis.
  - Coordinate complementary specialists and leverage meta-agents for gaps.

## 4. Agent Format Migration

- **Migration Steps:**
  1. **Backup Existing Agents:** Safeguard all agent files before migration.
  2. **Consolidate to Single Format:** Move agents to `codeflow-agents/` and ensure compliance with `BaseAgent` schema.
  3. **Update Agent Files:** Add required fields (name, description, mode, tools, etc.) and convert tool formats as needed.
  4. **Regenerate Output Formats:** Use `codeflow convert-all` to generate Claude Code and OpenCode formats.
  5. **Validate Agents:** Run `codeflow validate` and test round-trip conversion for data integrity.
  6. **Update Workflow:** Switch to automatic conversion and validation; eliminate manual sync.
- **Validation Schemas:**
  - Required fields: `name`, `description`, valid `mode`, tool object format.
  - Name format: lowercase, hyphens, numbers only.
  - Temperature: 0-2.
- **Compatibility Checks:**
  - Round-trip conversion testing.
  - Cross-format validation.
  - Performance benchmarks.

## 5. Context Management Strategies

- **Hierarchical Context:** Organize context with summary levels for different detail requirements.
- **Selective Filtering:** Include only relevant context for each agent/task.
- **Progressive Loading:** Load high-level summaries first, drill down as needed.
- **Context Validation:** Ensure context is fresh and relevant before use.
- **Context Boundaries:** Define clear boundaries to prevent information leakage.
- **Metadata Enrichment:** Add source, timestamp, confidence, and expiration to context.
- **Context Pruning:** Remove outdated or irrelevant context automatically.
- **Parallel Processing:** Gather context from multiple sources concurrently.

## 6. Security and Reliability

- **Security Boundaries:**
  - Validate all inputs to prevent injection and malicious payloads.
  - Implement role-based access control and principle of least privilege.
  - Use encrypted channels for agent communication.
  - Maintain audit logs for all agent actions and file operations.
  - Validate file paths and sanitize content for file operations.
- **Reliability Standards:**
  - Robust error recovery, automatic retries, and fallback options.
  - Health monitoring and structured logging.
  - Proactive alerting for critical errors.
  - Comprehensive test suites (unit, integration, performance).
- **MCP Integration Requirements:**
  - All tool inputs validated via Zod schemas.
  - No write access from MCP server; agents are orchestrated internally.
  - Sandboxed execution and markdown-only output.

## 7. Upgrade Workflow

**Recommended Step-by-Step Workflow:**

1. **Review AGENT_UPGRADE_GUIDELINES.md** for integration, context, security, and orchestration best practices.
2. **Consult MIGRATION.md** for step-by-step migration instructions and troubleshooting.
3. **Check CHANGELOG.md** for recent architecture changes, breaking changes, and new features.
4. **Reference ARCHITECTURE_OVERVIEW.md** for system design, validation, and conversion rules.
5. **Update agent files in `codeflow-agents/`** using the BaseAgent format.
6. **Run validation and conversion:**
   - `codeflow validate`
   - `codeflow convert-all --format claude-code`
   - `codeflow convert-all --format opencode`
7. **Test across platforms and run full test suite.**
8. **Document changes in DOCUMENTATION_UPDATE_SUMMARY.md.**
9. **Monitor for issues and rollback if needed.**

## 8. MCP Compatibility

- **Stable Naming:** Agents and commands registered with semantic names (e.g., `codeflow.command.research`).
- **Tool Discovery:** MCP server auto-registers workflow commands as tools; agents are orchestrated internally.
- **Dynamic Registration:** Changes to agent files are reflected automatically on next tool call.
- **Cross-Platform Support:** MCP works with Claude Desktop, Warp, Cursor, and other clients.
- **Validation:** All tool inputs and outputs are schema-validated for safety and reliability.
- **Backward Compatibility:** Existing agent and command files work with MCP without modification.

## 9. Actionable Recommendations

### Agent Upgrade Checklist

- [ ] Backup all agent files before upgrade.
- [ ] Consolidate agents to `codeflow-agents/` in BaseAgent format.
- [ ] Ensure all required fields and valid tool configurations.
- [ ] Run `codeflow validate` and address all warnings/errors.
- [ ] Use `codeflow convert-all` to regenerate output formats.
- [ ] Test round-trip conversion and cross-format validation.
- [ ] Update documentation and commit changes.
- [ ] Run full test suite (unit, integration, performance).
- [ ] Monitor MCP server for tool registration and compatibility.
- [ ] Document upgrade process and lessons learned.

### Best Practices

- Always edit agents in the single source of truth directory.
- Use descriptive names and comprehensive descriptions.
- Set precise tool permissions and minimize context bloat.
- Regularly validate and test agents after upgrades.
- Document all changes and update architectural diagrams.
- Collaborate with orchestrator and meta-agents for complex upgrades.
- Monitor for security, reliability, and performance issues post-upgrade.

---

**References:**

- AGENT_UPGRADE_GUIDELINES.md
- docs/ARCHITECTURE_OVERVIEW.md
- docs/AGENT_REGISTRY.md
- codeflow-agents/agent-architect.md
- codeflow-agents/smart-subagent-orchestrator.md
- docs/CHANGELOG.md
- docs/MIGRATION.md
- docs/DOCUMENTATION_UPDATE_SUMMARY.md
- docs/MCP_INTEGRATION.md

This document provides a comprehensive, actionable framework for technical leads to plan and execute agent upgrades in CodeFlow, ensuring maintainability, security, and seamless integration across platforms and workflows.
