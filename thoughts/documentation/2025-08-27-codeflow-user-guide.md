---
title: Codeflow - Complete User Guide
audience: user
version: 0.1.0
date: 2025-08-27
---

# Codeflow User Guide

Complete guide for using Codeflow's intelligent AI workflow management system.

## What is Codeflow?

Codeflow is an automation system that orchestrates 54+ specialized AI agents to handle complex software development workflows. It supports multiple platforms (Claude Code, MCP Protocol, OpenCode) with automatic synchronization and format conversion.

## Installation & Setup

### Quick Installation
```bash
git clone https://github.com/your-org/codeflow.git
cd codeflow
bun install && bun run install

# Verify installation
codeflow --version
```

### Project Setup

Codeflow automatically detects your project type and configures appropriately:

```bash
# Smart setup - detects Claude Code vs MCP needs
codeflow setup ~/my-project

# Force specific integration
codeflow setup ~/my-project --type claude-code   # Claude Code only
codeflow setup ~/my-project --type opencode      # MCP only
codeflow setup ~/my-project --type general       # Both (default)
```

**What happens during setup:**
- Creates `.claude/commands/` and/or `.opencode/` directories
- Copies 7 core workflow commands (research, plan, execute, test, document, commit, review)
- Installs 54+ specialized agents for different domains
- Updates `.gitignore` to preserve codeflow files
- Generates usage documentation in `README.md`

## Core Workflows

### 1. Research → Plan → Execute Pattern

The fundamental codeflow pattern for any development task:

```bash
# In Claude Code - use slash commands
/research "Analyze the authentication system for OAuth integration"
/plan "Create implementation plan based on research findings"  
/execute "Implement OAuth integration following the plan"
/test "Generate comprehensive test suite for OAuth functionality"
/document "Create user guide for OAuth login process"
/commit "Create structured commit for OAuth implementation"
/review "Validate implementation against original plan"
```

```bash
# In MCP clients (Claude Desktop, OpenCode)
# Use tools: research, plan, execute, test, document, commit, review
```

### 2. Agent Orchestration

Codeflow automatically selects appropriate agents based on your task:

**Codebase Analysis:**
- `codebase-locator` - Finds WHERE files exist
- `codebase-analyzer` - Understands HOW code works  
- `codebase-pattern-finder` - Discovers patterns

**Specialized Domains:**
- `development_migrations_specialist` - Database migrations
- `operations_incident_commander` - Incident response
- `quality-testing_performance_tester` - Performance analysis
- `programmatic_seo_engineer` - SEO architecture
- `content_localization_coordinator` - Internationalization

## Platform-Specific Usage

### Claude Code Integration

After setup, use slash commands directly:

```
/research "How does the current caching system work?"
/plan "Add Redis integration to improve cache performance"
/execute "Implement the Redis caching plan"
```

**Benefits:**
- Zero additional setup required
- Commands work immediately
- Native Claude Code experience

### MCP Integration (Claude Desktop, OpenCode)

#### Setup MCP Server
```bash
# Start server from your project directory
cd ~/my-project
codeflow mcp start

# Or start in background
codeflow mcp start --background

# Configure Claude Desktop automatically
codeflow mcp configure claude-desktop
```

#### Manual MCP Configuration
Add to `~/.../Claude/claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "codeflow-tools": {
      "command": "bun",
      "args": ["run", "/path/to/codeflow/mcp/codeflow-server.mjs"]
    }
  }
}
```

## Advanced Features

### Automatic Synchronization

Enable real-time file watching for automatic updates:

```bash
# Watch current project
codeflow watch start

# Watch multiple projects
codeflow watch start --projects ~/project1,~/project2

# Watch with global agent sync
codeflow watch start --global

# Check watch status
codeflow watch status

# View watch logs
codeflow watch logs --follow
```

### Format Conversion

Codeflow automatically converts between three agent formats:

```bash
# Convert all formats in project
codeflow convert-all

# Preview changes without writing
codeflow convert-all --dry-run

# Sync all formats to ensure consistency
codeflow sync-formats

# Check for format differences
codeflow show-format-differences
```

### Global Configuration

Share agents and commands across all projects:

```bash
# Sync agents to global directories (~/.claude/agents/)
codeflow sync-global

# Check global sync status
codeflow status --global

# List format differences
codeflow list-differences
```

## Status & Diagnostics

### Project Status
```bash
# Check current project status
codeflow status .

# Check specific project
codeflow status ~/my-project

# Verbose output with details
codeflow status . --verbose
```

### MCP Server Management
```bash
# Check MCP server status
codeflow mcp status

# List available MCP tools
codeflow mcp list

# Stop background server
codeflow mcp stop
```

### Performance Monitoring
```bash
# Test conversion performance
codeflow convert-all --dry-run

# Check agent registry loading time
# (Should be < 200ms for 54+ agents)
codeflow mcp start
```

## Troubleshooting

### Common Issues

**"Command not found: codeflow"**
```bash
# Re-link CLI globally
cd /path/to/codeflow
bun run install
```

**MCP Server Not Working**
```bash
# Remove old configurations
codeflow mcp configure claude-desktop --remove

# Reconfigure
codeflow mcp configure claude-desktop

# Restart Claude Desktop application
```

**Project Not Recognizing Commands**
```bash
# Re-setup project
codeflow setup ~/my-project --force

# Force synchronization
codeflow sync-formats
```

**Agent Parsing Errors**
```bash
# Check specific errors
codeflow status ~/my-project --verbose

# Some OpenCode agents may have formatting issues - this is expected
# The system handles errors gracefully and continues operation
```

### Performance Issues

Expected performance targets:
- **CLI operations**: < 2 seconds
- **Agent registry loading**: < 200ms
- **File change detection**: < 1 second
- **Format conversion**: < 5 seconds for all formats

If experiencing slower performance:
```bash
# Enable file watching for active development
codeflow watch start

# Check for large numbers of agents (54+ is normal)
codeflow status . --verbose
```

### Getting Help

```bash
# General help
codeflow --help

# Command-specific help  
codeflow setup --help
codeflow mcp --help
codeflow watch --help
```

## Migration from Agentic

See `MIGRATION.md` for complete migration instructions from the previous "agentic" system.

**Quick migration:**
1. Uninstall old CLI: `bun unlink agentic`
2. Install codeflow: `bun run install`
3. Update projects: `codeflow setup ~/my-project`
4. Update MCP config: `codeflow mcp configure claude-desktop`

## Best Practices

### Project Setup
- Use `codeflow setup` for new projects (detects needs automatically)
- Enable `codeflow watch start` for active development projects
- Run `codeflow sync-global` periodically to share improvements across projects

### Workflow Execution
- Always start with `/research` or `research` tool to understand context
- Use `/plan` to create structured implementation approaches
- Follow with `/execute` to implement with proper verification
- Complete with `/test`, `/document`, and `/commit` for thorough delivery

### Performance Optimization
- Use `--dry-run` flags when testing commands
- Enable background MCP server with `--background` flag
- Leverage global agent sync to reduce per-project overhead

### Team Collaboration
- Commit `.claude/commands/` and `.opencode/` directories to version control
- Share codeflow setup instructions in project README
- Use consistent project setup across team: `codeflow setup . --type general`

## Next Steps

After successful setup:

1. **Try Core Workflows**: Test research → plan → execute pattern
2. **Enable Automation**: Use `codeflow watch start --global`
3. **Explore Agents**: Check which specialized agents are available for your domain
4. **Optimize Performance**: Monitor and tune based on your project needs
5. **Share Setup**: Document your team's codeflow configuration

The system is designed to enhance your existing development workflow without disrupting established patterns. Start with basic usage and gradually adopt advanced features as needed.