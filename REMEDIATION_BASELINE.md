# Format Remediation: Using Updated Agentic-Standard Format as Baseline

**Date:** 2025-10-28
**Purpose:** Clarify that we use updated agents/commands that follow agentic standards

---

## Key Decision

**The FORMAT REMEDIATION will use the updated agents and commands that follow agentic repository standards as the authoritative baseline for all work.**

This ensures:
- ✅ All conversions start from a clean, valid baseline
- ✅ Compatibility with agentic repository standards
- ✅ Proper $ARGUMENTS handling in SST/OpenCode
- ✅ Consistent format across all 281 agents and 25 commands

---

## Updated Files Location

### Updated Agents
**Location:** `base-agents/` directory (untracked files)

Files following agentic format exactly:
- `base-agents/analyzer.md`
- `base-agents/architect.md`
- `base-agents/developer.md`
- `base-agents/deployer.md`
- `base-agents/integrator.md`
- `base-agents/locator.md`
- `base-agents/optimizer.md`
- `base-agents/researcher.md`
- And many more...

**Format:** Agentic-standard YAML with proper structure
```yaml
---
name: agent-name
description: Brief description
mode: subagent
temperature: 0.1
category: development
tags:
  - tag1
tools:
  read: true
  write: true
  bash: true
---

# Agent content
```

### Updated Commands
**Location:** `command/` directory (untracked files)

Commands following proper metadata format:
- `command/research.md`
- `command/plan.md`
- `command/execute.md`
- And others...

**Format:** Agentic-standard with proper tools metadata
```yaml
---
name: command-name
description: What it does
allowed-tools: read, write, bash
argument-hint: "describe args"
model: sonnet
---

# Command content
```

---

## Remediation Strategy

### Phase 1: Use Updated Format as Baseline
- ✅ Updated agents/commands are the canonical source
- ✅ They follow agentic standards exactly
- ✅ No YAML errors or format issues
- ✅ Ready for immediate conversion

### Phase 2: Upgrade Legacy Agents
- ❌ Legacy agents in subdirectories have format issues
- ✅ Fix YAML syntax (double separators)
- ✅ Remove non-standard fields
- ✅ Upgrade to match updated format

### Phase 3: Generate Platform Conversions
- ✅ Start from updated/upgraded agentic-standard format
- ✅ Convert to Claude Code format (.claude/agents/)
- ✅ Convert to OpenCode format (.opencode/agent/)
- ✅ Convert commands to platform-specific versions

### Phase 4: Validation & Testing
- ✅ Validate all conversions from agentic baseline
- ✅ Test $ARGUMENTS handling
- ✅ Verify cross-platform compatibility

---

## What Makes Updated Format Valid

### Agents
✅ Valid YAML with single `---` separator pair
✅ No non-standard fields in frontmatter
✅ Proper tool declarations as boolean object
✅ Clear mode and temperature settings
✅ Compatible with agentic conversion pipeline
✅ Ready for platform-specific conversions

### Commands
✅ Using `allowed-tools` instead of `tools:`
✅ Comma-separated tool list format
✅ Proper `argument-hint` for user guidance
✅ Model specified correctly
✅ $ARGUMENTS properly recognized
✅ Following agentic command standards

---

## Why This Matters

### Without Updated Format
❌ Multiple format variants in codebase
❌ Inconsistent YAML across agents
❌ Non-standard fields cause parsing issues
❌ Conversions become unreliable
❌ $ARGUMENTS handling fails
❌ Cross-platform compatibility uncertain

### With Updated Format as Baseline
✅ Single source of truth
✅ Valid YAML everywhere
✅ Consistent structure all agents
✅ Reliable conversions possible
✅ $ARGUMENTS work correctly
✅ Cross-platform compatibility assured

---

## Action Items

1. **Reference Updated Format**
   - Use `base-agents/` files as format reference
   - Compare legacy agents to updated format
   - Upgrade all agents to match

2. **Fix Legacy Issues**
   - Remove double `---` separators
   - Remove non-standard fields
   - Align structure with agentic spec

3. **Validate Against Baseline**
   - After each fix, compare to updated format
   - Ensure 100% format compatibility
   - Test conversion pipeline

4. **Generate Conversions**
   - Start from agentic-standard format
   - Apply platform-specific rules
   - Generate all platform versions

---

## Files Updated

- **FORMAT_REMEDIATION_PLAN.md** - Complete execution plan referencing agentic baseline
- **This document** - Explains updated format baseline approach

---

## Timeline

| Step | Action | Duration |
|------|--------|----------|
| 1 | Use updated format as baseline | Start |
| 2 | Fix legacy agents to match | 1-2 hours |
| 3 | Generate platform conversions | 1 hour |
| 4 | Validate from agentic baseline | 1 hour |
| **Total** | **Complete remediation** | **~5 hours** |

---

## Success = Agentic-Standard Compliance

When remediation is complete:
- ✅ All 281 agents follow agentic standards
- ✅ All 25 commands follow agentic standards
- ✅ Updated format is the single source of truth
- ✅ All conversions work reliably
- ✅ $ARGUMENTS recognized in all commands
- ✅ Cross-platform compatibility verified

---

**Status:** Ready for Remediation Execution
**Baseline:** Updated agents/commands in base-agents/ and command/ directories
**Target:** 100% agentic-standard compliance across all 281 agents and 25 commands
