---
summary: Resolve CLI test failures via TDD, align flags and messages
status: proposed
owners: ["maintainers"]
---

# CLI Flags & UX Alignment — TDD Plan

## Overview
Several CLI end-to-end and unit tests are failing due to mismatches between test expectations and current CLI behavior. This plan uses TDD to align the CLI with the intended UX while preserving backward compatibility where practical.

## Current Failures (observed)
- Unknown option errors:
  - `convert --source base --target opencode --project <path>` → Unknown option `--source` and `--project`
  - `sync --project <path>` → Unknown option `--project`
- Setup flow:
  - Tests expect `.codeflow` directory scaffolding after `setup`, but it’s not created in some flows (new user journey, error handling scenario).
- Messaging mismatch:
  - `codeflow mcp configure` without client
    - Tests expect: `Available clients: claude-desktop`
    - Actual: `Available MCP clients: claude-desktop, warp, cursor`
- Status/legacy migration expectations:
  - `status` output asserts presence of term(s) that differ from current formatting (e.g., looking for "agents").

## Goals
1) Define and support consistent flags across commands:
   - `convert`: support `--source`, `--target`, `--project` (and shorthand `-s`, `-t`, `-p` if desired)
   - `sync`: support `--project`
   - Maintain positional arguments for backward compatibility; emit deprecation notes if needed
2) Standardize CLI messages and help output
   - Use a single authoritative label for listings: e.g., `Available clients:`
   - Update tests accordingly (or adjust CLI to new canonical phrasing)
3) Ensure `setup` scaffolds expected directories consistently
   - Create `.codeflow/agent` (and any required structure) so tests that write files there pass
4) Keep behavior documented in `README.md` and `docs/`

## TDD Approach
- Stage 1: Adjust tests to represent desired UX (red)
  - Update unit/e2e tests to assert flags and standardized messages
  - Confirm failures are due to implementation gaps
- Stage 2: Implement minimal CLI changes (green)
  - Extend argument parsing to accept the new flags
  - Normalize error/help text
  - Ensure setup creates `.codeflow` skeleton
- Stage 3: Refactor (blue)
  - Consolidate parsing helpers
  - Keep help text DRY across subcommands

## Test Changes (to write/update first)
- Unit tests (`tests/unit/cli.test.ts`)
  - Add expectations for `mcp configure` error wording (canonical: `Available clients:`)
  - Verify `convert --source/--target/--project` parses correctly and passes values
  - Verify `sync --project` parses correctly
- E2E tests (`tests/e2e/*.test.ts`)
  - New user journey: confirm `.codeflow` directory exists after `setup`
  - Complete workflow: conversion with flags succeeds
  - Experienced user: `sync --project` works
  - Performance under load: `convert` with flags works
  - Adjust status/migration tests to match updated output format or update status output accordingly

## Implementation Outline
- src/cli/index.ts
  - Centralize flag definitions and alias mapping; ensure subcommands receive parsed options
- src/cli/convert.ts
  - Accept `--source`, `--target`, `--project` (positional still supported)
  - Update help text with examples
- src/cli/sync.ts
  - Accept `--project`; update help text
- src/cli/setup.ts
  - Ensure `.codeflow/agent` (and any required subdirs) created for fresh projects
- src/cli/mcp.ts
  - Standardize message to `Available clients: claude-desktop, warp, cursor`
- README/docs
  - Document the new flags and show Bun-first examples

## Acceptance Criteria
- All unit and integration tests pass
- E2E tests pass:
  - New user journey
  - Complete workflow
  - Experienced user (multi-project)
  - Developer workflow (watch mode) able to write into `.codeflow/agent`
  - Migration scenario reflects updated status output rules
  - Performance under load with convert flags
- Help output shows canonical messaging and examples with flags

## Risks & Mitigation
- Backwards compatibility: users relying on positional args
  - Mitigation: continue supporting positional args; prefer flags in docs
- Messaging changes could invalidate third-party automation that parses stderr/stdout
  - Mitigation: add a minor version bump and changelog entry documenting wording alignment

## Next Steps
1) Update failing tests for desired UX (flags/messages/scaffold)
2) Implement CLI changes incrementally until tests pass
3) Update README and docs; add CHANGELOG entry

