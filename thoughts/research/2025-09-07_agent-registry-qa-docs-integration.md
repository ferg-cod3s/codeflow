---
date: 2025-09-07T19:41:56-0600
researcher: John Ferguson
git_commit: 9019bee
branch: master
repository: codeflow
topic: 'Agent registry, QA, and docs/reporting integration (this fix we just planned)'
tags: [research, codebase, mcp, agent-registry, qa, validation, documentation]
status: complete
last_updated: 2025-09-07
last_updated_by: John Ferguson
---

## Ticket Synopsis

Address registry gaps, harden agent QA, and integrate documentation/reporting so that agents are consistently registered, validated, and discoverable. Ensure canonical agent definitions are the single source of truth, enforce format compliance, and surface live registry/QA state in command outputs.

## Summary

- Agent registry is built by scanning prioritized directories, parsing agent files with YAML frontmatter validation, and logging results.
- Agent QA is enforced via centralized validation routines, batch validation scripts, and round-trip conversion checks.
- Documentation/reporting integrates agent context into command outputs and logs registry/validation state.
- Architectural decisions in thoughts/ confirm a single source of truth, unified validation/conversion, strict naming/location conventions, and automated QA/testing.

## Detailed Findings

### Agent Registry Implementation

- Build and update logic (priority directories, parse + register):
  - mcp/agent-registry.mjs:216-261 — `buildAgentRegistry()` constructs the registry Map, logs totals/failures.
  - mcp/agent-registry.mjs:76-174 — `parseAgentFile()` parses YAML frontmatter, validates required fields, normalizes permissions, logs warnings.
- MCP-specific registry variant:
  - mcp/mcp-agent-registry.mjs:193-233 — Similar registry for MCP-specific tools with custom parsing and recursive directory loading.

### Agent QA

- Validation routine:
  - mcp/agent-spawner.mjs:307-354 — `validateAgentExecution()` checks required fields, model/temperature bounds, and context presence; returns structured errors/warnings.
- Batch validation scripts:
  - test-validation.mjs:13-19 — Comprehensive validation: all formats, duplicates, canonical checks.
  - test-batch-validation.mjs, test-opencode-validation.mjs — Batch and format-specific validation entry points.
- Conversion QA:
  - setup-canonical-agents.mjs:31 — Conversion to canonical formats runs with validation enabled.

### Documentation/Reporting Integration

- Agent context injection into command content:
  - mcp/codeflow-server.mjs:172-191 — `addAgentContext()` appends agent categories, execution helpers, and workflow orchestration references to command markdown.
- Registry status/logging:
  - mcp/codeflow-server.mjs:194-202 — Logs registry initialization and agent count.
  - mcp/agent-registry.mjs:161-167 — Logs agent permissions/allowed directories during parse.
- Command registration with live agent context:
  - mcp/codeflow-server.mjs:248-288 — Registers core workflow commands (research/plan/execute/test/document/commit/review) with live agent context and orchestrators.

## Code References

- `mcp/agent-registry.mjs:76-174` — Frontmatter parsing/validation and permissions normalization
- `mcp/agent-registry.mjs:216-261` — Registry build across prioritized directories
- `mcp/agent-spawner.mjs:307-354` — Agent execution validation routine
- `test-validation.mjs:13-19` — Batch validation entrypoint and options
- `mcp/codeflow-server.mjs:172-191, 248-288` — Documentation context injection and command registration

## Architecture Insights

- Single source of truth: Canonical agent definitions in `codeflow-agents/` (BaseAgent format), converted for platforms.
- Unified validation/conversion: One engine validates and converts Base, Claude Code, and OpenCode agents to prevent drift.
- Strict naming/location: Kebab-case names; project agents live in `.opencode/agent/` (flat), global in `~/.config/opencode/agent/`.
- Automated QA/testing: Round-trip conversion, cross-format validation, and integration tests for reliability.
- Docs/reporting hooks: Agent context injected into command outputs; registry status and permission logging for transparency.

## Historical Context (from thoughts/)

- `thoughts/architecture/overview.md` — Overall system architecture and MCP integration.
- `thoughts/plans/frontmatter-architecture-overhaul.md` — Unified frontmatter, validation-first design.
- `thoughts/plans/opencode-agent-compliance-checklist.md` — Naming/location compliance and drift mitigation.
- `thoughts/research/2025-09-07_opencode-agents-problems.md` — Registry invocation errors and architectural changes.
- `thoughts/research/2025-09-05_opencode-agent-permission-format-mismatch.md` — Permission format mismatches and registry/QA impact.

## Related Research

- `thoughts/research/2025-09-04_subagent-permission-issues.md` — Subagent permission denials and validation.
- `thoughts/research/2025-08-30_agent-format-validation.md` — Cross-format validation for Claude Code, OpenCode, Base.

## Open Questions

- Legacy agents: Migrate/remove corrupted or non-standard files?
- Versioning/deduplication: Best practices for evolving agent types.
- Where to centralize format specs for contributors.
- Whether to converge on fewer formats or maintain broad compatibility.
