# Deprecated Agent Directories

This directory contains the old agent format directories that have been deprecated as part of the migration to a single source of truth architecture.

## What Happened

As of this migration, the Codeflow system now uses a **single source of truth** approach:

- **Source**: `../codeflow-agents/` (base format)
- **Conversion**: On-demand conversion during setup
- **Target**: Project-specific directories with appropriate formats

## Deprecated Directories

- `claude-agents/` - Claude Code format agents (moved here)
- `opencode-agents/` - OpenCode format agents (moved here)

## Why This Change

1. **No Storage Bloat**: Eliminates duplicate agent files
2. **Single Source of Truth**: All agents maintained in one place
3. **On-Demand Conversion**: Faster setup, no pre-computed formats
4. **Easier Maintenance**: Changes made in one location only

## Migration Complete ✅

- ✅ Agents moved to `../codeflow-agents/`
- ✅ Setup process updated to convert on-demand
- ✅ All tests passing
- ✅ Backward compatibility maintained with deprecation warnings

## Future Removal

These directories can be safely removed after:

- All users have migrated to the new system
- All CI/CD pipelines updated
- All documentation updated
- No external dependencies found

## For Reference

If you need to reference the old agent formats for any reason, they are preserved here. However, all new development should use the single source approach with `../codeflow-agents/` as the authoritative source.
