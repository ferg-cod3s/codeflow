# Codeflow Agent Synchronization Scripts

This directory contains scripts and tools for managing agent synchronization across all three agent directories.

## Overview

The Codeflow system now supports three agent formats, each with its own directory structure:

- **`base-agents/`** - Base format agents (source of truth, organized in subdirectories by category)
- **`opencode-agents/`** - OpenCode format agents (flat directory structure)
- **`claude-agents/`** - Claude Code format agents (organized in subdirectories by category)

## Automatic Synchronization

The system automatically keeps all three directories in sync. When you:

1. **Add a new agent** to any directory
2. **Update an existing agent** in any directory
3. **Run the sync command**

The system will automatically:

- Parse the agent from the source directory
- Convert it to the appropriate format for each target directory
- Place it in the correct subdirectory structure
- Ensure all three directories have the same set of agents

## CLI Commands

### Sync All Formats

```bash
# Sync all agents across all formats (dry run first)
bun run codeflow sync-formats --dry-run

# Actually sync the agents
bun run codeflow sync-formats

# Sync with different direction
bun run codeflow sync-formats to-all
bun run codeflow sync-formats bidirectional
```

### Check Format Differences

```bash
# Show detailed differences between formats
bun run codeflow show-format-differences
```

### Global Synchronization

```bash
# Sync to global directories
bun run codeflow sync-global

# Check global sync status
bun run codeflow list-differences
```

## Directory Structure

### Base Agents (`base-agents/`)

```
base-agents/
├── development/           # Development specialists
├── generalist/           # Cross-functional agents
├── ai-innovation/        # AI/ML specialists
├── operations/           # DevOps and operations
├── quality-testing/      # Testing and security
├── business-analytics/   # Business and analytics
├── design-ux/            # Design and UX
└── product-strategy/     # Product management
```

### Claude Agents (`claude-agents/`)

```
claude-agents/
├── development/           # Development specialists
├── generalist/           # Cross-functional agents
├── ai-innovation/        # AI/ML specialists
├── operations/           # DevOps and operations
├── quality-testing/      # Testing and security
├── business-analytics/   # Business and analytics
├── design-ux/            # Design and UX
└── product-strategy/     # Product management
```

### OpenCode Agents (`opencode-agents/`)

```
opencode-agents/
├── analytics-engineer.md
├── api-builder.md
├── code-reviewer.md
├── ... (flat structure)
└── smart-subagent-orchestrator.md
```

## How It Works

1. **Agent Discovery**: The system scans all three directories (including subdirectories for MCP and Claude agents)

2. **Format Conversion**: Uses the `FormatConverter` class to convert between different agent formats

3. **Subdirectory Management**: Automatically places agents in the correct category subdirectories based on their names

4. **Validation**: Optionally validates agents using the `AgentValidator` class

5. **Synchronization**: Ensures all three directories contain the same set of agents with proper formatting

## Adding New Agents

When you add a new agent:

1. **Create it in any of the three directories** with the appropriate format
2. **Run the sync command** to propagate it to all directories
3. **The system will automatically**:
   - Detect the new agent
   - Convert it to other formats
   - Place it in the correct subdirectories
   - Maintain consistency across all formats

## Best Practices

1. **Always run sync after adding/updating agents**
2. **Use dry-run mode first** to see what will happen
3. **Keep agent names consistent** across all formats
4. **Use the appropriate format** for your primary development workflow
5. **Let the system handle** subdirectory organization automatically

## Troubleshooting

### Common Issues

1. **Agent not appearing in all directories**
   - Run `bun run codeflow sync-formats` to sync
   - Check for parsing errors in the output

2. **Wrong subdirectory placement**
   - Verify the agent name matches the category mapping
   - Check the `AGENT_CATEGORIES` constant in the sync code

3. **Format conversion errors**
   - Ensure the source agent has valid YAML frontmatter
   - Check that required fields are present

### Debugging

- Use `--dry-run` to see what would happen without making changes
- Check the detailed format differences with `show-format-differences`
- Look for parsing errors in the sync output
- Verify directory permissions and file accessibility

## Future Enhancements

- **Automatic file watching** for real-time synchronization
- **Conflict resolution** for agents with the same name but different content
- **Version control integration** for tracking agent changes
- **Template system** for creating new agents in all formats simultaneously
