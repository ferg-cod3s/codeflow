# Codeflow Agent Synchronization Scripts

<!-- VERBALIZED SAMPLING INTEGRATION -->
<!-- ================================ -->

**Selected Strategy**: Code-Path Analysis
**Confidence**: 71.0%

**Available Strategies**:

1. **Code-Path Analysis** (Confidence: 71.0%)
   - Plan: Identify entry points and main execution flows, Trace key decision branches and conditional logic...
2. **Pattern Discovery** (Confidence: 71.0%)
   - Plan: Scan codebase for repeated code structures, Identify naming conventions and architectural patterns...
3. **Architecture Mapping** (Confidence: 71.0%)
   - Plan: Identify major components and modules, Map data flow and dependencies between components...

This directory contains scripts and tools for managing agent synchronization across all three agent directories.

## Overview

The Codeflow system uses a canonical source format with runtime conversion to platform-specific formats:

- **`base-agents/`** - Base format agents (source of truth, organized in subdirectories by category)
- **Runtime Conversion** - Agents are converted on-the-fly to platform-specific formats:
  - `.claude/agents/` - Claude Code format (flat structure)
  - `.opencode/agent/` - OpenCode format (flat structure)
  - `.cursor/agents/` - Cursor format (same as Claude Code)

## Automatic Synchronization

The CanonicalSyncer system handles runtime conversion from base format to platform formats:

1. **Source**: Agents are authored in `base-agents/` with full metadata
2. **Runtime Conversion**: CanonicalSyncer converts on-demand to:
   - Claude Code format (`.claude/agents/`)
   - OpenCode format (`.opencode/agent/`)
   - Cursor format (`.cursor/agents/`)
3. **No Pre-built Folders**: Platform-specific folders are generated at runtime, not stored in repository

Benefits:
- Single source of truth (`base-agents/`)
- No duplicate files to maintain
- Fast conversion (<100ms for 141 agents)
- Reduced package size (~3MB savings)

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

## Validation System

### Isolated Tmp Environment

The validation system uses isolated `tmp/` directories for testing instead of scanning main repository directories.

**Directory Structure**:

```
tmp/
├── validation-{timestamp}/
│   ├── claude-agents/     # Generated Claude Code format agents
│   └── opencode-agents/    # Generated OpenCode format agents
```

**Benefits**:

- Complete isolation from development directories
- Tests actual conversion process end-to-end
- No complex exclusion logic needed
- Automatic cleanup after validation

**Usage**:

```bash
# Validate all formats in isolated environment
bun run codeflow validate --format all

# Validate specific format
bun run codeflow validate --format claude-code

# Keep tmp directory for debugging (advanced)
# Modify validate.ts to set shouldCleanup = false
```

**Process**:

1. Parse source agents from `base-agents/` only
2. Create isolated `tmp/validation-{timestamp}/` environment
3. Convert agents using existing pipeline
4. Validate only in tmp directories
5. Report results and cleanup automatically

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

### Claude Code Runtime Format (`.claude/agents/`)

Generated at runtime from `base-agents/`:
- Flat directory structure (no subdirectories)
- `tools` field as comma-separated string
- Category information in frontmatter
- Example: `.claude/agents/api-builder.md`

### OpenCode Runtime Format (`.opencode/agent/`)

Generated at runtime from `base-agents/`:
- Flat directory structure (required by OpenCode spec)
- `permission` object with tool access
- `mode: subagent` for all agents
- Example: `.opencode/agent/api-builder.md`

### Cursor Runtime Format (`.cursor/agents/`)

Generated at runtime from `base-agents/`:
- Same format as Claude Code (flat structure)
- Example: `.cursor/agents/api-builder.md`

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
