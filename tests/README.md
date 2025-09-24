# Codeflow Test Suite

Comprehensive test coverage for all Codeflow components including CLI commands, agents, commands, format conversions, and MCP servers.

## Test Structure

```
tests/
├── unit/                    # Unit tests
│   ├── cli/                # CLI command tests
│   ├── agents/             # Agent validation tests
│   ├── commands/           # Command validation tests
│   └── catalog/            # Catalog and conversion tests
├── integration/            # Integration tests
├── e2e/                    # End-to-end tests
└── setup.ts               # Test utilities and helpers
```

## Running Tests

### Run all tests
```bash
bun test
# or
bun run test
```

### Run specific test suites
```bash
# Unit tests only
bun run test:unit

# Integration tests only
bun run test:integration

# E2E tests only
bun run test:e2e

# Specific component tests
bun run test:agents       # Agent tests
bun run test:commands     # Command tests
bun run test:cli         # CLI tests
bun run test:conversion  # Format conversion tests
```

### Run with coverage
```bash
bun run test:coverage
```

### Watch mode
```bash
bun run test:watch
```

## Test Coverage Areas

### 1. CLI Commands (`tests/unit/cli/`)
- ✅ Catalog commands (list, search, info, build, import, etc.)
- ✅ Sync commands (local and global)
- ✅ Convert commands
- ✅ Validate commands
- ✅ Build manifest
- ✅ Help and version
- ✅ Error handling

### 2. Agent Validation (`tests/unit/agents/`)
- ✅ Claude format validation
- ✅ OpenCode format validation
- ✅ Frontmatter structure
- ✅ Required fields
- ✅ Security settings (OpenCode)
- ✅ Cross-format consistency
- ✅ Category validation

### 3. Command Validation (`tests/unit/commands/`)
- ✅ Claude command format
- ✅ OpenCode command format
- ✅ Parameter validation
- ✅ Temperature settings
- ✅ Usage documentation
- ✅ Permission restrictions
- ✅ Cross-format consistency

### 4. Format Conversion (`tests/unit/catalog/`)
- ✅ Claude to OpenCode conversion
- ✅ OpenCode to Claude conversion
- ✅ Metadata preservation
- ✅ Content preservation
- ✅ Round-trip conversion
- ✅ Batch conversion
- ✅ Error handling

### 5. Integration Tests (`tests/e2e/`)
- ✅ Complete workflow (create → convert → sync → deploy)
- ✅ External template import
- ✅ Catalog building from multiple sources
- ✅ MCP server configuration
- ✅ Error handling and recovery
- ✅ Performance and scalability

## Test Requirements

All tests validate:
- **Correctness**: Components work as expected
- **Format Compliance**: Both Claude and OpenCode formats
- **Error Handling**: Graceful failure with meaningful messages
- **Performance**: Operations complete in reasonable time
- **Consistency**: Same content works in both formats

## Writing New Tests

Use the provided test helpers in `tests/setup.ts`:

```typescript
import { 
  setupTests, 
  cleanupTests, 
  createMockAgent, 
  createMockCommand,
  testPaths 
} from '../setup';

describe('My Test Suite', () => {
  beforeAll(async () => {
    await setupTests();
  });
  
  afterAll(async () => {
    await cleanupTests();
  });
  
  test('should do something', () => {
    // Your test here
  });
});
```

## Test Utilities

### Mock Data Generators
- `createMockAgent(name, format)` - Creates test agent data
- `createMockCommand(name, format)` - Creates test command data

### Path Helpers
- `testPaths.agents.claude` - Claude agents directory
- `testPaths.agents.opencode` - OpenCode agents directory
- `testPaths.commands.claude` - Claude commands directory
- `testPaths.commands.opencode` - OpenCode commands directory
- `testPaths.mcp.claude` - Claude MCP directory
- `testPaths.mcp.warp` - Warp MCP directory

### Async Helpers
- `waitForFile(path, timeout)` - Wait for file to exist
- `retryAsync(fn, retries, delay)` - Retry async operations

## Coverage Goals

- **Line Coverage**: 80% minimum
- **Critical Paths**: 100% coverage for:
  - Format conversion logic
  - YAML validation
  - Security validations
  - MCP configurations

## CI/CD Integration

Tests run automatically on:
- Pull requests
- Main branch commits
- Release builds

Coverage reports are generated in:
- `.coverage/` - Coverage data
- `test-reports/` - Test results (JSON and Markdown)

## Troubleshooting

### Common Issues

1. **YAML parsing errors**: Check for unquoted colons in test data
2. **File not found**: Ensure test directories exist before running
3. **Timeout errors**: Increase timeout for integration tests
4. **Permission errors**: Some tests may need elevated permissions for global operations

### Debug Mode

Run tests with verbose output:
```bash
bun test --verbose
```

### Clean Test Environment

Remove all test artifacts:
```bash
rm -rf .test-tmp .coverage test-reports
```