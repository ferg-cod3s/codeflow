# Contributing to Codeflow



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


Thank you for contributing! This project favors Bun, TDD, and clear documentation.

## Prerequisites
- Bun (https://bun.sh)

## Setup
```
bun install && bun run install
```

## Scripts
- Typecheck: `bun run typecheck`
- Tests (all): `bun test`
- Tests (watch): `bun test --watch`
- Coverage: `bun test --coverage`
- MCP server: `bun run mcp:server`
- Lint: `bun run lint`
- Lint (fix): `bun run lint:fix`
- Format: `bun run format`

## Test-Driven Development (TDD)
- Write or update tests before implementing a fix or feature.
- Keep tests focused and atomic; include happy and error paths.
- Maintain coverage for critical paths.

## Pull Request Checklist
- [ ] Tests added/updated first (TDD)
- [ ] `bun run typecheck` passes
- [ ] `bun test` passes (and `bun test --coverage` generates a report)
- [ ] `bun run lint` passes; `bun run format` applied where needed
- [ ] Documentation updated (README, docs/, CHANGELOG)
- [ ] No secrets/credentials in changes

## Commit Messages
- Use clear, descriptive messages.
- Reference tickets when applicable.

## Development Tools
Install (optional; required to run lint/format locally):
```
bun add -d eslint @eslint/js @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-config-prettier eslint-plugin-jsx-a11y prettier
```

## Contribution Flow
1. Create a feature/bugfix branch.
2. Write/update tests and docs.
3. Implement the change.
4. Run typecheck, tests, lint.
5. Update CHANGELOG.md.
6. Open a PR and complete the checklist above.

