# Migrating from Agentic to Codeflow

This guide helps existing users of the "agentic" workflow system migrate to the new "codeflow" automation enhancement system.

## Overview of Changes

The core functionality remains the same, but the system has been enhanced with:
- **Better CLI experience** with more intuitive commands
- **Automatic synchronization** with file watching
- **Format conversion system** for agent compatibility
- **Enhanced MCP integration** with improved performance
- **Cross-platform testing** and validation
- **Global configuration management**

## Breaking Changes

### 1. CLI Command Renamed
- **Old**: `agentic` command
- **New**: `codeflow` command

### 2. Directory Structure Changes
- **Old**: Projects used `.opencode/` directory
- **New**: Projects use `.codeflow/` directory (with backward compatibility)

### 3. MCP Server Name Change
- **Old**: `agentic-tools` MCP server
- **New**: `codeflow-tools` MCP server

### 4. NPM Package Name
- **Old**: `@agentic/mcp-server` (if you were using NPX)
- **New**: `@codeflow/mcp-server`

### 5. Command Changes
- **Old**: `agentic pull [project]` - Copy files to project
- **New**: `codeflow setup [project]` - Full project setup and initialization
- **New**: `codeflow sync [project]` - Synchronize with global configuration
- **New**: `codeflow watch start` - Automatic file watching and sync

## Step-by-Step Migration Instructions

### Step 1: Uninstall Old CLI

```bash
# If you had the old agentic CLI globally linked
bun unlink agentic

# If you had npm/npx version
npm uninstall -g @agentic/mcp-server
```

### Step 2: Install New Codeflow CLI

```bash
# Clone or navigate to the codeflow repository
cd /path/to/codeflow

# Install dependencies and link globally
bun install
bun run install

# Verify installation
codeflow --version
```

### Step 3: Update MCP Configuration

#### Claude Desktop Configuration

**Old configuration** in `~/.../Claude/claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "agentic-workflows": {
      "command": "npx", 
      "args": ["@agentic/mcp-server"]
    }
  }
}
```

**New configuration**:
```json
{
  "mcpServers": {
    "codeflow-workflows": {
      "command": "node", 
      "args": ["/path/to/codeflow/mcp/codeflow-server.mjs"]
    }
  }
}
```

Or use automatic configuration:
```bash
codeflow mcp configure claude-desktop
```

### Step 4: Migrate Existing Projects

For each project that was using the old agentic system:

```bash
# Navigate to your project
cd ~/my-existing-project

# Run codeflow setup (automatically detects and migrates .opencode directories)
codeflow setup .

# Verify migration
codeflow status .
```

**What happens during migration:**
- Existing `.opencode/` directories are preserved and copied to `.codeflow/`
- Agent and command files are validated and updated if needed
- New enhanced commands and agents are added
- Backward compatibility is maintained

### Step 5: Update Workflows and Scripts

#### Replace Command References

**In shell scripts or documentation:**
```bash
# Old
agentic pull ~/my-project
agentic status ~/my-project

# New  
codeflow setup ~/my-project
codeflow status ~/my-project
codeflow sync ~/my-project
```

#### Update Slash Commands

Slash commands (`/research`, `/plan`, `/execute`, etc.) remain the same and work immediately after migration.

### Step 6: Set Up Global Configuration (Recommended)

The new system supports global agent and command management:

```bash
# Set up global configuration
codeflow global setup

# Enable automatic synchronization
codeflow watch start --global

# Check global status
codeflow global status
```

### Step 7: Test New Features

Try out the enhanced features:

```bash
# Test format conversion
codeflow convert --source base --target claude-code --project ~/my-project

# Test file watching (in development)
codeflow watch start --project ~/my-project

# Test MCP server
codeflow mcp start
codeflow mcp status
```

## New Features Available After Migration

### 1. Automatic Synchronization
```bash
# Start watching for changes and auto-sync
codeflow watch start --global
```

### 2. Agent Format Conversion
```bash
# Convert between Claude Code and OpenCode formats
codeflow convert --source claude-code --target opencode --project .
```

### 3. Enhanced Status and Diagnostics
```bash
# Comprehensive project status
codeflow status ~/my-project

# Global configuration status  
codeflow global status
```

### 4. Improved MCP Integration
```bash
# Better MCP server management
codeflow mcp start --background
codeflow mcp configure claude-desktop
codeflow mcp logs
```

## Troubleshooting Common Issues

### Issue: "Command not found: codeflow"

**Solution:**
```bash
# Ensure proper installation
cd /path/to/codeflow
bun run install

# Check if CLI is linked
ls -la $(which codeflow)
```

### Issue: MCP Server Not Working

**Solution:**
```bash
# Remove old configuration
# Edit ~/.../Claude/claude_desktop_config.json and remove agentic-workflows entry

# Configure new MCP server
codeflow mcp configure claude-desktop

# Restart Claude Desktop
```

### Issue: Project Not Recognizing New Commands

**Solution:**
```bash
# Re-setup the project
codeflow setup ~/problematic-project

# Force sync
codeflow sync ~/problematic-project

# Check status
codeflow status ~/problematic-project
```

### Issue: Agent Parsing Errors

**Solution:**
```bash
# The new system has better error handling
# Check specific errors with:
codeflow status ~/my-project --verbose

# Common fixes are automatically applied during setup
codeflow setup ~/my-project
```

### Issue: Performance Problems

**Solution:**
```bash
# The new system includes performance optimizations
# Enable file watching for better performance during development
codeflow watch start --project ~/my-project

# Check system performance
codeflow diagnose performance
```

## Backward Compatibility

### Existing Files
- **`.opencode/` directories**: Automatically detected and migrated
- **Agent files**: Automatically validated and fixed if needed
- **Command files**: Work without changes
- **Slash commands**: Continue working immediately

### Claude Desktop
- Old MCP configuration will continue to work during transition
- Gradual migration is supported - you can run both systems temporarily

### NPX Usage
- `npx @agentic/mcp-server` will be deprecated but may continue working
- Migrate to `codeflow mcp start` for better performance and features

## Getting Help

### Documentation
- [Complete Documentation](./README.md)
- [Architecture Overview](./ARCHITECTURE_OVERVIEW.md)  
- [MCP Integration Guide](./MCP_INTEGRATION.md)
- [Troubleshooting Guide](./TROUBLESHOOTING.md)

### Command Line Help
```bash
# General help
codeflow --help

# Command-specific help
codeflow setup --help
codeflow mcp --help
codeflow convert --help
```

### Common Commands Reference

| Old Agentic Command | New Codeflow Command | Notes |
|-------------------|-------------------|-------|
| `agentic pull ~/project` | `codeflow setup ~/project` | Enhanced with full setup |
| `agentic status ~/project` | `codeflow status ~/project` | More detailed output |
| N/A | `codeflow sync ~/project` | New synchronization feature |
| N/A | `codeflow watch start` | New file watching feature |
| N/A | `codeflow convert` | New format conversion |
| N/A | `codeflow mcp configure` | Automatic MCP setup |

### Performance Improvements

After migration, you should experience:
- **Faster CLI operations** (< 2 seconds for most commands)
- **Better file watching** (< 1 second change detection)
- **Improved agent parsing** (< 100ms per agent)
- **Enhanced synchronization** (< 5 seconds for full sync)

## Migration Checklist

- [ ] Uninstall old agentic CLI
- [ ] Install new codeflow CLI  
- [ ] Update Claude Desktop MCP configuration
- [ ] Migrate existing projects with `codeflow setup`
- [ ] Test slash commands still work
- [ ] Update any scripts or documentation
- [ ] Set up global configuration
- [ ] Enable file watching for active projects
- [ ] Test new features (format conversion, enhanced MCP)
- [ ] Verify performance improvements

## Next Steps After Migration

1. **Explore New Features**: Try format conversion and file watching
2. **Set Up Global Config**: Use `codeflow global setup` for team consistency  
3. **Enable Automation**: Use `codeflow watch start --global` for development
4. **Optimize Workflows**: Leverage the enhanced MCP integration
5. **Update Documentation**: Update your team's documentation with new commands

The migration process is designed to be smooth and backward-compatible. Most users should be able to migrate in under 10 minutes while gaining access to significant performance and feature improvements.