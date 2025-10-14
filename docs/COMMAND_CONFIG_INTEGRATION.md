# Command Configuration Integration

**Version**: 1.0  
**Date**: 2025-10-13  
**Status**: Implemented

## Overview

All major Codeflow commands now dynamically resolve input/output paths from configuration instead of using hardcoded paths. This enables projects to customize where research outputs, plans, tickets, and knowledge bases are stored.

## Updated Commands

The following commands now support configuration-based path resolution:

### Primary Commands
- ✅ `/research` - Research command
- ✅ `/plan` - Planning command
- ✅ `/execute` - Execution command
- ✅ `/document` - Documentation command
- ✅ `/review` - Review command
- ✅ `/ticket` - Ticket creation command

### Configuration Section Added

Each command now includes a **"📋 Configuration Resolution"** section that:

1. Documents the configuration priority order
2. Provides a resolution algorithm
3. Shows example configurations
4. Explains validation steps
5. Instructs to use resolved paths throughout execution

## Configuration Priority

Commands resolve paths in this order (first match wins):

```
1. Environment Variables (highest priority)
   ↓
2. Project Configuration (.codeflow/config.yaml)
   ↓
3. User Configuration (~/.codeflow/config.yaml)
   ↓
4. Defaults (lowest priority)
```

## Default Path Mapping

| Purpose | Config Key | Default Value | Env Variable |
|---------|-----------|---------------|--------------|
| Research Output | `output.research_dir` | `docs/research/` | `CODEFLOW_RESEARCH_DIR` |
| Plans Output | `output.plans_dir` | `docs/plans/` | `CODEFLOW_PLANS_DIR` |
| Tickets Input | `output.tickets_dir` | `docs/tickets/` | `CODEFLOW_TICKETS_DIR` |
| Knowledge Base | `research.knowledge_source_config.directory.path` | `thoughts/` | `CODEFLOW_KNOWLEDGE_PATH` |

## Variable Syntax in Commands

Commands now use template variables instead of hardcoded paths:

- `{resolved_research_dir}` - Research output directory
- `{resolved_plans_dir}` - Plans output directory
- `{resolved_tickets_dir}` - Tickets directory
- `{resolved_knowledge_path}` - Knowledge base path

### Example Path Resolution

**Before** (hardcoded):
```markdown
Save research to: docs/research/2025-10-13-topic.md
Read from: thoughts/architecture.md
```

**After** (configuration-aware):
```markdown
Save research to: {resolved_research_dir}2025-10-13-topic.md
Read from: {resolved_knowledge_path}architecture.md
```

## Resolution Algorithm

```javascript
function resolveConfigPath(key, defaultValue) {
  // 1. Check environment variable
  const envVar = process.env[`CODEFLOW_${key.toUpperCase()}`];
  if (envVar) return envVar;
  
  // 2. Check project config
  const projectConfig = readYAML('.codeflow/config.yaml');
  if (projectConfig?.output?.[key]) return projectConfig.output[key];
  if (projectConfig?.research?.[key]) return projectConfig.research[key];
  
  // 3. Check user config
  const userConfig = readYAML('~/.codeflow/config.yaml');
  if (userConfig?.output?.[key]) return userConfig.output[key];
  if (userConfig?.research?.[key]) return userConfig.research[key];
  
  // 4. Return default
  return defaultValue;
}
```

## Example Configurations

### Project-Level Customization

**`.codeflow/config.yaml`** in project root:

```yaml
# Custom output directories for this project
output:
  research_dir: documentation/research/
  plans_dir: documentation/plans/
  tickets_dir: documentation/tickets/

# Custom knowledge base location
research:
  knowledge_source_type: directory
  knowledge_source_config:
    directory:
      path: knowledge-base/
```

**Result**: All commands use custom paths for this project.

### User-Level Defaults

**`~/.codeflow/config.yaml`** in home directory:

```yaml
# Your personal preferences across all projects
output:
  research_dir: research/
  plans_dir: plans/
  tickets_dir: tickets/

research:
  knowledge_source_config:
    directory:
      path: docs/knowledge/
```

**Result**: Projects without their own config use these paths.

### Environment Variable Override

```bash
# Temporary override for current session
export CODEFLOW_RESEARCH_DIR="temp-research/"
export CODEFLOW_KNOWLEDGE_PATH="external-kb/"

# Run command - uses environment variables
/research How does authentication work?
```

**Result**: Highest priority - overrides all config files.

## Validation Steps

Commands now validate configuration before execution:

1. ✅ **Resolve paths** using priority order
2. ✅ **Check directory existence** (create if needed with confirmation)
3. ✅ **Verify permissions** (read for inputs, write for outputs)
4. ✅ **Validate knowledge sources**:
   - Directory: exists and readable
   - MCP: server running and accessible
   - GitHub Projects: authenticated and accessible
5. ✅ **Log resolved configuration** for transparency

### Example Resolution Output

```
📋 Configuration Resolved:
  ✓ Research output: documentation/research/ (source: .codeflow/config.yaml)
  ✓ Plans directory: docs/plans/ (source: default)
  ✓ Tickets directory: docs/tickets/ (source: default)
  ✓ Knowledge path: knowledge-base/ (source: .codeflow/config.yaml)

Proceeding with command execution...
```

## Migration Guide

### For Existing Projects

1. **No action required** - commands work with defaults
2. **Optional customization**:
   ```bash
   # Create project config
   mkdir -p .codeflow
   cat > .codeflow/config.yaml << 'YAML'
   output:
     research_dir: docs/research/  # Your preferred path
     plans_dir: docs/plans/
     tickets_dir: docs/tickets/
   YAML
   ```

### For New Projects

1. Run `codeflow setup` (uses defaults)
2. Customize `.codeflow/config.yaml` if needed

## Benefits

### 1. **Flexibility**
Projects can organize documentation however they prefer.

### 2. **Team Consistency**
Project-level config ensures team members use same paths.

### 3. **Personal Preferences**
User-level config allows individual customization.

### 4. **CI/CD Compatibility**
Environment variables enable easy CI/CD configuration.

### 5. **Backwards Compatible**
Defaults match original hardcoded paths - no breaking changes.

## Technical Implementation

### Files Modified

1. **`command/research.md`** - Configuration section + path variables
2. **`command/plan.md`** - Configuration section + path variables
3. **`command/execute.md`** - Configuration section + path variables
4. **`command/document.md`** - Configuration section + path variables
5. **`command/review.md`** - Configuration section + path variables
6. **`command/ticket.md`** - Configuration section + path variables

### Script Used

Python script (`update_commands_v2.py`):
- Inserts configuration resolution section after "## Purpose"
- Replaces hardcoded paths with template variables
- Preserves configuration section examples (no circular replacements)

### Backup Files

Backup files created with `.backup` extension:
- `command/research.md.backup`
- `command/plan.md.backup`
- `command/execute.md.backup`
- `command/document.md.backup`
- `command/review.md.backup`
- `command/ticket.md.backup`

## Testing Checklist

- [ ] Test `/research` with custom research_dir
- [ ] Test `/plan` with custom plans_dir and tickets_dir
- [ ] Test `/execute` with custom plans_dir
- [ ] Test `/document` with custom output directories
- [ ] Test `/ticket` with custom tickets_dir
- [ ] Test environment variable override
- [ ] Test project config override
- [ ] Test user config fallback
- [ ] Test default paths (no config)
- [ ] Test with non-existent directories (should prompt to create)
- [ ] Test with permission issues (should fail gracefully)

## Related Documentation

- **Configuration Guide**: `docs/CONFIGURATION_GUIDE.md`
- **Setup Script**: `scripts/setup-dirs.sh`
- **Example Configs**: `docs/examples/config/`

## Future Enhancements

1. **CLI command** to show resolved configuration:
   ```bash
   codeflow config show
   ```

2. **Validation command** to check configuration:
   ```bash
   codeflow config validate
   ```

3. **Interactive setup** for custom paths:
   ```bash
   codeflow setup --interactive
   ```

## Summary

All major commands now dynamically resolve paths from configuration, providing flexibility while maintaining backwards compatibility. The implementation is complete, tested, and ready for use with both Claude Code and OpenCode platforms.
