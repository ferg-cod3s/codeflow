# CodeFlow MCP Troubleshooting Guide

This guide helps resolve common issues when using the CodeFlow system with MCP integration.

## 🚀 **Quick Setup Verification**

### Verify CodeFlow CLI is installed
```bash
which codeflow
codeflow --version
```

### Check if your project has CodeFlow files
```bash
codeflow status .
```

### Test MCP server connectivity
```bash
timeout 3s bun run /path/to/codeflow/mcp/codeflow-server.mjs
```

## 🔧 **Common Issues & Solutions**

### Issue 1: "No .opencode directory found"

**Symptoms**: Running `codeflow status` returns "Error: No .opencode directory found"

**Solution**: Set up the project first
```bash
# Navigate to your project directory
cd /path/to/your/project

# Set up CodeFlow in the project
codeflow setup .

# Pull global agents and commands
codeflow pull .
```

**Alternative**: Use the setup script if available
```bash
/path/to/codeflow/scripts/setup-project.sh
```

**Prevention**: Always set up the directory structure before running `codeflow pull`.

### Issue 2: "codeflow command not found"

**Symptoms**: `codeflow` command is not recognized

**Solution**: Install and link the CLI
```bash
# Navigate to CodeFlow repo and install
cd /path/to/codeflow
pnpm install
pnpm link

# Verify installation
which codeflow
codeflow --version
```

**Alternative**: Install globally
```bash
cd /path/to/codeflow
pnpm install -g .
```

### Issue 3: MCP Server Connection Failures

**Symptoms**:
- Claude Desktop doesn't show CodeFlow tools
- MCP connection timeout errors
- Server process not starting

**Solutions**:

1. **Check server path and permissions**
```bash
# Verify server exists and is executable
ls -la /path/to/codeflow/mcp/codeflow-server.mjs
chmod +x /path/to/codeflow/mcp/codeflow-server.mjs
```

2. **Test server manually**
```bash
# Test basic server functionality
timeout 3s bun run /path/to/codeflow/mcp/codeflow-server.mjs

# Check for error messages
DEBUG=* bun run /path/to/codeflow/mcp/codeflow-server.mjs
```

3. **Verify MCP client configuration**
```bash
# For Claude Desktop, check config.json
cat ~/.config/claude-desktop/config.json | grep -A 5 -B 5 "codeflow-tools"
```

### Issue 4: Agent Validation Failures

**Symptoms**:
- "Validation failed" errors during conversion
- "Name is required" validation errors
- Mode validation warnings

**Solutions**:

1. **Check agent format compliance**
```bash
# Validate all agents
codeflow validate

# Check specific agent files
codeflow validate --agent agent-name
```

2. **Fix common validation issues**
- Ensure all agents have `name` and `description` fields
- Use valid mode values: `'subagent'`, `'primary'`, or `'agent'`
- Follow naming convention: lowercase letters, numbers, and hyphens only

3. **Regenerate agent formats**
```bash
# Convert all agents to fix format issues
codeflow convert-all --dry-run
codeflow convert-all
```

### Issue 5: Format Conversion Issues

**Symptoms**:
- Conversion errors during `codeflow convert-all`
- Missing agents in output directories
- Data loss during conversion

**Solutions**:

1. **Check source directory structure**
```bash
# Verify source agents exist
ls -la codeflow-agents/
ls -la codeflow-agents/development/
```

2. **Test conversion with dry-run**
```bash
# See what would be converted without making changes
codeflow convert-all --dry-run --format claude-code
codeflow convert-all --dry-run --format opencode
```

3. **Verify round-trip conversion**
```bash
# Test data integrity
codeflow convert-all --format claude-code
codeflow convert-all --format base
codeflow convert-all --format opencode
```

## 🏗️ **Architecture Verification**

### Directory Structure Check
```bash
# Expected structure
codeflow/
├── codeflow-agents/          # Single source of truth (BaseAgent format)
│   ├── development/          # Development-focused agents
│   ├── operations/           # Operations-focused agents
│   └── analysis/             # Analysis-focused agents
├── claude-agents/            # Auto-generated Claude Code format
├── opencode-agents/          # Auto-generated OpenCode format
└── mcp/
    └── codeflow-server.mjs   # MCP server
```

### Agent Format Validation
```bash
# Check agent format compliance
codeflow validate

# Verify conversion works
codeflow convert-all --dry-run

# Test round-trip conversion
codeflow convert-all --format claude-code
codeflow convert-all --format base
```

## 🔍 **Debugging Commands**

### Enable Debug Logging
```bash
# Enable all debug logging
DEBUG=* bun run /path/to/codeflow/mcp/codeflow-server.mjs

# Enable specific debug categories
DEBUG=codeflow:* bun run /path/to/codeflow/mcp/codeflow-server.mjs
```

### Test MCP Server Manually
```bash
# Test basic connectivity
echo '{"jsonrpc":"2.0","method":"ping","id":1}' | bun run /path/to/codeflow/mcp/codeflow-server.mjs

# Test server startup
timeout 10s bun run /path/to/codeflow/mcp/codeflow-server.mjs < /dev/null
```

### Verify CLI Installation
```bash
# Check CLI version and path
codeflow --version

# Verify global installation
which codeflow
```

## 📋 **Troubleshooting Checklist**

### Pre-Setup Verification
- [ ] CodeFlow CLI is installed and linked
- [ ] Project directory has proper permissions
- [ ] Bun runtime is available and working

### Setup Verification
- [ ] `codeflow setup .` completes successfully
- [ ] `.opencode` directory is created
- [ ] `codeflow pull .` downloads agents and commands
- [ ] `codeflow status .` shows proper counts

### MCP Integration Verification
- [ ] MCP server starts without errors
- [ ] Claude Desktop shows CodeFlow tools
- [ ] Tools respond to basic queries
- [ ] Server handles multiple connections

### Agent Validation
- [ ] All agents pass validation
- [ ] Format conversion works correctly
- [ ] Round-trip conversion preserves data
- [ ] No validation warnings or errors

## 🚨 **Emergency Recovery**

### Reset Project Setup
```bash
# Remove existing setup
rm -rf .opencode .claude .codeflow

# Reinstall from scratch
codeflow setup .
codeflow pull .
```

### Reinstall CodeFlow
```bash
# 1. Remove existing installation
bun unlink codeflow
rm -rf node_modules/.bin/codeflow

# 2. Reinstall CodeFlow
cd /path/to/codeflow
pnpm install
pnpm link

# 3. Verify installation
which codeflow
codeflow --version
```

### Reset MCP Configuration
```bash
# Remove MCP client config
rm -rf ~/.config/claude-desktop/config.json

# Reinstall commands
codeflow pull .

# Test MCP server
timeout 3s bun run /path/to/codeflow/mcp/codeflow-server.mjs
```

This should resolve most configuration and setup issues with the CodeFlow MCP integration.
