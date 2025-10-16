# Test Optimization TODO

## Integration Test Setup Optimization

**Created**: 2025-10-16  
**Priority**: Technical Debt  
**Status**: Backlog

### Problem

The integration test suite (`tests/integration/sync.test.ts`) causes pre-commit hook timeouts because it converts all 118 agents during test setup. This prevents commits from succeeding without using `--no-verify`.

**Current Behavior:**
- `bun test tests/integration/sync.test.ts` triggers full agent conversion
- Converting 118 agents during setup takes excessive time
- Pre-commit hook times out, requiring `--no-verify` flag

### Impact

- **Developer Experience**: Forces use of `--no-verify`, bypassing commit validation
- **CI/CD**: May cause timeout issues in automated pipelines
- **Test Reliability**: Slow test execution reduces feedback speed

### Suggested Solution

Use `test-automator` agent to restructure the test suite with these approaches:

1. **Test Fixtures**: Pre-convert a minimal subset of agents (5-10 representative samples)
2. **Lazy Loading**: Only convert agents when specifically tested
3. **Test Splitting**: Separate conversion tests from sync logic tests
4. **Mocking**: Mock conversion layer for sync-only tests

### Acceptance Criteria

- [ ] Integration tests complete within pre-commit hook timeout
- [ ] Full test coverage maintained (269 passing tests)
- [ ] Conversion testing still validates all 118 agents
- [ ] Test execution time reduced by >50%

### Related Files

- Test file: `tests/integration/sync.test.ts`
- Affected workflow: Pre-commit hooks (`.husky/pre-commit`)
- Version: v0.13.0

### Next Steps

1. Profile test execution to identify bottlenecks
2. Invoke `test-automator` agent to analyze and restructure tests
3. Implement fixtures for common test scenarios
4. Validate all tests still pass with optimizations
