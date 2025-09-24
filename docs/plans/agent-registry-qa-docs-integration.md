# Agent Registry QA + Docs Integration Plan

Last updated: 2025-09-07

Owner: Codeflow maintainers

Status: Draft for review

## Summary

Elevate the agent registry’s reliability, enforce a consistent schema and permissions model, surface QA results via MCP/CLI, and eliminate duplicate/legacy drift. This plan proceeds in phases so we can ship value quickly while keeping changes safe and reversible.

## Goals

- Single source of truth for agent definitions with deterministic scan order and duplicate handling.
- Strong schema/permissions validation at load-time and spawn-time with clear error reporting.
- Normalized agent shape across formats (Claude Code, OpenCode) for predictable execution.
- Visible QA surfaces in MCP and CLI to prevent regressions and ease troubleshooting.
- Documentation and tests aligned with behavior; CI fails on critical validation issues.

## Non-Goals

- Redesign of agent execution model or prompt composition.
- Changing agent content or capabilities beyond schema normalization.
- Breaking external projects that consume deprecated directories without a feature flag.

## Proposed Defaults (can be adjusted)

- Duplicate policy: Hybrid — prefer canonical paths, warn on legacy/duplicate; fail only when canonical duplicates conflict.
- Canonical scan set: Include `codeflow-agents/**` and `opencode-agents/**`; exclude `deprecated/**` by default; allow opt-in via env flag.
- Permissions model: `tools` is source of truth. Derive `permission` summary and enforce `allowed_directories` when FS tools are present.
- QA surfacing: Add structured MCP tool `codeflow.registry.qa` and include short summaries in `codeflow status` output.

---

## Phase 0 — Baseline + Decision Confirmation

Objectives

- Establish current ground truth and confirm defaults/flags.

Tasks

- Run baseline checks:
  - `node test-validation.mjs`
  - `node scripts/analyze-agent-duplicates.js`
  - `bun run typecheck`
- Capture outputs in `backup/` for comparison.
- Confirm decisions for: duplicate policy, canonical scan set, permissions derivation rules, QA surfacing scope.

Acceptance Criteria

- Baseline artifacts saved.
- Policy toggles documented (env vars) with default values decided.

- [x] Completed: Baseline checks run and outputs captured in backup/
- [x] Completed: Policy decisions confirmed (hybrid duplicate policy, canonical scan with legacy opt-in, tools-as-source permissions, MCP QA tool + CLI summaries)

---

## Phase 1 — Canonicalization & Precedence

Objectives

- Deterministic scan order, canonical-first precedence, legacy exclusion by default, and coherent duplicate handling.

Design

- Registry scan order: `codeflow-agents/**`, `opencode-agents/**`, then optionally `deprecated/**` when `CODEFLOW_INCLUDE_LEGACY=1`.
- Duplicate resolution:
  - If multiple agents share the same `id`/`name`, prefer first discovered in canonical paths.
  - Warn on legacy duplicates (collect into QA report).
  - Fail when conflicting canonical entries exist (same id/name but materially different definitions).
- Material difference: hash of normalized core fields (`model`, `tools`, `allowed_directories`, `inputs`, `outputs`).

Implementation Targets

- `mcp/agent-registry.mjs`
  - Implement ordered scanning with path allowlist and flag-gated legacy inclusion.
  - Add duplicate resolution and conflict detection with normalized hashing.
  - Produce a normalized in-memory index keyed by `agentId` and `name`.
- `src/cli/validate.ts`
  - Align output with new duplicate policy; exit non-zero on canonical conflicts.
- `scripts/analyze-agent-duplicates.js`
  - Use same normalization logic for consistency; emit warnings vs errors per policy.

Acceptance Criteria

- `node scripts/analyze-agent-duplicates.js` reports zero errors for canonical-only scan; warnings allowed for legacy when flag on.
- `codeflow status` reflects canonical precedence and warns about legacy duplicates only when flag on.

- [x] Completed: Updated mcp/agent-registry.mjs with ordered scanning, CODEFLOW_INCLUDE_LEGACY flag, duplicate resolution with hashing
- [x] Completed: Updated scripts/analyze-agent-duplicates.js with normalization logic and canonical-first policy
- [x] Completed: Updated src/cli/validate.ts to exit on canonical conflicts, warn on legacy duplicates

---

## Phase 2 — Validation & Normalization

Objectives

- Enforce consistent schema, validate permissions and inputs, and normalize agent definitions.

Schema Rules (Normalized Shape)

- Required fields: `id`, `name`, `description`, `model`, `tools` (object), `inputs` (schema or descriptor), `outputs` (schema/descriptor).
- `tools` is authoritative. Examples:
  - Filesystem tools: `{ filesystem: { read: true|false, write: true|false, allowed_directories: string[] } }`
  - Network/http tools: `{ http: { enabled: true|false, allowed_hosts?: string[] } }`
  - Custom tools: `{ <toolName>: { enabled: true, config?: object } }`
- Derived summary: `permission`: summarize enabled tool scopes (e.g., `"fs:read-only; http:off"`).
- Invariants:
  - If `filesystem.write === true`, `allowed_directories` must be non-empty; paths must be project-relative or absolute within repo root.
  - If `filesystem.read === true`, recommend `allowed_directories`; default to repo root only when explicitly allowed by policy flag.
  - No tool should be enabled without minimal configuration.
  - `model` must be present and valid per supported list.

Validation Layers

- Load-time (registry): schema presence, types, tool config integrity, directory path safety, normalization to canonical shape.
- Spawn-time (spawner): runtime inputs validation, permission checks (including re-check of allowed directories), guardrails for command execution.

Implementation Targets

- `mcp/agent-registry.mjs`
  - Add schema validation with clear error messages and remediation hints.
  - Normalize all agents to canonical shape stored in registry.
- `mcp/agent-spawner.mjs`
  - Expand `validateAgentExecution` to:
    - Validate inputs against declared schemas.
    - Enforce `allowed_directories` at execution time.
    - Disallow write operations when `filesystem.write` is false.
    - Provide structured error objects with severity and remediation.

Acceptance Criteria

- Invalid agents fail at load with actionable messages and file path references.
- Spawn-time guardrails block unsafe operations with clear errors.
- Typecheck passes; unit/integration tests cover happy/error paths.

- [x] Completed: Enhanced schema validation in mcp/agent-registry.mjs with tools-as-authoritative, filesystem invariants, permission derivation
- [x] Completed: Expanded validateAgentExecution in mcp/agent-spawner.mjs with structured errors, permission checks, path validation

---

## Phase 3 — QA Surfaces in MCP & CLI

Objectives

- Make QA status visible in developer workflows with both structured and human-readable outputs.

Design

- MCP Tool: `codeflow.registry.qa`
  - Returns JSON `{ summary, counts, issues: [ { severity, type, agentId, file, message, remediation } ] }` and a short text summary.
  - Issue types: `duplicate_legacy`, `duplicate_conflict`, `schema_missing`, `permission_violation`, `path_out_of_scope`, `deprecated_format`, etc.
- CLI:
  - `codeflow status`: append a concise QA summary (counts + top issues) with pointer to MCP tool for details.
  - `codeflow validate`: fail on `duplicate_conflict`, `schema_missing`, `permission_violation`; warn on `duplicate_legacy`.

Implementation Targets

- `mcp/codeflow-server.mjs`
  - Register `codeflow.registry.qa` tool with access to registry QA data.
  - Inject short QA snippet into `status` handler output.
- `src/cli/index.ts` (or related status/validate handlers)
  - Display short QA summary with guidance to fetch full report.

Acceptance Criteria

- MCP tool returns structured issues and human summary.
- CLI status shows counts; validate exits non-zero on critical issues.

- [x] Completed: Added codeflow.registry.qa MCP tool with structured JSON output and human summary
- [x] Completed: Updated buildAgentRegistry to collect QA issues during loading
- [x] Completed: Updated CLI validate to fail on critical issues, warn on legacy duplicates
- [x] Completed: Added QA guidance to CLI status output

---

## Phase 4 — Tests & Documentation

Objectives

- Ensure behavior is locked in with tests and reflected in docs.

Tests

- Unit: normalization/hashing, duplicate resolution, schema validation helpers.
- Integration: registry build with mixed canonical/legacy inputs, CLI validate behavior.
- E2E: MCP server exposes `codeflow.registry.qa`, and spawner enforces permissions at runtime.
- Regression: backfill tests for previously observed drift conditions.

Docs

- Update `docs/AGENT_REGISTRY.md` with:
  - Canonical scan order and duplicate policy.
  - Normalized schema and examples.
  - Validation rules and error reference.
  - Env flags and legacy behavior.
- Update `docs/MCP_INTEGRATION.md` with the new QA tool and usage.
- Add a short section to `README.md` linking to QA capabilities.

Acceptance Criteria

- All tests pass locally and in CI.
- Docs accurately match implementation and include copy-paste examples.

- [x] Completed: Updated docs/AGENT_REGISTRY.md with canonical scan order, duplicate policy, QA tools
- [x] Completed: Updated docs/MCP_INTEGRATION.md with codeflow.registry.qa tool documentation
- [x] Completed: Added QA capabilities section to README.md
- [ ] Pending: Unit/integration tests (can be added in future iteration)

---

## Phase 5 — Rollout & Safety

Objectives

- Ship changes safely, with feature flags, rollback, and telemetry.

Feature Flags / Env Vars

- `CODEFLOW_INCLUDE_LEGACY` (default `0`): Include deprecated directories in scan.
- `CODEFLOW_FS_READ_DEFAULT_ALLOW_REPO_ROOT` (default `0`): Permit default read scope when not specified.
- `CODEFLOW_VALIDATE_STRICT` (default `1`): Treat select warnings as errors.

Migration Steps

- Convert or remove agents in `deprecated/**` over time; track with QA issues.
- Update any external automation relying on legacy paths to set `CODEFLOW_INCLUDE_LEGACY=1` temporarily.

Rollback Plan

- Flags allow restoring prior behavior quickly.
- Keep normalization/validation behind minor version bump; document changes and how to disable strict mode.

Telemetry / Metrics

- QA issue counts by type over time.
- Duplicate/conflict counts trend to zero.
- CI failure rate attributable to registry validation.

---

## Work Items by File (Initial Pass)

- mcp/agent-registry.mjs
  - Add ordered scanning and legacy flag.
  - Implement normalization, hashing, duplicate resolution.
  - Collect QA issues during load.
- mcp/agent-spawner.mjs
  - Strengthen `validateAgentExecution` with schema/permissions checks.
  - Structured error objects with remediation.
- mcp/codeflow-server.mjs
  - Register `codeflow.registry.qa` MCP tool.
  - Inject QA snippet into status output.
- src/cli/validate.ts
  - Align severity mapping; fail/warn per policy.
- scripts/analyze-agent-duplicates.js
  - Reuse normalization/hashing for consistent results.
- docs/\*
  - Update AGENT_REGISTRY.md, MCP_INTEGRATION.md, README.md.

---

## Acceptance Gate (Phase-by-Phase)

- Phase 1: No canonical conflicts; `validate` passes; legacy warnings only under flag.
- Phase 2: Invalid agents blocked with clear messages; spawner guardrails verified by tests.
- Phase 3: MCP QA tool available; CLI shows summary; CI fails correctly on critical.
- Phase 4: Tests green; docs updated.
- Phase 5: Flags documented; rollout checklist completed.

---

## Risks & Mitigations

- False positives breaking CI: Start with hybrid policy; allow downgrade via env flags.
- Performance on large registries: Cache normalized hashes; lazy-load legacy when flag on.
- Inconsistent schemas across formats: Normalize at load and report discrepancies rather than silently coercing when risky.
- Developer confusion about flags: Centralize env var docs and surface current flag states in QA summary.

---

## Open Questions

- Should we auto-fix minor schema drift (e.g., coerce string → array for `allowed_directories`) with warnings, or fail?
- Exact supported model list enforcement vs warn-only?
- Do we need a migration script to rewrite legacy frontmatter to canonical format?

---

## Timeline (Indicative)

- Week 1: Phase 0–1 (baseline + canonicalization) complete.
- Week 2: Phase 2 (validation/normalization) complete.
- Week 3: Phase 3 (MCP/CLI QA surfaces) complete.
- Week 4: Phase 4–5 (tests/docs/rollout) complete.

---

## Next Steps

- Approve default policies and flags in this plan.
- Implement Phase 1 and re-run duplicate analysis; iterate on edge cases.
- Move to Phase 2 with strict but actionable validation messages.
