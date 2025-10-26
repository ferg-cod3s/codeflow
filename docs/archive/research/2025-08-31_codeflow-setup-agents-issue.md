---
date: 2025-08-31T12:00:00-05:00
researcher: opencode
git_commit: b53d1cc
branch: master
repository: codeflow
topic: 'Codeflow setup not copying agents for Claude Code projects'
tags: [setup, agents, claude-code, opencode, bug]
status: complete
last_updated: 2025-08-31
last_updated_by: opencode
---

## Ticket Synopsis

User reported that `codeflow setup` command successfully copies commands but fails to copy agents. The issue appears to be specific to Claude Code projects - OpenCode projects may be working correctly for agents.

## Summary

The root cause is a **missing conversion step** in the setup process. The system is designed with `codeflow-agents/` as the single source of truth (base format), but the setup process is not converting agents to the appropriate format for each project type. Instead, it's just copying the base format files directly without any conversion.

**Issues Found:**

1. **Missing agent directories**: `.claude/agents` not configured in `setupDirs` for Claude Code projects
2. **No format conversion**: Agents are copied directly from `codeflow-agents/` without converting to target format
3. **Incorrect source selection**: Should convert from base format to appropriate format for each target directory

## Detailed Findings

### Issue Analysis

#### 1. Missing Agent Directories in Configuration

**File**: `src/cli/setup.ts:14-67`

The `PROJECT_TYPES` array is missing `.claude/agents` for Claude Code projects:

```typescript
{
  name: "claude-code",
  setupDirs: [".claude/commands"],  // ❌ MISSING: ".claude/agents"
  // ...
},
{
  name: "general",
  setupDirs: [".opencode/command", ".opencode/agent", ".claude/commands"],  // ❌ MISSING: ".claude/agents"
  // ...
}
```

**Impact**: Claude Code projects never get agents because `.claude/agents` is not configured to be created.

#### 2. No Format Conversion During Setup

**File**: `src/cli/setup.ts:78-121`

The `copyCommands` function is doing direct file copying without format conversion:

```typescript
// Current logic - just copies files directly
const sourcefile = join(sourceDir, file.name);
const targetFile = join(targetDir, file.name);
await copyFile(sourcefile, targetFile);
```

**Problem**: This copies base format agents directly to project directories without converting them to the appropriate format.

**Expected**: Should parse agents, convert to target format, then serialize:

```typescript
// Parse base format agents
const { agents } = await parseAgentsFromDirectory(sourceDir, 'base');

// Convert to target format
const converter = new FormatConverter();
const targetFormat = setupDir.includes('.claude') ? 'claude-code' : 'opencode';
const convertedAgents = converter.convertBatch(agents, targetFormat);

// Serialize and write
for (const agent of convertedAgents) {
  const serialized = serializeAgent(agent);
  await writeFile(targetFile, serialized);
}
```

#### 3. Agent Directories Exist But Aren't Used

**Verification**: All agent directories exist and contain properly formatted agents:

- `codeflow-agents/`: 29 agents (base format - source of truth)
- `claude-agents/`: 29 agents (Claude Code format - organized in subdirs)
- `opencode-agents/`: 29 agents (OpenCode format - flat structure)

#### 4. Architecture Design Intent

The system is designed for **single source of truth with conversion**:

1. **Source**: `codeflow-agents/` (base format)
2. **Setup Process**: Convert to appropriate format on-demand
3. **Target**: Project-specific directories with correct format

### Code References

- `src/cli/setup.ts:26` - Missing `.claude/agents` in claude-code setupDirs
- `src/cli/setup.ts:60` - Missing `.claude/agents` in general setupDirs
- `src/cli/setup.ts:92-100` - Source directory selection logic
- `src/cli/setup.ts:97` - Hardcoded to use `codeflow-agents` for all agent copies

### Architecture Insights

The system is designed with three agent formats:

1. **Base format** (`codeflow-agents/`) - Source of truth
2. **Claude Code format** (`claude-agents/`) - For Claude Code projects
3. **OpenCode format** (`opencode-agents/`) - For OpenCode projects

The setup process should copy the appropriate format to project directories:

- `.claude/agents/` ← `claude-agents/`
- `.opencode/agent/` ← `opencode-agents/`

### Historical Context

This appears to be a **design oversight** rather than a recent regression. The codebase shows evidence of the three-format system being planned and implemented, but the setup process was never updated to handle the format-specific agent copying.

## Open Questions

1. **Should agents be copied to both formats simultaneously?** The current logic only copies from `codeflow-agents/`, but projects might want format-specific agents.

2. **Is the global `~/.claude/agents/` directory still used?** Some documentation references this global directory for Claude Code.

3. **Should the setup process validate agent format compatibility?** Currently it assumes the source agents are compatible with the target format.

## Solution Implemented ✅

**Implemented single source + conversion approach** to address bloat concerns:

### 1. Added Missing Agent Directories to PROJECT_TYPES

```typescript
{
  name: "claude-code",
  setupDirs: [".claude/commands", ".claude/agents"],  // ✅ Added .claude/agents
},
{
  name: "general",
  setupDirs: [".opencode/command", ".opencode/agent", ".claude/commands", ".claude/agents"],  // ✅ Added .claude/agents
}
```

### 2. Implemented On-Demand Conversion in copyCommands()

**For Commands**: Direct copy (no conversion needed)
**For Agents**: Parse → Convert → Serialize workflow

```typescript
async function copyAgentsWithConversion(
  sourceDir: string,
  targetDir: string,
  targetFormat: 'claude-code' | 'opencode'
) {
  // Parse base format agents from codeflow-agents/
  const { agents } = await parseAgentsFromDirectory(sourceDir, 'base');

  // Convert to target format
  const converter = new FormatConverter();
  const convertedAgents = converter.convertBatch(agents, targetFormat);

  // Serialize and write to project directory
  for (const agent of convertedAgents) {
    const serialized = serializeAgent(agent);
    await writeFile(targetFile, serialized);
  }
}
```

### 3. Updated copyCommands() Logic

```typescript
if (setupDir.includes('agent')) {
  // Use conversion for agent directories
  const sourceDir = join(sourcePath, 'codeflow-agents');
  const targetFormat = setupDir.includes('.claude') ? 'claude-code' : 'opencode';
  const convertedCount = await copyAgentsWithConversion(sourceDir, targetDir, targetFormat);
  fileCount += convertedCount;
} else {
  // Direct copy for commands
  // ... existing logic
}
```

## Architecture Decision: Single Source + Conversion ✅

**Chose single source approach** to address your bloat concerns:

- **No file duplication**: Only `codeflow-agents/` contains the source of truth
- **On-demand conversion**: Conversion happens only when needed during setup
- **Minimal storage**: No redundant copies of agent files
- **Clean maintenance**: Edit in one place, conversion handles the rest
- **Scalable**: Easy to add new agent formats without storage bloat

**Workflow:**

1. **Development**: Edit agents in `codeflow-agents/` (single source of truth)
2. **Setup**: Automatically converts to appropriate format for each project type
3. **Result**: Projects get correctly formatted agents without storage bloat

**Benefits:**

- ✅ Addresses bloat concern (no duplicate files)
- ✅ Maintains single source of truth
- ✅ Automatic format conversion during setup
- ✅ No sync complexity between multiple directories
- ✅ Easy to add new agent formats

## Related Research

- `research/plans/agent-format-validation-fixes.md` - Details the three-format agent system
- `research/research/2025-08-30_agent-format-validation.md` - Agent format analysis and validation
- `docs/ARCHITECTURE_OVERVIEW.md` - System architecture documentation
