---
date: 2025-09-02T23:26:15Z
researcher: John Ferguson
git_commit: 6b9e1a2b6adac219e9e32aeae08f3cc5fb61550f
branch: master
repository: codeflow
topic: 'How allowed directories are set for OpenCode agents during global sync, and how project-specific overrides work'
tags: [research, codebase, opencode, agent-permissions, sync, allowed-directories]
status: complete
last_updated: 2025-09-02
last_updated_by: John Ferguson
---

## Ticket Synopsis

During global sync you should be able to add a folder that will be set on the global agents; this will be overridden by project-specific agents and their allowed directories.

## Summary

The Codeflow system supports a hierarchical configuration for allowed directories on OpenCode agents. During global sync, allowed directories can be set for global agents, but these are always overridden by project-specific agent definitions if present. The system ensures that the most specific (project-level) configuration takes precedence, with global and built-in defaults as fallbacks. This is enforced both in the sync logic and in agent registry/discovery mechanisms.

## Detailed Findings

### 1. Where allowed directories are set and managed

- The `allowed_directories` field is present in the frontmatter of all OpenCode agent definitions (see `codeflow-agents/`, `deprecated/opencode-agents/`).
- The file `src/security/opencode-permissions.ts` contains logic to add or update `allowed_directories` in agent frontmatter during sync/setup.
- The file `docs/opencode-permissions-setup.md` documents the process for updating and validating allowed directories.

### 2. Global sync logic for OpenCode agents

- The main sync logic is in `src/cli/sync.ts` (function `syncGlobalAgents`). This function ensures global agent directories exist, copies agents, and applies permissions.
- `src/cli/global.ts` manages global agent directory setup and documents the priority order: project-specific → global → built-in.
- The sync process updates agent frontmatter with `allowed_directories` if not present, using logic in `src/security/opencode-permissions.ts`.

### 3. Project-specific overrides

- The system always prefers project-specific agent definitions over global ones. This is enforced in:
  - `src/cli/global.ts` (priority order comment and logic)
  - `codeflow-agents/README.md` (priority: project > global > built-in)
  - `packages/agentic-mcp/src/agent-registry.ts` (explicit override logic)
  - `src/sync/conflict-resolver.ts` (conflict detection and explanation)
- Documentation in `docs/CROSS_REPO_SETUP.md`, `docs/MCP_INTEGRATION.md`, and several thoughts/plans files confirms this hierarchy and fallback mechanism.

### 4. Code and config files related to allowed directories

- `src/security/opencode-permissions.ts`, `src/security/agent-permission-templates.ts`, `src/conversion/agent-parser.ts` (parsing and updating agent files)
- `docs/opencode-permissions-setup.md`, `codeflow-agents/README.md`, `config.json`, `.claude/claude_config.json` (configuration and documentation)
- `tests/integration/agent-permissions.test.ts` (tests for allowed directories and permissions)

### 5. Documentation and historical context

- `docs/opencode-permissions-setup.md` and `thoughts/plans/agent-permissions-audit-and-update.md` detail the setup, audit, and update process for allowed directories.
- `thoughts/plans/fix-sync-global-opencode-issues.md`, `thoughts/research/2025-08-31_sync-global-opencode-agent-errors.md`, and related research documents provide deep dives into sync-global implementation, validation, and error handling.
- `thoughts/research/2025-09-02_agent-permissions-gap-analysis.md` confirms all agents have `allowed_directories` blocks configured.

## Code References

- `src/security/opencode-permissions.ts:123-125` – Adds `allowed_directories` to agent frontmatter if missing
- `src/cli/sync.ts:151-371` – Main sync logic, including global sync and agent copying
- `src/cli/global.ts:50-160` – Global agent directory setup and priority order
- `packages/agentic-mcp/src/agent-registry.ts:11-301` – Agent registry, project-specific overrides
- `src/sync/conflict-resolver.ts:104-182` – Conflict detection and override explanation
- `docs/opencode-permissions-setup.md:3-136` – Documentation of allowed directories and sync-global

## Architecture Insights

- The system uses a clear priority order for agent discovery: project-specific > global > built-in.
- Allowed directories are always set in agent frontmatter and validated during sync/setup.
- Sync logic is robust, with fallback and override mechanisms to ensure correct agent loading.
- Project-specific customizations are respected and never overwritten by global sync.

## Historical Context (from thoughts/)

- `thoughts/plans/agent-permissions-audit-and-update.md` – Permission inheritance and override audit
- `thoughts/research/2025-09-02_agent-permissions-gap-analysis.md` – All agents have allowed directories configured
- `thoughts/plans/fix-sync-global-opencode-issues.md` – Implementation plan for sync-global fixes
- `thoughts/research/2025-08-31_sync-global-opencode-agent-errors.md` – Analysis of validation and sync-global errors
- `thoughts/plans/fix-opencode-agent-format-compliance.md` – Format compliance and sync-global validation
- `thoughts/research/2025-09-01_opencode-v070-folder-changes-issue.md` – Directory structure and sync-global workflow

## Related Research

- `thoughts/research/2025-08-31_sync-global-opencode-agent-errors.md`
- `thoughts/research/2025-09-01_opencode-v070-folder-changes-issue.md`
- `thoughts/research/2025-09-02_agent-permissions-gap-analysis.md`

## Open Questions

- Are there any edge cases where global allowed directories are not properly overridden by project-specific agents?
- How are allowed directories validated for custom agent formats or non-standard directory structures?
