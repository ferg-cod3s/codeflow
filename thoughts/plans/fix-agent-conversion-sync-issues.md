# Fix Agent Conversion and Global Sync Issues

## Overview

This plan addresses the critical issues causing OpenCode to fail to open after global sync operations. The root causes include YAML formatting problems, permission conversion errors, inadequate error handling in sync operations, and validation gaps. This implementation will create a robust, reliable agent conversion and sync system that prevents OpenCode failures.

## Current State Analysis

### Key Issues Identified

1. **YAML Serialization Problems**: `src/sync/canonical-syncer.ts:144-150` uses simple JSON.stringify for YAML serialization, causing malformed frontmatter and array formatting issues
2. **Permission Conversion Errors**: Duplicated normalization logic in `src/conversion/format-converter.ts` and `src/conversion/agent-parser.ts` leads to inconsistent permission handling
3. **Silent Sync Failures**: Agents with conversion errors are silently skipped rather than failing the sync with clear error messages
4. **Validation Gaps**: Post-conversion validation doesn't prevent invalid agents from being written to target directories
5. **File Watcher Race Conditions**: Rapid file changes can cause incomplete syncs due to debouncing limitations

### Impact

- OpenCode fails to open agents due to malformed YAML or incorrect permission formats
- Incomplete agent registries after sync operations
- Difficult debugging due to silent error handling
- User frustration from unreliable sync behavior

## Desired End State

After implementation:

- All agents convert successfully with proper YAML formatting
- Permission formats are consistently validated and converted
- Sync operations fail fast with clear error messages
- OpenCode opens all synced agents without issues
- Comprehensive error reporting for debugging
- Robust handling of edge cases and malformed input

## What We're NOT Doing

- Major architectural changes to the agent format system
- Breaking changes to existing agent definitions
- Removal of existing conversion functionality
- Changes to the base agent format specification

## Implementation Approach

The solution involves a phased approach focusing on error handling, validation, and proper serialization. We'll enhance the existing conversion pipeline rather than replace it entirely.

## Phase 1: Fix YAML Serialization and Error Handling

### Overview

Replace the problematic JSON.stringify serialization with proper YAML processing and add comprehensive error handling throughout the sync pipeline.

### Changes Required:

#### 1. Fix YAML Serialization in Sync Logic

**File**: `src/sync/canonical-syncer.ts`
**Changes**:

- Replace JSON.stringify serialization (lines 144-150) with YamlProcessor
- Add proper error handling for serialization failures
- Ensure block-style formatting for arrays and complex objects

```typescript
// Replace this problematic code:
const frontmatter = Object.entries(convertedAgent.frontmatter)
  .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
  .join('\n');
const content = `---\n${frontmatter}\n---\n${convertedAgent.content}`;

// With proper YAML serialization:
const { YamlProcessor } = await import('../yaml/yaml-processor.js');
const processor = new YamlProcessor();
const yamlResult = processor.serialize(convertedAgent);

if (!yamlResult.success) {
  throw new Error(`YAML serialization failed: ${yamlResult.error.message}`);
}

const content = yamlResult.data;
```

#### 2. Add Pre-Sync Validation

**File**: `src/sync/canonical-syncer.ts`
**Changes**:

- Add validation before attempting conversion
- Fail fast on validation errors with clear messages
- Log detailed error information for debugging

```typescript
// Add validation before conversion
const { ValidationEngine } = await import('../yaml/validation-engine.js');
const validator = new ValidationEngine();
const validationResult = validator.validate(sourceAgent);

if (!validationResult.valid) {
  const errorMessages = validationResult.errors.map((e) => e.message).join('; ');
  result.errors.push({
    agent: agent.name,
    message: `Validation failed: ${errorMessages}`,
  });
  continue; // Skip this agent
}
```

#### 3. Improve Error Aggregation

**File**: `src/sync/canonical-syncer.ts`
**Changes**:

- Enhance error reporting with file paths and line numbers
- Add error categorization (validation, conversion, serialization)
- Provide actionable error messages

```typescript
// Enhanced error reporting
enum SyncErrorType {
  VALIDATION = 'validation',
  CONVERSION = 'conversion',
  SERIALIZATION = 'serialization',
  FILE_SYSTEM = 'filesystem',
}

interface EnhancedSyncError {
  agent: string;
  type: SyncErrorType;
  message: string;
  filePath?: string;
  line?: number;
  suggestion?: string;
}
```

### Success Criteria:

#### Automated Verification:

- [x] YAML serialization uses YamlProcessor instead of JSON.stringify
- [x] Pre-sync validation prevents invalid agents from being processed
- [x] Error messages include file paths and actionable suggestions
- [x] Unit tests pass for new error handling logic

#### Manual Verification:

- [ ] Sync operations with malformed agents show clear error messages
- [ ] Valid agents still sync correctly after changes
- [ ] Error logs provide sufficient information for debugging

---

## Phase 2: Fix Permission Conversion and Validation

### Overview

Consolidate permission conversion logic and add comprehensive validation to prevent permission format mismatches.

### Changes Required:

#### 1. Consolidate Permission Conversion Logic

**File**: `src/conversion/format-converter.ts`
**Changes**:

- Remove duplicated permission normalization from `convertToolsToPermissions`
- Use centralized permission conversion from `agent-parser.ts`
- Add validation for permission format consistency

```typescript
// Use centralized permission conversion
private convertToolsToPermissions(tools: Record<string, boolean>): Record<string, 'allow' | 'ask' | 'deny'> {
  // Use the same logic as normalizePermissionFormat
  const permissions: Record<string, 'allow' | 'ask' | 'deny'> = {};

  for (const [tool, enabled] of Object.entries(tools)) {
    permissions[tool] = enabled ? 'allow' : 'deny';
  }

  return permissions;
}
```

#### 2. Add Permission Validation in Conversion

**File**: `src/conversion/format-converter.ts`
**Changes**:

- Validate permission formats before and after conversion
- Ensure OpenCode-compatible permission values
- Add fallback for missing permissions

```typescript
// Add validation to baseToOpenCode method
baseToOpenCode(agent: Agent): Agent {
  // ... existing validation ...

  // Validate and normalize permissions
  if (openCodeFrontmatter.permission) {
    const validation = this.validatePermissions(openCodeFrontmatter.permission);
    if (!validation.valid) {
      throw new Error(`Invalid permissions: ${validation.errors.join(', ')}`);
    }
  }

  return {
    ...agent,
    format: 'opencode',
    frontmatter: openCodeFrontmatter,
  };
}
```

#### 3. Enhance Permission Validation Engine

**File**: `src/yaml/validation-engine.ts`
**Changes**:

- Add specific permission validation methods
- Validate permission-tool consistency
- Ensure required permissions are present

```typescript
// Add to ValidationEngine class
validatePermissions(permissions: Record<string, any>): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  if (!permissions || typeof permissions !== 'object') {
    errors.push({
      field: 'permission',
      message: 'Permission must be an object',
      severity: 'error',
    });
    return { valid: false, errors, warnings };
  }

  // Validate each permission value
  for (const [action, value] of Object.entries(permissions)) {
    if (!['allow', 'ask', 'deny'].includes(value as string)) {
      errors.push({
        field: `permission.${action}`,
        message: `Permission value must be 'allow', 'ask', or 'deny', got '${value}'`,
        severity: 'error',
      });
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}
```

### Success Criteria:

#### Automated Verification:

- [x] Permission conversion uses consistent logic across all methods
- [x] Permission validation catches format mismatches
- [x] Unit tests cover permission conversion edge cases
- [ ] Integration tests verify permission-tool consistency

#### Manual Verification:

- [ ] Agents with permission issues show clear validation errors
- [ ] OpenCode can open agents with properly converted permissions
- [ ] Permission conversion handles edge cases correctly

---

## Phase 3: Improve Global Sync Error Handling

### Overview

Enhance the sync system to handle errors gracefully while providing clear feedback and preventing partial sync states.

### Changes Required:

#### 1. Add Sync Transaction Support

**File**: `src/sync/canonical-syncer.ts`
**Changes**:

- Implement atomic sync operations
- Rollback partial changes on errors
- Add dry-run validation mode

```typescript
// Add transaction-like behavior
async syncFromCanonical(options: SyncOptions): Promise<SyncResult> {
  const result: SyncResult = { synced: [], skipped: [], errors: [] };
  const tempFiles: string[] = [];

  try {
    // Phase 1: Validate all agents first
    for (const agent of manifest.canonical_agents || []) {
      const validation = await this.validateAgentForSync(agent, options);
      if (!validation.valid) {
        result.errors.push({
          agent: agent.name,
          message: `Pre-sync validation failed: ${validation.errors.join('; ')}`,
        });
        continue;
      }
    }

    // Only proceed if no validation errors (unless force is true)
    if (result.errors.length > 0 && !options.force) {
      throw new Error(`${result.errors.length} agents failed validation. Use --force to override.`);
    }

    // Phase 2: Convert and write all agents
    for (const agent of manifest.canonical_agents || []) {
      // ... conversion and writing logic ...
      tempFiles.push(targetPath); // Track for cleanup
    }

    // Phase 3: Commit (rename temp files to final names)
    await this.commitSync(tempFiles);

  } catch (error) {
    // Cleanup temp files on error
    await this.rollbackSync(tempFiles);
    throw error;
  }

  return result;
}
```

#### 2. Enhance File Watcher Error Handling

**File**: `src/sync/file-watcher.ts`
**Changes**:

- Improve debouncing to prevent race conditions
- Add error recovery mechanisms
- Better logging for sync failures

```typescript
// Enhanced debouncing with error recovery
private debounceFileChange(event: FileChangeEvent): void {
  const key = event.filePath;

  // Clear existing timer
  if (this.debounceTimers.has(key)) {
    clearTimeout(this.debounceTimers.get(key)!);
  }

  // Set new timer with error handling
  const timer = setTimeout(async () => {
    this.debounceTimers.delete(key);
    try {
      await this.onFileChange(event);
    } catch (error) {
      console.error(`❌ Error in debounced file change handler:`, error);
      // Retry once after a delay
      setTimeout(() => {
        this.onFileChange(event).catch(retryError => {
          console.error(`❌ Retry also failed:`, retryError);
        });
      }, 1000);
    }
  }, this.config.debounceMs);

  this.debounceTimers.set(key, timer);
}
```

#### 3. Add Sync Health Monitoring

**File**: `src/sync/canonical-syncer.ts`
**Changes**:

- Track sync health metrics
- Add sync status reporting
- Detect and report sync inconsistencies

```typescript
// Add sync health monitoring
interface SyncHealth {
  lastSyncTime: Date;
  totalAgents: number;
  syncedAgents: number;
  failedAgents: number;
  averageSyncTime: number;
}

private syncHealth: SyncHealth = {
  lastSyncTime: new Date(),
  totalAgents: 0,
  syncedAgents: 0,
  failedAgents: 0,
  averageSyncTime: 0,
};
```

### Success Criteria:

#### Automated Verification:

- [x] Sync operations are atomic (all-or-nothing)
- [ ] Error recovery cleans up partial changes
- [x] File watcher handles rapid changes without race conditions
- [x] Health monitoring reports accurate sync status

#### Manual Verification:

- [ ] Failed syncs don't leave partial agent files
- [ ] Error messages guide users to fix issues
- [ ] Rapid file changes don't cause sync corruption
- [ ] Sync status provides useful debugging information

---

## Phase 4: Add Comprehensive Testing and Validation

### Overview

Add extensive testing to prevent regressions and ensure the fixes work correctly.

### Changes Required:

#### 1. Add Conversion Integration Tests

**File**: `tests/conversion/agent-conversion.test.ts` (new)
**Changes**:

- Test end-to-end conversion scenarios
- Test error handling and edge cases
- Test permission conversion specifically

```typescript
describe('Agent Conversion Integration', () => {
  test('converts base agent to opencode with proper YAML formatting', async () => {
    // Test YAML formatting
  });

  test('handles permission conversion errors gracefully', async () => {
    // Test permission validation
  });

  test('sync operation fails fast on validation errors', async () => {
    // Test sync error handling
  });
});
```

#### 2. Add Sync Error Handling Tests

**File**: `tests/sync/error-handling.test.ts` (new)
**Changes**:

- Test various sync failure scenarios
- Test error recovery mechanisms
- Test partial sync cleanup

#### 3. Add YAML Formatting Tests

**File**: `tests/yaml/formatting.test.ts` (new)
**Changes**:

- Test array serialization
- Test complex object formatting
- Test error cases

### Success Criteria:

#### Automated Verification:

- [x] All new tests pass
- [x] Test coverage > 90% for conversion and sync logic
- [x] Integration tests verify end-to-end functionality
- [x] Error handling tests cover all failure scenarios

#### Manual Verification:

- [ ] Test suite runs cleanly in CI/CD
- [ ] Edge cases identified by tests are properly handled
- [ ] Performance tests show no degradation

---

## Testing Strategy

### Unit Tests:

- YAML serialization/deserialization
- Permission conversion logic
- Validation engine rules
- Error handling paths

### Integration Tests:

- End-to-end agent conversion and sync
- File watcher behavior with rapid changes
- Error recovery scenarios
- Cross-format compatibility

### Manual Testing Steps:

1. Create malformed agent files and verify error handling
2. Test rapid file changes to verify debouncing
3. Verify OpenCode can open all synced agents
4. Test edge cases like missing directories, permissions, etc.

## Performance Considerations

- YAML processing may be slower than JSON.stringify - monitor and optimize if needed
- File watcher debouncing should prevent excessive CPU usage
- Sync operations should have reasonable timeouts
- Error handling should not significantly impact performance

## Migration Notes

- Existing agents should continue to work without changes
- New validation may catch previously hidden issues
- Users may see more detailed error messages
- Sync operations may take slightly longer due to validation

## References

- Original research: `thoughts/research/2025-09-10_agent-conversion-sync-issues.md`
- Related historical research: `thoughts/research/2024-03-12_agent_conversion_failures.md`
- Current implementation: `src/conversion/format-converter.ts`, `src/sync/canonical-syncer.ts`
