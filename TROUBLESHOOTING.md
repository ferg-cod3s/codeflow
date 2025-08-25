# Agentic MCP Troubleshooting Guide

This guide helps resolve common issues when using the Agentic Workflow system with MCP integration.

## Quick Diagnosis

### 1. Check Installation Status

```bash
# Verify agentic CLI is installed
which agentic
agentic --version

# Check if your project has agentic files
agentic status .

# List available commands  
ls .opencode/command/
```

### 2. Test MCP Server

```bash
# Test server startup
timeout 3s bun run /path/to/agentic/mcp/agentic-server.mjs
echo "Exit code: $?"  # Should be 0
```

### 3. Verify Claude Desktop Configuration

Check your Claude Desktop MCP settings file location:
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%/Claude/claude_desktop_config.json`  
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

## Common Issues

### Issue 1: "No .opencode directory found"

**Symptoms:**
```bash
$ agentic pull .
Error: No .opencode directory found at /path/to/project/.opencode
```

**Solution:**
```bash
# Method 1: Use setup script
/path/to/agentic/scripts/setup-project.sh

# Method 2: Manual setup
mkdir -p .opencode/command .opencode/agent
mkdir -p .claude/commands
agentic pull .
```

**Prevention:**
Always set up the directory structure before running `agentic pull`.

---

### Issue 2: "agentic command not found"

**Symptoms:**
```bash
$ agentic pull .
bash: agentic: command not found
```

**Solution:**
```bash
# Navigate to agentic repo and install
cd /path/to/agentic
bun install
bun run install

# Verify installation
which agentic
agentic --version
```

**Alternative:**
```bash
# Use bun run directly
cd /path/to/agentic
bun run src/cli/index.ts pull /path/to/your/project
```

---

### Issue 3: MCP Tools Not Appearing in Claude Desktop

**Symptoms:**
- Claude Desktop doesn't show agentic tools
- "No MCP servers available" message

**Diagnosis Steps:**
1. **Check MCP Configuration:**
   ```bash
   # Check if config file exists
   ls ~/Library/Application\ Support/Claude/claude_desktop_config.json
   
   # View contents
   cat ~/Library/Application\ Support/Claude/claude_desktop_config.json
   ```

2. **Verify Server Path:**
   ```bash
   # Test the exact path from your MCP config
   bun run /full/path/to/agentic/mcp/agentic-server.mjs
   ```

3. **Check Server Startup:**
   ```bash
   # Run server with debug output
   DEBUG=* bun run /path/to/agentic/mcp/agentic-server.mjs
   ```

**Solutions:**

**A. Fix MCP Configuration:**
```json
{
  "mcpServers": {
    "agentic-tools": {
      "command": "bun",
      "args": ["run", "/FULL/ABSOLUTE/PATH/to/agentic/mcp/agentic-server.mjs"],
      "env": {}
    }
  }
}
```

**B. Restart Claude Desktop:**
- Completely quit Claude Desktop (not just minimize)
- Wait 5 seconds
- Restart Claude Desktop

**C. Check Permissions:**
```bash
# Ensure server file is executable
chmod +x /path/to/agentic/mcp/agentic-server.mjs

# Check file ownership
ls -la /path/to/agentic/mcp/agentic-server.mjs
```

---

### Issue 4: "Tool not found" Error in Claude Desktop

**Symptoms:**
- Claude Desktop shows MCP is connected
- But specific tools like `research` return "tool not found"

**Diagnosis:**
```bash
# Check what commands are available from current directory
cd /path/to/your/project
ls -la .opencode/command/

# Test server finds the commands
cd /path/to/your/project
timeout 3s bun run /path/to/agentic/mcp/agentic-server.mjs
```

**Solutions:**

**A. Verify Commands Exist:**
```bash
# Ensure commands are in the right place
ls .opencode/command/
# Should show: commit.md document.md execute.md plan.md research.md review.md test.md
```

**B. Reinstall Commands:**
```bash
# Remove and reinstall
rm -rf .opencode/command/*
agentic pull .
```

**C. Check File Format:**
```bash
# Verify files are UTF-8 text
file .opencode/command/research.md
# Should show: UTF-8 Unicode text
```

---

### Issue 5: Wrong Commands Being Used

**Symptoms:**
- Commands work but return unexpected content
- Using outdated or wrong command versions

**Diagnosis:**
The MCP server searches in this order:
1. `{current-dir}/.opencode/command/`
2. `{current-dir}/.claude/commands/`
3. `{agentic-repo}/command/`

**Solution:**
```bash
# Check which directory has commands
pwd
ls -la .opencode/command/ 2>/dev/null || echo "No .opencode/command"
ls -la .claude/commands/ 2>/dev/null || echo "No .claude/commands"
ls -la /path/to/agentic/command/

# Remove unwanted command directories
rm -rf .opencode/command/  # Forces use of global commands
# OR
rm -rf .claude/commands/   # Removes Claude-specific commands
```

---

### Issue 6: Server Starts But Doesn't Work

**Symptoms:**
- MCP server starts without errors
- But commands don't execute properly

**Diagnosis:**
```bash
# Check server is finding commands
cd /path/to/your/project
ls .opencode/command/ | wc -l  # Should be 7

# Verify server can read files
head -n 5 .opencode/command/research.md
```

**Solutions:**

**A. Check File Contents:**
```bash
# Ensure command files have content
for cmd in .opencode/command/*.md; do
  echo "=== $cmd ==="
  wc -l "$cmd"
done
```

**B. Test Server Manually:**
```bash
# Create simple test
cd /path/to/your/project
echo "Testing from: $(pwd)"
timeout 5s bun run /path/to/agentic/mcp/agentic-server.mjs &
sleep 2
ps aux | grep agentic-server
```

**C. Check Dependencies:**
```bash
cd /path/to/agentic
bun install --frozen-lockfile
```

---

### Issue 7: Permission Errors

**Symptoms:**
```bash
Error: EACCES: permission denied, open '/path/to/.opencode/command/research.md'
```

**Solution:**
```bash
# Fix permissions on project directory
chmod -R u+rw .opencode/
chmod -R u+rw .claude/

# Fix permissions on agentic installation
cd /path/to/agentic
chmod -R u+rw command/ agent/ mcp/
```

---

### Issue 8: Cross-Platform Issues

**Symptoms:**
- Works on one OS but not another
- Path separator issues

**Solutions:**

**Windows:**
```bash
# Use forward slashes in MCP config
{
  "mcpServers": {
    "agentic-tools": {
      "command": "bun",
      "args": ["run", "C:/path/to/agentic/mcp/agentic-server.mjs"]
    }
  }
}
```

**macOS/Linux with Homebrew Bun:**
```bash
# Specify full bun path if needed
{
  "mcpServers": {
    "agentic-tools": {
      "command": "/opt/homebrew/bin/bun",
      "args": ["run", "/path/to/agentic/mcp/agentic-server.mjs"]
    }
  }
}
```

## Advanced Diagnostics

### Debug Mode

Enable debug output for detailed troubleshooting:

```bash
# Set debug environment variable
DEBUG=agentic:* bun run /path/to/agentic/mcp/agentic-server.mjs

# Or with more verbose output
DEBUG=* bun run /path/to/agentic/mcp/agentic-server.mjs
```

### Log Analysis

Check system logs for MCP-related errors:

```bash
# macOS
log show --predicate 'process == "Claude"' --last 1h

# Linux
journalctl -u claude --since "1 hour ago"

# Windows
# Check Event Viewer > Application Logs
```

### Network Issues

If MCP communication fails:

```bash
# Check if stdio transport is working
echo '{"jsonrpc":"2.0","method":"ping","id":1}' | bun run /path/to/agentic/mcp/agentic-server.mjs

# Test with timeout
timeout 10s bun run /path/to/agentic/mcp/agentic-server.mjs < /dev/null
```

## Getting Help

### Information to Gather

When reporting issues, include:

1. **System Information:**
   ```bash
   uname -a
   bun --version
   agentic --version
   ```

2. **File Structure:**
   ```bash
   find .opencode -name "*.md" | head -10
   find .claude -name "*.md" | head -10
   ```

3. **MCP Configuration:**
   ```bash
   cat ~/Library/Application\ Support/Claude/claude_desktop_config.json
   ```

4. **Error Messages:**
   - Full error output from terminal
   - Claude Desktop error messages
   - System logs if applicable

### Quick Fix Checklist

Before reporting an issue, try these steps:

- [ ] Restart Claude Desktop completely
- [ ] Verify MCP config uses absolute paths
- [ ] Test MCP server startup manually
- [ ] Check file permissions
- [ ] Reinstall commands with `agentic pull .`
- [ ] Test from agentic repo directory
- [ ] Clear any cached configurations

### Reset to Clean State

If all else fails, reset completely:

```bash
# 1. Clean project
rm -rf .opencode .claude

# 2. Reinstall agentic
cd /path/to/agentic
bun install
bun run install

# 3. Setup project fresh
/path/to/agentic/scripts/setup-project.sh /path/to/your/project

# 4. Reset Claude Desktop MCP config
# Edit: ~/Library/Application Support/Claude/claude_desktop_config.json

# 5. Test step by step
cd /path/to/your/project
agentic status .
timeout 3s bun run /path/to/agentic/mcp/agentic-server.mjs
```

This should resolve most configuration and setup issues with the Agentic MCP integration.