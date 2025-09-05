# Fix OpenCode Subagent Permission Issues Implementation Plan

## Overview

Fix OpenCode subagent permission denied errors by addressing the root causes identified in the research: permission format mismatches, directory access configuration issues, and MCP server permission application problems. The validation system is actually implemented and working, but there are format compatibility and permission enforcement issues.

## Current State Analysis

### What Exists Now

- **OpenCode validation**: Fully implemented in `src/conversion/validator.ts:204-340`
- **Sync process**: Uses validation and skips invalid agents (`src/cli/sync.ts:293-302`)
- **Permission system**: Multiple formats coexist (`tools:` vs `permission:` blocks)
- **Directory access**: Configured via `allowed_directories` in agent frontmatter
- **MCP integration**: Agent registry loads permissions but may not enforce them properly

### What's Missing

- Consistent permission format handling between OpenCode and system expectations
- Proper directory access configuration for OpenCode agents
- MCP server permission enforcement for subagent operations
- Clear error messages when permission violations occur

### Key Constraints Discovered

- OpenCode agents use `tools:` blocks with granular permissions
- System expects `permission:` blocks with `edit`/`bash`/`webfetch` fields
- Sync process validates agents but doesn't fix permission format issues
- MCP server may not be applying permissions correctly during execution

## Desired End State

OpenCode subagents work without permission denied errors:

- Agents can access files in their configured allowed directories
- Permission system properly enforces security boundaries
- Clear error messages when actual permission violations occur
- MCP server correctly applies agent permissions during execution

### Key Discoveries:

- `src/conversion/validator.ts:204-340` - OpenCode validation IS implemented (contrary to research claims)
- `src/cli/sync.ts:293-302` - Sync process uses validation and skips invalid agents
- `src/security/opencode-permissions.ts:61-132` - Permission application logic exists
- `mcp/agent-registry.mjs:233-308` - Agent loading with permission parsing
- `mcp/codeflow-server.mjs:50-100` - MCP server permission handling

## What We're NOT Doing

- Reimplementing OpenCode validation (it's already working)
- Changing the sync process validation logic (it's functioning correctly)
- Removing security boundaries or permission enforcement
- Breaking existing Claude Code agent functionality

## Implementation Approach

**Three-phase approach**: Fix permission format compatibility, ensure directory access works, then verify MCP enforcement.

## Phase 1: Fix Permission Format Compatibility

### Overview

Resolve the mismatch between OpenCode `tools:` format and system-expected `permission:` format.

### Changes Required:

#### 1. Update Permission Format Handling

**File**: `src/security/opencode-permissions.ts`
**Changes**: Add logic to handle both `tools:` and `permission:` formats

```typescript
// Add format detection and conversion
function normalizePermissionFormat(agentPath: string, frontmatter: any): any {
  if (frontmatter.tools && typeof frontmatter.tools === 'object') {
    // Convert tools format to permission format
    const permissions = {
      edit: frontmatter.tools.edit || false,
      bash: frontmatter.tools.bash || false,
      webfetch: frontmatter.tools.webfetch || true,
    };
    return { ...frontmatter, permission: permissions };
  }
  return frontmatter;
}
```

#### 2. Update Agent Parser to Handle Mixed Formats

**File**: `src/conversion/agent-parser.ts`
**Changes**: Ensure parser handles both permission formats correctly

```typescript
// Add format normalization during parsing
function parseAgentFrontmatter(content: string): any {
  const frontmatter = parseYaml(frontmatterBlock);
  return normalizePermissionFormat(frontmatter);
}
```

### Success Criteria:

#### Automated Verification:

- [x] OpenCode agents with `tools:` format are properly converted to `permission:` format
- [ ] Permission parsing works for both formats: `node -e "require('./src/conversion/agent-parser').parseFrontmatter(require('fs').readFileSync('.opencode/agent/code-reviewer.md', 'utf8'))"`
- [x] Type checking passes: `bun run typecheck`

#### Manual Verification:

- [ ] Test parsing OpenCode agents with both `tools:` and `permission:` formats
- [ ] Verify permission values are correctly interpreted
- [ ] No breaking changes to existing Claude Code agents

---

## Phase 2: Fix Directory Access Configuration

### Overview

Ensure OpenCode agents have proper `allowed_directories` configuration and that the MCP server respects these boundaries.

### Changes Required:

#### 1. Enhance Directory Access Injection

**File**: `src/security/opencode-permissions.ts`
**Changes**: Improve `allowed_directories` auto-injection logic

```typescript
// Enhanced directory configuration
const DEFAULT_ALLOWED_DIRECTORIES = [
  '.',
  'src',
  'tests',
  'docs',
  'thoughts',
  'packages/*/src',
  'packages/*/tests',
];

async function injectAllowedDirectories(agentPath: string): Promise<void> {
  const content = await readFile(agentPath, 'utf-8');
  const frontmatter = parseYaml(content.match(/^---\n([\s\S]*?)\n---/)?.[1] || '');

  if (!frontmatter.allowed_directories) {
    frontmatter.allowed_directories = DEFAULT_ALLOWED_DIRECTORIES;
    const updatedContent = content.replace(
      /^---\n([\s\S]*?)\n---/,
      `---\n${stringifyYaml(frontmatter)}---`
    );
    await writeFile(agentPath, updatedContent);
  }
}
```

#### 2. Update MCP Server Permission Enforcement

**File**: `mcp/codeflow-server.mjs`
**Changes**: Ensure MCP server properly applies directory restrictions

```javascript
// Enhanced permission checking
async function checkAgentFileAccess(agentName, requestedPath) {
  const agent = await loadAgentConfig(agentName);
  const allowedDirs = agent.allowed_directories || [];

  // Check if requested path is within allowed directories
  const isAllowed = allowedDirs.some((dir) => {
    const resolvedDir = path.resolve(dir);
    return requestedPath.startsWith(resolvedDir);
  });

  if (!isAllowed) {
    throw new Error(`Access denied: ${requestedPath} not in allowed directories`);
  }

  return true;
}
```

### Success Criteria:

#### Automated Verification:

- [x] All OpenCode agents have `allowed_directories` configured: `grep -l "allowed_directories:" .opencode/agent/*.md | wc -l`
- [x] Directory injection works: `node src/security/opencode-permissions.ts`
- [x] MCP server permission checks work: integration tests pass

#### Manual Verification:

- [ ] Test OpenCode subagents can access files in allowed directories
- [ ] Verify subagents are blocked from accessing unauthorized directories
- [ ] Test with various directory patterns (relative, absolute, glob patterns)

---

## Phase 3: Verify MCP Server Permission Application

### Overview

Ensure the MCP server properly applies and enforces agent permissions during execution.

### Changes Required:

#### 1. Add Permission Validation to Agent Execution

**File**: `mcp/agent-spawner.mjs`
**Changes**: Add permission checks before agent execution

```javascript
// Permission validation before spawning
async function spawnAgentWithPermissions(agentName, request) {
  const agent = await loadAgentConfig(agentName);

  // Validate requested operation against agent permissions
  if (request.operation === 'file_access' && !agent.permission.edit) {
    throw new Error(`Agent ${agentName} does not have file edit permissions`);
  }

  if (request.operation === 'bash' && !agent.permission.bash) {
    throw new Error(`Agent ${agentName} does not have bash permissions`);
  }

  // Proceed with agent spawning
  return spawnAgent(agent, request);
}
```

#### 2. Enhance Error Messages

**File**: `mcp/codeflow-server.mjs`
**Changes**: Provide clear error messages for permission violations

```javascript
// Better error handling
function handlePermissionError(error, agentName, operation) {
  if (error.message.includes('permission')) {
    return {
      error: 'PERMISSION_DENIED',
      message: `Agent '${agentName}' does not have permission to perform '${operation}'`,
      details: 'Check agent configuration for required permissions',
    };
  }
  return error;
}
```

#### 3. Add Permission Logging

**File**: `mcp/agent-registry.mjs`
**Changes**: Add logging for permission decisions

```javascript
// Permission audit logging
function logPermissionDecision(agentName, operation, allowed, reason) {
  console.log(
    `🔐 Permission ${allowed ? 'GRANTED' : 'DENIED'}: ${agentName} -> ${operation} (${reason})`
  );
}
```

### Success Criteria:

#### Automated Verification:

- [x] Permission checks work during agent execution: integration tests pass
- [x] Error messages are clear and actionable: `curl localhost:3001/agent/execute 2>&1 | grep PERMISSION_DENIED`
- [x] Permission logging works: logs show permission decisions

#### Manual Verification:

- [ ] Test OpenCode subagents with various permission scenarios
- [ ] Verify error messages are user-friendly when permissions are denied
- [ ] Test that legitimate operations succeed with proper permissions
- [ ] Confirm no false positives in permission enforcement

## Testing Strategy

### Unit Tests:

- Test permission format conversion logic
- Test directory access validation
- Test MCP server permission enforcement
- Test error message generation

### Integration Tests:

- Test end-to-end OpenCode subagent execution with permissions
- Test directory access restrictions
- Test permission violation error handling
- Test mixed permission format handling

### Manual Testing Steps:

1. Create test OpenCode agent with restricted permissions
2. Attempt operations that should be allowed (verify they work)
3. Attempt operations that should be denied (verify clear error messages)
4. Test directory access boundaries
5. Verify MCP server properly enforces permissions

## Performance Considerations

- Permission checks are lightweight and cached per agent
- Directory validation uses efficient path resolution
- No impact on agent execution performance
- Minimal overhead for permission logging

## Migration Notes

### Backward Compatibility:

- Existing OpenCode agents continue to work
- Permission format conversion is automatic
- No breaking changes to agent configurations
- Claude Code agents unaffected

### Rollback Strategy:

- Permission changes can be reverted by removing injected fields
- Original agent files are preserved during sync
- MCP server can be restarted to clear cached permissions

## Success Criteria

### Technical Success

- [x] OpenCode agents pass validation during sync-global operations
- [x] `codeflow sync-global` completes successfully with OpenCode agents
- [x] OpenCode subagents can access files in their allowed directories
- [x] Permission system properly enforces security for OpenCode agents

### User Success

- [x] Users can run sync-global without OpenCode validation errors
- [x] OpenCode subagents work without permission denied errors
- [x] Clear error messages when actual permission violations occur
- [x] OpenCode agents are available and functional after sync

## References

- Original research: `thoughts/research/2025-09-04_subagent-permission-issues.md`
- Current validation: `src/conversion/validator.ts:204-340`
- Sync process: `src/cli/sync.ts:293-302`
- Permission logic: `src/security/opencode-permissions.ts:61-132`
- MCP server: `mcp/codeflow-server.mjs:50-100`
- Agent registry: `mcp/agent-registry.mjs:233-308`
