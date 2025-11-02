---
title: Setup Agents - API Reference
audience: api
version: v0.4.0
feature: setup-agents
---

## CLI Command: `codeflow setup`

Enhanced setup command that now copies both commands and agents with automatic format conversion.

### Syntax

```bash
codeflow setup [project-path] [options]
```

### Parameters

| Parameter      | Type   | Required | Default | Description               |
| -------------- | ------ | -------- | ------- | ------------------------- |
| `project-path` | string | No       | `.`     | Path to project directory |

### Options

| Flag            | Type    | Default | Description                                        |
| --------------- | ------- | ------- | -------------------------------------------------- |
| `--type <type>` | string  | `auto`  | Project type: `claude-code`, `opencode`, `general` |
| `--force`       | boolean | `false` | Overwrite existing setup                           |
| `--help`        | boolean | `false` | Show help information                              |

### Project Types

#### `claude-code`

- **Creates**: `.claude/commands/`, `.claude/agents/`
- **Agents**: 29 agents converted to Claude Code format
- **Commands**: 7 slash commands
- **Use Case**: Claude Code native integration

#### `opencode`

- **Creates**: `.opencode/command/`, `.opencode/agent/`
- **Agents**: 29 agents converted to OpenCode format
- **Commands**: 7 MCP-compatible commands
- **Use Case**: OpenCode/MCP server integration

#### `general`

- **Creates**: Both Claude Code AND OpenCode directories
- **Total Files**: 72 files (36 per platform)
- **Use Case**: Support both platforms simultaneously

### Output Examples

#### Successful Setup

```bash
$ codeflow setup . --type claude-code

🔍 Analyzing project: /path/to/project
📋 Using specified type: Claude Code project with native slash commands
📦 Setting up claude-code configuration...

  ✓ Created directory: .claude/commands
  ✓ Processed 7 files for .claude/commands
  ✓ Created directory: .claude/agents
  ✓ Converted and copied: claude-code/ai-integration-expert.md
  ✓ Converted and copied: claude-code/codebase-analyzer.md
  [... 27 more agents ...]
  ✓ Processed 29 files for .claude/agents
  ✓ Updated README.md with usage instructions
  ✓ Updated .gitignore to preserve codeflow files

✅ Successfully set up claude-code project!
📁 Installed 36 files
```

#### Existing Setup Detection

```bash
$ codeflow setup .

⚠️  Project appears to already have codeflow setup.
   Use --force to overwrite, or 'codeflow status .' to check current state.
```

### Files Created

#### Commands Directory Structure

```
.claude/commands/          # Claude Code
├── commit.md
├── document.md
├── execute.md
├── plan.md
├── research.md
├── review.md
└── test.md

.opencode/command/         # OpenCode
├── commit.md
├── document.md
├── execute.md
├── plan.md
├── research.md
├── review.md
└── test.md
```

#### Agents Directory Structure

```
.claude/agents/            # Claude Code format
├── ai-integration-expert.md
├── api-builder.md
├── codebase-analyzer.md
├── codebase-locator.md
├── codebase-pattern-finder.md
[... 24 more agents ...]
└── ux-optimizer.md

.opencode/agent/           # OpenCode format
├── ai-integration-expert.md
├── api-builder.md
├── codebase-analyzer.md
[... same 29 agents in OpenCode format ...]
```

### Error Codes

| Error                           | Cause                              | Resolution                    |
| ------------------------------- | ---------------------------------- | ----------------------------- |
| `❌ Invalid project path`       | Path doesn't exist or inaccessible | Check path and permissions    |
| `❌ Source directory not found` | Codeflow installation incomplete   | Run `codeflow pull` first     |
| `❌ Failed to parse agents`     | Corrupted agent files              | Check source agent files      |
| `❌ Failed to write [file]`     | Permission or disk space issue     | Check file system permissions |

### Performance Characteristics

| Agent Count | Setup Time | Memory Usage |
| ----------- | ---------- | ------------ |
| 29 agents   | ~9ms       | Minimal      |
| 100 agents  | ~31ms      | Low          |
| 1000 agents | ~0.3s      | Moderate     |

### Integration Points

#### With Existing Commands

- **`codeflow status`**: Check which files are up-to-date
- **`codeflow pull`**: Ensure source files exist
- **`codeflow sync-formats`**: Update agent formats manually

#### With File System

- **Creates directories**: `.claude/`, `.opencode/`, `.codeflow/`
- **Updates files**: `README.md`, `.gitignore`
- **Preserves existing**: Non-conflicting files are preserved

#### With Agent System

- **Source**: `codeflow-agents/` (base format)
- **Conversion**: Automatic format conversion during setup
- **Validation**: Format compatibility checking
- **Error Recovery**: Graceful handling of conversion failures

### Configuration Files

#### `.claude/claude_config.json` (Auto-created)

```json
{
  "commands": {
    "enabled": true,
    "directory": "commands"
  }
}
```

#### `.gitignore` Updates

```
# Keep codeflow Claude Code commands
!.claude/

# Keep codeflow OpenCode commands and agents
!.opencode/
```

### Backward Compatibility

- **Existing projects**: Work unchanged
- **Old setup behavior**: Preserved for non-agent directories
- **Migration**: Run `codeflow setup . --force` to add agents to existing projects
- **No breaking changes**: Purely additive functionality
