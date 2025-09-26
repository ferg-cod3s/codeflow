# Model Configuration System

## Overview

The Codeflow model configuration system ensures that agents and commands always use the correct model IDs when synced to different platforms (Claude Code, OpenCode, etc.). This prevents the "ProviderModelNotFoundError" that occurs when model IDs are in the wrong format.

## The Problem

Different AI coding assistants expect model IDs in different formats:

- **Claude Code**: Uses model IDs without provider prefix (e.g., `claude-sonnet-4-20250514`)
- **OpenCode**: Requires provider/model format (e.g., `anthropic/claude-sonnet-4-20250514`)

When commands or agents have the wrong format, they fail with errors like:

```
ERROR: ProviderModelNotFoundError
providerID=claude-sonnet-4-20250514 modelID=
```

## The Solution

We've implemented a centralized model configuration system that:

1. Maintains correct model IDs for each platform
2. Automatically fixes model IDs during sync operations
3. Integrates with the catalog system for consistent installations

## Configuration File

The model configuration is stored in `config/models.json`:

```json
{
  "default": {
    "provider": "anthropic",
    "model": "claude-sonnet-4-20250514",
    "full": "anthropic/claude-sonnet-4-20250514",
    "temperature": 0.7
  },
  "opencode": {
    "commands": "anthropic/claude-sonnet-4-20250514",
    "agents": "anthropic/claude-sonnet-4-20250514",
    "fallback": "anthropic/claude-sonnet-4-20250514"
  },
  "claude": {
    "default": "claude-sonnet-4-20250514"
  }
}
```

## Usage

### Quick Sync with Model Fixes

Use the smart sync script to sync all agents and commands with correct models:

```bash
# Using npm/bun scripts
bun run sync:smart       # Sync with automatic model fixes
bun run sync:opencode    # Same as above
bun run fix:models       # Fix models without syncing

# Using scripts directly
./scripts/sync-with-model-config.sh
```

### Manual Model Fixes

If you need to fix models manually:

```bash
# Fix OpenCode command models
./scripts/fix-opencode-models.sh

# Fix OpenCode agent models
./scripts/fix-opencode-agent-models.sh
```

### Catalog Integration

The catalog system automatically applies correct models when installing:

```bash
# Install with automatic model configuration
codeflow catalog install <item-id> --global

# Sync all catalog items with correct models
codeflow catalog sync --global
```

## How It Works

### 1. Smart Sync Script (`sync-with-model-config.sh`)

This script:

- Reads the model configuration from `config/models.json`
- Syncs agents and commands to global directories
- Automatically fixes any incorrect model IDs
- Verifies that all files have correct models

### 2. Model Fixer Class (`src/catalog/model-fixer.ts`)

The TypeScript ModelFixer class:

- Loads model configuration
- Provides methods to fix model IDs in content
- Validates model formats for different targets
- Integrates with the catalog installation process

### 3. Catalog Integration

When installing items through the catalog:

1. Content is converted to the target format
2. ModelFixer applies the correct model ID
3. Content is validated before writing

## Supported Platforms

### Claude Code

- **Location**: `~/.claude/`
- **Model Format**: Without provider (e.g., `claude-3-5-sonnet-20241022`)
- **Directories**: `commands/`, `agents/`

### OpenCode

- **Location**: `~/.config/opencode/`
- **Model Format**: With provider (e.g., `anthropic/claude-3-5-sonnet-20241022`)
- **Directories**: `command/`, `agent/`

## Troubleshooting

### Model Errors in OpenCode

If you see "ProviderModelNotFoundError" in OpenCode:

1. Run `bun run sync:smart` to fix all models
2. Restart OpenCode
3. Try the command again

### Verification

To verify models are correct:

```bash
# Check OpenCode models
grep "^model:" ~/.config/opencode/command/*.md | head -5
grep "^model:" ~/.config/opencode/agent/*.md | head -5

# Should show: model: anthropic/claude-sonnet-4-20250514
```

```bash
# Check Claude Code models
grep "^model:" ~/.claude/commands/*.md | head -5
grep "^model:" ~/.claude/agents/*.md | head -5

# Should show: model: claude-sonnet-4-20250514
```

### Custom Models

To use a different model, edit `config/models.json`:

```json
{
  "opencode": {
    "commands": "anthropic/claude-3-opus-20240229",
    "agents": "anthropic/claude-3-5-sonnet-20241022"
  }
}
```

Then run `bun run sync:smart` to apply the changes.

## Best Practices

1. **Always use sync:smart**: This ensures models are correct across all platforms
2. **Don't edit models manually**: Let the configuration system handle it
3. **Check logs**: The sync script shows which files were fixed
4. **Test after sync**: Run a command in OpenCode to verify it works

## Future Enhancements

- [ ] Auto-detect available models from platform APIs
- [ ] Support for per-agent/command model overrides
- [ ] Model compatibility checking
- [ ] Automatic model fallback for unavailable models
- [ ] Integration with CI/CD pipelines
