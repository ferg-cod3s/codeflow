---
date: 2025-09-05T12:00:00-05:00
researcher: opencode
git_commit: b103caf
branch: master
repository: codeflow
topic: 'OpenCode Agent Permission Format Mismatch - true/false vs allow/deny'
tags: [opencode, agents, permissions, configuration, format-mismatch]
status: complete
last_updated: 2025-09-05
last_updated_by: opencode
---

## Ticket Synopsis

User reported that OpenCode agents are using "true/false" values instead of "allow/deny" and this is causing errors when trying to open OpenCode with the agent directory.

## Summary

The issue stems from a **permission format mismatch** between the Codeflow system's agent definitions and OpenCode's expected permission format. Agents in the `codeflow-agents/` directory use boolean `true`/`false` values in their `tools` section, but OpenCode expects string values `'allow'`/`'deny'` in the `permission` section.

## Detailed Findings

### Root Cause Analysis

#### 1. **Format Inconsistency**

- **Agent Files**: Use boolean format in `tools` section
  ```yaml
  tools:
    write: true
    edit: false
    bash: true
  ```
- **OpenCode Expectation**: Uses string format in `permission` section
  ```yaml
  permission:
    write: allow
    edit: deny
    bash: allow
  ```

#### 2. **Duplicate Conversion Logic**

**Files**: `src/security/opencode-permissions.ts:61-91`, `src/conversion/agent-parser.ts:130-160`

Both files contain identical `normalizePermissionFormat()` and `booleanToPermissionString()` functions, creating potential conflicts and maintenance issues.

#### 3. **Configuration Files**

- **Claude Settings**: `.claude/settings.local.json` correctly uses `allow`/`deny` format
- **Agent Definitions**: `codeflow-agents/` directory uses `true`/`false` format
- **OpenCode Integration**: Expects string-based permissions

### Code References

- `src/security/opencode-permissions.ts:61-91` - Duplicate permission normalization logic
- `src/conversion/agent-parser.ts:130-160` - Duplicate permission normalization logic
- `codeflow-agents/development/code-reviewer.md:11-19` - Example agent using boolean tools format
- `.claude/settings.local.json:3-27` - Claude configuration using correct allow/deny format
- `research/plans/fix-opencode-agent-format-compliance.md` - Previous attempt to address format compliance

### Architecture Insights

#### Current Architecture Issues:

1. **Dual Permission Systems**: Codeflow supports both `tools:` (boolean) and `permission:` (string) formats
2. **Inconsistent Conversion**: Duplicate conversion functions may produce different results
3. **Format Detection**: System attempts to auto-detect and convert between formats
4. **OpenCode Compatibility**: String permissions required for OpenCode integration

#### Permission Flow:

```
Agent Definition (boolean) → normalizePermissionFormat() → OpenCode (string)
     ↓
Claude Settings (string) → Direct usage
```

## Historical Context

### Previous Research

- `research/plans/fix-opencode-agent-format-compliance.md` - Comprehensive plan to convert agents to official OpenCode format
- `research/research/2025-08-31_sync-global-opencode-agent-errors.md` - Related sync issues with OpenCode agents

### Evolution of Permission System

1. **Initial**: Boolean tools format in custom OpenCode agents
2. **Transition**: Added string permission format for OpenCode compatibility
3. **Current**: Dual support with conversion logic
4. **Issue**: Conversion logic duplicated and potentially inconsistent

## Related Research

- `research/plans/agent-format-validation-fixes.md` - Agent format validation improvements
- `research/research/2025-08-26_automated-global-configs-mcp-integration.md` - MCP integration research

## Open Questions

1. **Which conversion logic is authoritative?** - Two identical functions exist
2. **Should agents be converted to use permission format?** - Current approach maintains both formats
3. **Is the dual-format approach sustainable?** - Potential for ongoing compatibility issues

## Recommendations

### Immediate Fix

1. **Consolidate Conversion Logic**: Remove duplicate functions, keep one authoritative version
2. **Standardize Agent Format**: Convert all agents to use `permission:` section with string values
3. **Update Documentation**: Clarify expected permission format for OpenCode agents

### Long-term Solution

1. **Single Source of Truth**: Maintain one permission conversion function
2. **Format Migration**: Gradually migrate all agents to official OpenCode specification
3. **Validation Enhancement**: Add strict validation to prevent format mismatches

### Implementation Steps

1. Remove duplicate `normalizePermissionFormat()` from one of the files
2. Update agent definitions to use `permission:` instead of `tools:` for permissions
3. Test OpenCode integration with updated agent format
4. Update conversion scripts to handle the new format consistently
