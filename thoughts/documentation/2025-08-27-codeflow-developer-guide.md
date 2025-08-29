---
title: Codeflow - Developer Guide
audience: developer
version: 0.1.0
date: 2025-08-27
---

# Codeflow Developer Guide

Comprehensive guide for developers working on or extending Codeflow.

## Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                          Codeflow System                        │
├─────────────────────────────────────────────────────────────────┤
│  CLI Interface (src/cli/index.ts)                              │
│  ├── Command Routing & Argument Parsing                        │
│  ├── Project Setup & Management                                │
│  └── File Watching & Synchronization                           │
├─────────────────────────────────────────────────────────────────┤
│  Agent System                                                   │
│  ├── Format Converter (src/conversion/)                        │
│  ├── Agent Registry (mcp/agent-registry.mjs)                   │
│  └── Agent Spawner (mcp/agent-spawner.mjs)                     │
├─────────────────────────────────────────────────────────────────┤
│  MCP Server (mcp/codeflow-server.mjs)                          │
│  ├── Tool Registration                                          │
│  ├── Agent Orchestration                                        │
│  └── Protocol Implementation                                    │
├─────────────────────────────────────────────────────────────────┤
│  File System Operations                                         │
│  ├── Sync Engine (src/sync/)                                   │
│  ├── Security Validation (src/security/)                       │
│  └── Cross-Platform Support                                     │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **CLI Commands** → Parse arguments → Route to appropriate handler
2. **Agent Discovery** → Load from directories → Parse YAML frontmatter → Register in memory
3. **Format Conversion** → Parse source format → Transform data → Write target format
4. **MCP Integration** → Register tools → Handle client requests → Execute with agent context
5. **File Watching** → Monitor changes → Trigger sync operations → Update targets

### Directory Structure

```
codeflow/
├── src/cli/                    # CLI command implementations
│   ├── index.ts               # Main CLI entry point
│   ├── setup.ts               # Project setup logic
│   ├── mcp.ts                 # MCP server management
│   ├── watch.ts               # File watching commands
│   └── convert.ts             # Format conversion commands
├── src/conversion/             # Agent format conversion
│   ├── agent-parser.ts        # YAML frontmatter parsing
│   ├── format-converter.ts    # Format transformation logic
│   └── validator.ts           # Agent validation
├── src/sync/                  # Synchronization system
│   ├── file-watcher.ts        # File system monitoring
│   ├── sync-daemon.ts         # Background sync process
│   └── conflict-resolver.ts   # Conflict resolution
├── mcp/                       # MCP server implementation
│   ├── codeflow-server.mjs    # Main MCP server
│   ├── agent-registry.mjs     # Agent discovery & management
│   └── agent-spawner.mjs      # Agent execution infrastructure
├── tests/                     # Test suites
│   ├── unit/                  # Unit tests
│   ├── integration/           # Integration tests
│   ├── platform/              # Cross-platform tests
│   └── e2e/                   # End-to-end tests
└── thoughts/documentation/    # Generated documentation
```

## Key Design Decisions

### 1. Three Agent Formats

**Rationale:** Support different AI platform requirements while maintaining unified functionality.

**Implementation:**
- **Base format** (`/agent/`): Core agent definitions with minimal frontmatter
- **Claude Code format** (`/claude-agents/`): Optimized for Claude Code slash commands
- **OpenCode format** (`/opencode-agents/`): Extended metadata for MCP protocol

**Trade-offs:**
- ✅ Platform compatibility and flexibility
- ❌ Maintenance overhead for multiple formats
- ✅ Automatic conversion prevents drift

### 2. Priority-based Agent Loading

**Rationale:** Allow project-specific customization while providing sensible defaults.

**Priority Order:**
1. Project-specific OpenCode agents (`.opencode/agent/`)
2. Project-specific Claude agents (`.claude/agents/`)
3. Global user agents (`~/.claude/agents/`)
4. Built-in codeflow agents

**Implementation:** `mcp/agent-registry.mjs:175-194`

### 3. MCP Server Design

**Rationale:** Expose only workflow commands as tools while keeping agents as internal implementation details.

**Key Decisions:**
- Commands exposed: `research`, `plan`, `execute`, `test`, `document`, `commit`, `review`
- Agents available internally via context functions
- Dynamic agent context added to each command

**Benefits:**
- Clean MCP client experience
- Flexible internal agent orchestration
- Backward compatibility with existing workflows

### 4. File Watching Architecture

**Rationale:** Enable real-time synchronization without manual intervention.

**Components:**
- `FileWatcher`: Monitors directories for changes
- `SyncDaemon`: Background process management
- `ConflictResolver`: Handles synchronization conflicts

**Performance Considerations:**
- Debounced event handling (prevents rapid-fire updates)
- Selective directory watching (only relevant paths)
- Background processing with health checks

## Extension Points

### Adding New CLI Commands

1. **Create command handler** in `src/cli/`
2. **Add route** in `src/cli/index.ts`
3. **Add help text** and argument parsing
4. **Add tests** in `tests/unit/cli.test.ts`

Example:
```typescript
// src/cli/my-command.ts
export async function myCommand(options: MyCommandOptions) {
  // Implementation
}

// src/cli/index.ts
case "my-command":
  const myOptions = parseMyOptions(args);
  await myCommand(myOptions);
  break;
```

### Adding New Agent Formats

1. **Extend format types** in `src/conversion/format-converter.ts`
2. **Add parser logic** in `src/conversion/agent-parser.ts`
3. **Add validation** in `src/conversion/validator.ts`
4. **Update tests** in `tests/conversion/`

Example:
```typescript
interface NewFormatAgent {
  customField: string;
  // ... other fields
}

export function parseNewFormat(content: string): NewFormatAgent {
  // Implementation
}
```

### Adding New MCP Tools

1. **Register tool** in `mcp/codeflow-server.mjs`
2. **Define input schema**
3. **Implement handler** with agent context
4. **Add integration tests**

Example:
```javascript
server.registerTool("my-tool", {
  title: "my-tool",
  description: "Description of my tool",
  inputSchema: jsonSchemaObject({ /* schema */ })
}, async (args) => {
  // Tool implementation with agent access
  const context = {
    availableAgents: Array.from(globalAgentRegistry.keys()),
    // ...
  };
  return { content: [{ type: "text", text: result }] };
});
```

### Adding New Specialized Agents

1. **Create agent file** in appropriate format directory
2. **Follow YAML frontmatter format**
3. **Add to agent categories** in `mcp/agent-registry.mjs:221-259`
4. **Update documentation**

Example agent structure:
```yaml
---
name: my_specialist_agent
description: |
  Specialized agent for domain-specific tasks
model: claude-3-5-sonnet-20241022
temperature: 0.3
tools:
  read: true
  write: true
mode: subagent
---

You are a specialist agent for [domain]. Your expertise includes...
```

## Development Workflow

### Setup Development Environment

```bash
# Clone and setup
git clone <repository>
cd codeflow
bun install

# Link CLI globally for testing
bun run install

# Run type checking
bun run typecheck

# Run tests
bun test
```

### Testing Strategy

**Test Categories:**
- **Unit tests** (`tests/unit/`): Individual function/module testing
- **Integration tests** (`tests/integration/`): MCP server and CLI integration
- **Cross-platform tests** (`tests/platform/`): Platform-specific behavior
- **E2E tests** (`tests/e2e/`): Complete user workflows

**Running Tests:**
```bash
# All tests
bun test

# Specific category
bun test tests/unit/
bun test tests/integration/

# With coverage
bun test --coverage
```

### Performance Optimization

**Target Performance:**
- CLI operations: < 2 seconds
- Agent registry loading: < 200ms
- Format conversion: < 5 seconds for 50+ agents
- File change detection: < 1 second

**Optimization Techniques:**
1. **Lazy loading**: Load agents only when needed
2. **Caching**: Cache parsed agent definitions
3. **Debouncing**: Batch file system events
4. **Parallel processing**: Use Promise.all for independent operations

**Performance Monitoring:**
```typescript
// src/optimization/performance.ts
export class PerformanceMonitor {
  static time<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    const start = Date.now();
    return fn().finally(() => {
      const duration = Date.now() - start;
      console.log(`${operation}: ${duration}ms`);
    });
  }
}
```

### Security Considerations

**Input Validation:**
- All file paths validated in `src/security/validation.ts`
- User input sanitized before processing
- No direct execution of user-provided code

**File System Security:**
- Path traversal prevention
- Permission checking before file operations
- Secure temporary file handling

**Agent Security:**
- No secrets in agent definitions
- Parameterized queries only
- PII handling guidelines in agent constraints

## Code Quality Standards

### TypeScript Configuration

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "exactOptionalPropertyTypes": true
  }
}
```

### Code Style

- **Function size**: Target 10-30 lines, max 50
- **Nesting depth**: Maximum 3 levels
- **Error handling**: Explicit error handling, no silent failures
- **Naming**: Descriptive variable and function names
- **Comments**: Only when explaining complex logic

### Error Handling Patterns

```typescript
// Preferred: Result-style error handling
type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

export async function safeOperation(): Promise<Result<Data>> {
  try {
    const data = await riskyOperation();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error as Error };
  }
}
```

## Debugging Guide

### Common Issues

**Agent parsing errors:**
```bash
# Check specific agent validation
codeflow status . --verbose

# Test single agent conversion
codeflow convert ./agent/test.md ./output claude-code --dry-run
```

**MCP server issues:**
```bash
# Check server logs
codeflow mcp start  # Run in foreground to see logs

# Test server connectivity
codeflow mcp status
```

**File watching problems:**
```bash
# Check watch daemon status
codeflow watch status

# View watch logs
codeflow watch logs --follow
```

### Debug Environment Variables

```bash
# Enable debug logging
NODE_ENV=development codeflow <command>

# Enable MCP debug mode
DEBUG=mcp codeflow mcp start
```

### Profiling Performance

```typescript
// Add timing to any operation
import { performance } from 'perf_hooks';

const start = performance.now();
await someOperation();
const end = performance.now();
console.log(`Operation took ${end - start}ms`);
```

## Contributing Guidelines

### Before Submitting PRs

1. **Run full test suite**: `bun test`
2. **Type check**: `bun run typecheck`
3. **Test CLI functionality**: Install and test key commands
4. **Update documentation**: Add/update relevant docs
5. **Performance test**: Ensure no performance regressions

### Branch Strategy

- `master` - Production-ready code
- `develop` - Integration branch for features
- `feature/<name>` - Feature development
- `hotfix/<issue>` - Critical bug fixes

### Commit Message Format

```
feat: add new agent format support
fix: resolve MCP server timeout issue
docs: update API reference
test: add cross-platform tests
```

### Code Review Checklist

- [ ] Tests included and passing
- [ ] Documentation updated
- [ ] Error handling comprehensive
- [ ] Performance considerations addressed
- [ ] Cross-platform compatibility verified
- [ ] Security implications reviewed

## Deployment & Distribution

### Building for Production

```bash
# Type check
bun run typecheck

# Run all tests
bun test

# Package for distribution
bun build --target=node --outdir=dist
```

### Release Process

1. **Update version** in `package.json`
2. **Update CHANGELOG.md**
3. **Tag release**: `git tag v0.1.1`
4. **Push tags**: `git push --tags`
5. **GitHub Actions** handles CI/CD

### NPM Package Distribution

The system supports distribution as an NPM package for universal MCP server usage:

```bash
# Build package
cd packages/agentic-mcp
bun build

# Publish
npm publish
```

## Troubleshooting Development Issues

### TypeScript Errors

**Common issue:** Bun-specific type conflicts
**Solution:** Ensure `@types/bun` is latest version

### Test Failures

**MCP integration tests timing out:**
- Increase timeout values
- Check background processes aren't interfering

**Cross-platform test failures:**
- Verify path separator handling
- Check file permission differences

### Performance Issues

**Slow agent registry loading:**
- Profile with `performance.now()`
- Check for synchronous file operations
- Consider caching strategies

**Memory usage growth:**
- Monitor with `process.memoryUsage()`
- Look for event listener leaks
- Check for unclosed file handles

This developer guide provides the foundation for understanding, extending, and maintaining the Codeflow system. The architecture is designed to be modular and extensible while maintaining performance and reliability standards.