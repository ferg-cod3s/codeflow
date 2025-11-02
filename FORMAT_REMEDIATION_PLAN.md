# Format Remediation Plan



<!-- VERBALIZED SAMPLING INTEGRATION -->
<!-- ================================ -->

**Selected Strategy**: Code-Path Analysis
**Confidence**: 71.0%

**Available Strategies**:
1. **Code-Path Analysis** (Confidence: 71.0%)
   - Plan: Identify entry points and main execution flows, Trace key decision branches and conditional logic...
2. **Pattern Discovery** (Confidence: 71.0%)
   - Plan: Scan codebase for repeated code structures, Identify naming conventions and architectural patterns...
3. **Architecture Mapping** (Confidence: 71.0%)
   - Plan: Identify major components and modules, Map data flow and dependencies between components...

## Align Agents, Commands, and Docs with Agentic Standards

**Date:** 2025-10-28
**Goal:** Ensure agents, commands, and docs match agentic repository standards for proper $ARGUMENTS handling in SST/OpenCode
**Status:** Ready for execution

---

## Executive Summary

The codeflow project has 281 base agents, 25 commands, and supporting documentation that need format standardization to work properly with OpenCode and Claude Code platforms.

### Key Decision: Using Updated Agent & Command Format
**We will use the updated agents and commands that follow agentic repository standards more closely.** These updated files are the baseline for all conversions and ensure compatibility with SST/OpenCode platforms.

### Current Situation
- ✅ Clean git state on main branch (fully synced with origin/main)
- ✅ Updated agents and commands available following agentic best practices
- ❌ 20+ legacy base agents have invalid YAML (double `---` separators)
- ❌ Non-standard fields in frontmatter (uats_version, spec_version, etc.)
- ❌ Orphaned files (command/.md with empty name field)
- ❌ Inconsistent command metadata (tools vs allowed-tools)
- ⚠️ Incomplete platform conversions (only 9/281 agents converted)

---

## Important: Updated Agents & Commands Available

### What Are the Updated Agents & Commands?

The codeflow repository now includes **updated agents and commands that follow agentic repository standards more closely**. These files are:

- **Already present** in the repository as untracked files
- **Following agentic format** exactly as specified
- **Ready to be the source of truth** for all platform conversions
- **Include proper YAML syntax** with no errors
- **Have correct metadata fields** without non-standard additions
- **Use proper tool declarations** following agentic spec

### Why Use These as Baseline?

✅ **Compatibility:** They match agentic repository standards exactly
✅ **Quality:** No YAML syntax errors or invalid structures
✅ **Completeness:** Properly formatted with all required fields
✅ **Conversion-Ready:** Can be reliably converted to all platforms
✅ **$ARGUMENTS Support:** Proper command metadata ensures argument handling works

### Location of Updated Files

```
base-agents/                    # Updated agents following agentic spec
  ├── analyzer.md
  ├── architect.md
  ├── developer.md
  ├── deployer.md
  ├── ... (and many more)

command/                        # Updated commands following agentic spec
  ├── research.md
  ├── plan.md
  ├── execute.md
  ├── ... (and others)
```

### Integration Strategy

1. **Use updated agents/commands as the canonical format**
2. **Legacy agents get upgraded to match this format**
3. **All platform conversions start from this baseline**
4. **Ensures consistency across all platforms**

---

## Updated Agents & Commands Format Standard

### Source of Truth: Agentic-Compatible Format

The updated agents and commands follow **agentic repository standards** more closely. These serve as the authoritative baseline for all platform conversions:

**Updated Agents Location:** `base-agents/` (individual agent files following agentic spec)
**Updated Commands Location:** `command/` (command files with proper metadata)

### Format Improvements in Updated Files

**Agents now follow this structure:**
```yaml
---
name: agent-name
description: Brief, clear description
mode: subagent
temperature: 0.1
category: development
tags:
  - tag1
  - tag2
tools:
  read: true
  write: true
  bash: true
---

# Agent prompt content
```

**Key improvements:**
- ✅ Valid YAML with single `---` separator pair
- ✅ No non-standard fields in frontmatter
- ✅ Proper tool declarations as boolean object
- ✅ Clear mode and temperature settings
- ✅ Compatible with agentic conversion pipeline
- ✅ Ready for platform-specific conversions

**Commands now follow this structure:**
```yaml
---
name: command-name
description: What the command does
allowed-tools: read, grep, glob, bash
argument-hint: "describe expected arguments"
model: sonnet
---

# Command implementation
```

**Key improvements:**
- ✅ Using `allowed-tools` instead of `tools:`
- ✅ Comma-separated tool list (not object)
- ✅ Proper `argument-hint` for user guidance
- ✅ Model specified correctly
- ✅ $ARGUMENTS properly recognized

### Migration Strategy

1. **Use Updated Format as Baseline**
   - Updated agents/commands are the source of truth
   - These follow agentic standards exactly
   - All conversions start from these files

2. **Legacy Agent Remediation**
   - Fix YAML syntax issues in old agents
   - Remove non-standard fields
   - Upgrade to match updated format

3. **Standardized Conversion**
   - Apply consistent conversion rules
   - Generate platform-specific versions
   - Maintain format integrity across platforms

---

## Critical Issues to Fix

### Issue 1: Invalid YAML Syntax (20+ agents)

**Problem:** Double `---` separators with fields appearing between them

**Example (BROKEN):**
```yaml
---
name: agent-architect
# ... fields ...
tools:
  read: true
---                              # FIRST SEPARATOR

output_format: AGENT_OUTPUT_V1    # INVALID: Fields after first separator
requires_structured_output: true
---                              # SECOND SEPARATOR
```

**Fix:** Move all fields into YAML frontmatter before first separator

**Affected Agents (20+):**
- base-agents/generalist/agent-architect.md
- base-agents/development/full-stack-developer.md
- base-agents/development/api-builder-enhanced.md
- base-agents/operations/devops-operations-specialist.md
- base-agents/business-analytics/growth-engineer.md
- base-agents/operations/deployment-wizard.md
- base-agents/ai-innovation/computer-vision-engineer.md
- base-agents/product-strategy/ecommerce-specialist.md
- base-agents/generalist/ide-extension-developer.md
- base-agents/generalist/onboarding-experience-designer.md
- base-agents/generalist/code-generation-specialist.md
- And ~9 more (full list in validation step)

---

### Issue 2: Non-Standard Frontmatter Fields

**Problem:** Fields not in agentic spec are in YAML frontmatter

**Fields to REMOVE from frontmatter (move to markdown body if needed):**

```yaml
# Remove these fields:
uats_version: "1.0"                      # Non-standard
spec_version: UATS-1.0                   # Non-standard
output_format: AGENT_OUTPUT_V1           # Should be in "Capabilities" section
requires_structured_output: true         # Should be in "Capabilities" section
validation_rules:                        # Should be in "Quality Standards" section
  - must_produce_structured_output
owner: development-practice              # Use git history instead
author: codeflow-core                    # Use git history instead
last_updated: 2025-09-13                 # Use git history instead
```

**Where to move them:**
- `output_format` + `requires_structured_output` → "Capabilities" or "Output Format" section
- `validation_rules` → "Quality Standards" section
- `owner`, `author`, `last_updated` → Remove entirely (use git blame/history)

---

### Issue 3: Orphaned Command File

**File:** `/home/f3rg/src/github/codeflow/command/.md`

**Problem:**
- Empty/invalid filename (just `.md`)
- Empty `name` field
- Corrupted content

**Fix:** Delete the file - it cannot be salvaged

```bash
rm /home/f3rg/src/github/codeflow/command/.md
```

---

### Issue 4: Command Metadata Inconsistency

**Problem:** Commands use `tools:` field but should use `allowed-tools:`

**Current (INCORRECT):**
```yaml
---
name: research
description: ...
tools:                    # WRONG - should be allowed-tools
model: anthropic/claude-sonnet-4
---
```

**Correct format:**
```yaml
---
name: research
description: Research a ticket or provide prompt for ad-hoc research
allowed-tools: read, grep, glob, bash, webfetch
argument-hint: "Path to ticket file or research question"
model: sonnet
---
```

**Affected:** All 25 command files in `/command/`

---

## Frontmatter Standards (Reference)

### Base Agents (Source of Truth)

**Required:**
- `name` - kebab-case unique identifier
- `description` - clear purpose statement

**Optional (recommended):**
- `mode` - `subagent` | `primary` (for dispatch)
- `temperature` - 0-2 range
- `category` - agent category
- `tags` - array of string tags
- `primary_objective` - detailed objective statement
- `anti_objectives` - array of what NOT to do
- `allowed_directories` - array of allowed paths
- `tools` - object with boolean values (e.g., `read: true`)
- `intended_followups` - array of agent names to follow

**REMOVED (do NOT include):**
- `uats_version`, `spec_version` - non-standard
- `output_format`, `requires_structured_output` - move to markdown
- `validation_rules` - move to markdown
- `owner`, `author`, `last_updated` - use git history

**Template:**
```yaml
---
name: agent-name
description: |
  Multi-line description
  of what agent does
mode: subagent
temperature: 0.1
category: development
tags:
  - tag1
  - tag2
primary_objective: |
  Detailed objective
tools:
  read: true
  write: false
  bash: true
intended_followups:
  - next-agent
---
```

---

### Claude Code Agents (Converted)

**Requirements:**
- Strip: mode, temperature, tags, category, primary_objective, anti_objectives
- Convert: `tools` object → comma-separated string
- Convert: Model format (anthropic/claude-sonnet-4 → sonnet)

**Template:**
```yaml
---
name: agent-name
description: "Claude Code agent: Brief description optimized for Claude Code."
tools: read, write, bash
model: sonnet
---
```

---

### OpenCode Agents (Converted)

**Requirements:**
- Keep: name, description, mode, temperature, tags, category
- Convert: `tools` object → `permission` object (true → allow, false → deny)
- Keep: Model as full spec (anthropic/claude-sonnet-4)

**Template:**
```yaml
---
name: agent-name
description: "OpenCode agent: Brief description for OpenCode platform."
mode: subagent
temperature: 0.1
model: anthropic/claude-sonnet-4
permission:
  read: allow
  write: allow
  bash: allow
  edit: allow
  webfetch: deny
tags:
  - tag1
category: development
---
```

---

### Commands

**Required:**
- `name` - kebab-case
- `description` - what command does

**Optional:**
- `allowed-tools` - comma-separated list
- `argument-hint` - hint for user args
- `model` - sonnet (Claude Code) or full spec (OpenCode)

**Template:**
```yaml
---
name: command-name
description: Brief description of what command does
allowed-tools: read, grep, glob, bash
argument-hint: "describe expected arguments"
model: sonnet
---
```

---

## Remediation Execution Plan

### Phase 1: Quick Fixes (Hour 1)

**1.1 Delete orphaned file**
```bash
rm /home/f3rg/src/github/codeflow/command/.md
```

**1.2 Fix invalid YAML in legacy agents**
- For each agent with 3+ `---` separators:
  - Move all fields from after first `---` into YAML frontmatter
  - Remove second `---` separator
  - Verify valid YAML structure
- Compare against updated format in `base-agents/` for reference
- Align with agentic-compatible structure

**1.3 Standardize command metadata**
- For each of 25 commands:
  - Replace `tools:` with `allowed-tools:` (following updated format)
  - Convert model format: `anthropic/claude-sonnet-4` → `sonnet`
  - Add `argument-hint` field if missing
- Reference updated command format as baseline
- Ensure $ARGUMENTS compatibility

---

### Phase 2: Standardize Base Agents (Hour 2-3)

**2.1 Use Updated Format as Baseline**
- Reference the updated agents in `base-agents/` that follow agentic standards
- These define the canonical format for all 281 agents
- Legacy agents should be upgraded to match this format exactly

**2.2 Remove non-standard fields from legacy agents**
- For each of 281 base agents:
  - Remove: uats_version, spec_version (not in agentic spec)
  - Move: output_format → markdown "Capabilities" section
  - Move: requires_structured_output → markdown "Output Format" subsection
  - Move: validation_rules → markdown "Quality Standards" section
  - Remove: owner, author, last_updated (use git history)
- Align structure with updated agent format

**2.3 Verify YAML structure**
- Ensure exactly 2 `---` separators per file (single pair)
- Validate all required fields present (name, description, mode, tools)
- Check field types match agentic specification
- Compare against updated format as reference

---

### Phase 3: Generate Platform Conversions (Hour 4)

**3.1 Convert to Claude Code format (.claude/agents/)**
- Start from agentic-standard updated format in `base-agents/`
- Convert all 281 agents to Claude Code spec
- Apply conversion rules from updated baseline:
  - Keep: name, description (properly formatted)
  - Strip: mode, temperature, tags, category, etc.
  - Convert: tools object → comma-separated string
  - Convert: model to short form (sonnet/opus/haiku)
- Reference updated format as source of truth

**3.2 Convert to OpenCode format (.opencode/agent/)**
- Start from agentic-standard updated format in `base-agents/`
- Convert all 281 agents to OpenCode spec
- Apply conversion rules from updated baseline:
  - Keep: name, description, mode, temperature, tags, category
  - Convert: tools object → permission object (true→allow, false→deny)
  - Keep: model as full spec (anthropic/claude-sonnet-4)
  - Preserve: allowed_directories
- Ensure proper permission defaults

**3.3 Update command conversions**
- Start from updated command format in `command/`
- Apply standards to all 25 commands
- Ensure `allowed-tools` properly converted for each platform
- Verify $ARGUMENTS compatibility across platforms

---

### Phase 4: Validation & Testing (Hour 5)

**4.1 Run validation suite**
```bash
# Validate YAML syntax
bun run validate:yaml

# Validate field compliance
bun run validate:fields

# Validate conversions
bun run validate:conversions
```

**4.2 Test $ARGUMENTS parsing**
- Verify commands properly handle $ARGUMENTS
- Test SST/OpenCode integration
- Confirm cross-platform compatibility

**4.3 Update manifest**
- Generate complete AGENT_MANIFEST.json
- Verify all 281 agents tracked
- Remove duplicates and invalid entries

---

## Testing Checklist

Before committing any changes:

- [ ] No file has more than 2 `---` separators
- [ ] All required fields present in frontmatter
- [ ] No invalid fields in YAML
- [ ] All tools/permission values valid
- [ ] All model values in correct format
- [ ] Names are kebab-case
- [ ] Descriptions meaningful and present
- [ ] Orphaned files removed
- [ ] Commands use `allowed-tools` not `tools`
- [ ] Conversion tests pass
- [ ] AGENT_MANIFEST.json valid and complete
- [ ] $ARGUMENTS properly recognized in commands
- [ ] Cross-platform validation passes

---

## Expected Outcomes

After remediation completes:

✅ **YAML Syntax**
- All 281 base agents valid YAML
- All 25 commands valid YAML
- Zero parsing errors

✅ **Format Compliance**
- Base agents follow agentic spec exactly
- Claude Code agents converted properly
- OpenCode agents converted properly
- Commands have proper metadata

✅ **Platform Integration**
- $ARGUMENTS recognized in all commands
- SST command execution works
- OpenCode dispatch functional
- Claude Code agent loading works

✅ **Manifest & Documentation**
- AGENT_MANIFEST.json complete (281 agents)
- No duplicate entries
- All conversions tracked
- Documentation updated

✅ **Quality Assurance**
- Validation tests pass (100%)
- No conversion errors
- Cross-platform compatibility verified
- Git history clean

---

## Rollback Plan

If issues arise during remediation:

1. **Before starting:** Create backup branch
   ```bash
   git checkout -b backup/format-remediation-$(date +%s)
   git push origin backup/format-remediation-*
   ```

2. **During remediation:** Commit frequently
   ```bash
   git commit -m "Fix: Remediate [section] format issues"
   ```

3. **If needed:** Reset to clean state
   ```bash
   git reset --hard origin/main
   ```

---

## Success Criteria

The remediation is complete when:

1. ✅ All YAML is valid (0 parsing errors)
2. ✅ All agents/commands match agentic spec exactly
3. ✅ Updated agents/commands used as authoritative baseline
4. ✅ Legacy agents upgraded to match updated format
5. ✅ All conversions execute correctly from agentic-standard source
6. ✅ $ARGUMENTS work in all commands (proper allowed-tools format)
7. ✅ Validation tests pass (100%)
8. ✅ AGENT_MANIFEST.json is complete with all 281 agents
9. ✅ Git history is clean with atomic commits
10. ✅ Documentation updated to reference agentic standards
11. ✅ Cross-platform compatibility verified from updated baseline

---

## Next Steps

1. **Review this plan** - Ensure alignment with project goals
2. **Get approval** - Confirm scope and timeline
3. **Create branch** - Start remediation work
4. **Execute phases** - Follow plan sequentially
5. **Validate** - Test at each phase boundary
6. **Commit** - Push changes with clear messages
7. **Document** - Update CLAUDE.md and COMPLIANCE.md

---

## References

- **Agentic Repository:** https://github.com/Cluster444/agentic
- **COMPLIANCE.md:** /home/f3rg/src/github/codeflow/COMPLIANCE.md
- **Agent Format:** base-agents/ directory
- **Command Format:** command/ directory
- **Validation Tests:** tests/ directory

---

**Plan Status:** ✅ Ready for Review and Execution

---

## Timeline Estimate

| Phase | Task | Duration | Start | End |
|-------|------|----------|-------|-----|
| 1 | Quick fixes (orphaned file, YAML) | 1 hour | T+0 | T+1 |
| 2 | Standardize 281 base agents | 2 hours | T+1 | T+3 |
| 3 | Generate conversions | 1 hour | T+3 | T+4 |
| 4 | Validation & testing | 1 hour | T+4 | T+5 |
| - | **Total** | **~5 hours** | - | - |

**Estimated Completion:** Same day execution possible

---

Created: 2025-10-28
Author: Claude Code Agent
Status: Ready for Approval
