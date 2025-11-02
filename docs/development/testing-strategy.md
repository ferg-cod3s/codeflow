# Testing Strategy



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


This project uses Bun and TypeScript. Tests are organized by purpose:

- Unit: `tests/unit/`
- Integration: `tests/integration/`
- End-to-End: `tests/e2e/`
- Platform: `tests/platform/`
- Conversion: `tests/conversion/`

## Principles
- TDD where practical: write/update tests before code
- Cover both happy and error paths
- Target strong coverage on critical paths
- Fast, reliable tests with clear Arrange-Act-Assert structure

## Commands
- Run all tests: `bun test`
- Watch mode: `bun test --watch`
- Coverage: `bun test --coverage`
- Typecheck: `bun run typecheck`

## What to Test
- Unit: CLI parsing/flags, utilities, small modules
- Integration: MCP server behaviors, command orchestration
- E2E: research → plan → execute → test → document → commit → review
- Platform: cross-OS differences if applicable
- Conversion: agent/command format conversions

## Pull Requests
- Include/update tests with your changes
- Ensure `bun run typecheck` and `bun test` pass locally
- Document notable testing decisions in PR description

