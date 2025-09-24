---
date: 2025-09-10T12:00:00-05:00
researcher: opencode
git_commit: 9019bee
branch: master
repository: codeflow
topic: 'Agent Conversion and Global Sync Issues'
tags: [agent-conversion, global-sync, yaml-formatting, permission-conversion, opencode-failures]
status: complete
last_updated: 2025-09-10
last_updated_by: opencode
---

## Ticket Synopsis

User reported problems with agent conversion between base agents and opencode agents, specifically issues with global sync causing opencode to fail to open due to YAML formatting problems and possible permission conversion issues.

## Summary

The research identified multiple root causes for agent conversion failures between base and opencode formats, primarily affecting global sync operations. Key issues include YAML formatting inconsistencies, permission format mismatches, sync logic errors, and validation failures that prevent opencode from opening properly. The analysis revealed that these problems stem from duplicated conversion logic, format detection errors, and incomplete error handling in the sync pipeline.

## Detailed Findings

### YAML Formatting Problems

**Root Cause**: Inconsistent YAML serialization and parsing between base and opencode formats, particularly with array fields and frontmatter structure.

**Specific Issues**:

- Array fields (tags, allowed_directories) incorrectly serialized as flow-style `[item1, item2]` instead of block-style
- Malformed frontmatter causing parse failures
- Missing or extra `---` delimiters breaking YAML structure

**Impact**: Agents fail to parse during conversion, causing sync to skip them or write invalid files.

**Code References**:

- `src/yaml/yaml-processor.ts:46-86` - YAML parsing logic
- `src/yaml/array-parser.ts:14-250` - Array serialization handling
- `scripts/fix-allowed-directories-format.js:14-80` - Script to fix array formatting issues

### Permission Conversion Issues

**Root Cause**: Format mismatch between base agents (using `tools:` with boolean values) and opencode agents (requiring `permission:` with string values).

**Specific Issues**:

- Boolean `tools: { read: true }` not properly converted to string `permission: { read: "allow" }`
- Duplicated normalization logic in multiple files causing inconsistent results
- Missing permission fields causing validation failures

**Impact**: OpenCode fails to open agents due to permission format incompatibilities, resulting in permission denied errors.

**Code References**:

- `src/conversion/format-converter.ts:281-313` - Permission conversion functions
- `src/conversion/agent-parser.ts:134-173` - Permission normalization logic
- `src/conversion/validator.ts:460-493` - Permission validation rules

### Global Sync Integration Problems

**Root Cause**: Sync logic fails to handle conversion errors gracefully, leading to partial syncs and missing agents.

**Specific Issues**:

- Missing `AGENT_MANIFEST.json` causes sync to abort completely
- File watcher race conditions during rapid changes
- Format detection errors causing wrong conversion paths
- Error aggregation without proper recovery mechanisms

**Impact**: Incomplete agent registry in opencode, causing some agents to be unavailable or improperly configured.

**Code References**:

- `src/sync/canonical-syncer.ts:42-95` - Main sync logic
- `src/sync/file-watcher.ts:219-251` - File change handling
- `src/sync/canonical-syncer.ts:157-175` - File sync decision logic

### Validation and Error Handling Gaps

**Root Cause**: Strict validation prevents invalid agents from syncing, but error messages are insufficient for debugging.

**Specific Issues**:

- Agents with validation errors are silently skipped during sync
- No clear indication of which agents failed or why
- Fallback parsing attempts may produce incorrect results

**Impact**: Difficult to diagnose why specific agents are missing from opencode after sync.

**Code References**:

- `src/conversion/agent-parser.ts:254-294` - Fallback parsing logic
- `src/conversion/validator.ts:108-217` - Agent validation rules
- `src/sync/canonical-syncer.ts:86-91` - Error handling in sync

## Code References

- `src/conversion/format-converter.ts:43-77` - Base to OpenCode conversion logic
- `src/conversion/agent-parser.ts:205-294` - Agent file parsing with error handling
- `src/sync/canonical-syncer.ts:27-230` - Complete sync implementation
- `src/yaml/yaml-processor.ts:46-86` - YAML processing and serialization
- `src/conversion/validator.ts:460-493` - Permission and format validation

## Architecture Insights

**Conversion Pipeline Flow**:

1. Agent file read and YAML parsing
2. Permission/tools normalization
3. Format conversion (base ↔ opencode)
4. YAML serialization for target format
5. Validation before sync
6. File writing to target directories

**Key Architectural Problems**:

- Duplicated conversion logic across multiple files
- No single source of truth for format specifications
- Error handling that prioritizes continuation over correctness
- Lack of comprehensive validation before sync operations

**Design Recommendations**:

- Consolidate conversion logic into a single, well-tested module
- Implement comprehensive pre-sync validation with detailed error reporting
- Add format detection and conversion verification steps
- Improve error handling to fail fast with clear diagnostics

## Historical Context (from thoughts/)

**Previous Research**:

- `thoughts/research/2024-03-12_agent_conversion_failures.md` - Analysis of common conversion errors
- `thoughts/research/2024-02-28_yaml_formatting_edge_cases.md` - YAML formatting investigation
- `thoughts/research/2024-01-20_permission_conversion_analysis.md` - Permission conversion research
- `thoughts/research/2024-04-05_global_sync_failures.md` - Historical sync failure analysis

**Implementation Plans**:

- `thoughts/plans/agent-conversion-improvements.md` - Conversion reliability improvements
- `thoughts/plans/yaml-normalization-strategy.md` - YAML normalization approach
- `thoughts/plans/permission-sync-fix.md` - Permission conversion fixes

**Key Historical Insights**:

- Single source of truth established in `codeflow-agents/` directory
- Automated conversion and validation implemented via `codeflow convert-all`
- Unified YAML processor and validation engine deployed
- Role-based permission templates standardized

## Related Research

- `thoughts/research/2025-09-05_opencode-agent-permission-format-mismatch.md` - Recent permission format analysis
- `thoughts/research/2025-09-06_opencode-agent-validation-failures.md` - Validation failure investigation
- `thoughts/research/2025-09-07_yaml-normalization-edge-cases.md` - YAML edge case handling

## Open Questions

1. Are there any remaining agents that haven't been audited for OpenCode YAML spec compliance?
2. Should the sync process be changed to fail fast on validation errors rather than skipping agents?
3. Is there a need for better error reporting and diagnostics during the conversion process?
4. How can we prevent format drift between different agent directories?
5. Should permission conversion be made more lenient to handle edge cases?
