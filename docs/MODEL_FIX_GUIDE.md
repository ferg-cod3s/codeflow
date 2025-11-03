# Model Configuration Fix Guide

This guide explains how to fix model configurations for OpenCode and Claude Code agents and commands.

## Problem

The original issue was that global agents were only setting models for Claude Code, not OpenCode. This was because:

1. **OpenCode stores agents/commands per-project** in `.opencode/agent` and `.opencode/command` directories
2. **Claude Code uses global directories** at `~/.claude/agents` and `~/.claude/commands`
3. The original script incorrectly assumed OpenCode used global directories like `~/.config/opencode/agent`

## Solution

Updated the model fix script to:

1. ✅ **Recognize OpenCode's per-project storage** - no global directories to fix
2. ✅ **Fix Claude Code global agents/commands** as before
3. ✅ **Optional: Fix all OpenCode projects** with `--all-projects` flag
4. ✅ **Provide clear messaging** about what's being fixed

## Usage

### Fix Global Claude Code Agents/Commands

```bash
# Preview changes
npm run fix:models:global -- --dry-run

# Apply changes
npm run fix:models:global
```

### Fix All OpenCode Projects + Global Claude Code

```bash
# Preview changes (recommended first)
npm run fix:models:global:all -- --dry-run

# Apply changes to all discovered projects
npm run fix:models:global:all
```

### Fix Local Project Only

```bash
bun run src/cli/fix-models.ts --local
```

### Advanced Usage

```bash
# Verbose output
bun run src/cli/fix-models.ts --global --verbose

# All projects with verbose output
bun run src/cli/fix-models.ts --global --all-projects --verbose

# Dry run with verbose
bun run src/cli/fix-models.ts --global --dry-run --verbose
```

## What Gets Fixed

### Claude Code (Global)

- **Location**: `~/.claude/agents` and `~/.claude/commands`
- **Model**: Uses `claude-sonnet-4-20250514` (from config/models.json)
- **Format**: No provider prefix (e.g., `claude-sonnet-4-20250514`)

### OpenCode (Per-Project)

- **Location**: `.opencode/agent` and `.opencode/command` in each project
- **Model**: Uses `opencode/grok-code` (from config/models.json)
- **Format**: Provider/model format (e.g., `opencode/grok-code`)

## Configuration

Models are configured in `config/models.json`:

```json
{
  "opencode": {
    "commands": "opencode/grok-code",
    "agents": "opencode/grok-code",
    "fallback": "opencode/code-supernova"
  },
  "claude": {
    "default": "claude-sonnet-4-20250514"
  }
}
```

## Script Details

### Main Script

- **File**: `src/cli/fix-models.ts`
- **Features**:
  - Handles both global and local fixes
  - Supports dry-run mode
  - Verbose logging
  - All-projects discovery

### Wrapper Script

- **File**: `scripts/fix-global-models.js`
- **Purpose**: Easy access for global fixes
- **Usage**: Called via npm scripts

### NPM Scripts

- `fix:models:global` - Fix global Claude Code only
- `fix:models:global:all` - Fix all OpenCode projects + global

## Troubleshooting

### "No OpenCode projects found"

- The script searches in `~/src`, `~/projects`, `~/development`, and `~`
- Make sure your projects contain `.opencode/agent` or `.opencode/command` directories

### "Permission denied"

- Ensure the script has execute permissions: `chmod +x scripts/fix-global-models.js`

### Models still incorrect after fix

- Check `config/models.json` for correct model values
- Verify the target directories exist
- Use `--verbose` flag for detailed output

## Development

To modify the fix behavior:

1. **Edit models**: Update `config/models.json`
2. **Change search paths**: Modify `fixAllOpenCodeProjects()` in `src/cli/fix-models.ts`
3. **Add new platforms**: Extend `fixModel()` method in `src/catalog/model-fixer.ts`

## Related Files

- `src/cli/fix-models.ts` - Main fix script
- `src/catalog/model-fixer.ts` - Model fixing logic
- `config/models.json` - Model configuration
- `scripts/fix-global-models.js` - Wrapper script
