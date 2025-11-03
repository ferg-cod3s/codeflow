# CodeFlow Global Setup Guide

This guide covers setting up CodeFlow agents, commands, and skills globally for use across all projects and platforms (Claude Code, OpenCode, Cursor).

## Quick Start

```bash
# Install CodeFlow CLI globally
npm install -g @agentic-codeflow/cli

# Sync agents/commands to global directories
codeflow sync --global

# Verify installation
codeflow status
```

## Global Directory Structure

CodeFlow creates and manages these global directories:

### Claude Code

- **Agents**: `~/.claude/agents/` (137+ agents)
- **Commands**: `~/.claude/commands/` (58+ commands)
- **Skills**: `~/.claude/skills/` (if applicable)

### OpenCode

- **Agents**: `~/.config/opencode/agent/` (137+ agents)
- **Commands**: `~/.config/opencode/command/` (58+ commands)
- **Skills**: `~/.config/opencode/skill/` (if applicable)

### Cursor

- **MCP Config**: `~/.config/Cursor/User/globalStorage/workspace.json`
- **Agents**: Via MCP server configuration

## Platform Integration

### Claude Code

```bash
# Check available agents (files exist in ~/.claude/agents/)
ls ~/.claude/agents/

# Use agents (syntax varies by agent configuration)
claude --print "Use @agent_name to perform task"

# Note: Claude Code agent integration may require additional configuration
```

### OpenCode

```bash
# List available agents
opencode --agent <agent_name> --help

# Use specific agent
opencode --agent accessibility_pro "Help me make this accessible"

# Start OpenCode TUI with agent
opencode --agent python_pro
```

### Cursor

```bash
# Agents are accessed via MCP configuration
# Cursor automatically loads agents from configured MCP servers
```

## Core Commands

### Sync Operations

```bash
# Sync to global directories
codeflow sync --global

# Preview sync changes (dry run)
codeflow sync --global --dry-run

# Force overwrite existing files
codeflow sync --global --force
```

### Status and Validation

```bash
# Check global setup status
codeflow status

# Validate all agents/commands
codeflow validate

# List available items
codeflow list
```

### Project Setup

```bash
# Set up current project with agents/commands
codeflow setup

# Setup specific project type
codeflow setup /path/to/project --type claude-code
codeflow setup /path/to/project --type opencode
codeflow setup /path/to/project --type all
```

## Troubleshooting

### Common Issues

#### 1. "TypeError: path argument must be of type string. Received undefined"

**Cause**: Old version of CLI with `import.meta.dir` bug
**Solution**:

```bash
# Update to latest version
npm install -g @agentic-codeflow/cli@latest

# Or use source directly
bun run /path/to/codeflow/src/cli/index.ts <command>
```

#### 2. "Bun is not defined" Error

**Cause**: Using Bun-specific APIs in Node.js environment
**Solution**:

```bash
# Ensure you're using updated CLI version
npm install -g @agentic-codeflow/cli@latest

# Use Node.js compatible commands
node /path/to/codeflow/dist/cli.js <command>
```

#### 3. Global Sync Not Working

**Cause**: Missing AGENT_MANIFEST.json or permissions issues
**Solution**:

```bash
# Check if manifest exists
ls -la /path/to/codeflow/AGENT_MANIFEST.json

# Fix permissions if needed
chmod 755 ~/.claude/agents
chmod 755 ~/.config/opencode/agent
```

#### 4. Agents Not Recognized by Claude Code

**Cause**: Claude Code may not be configured to load global agents
**Solution**:

```bash
# Verify agents exist in correct location
ls ~/.claude/agents/

# Check Claude Code configuration
cat ~/.claude/settings.json

# Restart Claude Code to reload agents
```

#### 5. OpenCode Agent Access Issues

**Cause**: Incorrect agent invocation syntax or permissions
**Solution**:

```bash
# Use correct syntax
opencode --agent <agent_name> <message>

# Check agent configuration
cat ~/.config/opencode/agent/<agent_name>.md

# Verify agent permissions
grep -A10 "tools:" ~/.config/opencode/agent/<agent_name>.md
```

## File Formats

### Agent Format (YAML Frontmatter)

```yaml
---
name: agent_name
description: Brief description of agent's purpose
category: development|operations|quality-testing|ai-innovation|business-analytics|design-ux|product-strategy|generalist
tools: read,grep,list,glob,edit,write,bash
model: inherit
permissions: file-system,network,execute
---
Agent content here...
```

### Command Format

```yaml
---
name: command_name
mode: command
description: Brief description of command's purpose
version: 1.0.0
inputs:
  - name: parameter_name
    type: string
    required: true
    description: Parameter description
outputs:
  - name: result
    type: string
    description: Output description
---
Command implementation details...
```

## Advanced Usage

### Custom Agent Locations

```bash
# Sync to custom directories
codeflow sync /custom/path --global

# Multiple target directories
codeflow sync --global --target claude-code,opencode
```

### Model Configuration

```bash
# Fix model configurations globally
codeflow fix-models

# Fix models in all projects
codeflow fix-models --all-projects

# Fix models locally only
codeflow fix-models --local
```

### Development and Testing

```bash
# Validate changes before syncing
codeflow validate

# Test specific agent
codeflow info accessibility_pro

# Build manifest from agents
codeflow build-manifest

# Export project setup
codeflow export /path/to/export/file.json
```

## Platform-Specific Notes

### Claude Code

- Agents loaded from `~/.claude/agents/`
- Commands loaded from `~/.claude/commands/`
- Skills loaded from `~/.claude/skills/`
- May require restart for agent changes to take effect
- Agent invocation syntax: `@agent_name` or platform-specific

### OpenCode

- Agents loaded from `~/.config/opencode/agent/`
- Commands loaded from `~/.config/opencode/command/`
- Skills loaded from `~/.config/opencode/skill/`
- Agent invocation: `--agent <name>` flag
- Full TUI support with agent integration

### Skills

Skills are specialized knowledge files that provide domain-specific expertise:

**Available Skills Categories:**

- **Development**: Docker container management, Git workflow management
- **MCP Tools**: Chrome DevTools, Context7 documentation, Coolify management, Playwright automation, Sentry incident response, Socket security analysis
- **Operations**: Kubernetes deployment automation

**Skills Usage:**
Skills are automatically loaded by platforms and provide contextual knowledge when working with related technologies.

### Cursor

- Uses MCP (Model Context Protocol) for agent integration
- Configuration in `~/.config/Cursor/User/globalStorage/workspace.json`
- Automatic agent loading from MCP servers

## Maintenance

### Regular Updates

```bash
# Check for CLI updates
codeflow update

# Resync all global agents/commands
codeflow sync --global --force

# Clean up cache/temp files
codeflow clean --global
```

### Backup and Recovery

```bash
# Export current setup
codeflow export --global > codeflow-backup.json

# Import setup on new machine
codeflow import codeflow-backup.json --global
```

## Getting Help

### Command Help

```bash
# General help
codeflow --help

# Specific command help
codeflow setup --help
codeflow sync --help
codeflow validate --help

# Agent information
codeflow info <agent_name>
```

### Community Support

- **GitHub Issues**: https://github.com/ferg-cod3s/codeflow/issues
- **Documentation**: https://github.com/ferg-cod3s/codeflow/blob/main/docs/
- **Agent Registry**: https://github.com/ferg-cod3s/codeflow/blob/main/docs/AGENT_REGISTRY.md

## Performance Tips

1. **Use `--dry-run`** to preview sync changes before applying
2. **Run `validate`** before syncing to catch issues early
3. **Use `--force`** only when necessary to avoid unintended overwrites
4. **Regular updates** ensure access to latest agents and features
5. **Monitor disk space** - global agents can use significant space with full installation

## Security Considerations

- Global agents have file system access by default
- Review agent permissions before installation
- Regular security scans recommended: `codeflow security-scan --global`
- Keep CLI updated for security patches

---

_This guide covers CodeFlow v0.20.2+. For version-specific issues, check the GitHub repository or run `codeflow --version`._
