---
date: 2025-08-31T21:26:26-07:00
researcher: claude
git_commit: 0a42c84
branch: master
repository: codeflow
topic: 'sync-global OpenCode agent validation errors investigation'
tags: [sync-global, opencode, agents, validation, bug-analysis]
status: complete
last_updated: 2025-08-31
last_updated_by: claude
---

## Ticket Synopsis

User experiencing errors with at least one agent when running `sync-global` and trying to use OpenCode afterwards. Investigation needed to determine why OpenCode agents fail during the sync-global process.

## Summary

**Root Cause Identified**: OpenCode agent validation is completely **unimplemented** in the validation logic, causing ALL OpenCode format agents to be marked as invalid and skipped during sync-global operations.

**Critical Issue Location**: `src/utils/validation.ts:42-50` contains a TODO comment where OpenCode validation should be implemented but currently returns `{ isValid: false, format: 'unknown', errors: ['Unknown agent format'] }` for all OpenCode agents.

**Impact**: When users run `sync-global`, OpenCode agents are silently dropped from the sync process, leaving OpenCode environments without the expected agents and causing runtime errors.

## Detailed Findings

### Core Issue: Missing OpenCode Validation Implementation

**File**: `src/utils/validation.ts:42-50`
**Problem**: OpenCode validation logic is not implemented

```typescript
// OpenCode format validation is NOT IMPLEMENTED
if (metadata.agent || metadata.model) {
  // TODO: Implement OpenCode validation
  return { isValid: false, format: 'unknown', errors: ['Unknown agent format'] };
}
```

**Impact**: This causes a cascade of failures:
1. All OpenCode agents marked as invalid during validation
2. Invalid agents are skipped in `src/core/sync.ts:112`  
3. OpenCode agent directories remain empty after sync-global
4. OpenCode platform cannot find expected agents, causing runtime errors

### sync-global Implementation Analysis

**File**: `src/cli/commands/sync-global.ts:12-40`
**Flow**: Command → Core sync → Agent validation → File copy (conditional)

#### Sync Process Steps (`src/core/sync.ts:15-89`):
1. **Global Directory Resolution** (line 20): Resolves `~/.codeflow` directory
2. **Agent Discovery** (line 97): Reads all files from `${globalDir}/agent`
3. **Per-File Validation** (line 110): Calls `validateAgent(agentPath)` 
4. **Conditional Copy** (line 112): **ONLY** copies agents that pass validation
5. **Error Collection** (lines 126-156): Tracks validation failures as warnings

#### Validation-First Architecture Issue
The system's validation-first approach means:
- **No validation = No copy**: Files that fail validation are completely skipped
- **Silent failures**: Invalid agents logged as warnings but sync continues
- **Missing dependency**: OpenCode environments depend on agents that never get copied

### Agent Format Analysis

**Directory Structure Found**:
- `/Users/johnferguson/Github/codeflow/agent/` - Mixed format agents
- `/Users/johnferguson/Github/codeflow/agent/opencode/` - OpenCode format agents  
- `/Users/johnferguson/Github/codeflow/agent/claudecode/` - Claude Code format agents

#### Format Differences Identified

**Base Format** (in root `/agent/` directory):
```markdown
You are Codebase Locator, a specialist at finding files...
## Core Responsibilities
1. **File Discovery**
   - Find specific files by name or pattern
```
- No YAML frontmatter
- Direct instruction format

**Claude Code Format** (in `/agent/claudecode/`):
```markdown
---
role: system
model: claude-3-5-sonnet-latest
---
You are Operations Incident Commander...
```
- Minimal YAML frontmatter
- `role` and `model` fields

**OpenCode Format** (in `/agent/opencode/`):  
```markdown
---
agents:
  - name: agent-architect
    model: claude-3-5-sonnet-20241022
    provider: anthropic
    temperature: 0.1
    role: system
---
You are Agent Architect, a specialist in designing...
```
- Extended YAML frontmatter
- Nested `agents` array structure
- Provider and temperature specifications

### Validation Logic Analysis

**Current Implementation** (`src/utils/validation.ts:15-55`):

#### Working Validation (Claude Code):
```typescript
// Validates files WITH frontmatter only
if (!content.startsWith('---\n')) {
  return { isValid: false, format: 'unknown', errors: ['No YAML frontmatter found'] };
}

// Claude Code format validation - IMPLEMENTED
const metadata = yaml.load(frontmatter);
if (metadata.role && metadata.model) {
  return validateClaudeCodeFormat(metadata);
}
```

#### Broken Validation (OpenCode):
```typescript
// OpenCode detection logic exists but validation missing
if (metadata.agent || metadata.model) {
  // TODO: Implement OpenCode validation  
  return { isValid: false, format: 'unknown', errors: ['Unknown agent format'] };
}
```

#### Root Problems:
1. **Detection works**: System correctly identifies OpenCode format via `metadata.agent` 
2. **Validation missing**: No validation logic implemented for OpenCode structure
3. **Default rejection**: Falls through to invalid result

### Target Path Resolution Impact

**File**: `src/utils/agent-utils.ts:25-51`

```typescript
const validation = validateAgent(agentPath);
if (validation.format === 'claude-code') {
  return path.join(projectDir, '.claude', 'agents', filename);
} else if (validation.format === 'opencode') {
  return path.join(projectDir, '.opencode', 'agent', filename);
}
```

**Problem**: Since OpenCode validation always fails:
- `validation.format` is never `'opencode'`  
- OpenCode agents would go to `.claude/agents/` if copied (incorrect)
- But they're never copied anyway due to validation failure

### Error Handling Analysis

**Error Patterns Found**:
- **Validation errors**: Logged but don't stop sync process
- **Copy errors**: Collected in arrays for final reporting
- **Silent degradation**: Users see "sync complete" even with validation failures
- **No format-specific guidance**: Generic "unknown format" errors

**Command Error Handling** (`src/cli/commands/sync.ts:15-50`):
- Process exits with code 1 on failures
- Auto-recovery for missing setup directories
- Graceful per-file error handling in batch operations

## Code References

- `src/utils/validation.ts:42-50` - **Primary issue**: Unimplemented OpenCode validation
- `src/core/sync.ts:112` - Validation gate that blocks invalid agents
- `src/core/sync.ts:97-104` - Agent discovery from global directory
- `src/utils/agent-utils.ts:27-35` - Target path resolution based on format
- `src/cli/commands/sync-global.ts:24` - sync-global command entry point

## Architecture Insights

### Design Intent vs Reality
- **Intended**: Single source of truth with format-specific conversion
- **Reality**: Validation-first architecture blocks unrecognized formats
- **Gap**: Format detection implemented but validation not completed

### Global Configuration Paths
- **Global source**: `~/.codeflow/agent/` directory
- **Claude target**: `.claude/agents/`  
- **OpenCode target**: `.opencode/agent/`
- **Path resolution**: Works correctly when validation passes

### Agent Organization Patterns
- **Organized by format**: Agents segregated into format-specific subdirectories
- **Mixed repository**: Base, Claude Code, and OpenCode formats coexist
- **Conversion intended**: Architecture suggests format conversion capability

## Historical Context

Based on codebase examination:
- System originally designed for Claude Code agents only
- OpenCode support added later with detection logic
- Validation implementation incomplete - TODO left in critical path
- Format-specific directory structure exists but validation missing

## Related Research

- `research/research/2025-08-31_codeflow-setup-agents-issue.md` - Related agent copying issues in setup command
- Directory structure suggests comprehensive format conversion system planned

## Open Questions

1. **Validation Requirements**: What validation rules should OpenCode format follow?
2. **Format Detection**: Should frontmatter be required for all agent formats?
3. **Error Reporting**: Should validation failures cause sync to fail or continue with warnings?
4. **Backward Compatibility**: How to handle agents without proper frontmatter?

## Recommended Solution

### Immediate Fix
Implement OpenCode validation in `src/utils/validation.ts:42-50`:

```typescript
// Replace TODO with actual validation
if (metadata.agents && Array.isArray(metadata.agents)) {
  return validateOpenCodeFormat(metadata);
}
```

### Validation Rules for OpenCode Format
Based on format analysis, OpenCode agents should validate:
- `agents` array exists and is non-empty
- Each agent has required fields: `name`, `model`, `provider`, `role`
- Optional fields: `temperature`, additional configuration

### Long-term Improvements
1. **Format-agnostic validation**: Support agents without frontmatter
2. **Better error reporting**: Format-specific validation messages
3. **Validation testing**: Comprehensive test coverage for all formats
4. **Documentation**: Clear format specifications for contributors