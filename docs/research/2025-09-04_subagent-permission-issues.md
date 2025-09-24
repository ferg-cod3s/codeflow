---
date: 2025-09-04T12:00:00Z
researcher: John Ferguson
git_commit: 6b9e1a2b6adac219e9e32aeae08f3cc5fb61550f
branch: master
repository: codeflow
topic: 'OpenCode subagent permission denied issues - root cause analysis and fixes'
tags: [research, opencode, subagents, permissions, validation, sync-global]
status: complete
last_updated: 2025-09-04
last_updated_by: John Ferguson
---

## Ticket Synopsis

User experiencing permission denied errors when OpenCode subagents attempt to access files in folders they should have access to. The issue appears to be related to validation failures and permission configuration problems specific to OpenCode agents.

## Summary

**Primary Root Cause:** OpenCode validation logic is completely unimplemented, causing all OpenCode agents to fail validation during sync-global operations and be skipped entirely.

**Secondary Issues:**

1. **Permission format mismatch** - System expects `permission:` blocks but OpenCode agents use `tools:` blocks
2. **Sync-global failures** - Validation failures prevent OpenCode agents from being copied to project directories
3. **Runtime permission errors** - Subagents can't access files due to misconfigured allowed_directories

**Key Findings:**

- OpenCode validation contains TODO comment and always returns invalid
- All OpenCode agents are marked as invalid during sync-global
- Permission system has format inconsistencies between expected and actual implementations
- Users get runtime errors when trying to use OpenCode subagents

## Detailed Findings

### 1. Critical OpenCode Validation Failure

**Location:** `src/utils/validation.ts:42-50`
**Issue:** OpenCode validation logic is completely unimplemented

```typescript
// OpenCode format validation is NOT IMPLEMENTED
if (metadata.agent || metadata.model) {
  // TODO: Implement OpenCode validation
  return { isValid: false, format: 'unknown', errors: ['Unknown agent format'] };
}
```

**Root Cause Analysis:**

- OpenCode agents have proper frontmatter structure but validation always fails
- Sync-global process depends on validation passing to copy agents
- All OpenCode agents are silently dropped during sync operations
- Users experience runtime errors when OpenCode agents are missing

### 2. Sync-Global Process Failure

**Location:** `src/core/sync.ts:112`
**Issue:** Validation-first architecture blocks OpenCode agents

**Process Flow:**

1. **Agent Discovery**: Finds all agents in global directory
2. **Validation Gate**: `validateAgent(agentPath)` called for each agent
3. **Conditional Copy**: Only validated agents are copied to project
4. **Silent Failure**: Invalid agents logged as warnings but sync continues

**Impact:**

- OpenCode agents never reach project directories
- OpenCode platform cannot find expected agents
- Users get "agent not found" errors at runtime

### 3. Permission Format Mismatch

**Issue:** System expects different permission format than what's implemented

**Expected Format:**

```yaml
permission:
  edit: deny
  bash: deny
  webfetch: allow
```

**Actual OpenCode Format:**

```yaml
tools:
  read: true
  grep: true
  glob: true
  write: false
  edit: false
  bash: false
```

**Gap:**

- OpenCode agents use granular `tools:` blocks (more secure)
- System logic expects simpler `permission:` blocks
- Format mismatch causes permission parsing failures

### 4. Directory Access Configuration

**Current State:**

- `allowed_directories` properly configured in most OpenCode agents
- Auto-injection works during setup/sync for missing entries
- Default directories: project root, `src`, `tests`

**Potential Issues:**

- Sync failures prevent directory configuration from reaching projects
- Project-specific overrides may not work if base agents aren't copied
- Default directories may be insufficient for some subagent operations

### 5. MCP Server Permission Application

**Location:** `mcp/agent-registry.mjs:233-308`
**Issue:** Agent loading and permission parsing in MCP context

**Problems:**

- Frontmatter parsing may not handle OpenCode format correctly
- Permission inheritance not applied properly
- Execution context may not restrict subagent access appropriately

## Code References

### Primary Issue Locations

- `src/utils/validation.ts:42-50` - **CRITICAL**: Unimplemented OpenCode validation
- `src/security/validation.ts:70-148` - Path validation logic
- `src/security/opencode-permissions.ts:61-132` - Permission application logic
- `mcp/agent-registry.mjs:233-308` - Agent loading and permission parsing
- `mcp/agent-spawner.mjs:41-91` - Agent execution with permissions

### Related Files

- `src/cli/sync.ts:151-371` - Sync logic that depends on validation
- `src/security/agent-permission-templates.ts:27-136` - Permission templates
- `tests/integration/agent-permissions.test.ts` - Permission tests
- `docs/opencode-permissions-setup.md` - Permission documentation

## Architecture Insights

### Permission System Architecture

1. **Agent Frontmatter** → Contains `allowed_directories` and permission settings
2. **Sync/Setup Process** → Injects missing permissions using templates
3. **Validation Layer** → Checks paths and permissions before operations
4. **MCP Server** → Loads agents and applies permission restrictions
5. **Agent Execution** → Enforces permissions during runtime

### Critical Path Issues

- **Validation Gate**: `src/core/sync.ts:112` blocks invalid agents from being copied
- **Format Detection**: Works but validation fails for OpenCode agents
- **Permission Inheritance**: Not properly applied in MCP context
- **Path Resolution**: May fail for subagent-specific file access patterns

## Historical Context (from thoughts/)

### Existing Research

- `thoughts/research/2025-09-02_agent-permissions-gap-analysis.md` - Comprehensive audit of permission inconsistencies
- `thoughts/research/2025-08-31_sync-global-opencode-agent-errors.md` - Root cause analysis of sync validation failures
- `thoughts/research/2025-09-02_allowed-directories-global-sync.md` - Directory access configuration analysis

### Implementation Plans

- `thoughts/plans/agent-permissions-audit-and-update.md` - Comprehensive permission update plan
- `thoughts/plans/fix-sync-global-opencode-issues.md` - Sync validation fixes
- `thoughts/plans/opencode-file-editing-compatibility-fix.md` - File access permission fixes

## Open Questions

1. **Validation Requirements**: What specific validation rules should OpenCode agents follow?
2. **Path Boundaries**: Should subagents have broader file access than current restrictions?
3. **Format Reconciliation**: Should the system standardize on `tools:` or `permission:` format?
4. **MCP Context**: How should permissions be enforced in MCP server execution?
5. **Directory Defaults**: Are the default allowed directories sufficient for subagent operations?

## Proposed Solutions

### Immediate Critical Fix (HIGH PRIORITY)

#### 1. Implement OpenCode Validation Logic

**File:** `src/utils/validation.ts:42-50`
**Status:** REQUIRED for sync-global to work

**Current Code:**

```typescript
// OpenCode format validation is NOT IMPLEMENTED
if (metadata.agent || metadata.model) {
  // TODO: Implement OpenCode validation
  return { isValid: false, format: 'unknown', errors: ['Unknown agent format'] };
}
```

**Fix:**

```typescript
// Implement proper OpenCode validation
if (metadata.agents && Array.isArray(metadata.agents)) {
  return validateOpenCodeFormat(metadata);
}
```

**Implementation Steps:**

1. Create `validateOpenCodeFormat()` function
2. Validate required fields: `agents` array, `name`, `model`, `provider`, `role`
3. Return proper format identifier and validation status

### Phase 1: Fix Sync-Global Process

#### 1. Update Sync Logic to Handle OpenCode

**File:** `src/core/sync.ts:112`
**Solution:** Ensure OpenCode agents pass validation gate

#### 2. Fix Permission Format Handling

**File:** `src/security/opencode-permissions.ts`
**Solution:** Update to work with existing `tools:` format instead of `permission:` blocks

**Current Issue:** System expects:

```yaml
permission:
  edit: deny
  bash: deny
```

**Actual Format:**

```yaml
tools:
  edit: false
  bash: false
```

### Phase 2: Permission System Fixes

#### 1. Standardize Permission Templates

**File:** `src/security/agent-permission-templates.ts`
**Solution:** Create templates that work with existing OpenCode `tools:` format

#### 2. Fix Agent Registry Loading

**File:** `mcp/agent-registry.mjs`
**Solution:** Ensure proper parsing of OpenCode agent frontmatter

#### 3. Validate Directory Access

**Files:** All OpenCode agent frontmatter
**Solution:** Ensure `allowed_directories` are properly configured

### Phase 3: Testing and Verification

#### 1. Test Sync-Global with OpenCode Agents

**Command:** `codeflow sync-global`
**Expected:** OpenCode agents should now pass validation and be copied

#### 2. Test Subagent File Access

**Manual Testing:** Verify OpenCode subagents can access files in allowed directories

#### 3. Add Permission Tests

**File:** `tests/integration/agent-permissions.test.ts`
**Solution:** Comprehensive tests for OpenCode permission scenarios

## Implementation Priority

### CRITICAL (Fix Immediately)

1. **Implement OpenCode validation logic** - Required for sync-global to work at all
2. **Test sync-global with OpenCode agents** - Verify the fix resolves the core issue

### High Priority (This Sprint)

1. **Fix permission format handling** - Resolve tools vs permission block mismatch
2. **Validate directory access configuration** - Ensure allowed_directories work properly
3. **Test subagent file access** - Verify OpenCode subagents can access necessary files

### Medium Priority (Next Sprint)

1. **Standardize permission templates** - Create consistent permission system
2. **Add comprehensive permission tests** - Ensure system works correctly
3. **Update documentation** - Document the fixes and best practices

## Risk Assessment

### Critical Risk

- **OpenCode validation unimplemented**: Complete blocker for OpenCode agent functionality
- **Sync-global failures**: Users cannot use OpenCode agents at all

### High Risk

- **Permission format mismatch**: Inconsistent security enforcement
- **Directory access issues**: Subagents may not work properly even after sync

### Medium Risk

- **Agent registry issues**: May cause runtime permission problems
- **Path validation restrictions**: May block legitimate operations

## Success Criteria

### Technical Success

- [ ] OpenCode agents pass validation during sync-global operations
- [ ] `codeflow sync-global` completes successfully with OpenCode agents
- [ ] OpenCode subagents can access files in their allowed directories
- [ ] Permission system properly enforces security for OpenCode agents

### User Success

- [ ] Users can run sync-global without OpenCode validation errors
- [ ] OpenCode subagents work without permission denied errors
- [ ] Clear error messages when actual permission violations occur
- [ ] OpenCode agents are available and functional after sync

## Related Research

- `thoughts/research/2025-09-02_agent-permissions-gap-analysis.md`
- `thoughts/research/2025-08-31_sync-global-opencode-agent-errors.md`
- `thoughts/research/2025-09-02_allowed-directories-global-sync.md`
- `thoughts/plans/agent-permissions-audit-and-update.md`
- `thoughts/plans/fix-sync-global-opencode-issues.md`
