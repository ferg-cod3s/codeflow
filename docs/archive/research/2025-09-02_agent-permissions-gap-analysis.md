# Agent Permissions Gap Analysis

## Executive Summary

After auditing all 29 OpenCode agents and 29+ Claude Code agents, I've identified key findings about the current permission state and gaps that need to be addressed to achieve the security-first, least-privilege access pattern goal.

## Key Findings

### OpenCode Agents Current State

**Total Agents Reviewed:** 29 agents in `.opencode/agent/`

**Current Permission Format:**
- ✅ All agents have detailed `tools:` blocks with boolean values (e.g., `write: true`, `bash: false`)  
- ✅ All agents have `allowed_directories:` blocks configured
- ❌ **CRITICAL GAP:** No agents have `permission:` blocks with `edit`/`bash`/`webfetch` settings as expected by the plan
- ✅ Agents are already well-categorized by permission levels

**Permission Patterns Identified:**

1. **Review-Only Agents (2 agents)**
   - Example: `code-reviewer`
   - Current: `write: false, edit: false, bash: false, patch: false, read: true, grep: true, glob: true, list: true, webfetch: false`
   - Role: Read-only code analysis

2. **Search-Only Agents (2 agents)**  
   - Examples: `codebase-locator`, `research-locator`
   - Current: `grep: true, glob: true, list: true` (all other tools: false)
   - Role: File and content discovery

3. **Builder Agents (25 agents)**
   - Examples: `full-stack-developer`, `system-architect`, `analytics-engineer`
   - Current: All tools set to `true` 
   - Role: Full development capabilities

### Claude Code Agents Current State

**Total Agents Reviewed:** 29+ agents in `.claude/agents/**/*.md` and `~/.claude/agents/*.md`

**Current Format:**
- ✅ All agents have `tools:` field with comma-separated string values
- ✅ All agents have `name:` and `description:` fields
- ✅ Tool permissions already follow expected patterns

**Permission Patterns:**

1. **Review-Only Agents**
   - Current: `tools: read, grep, glob, list`
   - ✅ Already properly restricted

2. **Search-Only Agents**
   - Current: `tools: grep, glob, list`
   - ✅ Already properly restricted

3. **Builder Agents**
   - Current: `tools: write, edit, bash, patch, read, grep, glob, list, webfetch`
   - ✅ Already have full permissions

## Gap Analysis

### Critical Gaps Identified

1. **OpenCode Permission Format Mismatch**
   - **Expected:** Agents should have `permission:` blocks with `edit`, `bash`, `webfetch` fields
   - **Found:** Agents use detailed `tools:` blocks instead
   - **Impact:** The existing OpenCode permission system (`src/security/opencode-permissions.ts`) expects a different format

2. **Plan Assumptions vs Reality**
   - **Plan assumes:** OpenCode agents need `permission:` blocks added
   - **Reality:** OpenCode agents already have comprehensive `tools:` blocks that are more detailed
   - **Impact:** Need to reconcile plan expectations with actual implementation

3. **Mixed Permission Systems**
   - **Current:** Two different systems coexist (tools vs permission blocks)
   - **Problem:** Potential confusion and inconsistency

### Minor Gaps

1. **Tool Coverage Inconsistency**
   - Some tools appear in OpenCode but not Claude Code format (patch, webfetch)
   - Need standardization across formats

2. **Permission Validation**
   - No automated validation of permission consistency
   - No tests ensuring agents have appropriate restrictions

## Agent Role Classification

Based on current tool usage patterns, I've identified three clear agent roles:

### Reviewer Role (Read-Only)
- **Count:** 2 agents
- **Examples:** code-reviewer
- **OpenCode Tools:** read, grep, glob, list (webfetch varies)
- **Claude Code Tools:** read, grep, glob, list
- **Purpose:** Code analysis and review without modification capability

### Analyzer Role (Search-Only) 
- **Count:** 2 agents
- **Examples:** codebase-locator, research-locator
- **OpenCode Tools:** grep, glob, list (read varies)
- **Claude Code Tools:** grep, glob, list
- **Purpose:** File and content discovery without modification capability

### Builder Role (Full Access)
- **Count:** 25 agents  
- **Examples:** full-stack-developer, system-architect, analytics-engineer
- **OpenCode Tools:** All tools enabled
- **Claude Code Tools:** write, edit, bash, patch, read, grep, glob, list, webfetch
- **Purpose:** Full development and modification capabilities

## Recommendations

### 1. Reconcile Permission Systems (HIGH PRIORITY)

The plan expects OpenCode agents to have `permission:` blocks, but they already have detailed `tools:` blocks. We need to decide:

**Option A:** Convert existing `tools:` blocks to `permission:` blocks
- Pro: Aligns with plan expectations
- Con: Loses granular tool control

**Option B:** Update the plan to work with existing `tools:` format  
- Pro: Leverages existing detailed permissions
- Con: Requires plan modifications

**Recommendation:** Option B - the existing `tools:` format is more detailed and already implements least-privilege principles.

### 2. Standardize Tool Sets

Create consistent tool definitions across both formats:
- Reviewer: `read, grep, glob, list`
- Analyzer: `grep, glob, list, read` 
- Builder: `write, edit, bash, patch, read, grep, glob, list, webfetch`

### 3. Add Permission Validation

Implement automated checks to ensure:
- Agents have appropriate tool restrictions for their roles
- No overly permissive agents in reviewer/analyzer categories
- Consistency between OpenCode and Claude Code formats

### 4. Update Plan Scope

The plan should focus on:
- Creating permission templates that work with existing `tools:` format
- Adding validation tests
- Ensuring consistency rather than format conversion

## Implementation Priority

1. **Phase 2 Modified:** Create templates that work with existing formats
2. **Phase 3 Modified:** Validate and standardize existing OpenCode `tools:` blocks  
3. **Phase 4 Modified:** Validate and standardize existing Claude Code `tools:` fields
4. **Phase 5:** Add comprehensive validation tests

## Risk Assessment

**Low Risk:** The current permission system is already quite robust and follows security best practices.

**Medium Risk:** Format inconsistency could cause confusion, but doesn't create security vulnerabilities.

**High Risk:** None identified - existing permissions are appropriately restrictive.

## Conclusion

The agent permission audit reveals that agents are already well-configured with appropriate security restrictions. The main gap is not missing permissions, but rather a mismatch between plan expectations and current implementation. The existing `tools:` format in OpenCode agents is actually more granular and secure than the proposed `permission:` format.

**Recommendation:** Modify the implementation plan to standardize and validate existing permission formats rather than converting to a different format.