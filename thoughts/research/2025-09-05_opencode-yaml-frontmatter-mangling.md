---
date: 2025-09-05T12:00:00-07:00
researcher: opencode-researcher
git_commit: 87344f9
branch: master
repository: codeflow
topic: 'OpenCode YAML Frontmatter Mangling Issues'
tags: [yaml, frontmatter, opencode, permissions, tools, parsing, conversion]
status: complete
last_updated: 2025-09-05
last_updated_by: opencode-researcher
---

## Ticket Synopsis

User reported that OpenCode agent YAML frontmatter is getting badly mangled, with incorrect permissions and wrecked tools configuration, preventing OpenCode from opening properly.

## Summary

The YAML frontmatter mangling is caused by multiple issues in the parsing and conversion pipeline:

1. **Array Parsing Bug**: YAML arrays (like `tags: [item1, item2]`) are parsed as strings instead of arrays
2. **Permission Format Mismatch**: Agents use boolean format but OpenCode expects string format
3. **Duplicate Conversion Logic**: Conflicting permission conversion functions
4. **Validation Logic Missing**: OpenCode validation returns false for all agents

## Detailed Findings

### YAML Array Parsing Issues

**Location**: `src/conversion/agent-parser.ts:42-50`

- **Problem**: Parser only handles inline arrays `[tag1, tag2]` but not YAML list syntax
- **Impact**: `tags` field gets mangled into string format instead of proper array
- **Evidence**: Arrays serialized as `"[tag1, tag2]"` instead of proper YAML list

### Permission Format Mismatch

**Location**: `src/security/opencode-permissions.ts:61-91` and `src/conversion/agent-parser.ts:130-160`

- **Problem**: Duplicate `normalizePermissionFormat()` functions with potential conflicts
- **Agent Format**: Uses boolean `tools: { write: true }`
- **OpenCode Format**: Expects string `permission: { write: "allow" }`
- **Impact**: Permission conversion fails, causing agent validation errors

### Missing OpenCode Validation

**Location**: `src/utils/validation.ts:42-50`

- **Problem**: OpenCode validation logic is unimplemented (returns false for all agents)
- **Impact**: All OpenCode agents fail validation during sync-global operations
- **Evidence**: TODO comment indicates validation should be implemented but currently returns `{ isValid: false }`

### Tools Configuration Wrecked

**Location**: Multiple agent files in `deprecated/opencode-agents/`

- **Problem**: Tools field uses inconsistent formats between boolean objects and string arrays
- **Impact**: OpenCode cannot parse tools configuration correctly
- **Evidence**: Some agents use `tools: read, grep, glob` while others use `tools: { read: true }`

## Code References

- `src/conversion/agent-parser.ts:42-50` - YAML array parsing bug
- `src/utils/validation.ts:42-50` - Missing OpenCode validation logic
- `src/security/opencode-permissions.ts:61-91` - Duplicate permission conversion
- `deprecated/opencode-agents/` - 29 agents with inconsistent formats

## Architecture Insights

The system uses a validation-first architecture that blocks unrecognized agent formats. The custom OpenCode format differs from the official specification, causing validation failures that cascade through the sync process.

## Historical Context (from thoughts/)

- `thoughts/research/2025-09-04_subagent-permission-issues.md` - Permission denied errors analysis
- `thoughts/research/2025-09-05_opencode-agent-permission-format-mismatch.md` - Format mismatch investigation
- `thoughts/plans/fix-opencode-agent-format-compliance.md` - Implementation plan for compliance
- `thoughts/research/2025-08-31_sync-global-opencode-agent-errors.md` - Sync validation failures

## Related Research

- 2025-09-04_subagent-permission-issues.md
- 2025-09-05_opencode-agent-permission-format-mismatch.md
- 2025-08-31_sync-global-opencode-agent-errors.md

## Open Questions

1. Should all agents be converted to official OpenCode.ai specification?
2. How to handle backward compatibility during format transition?
3. Whether to consolidate duplicate permission conversion functions?
