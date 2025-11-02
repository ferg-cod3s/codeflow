# Agentic CLI

## Overview

The `agentic` command-line tool manages the distribution of agents and commands to your projects. It ensures your OpenCode setup stays synchronized with the latest agent configurations.

## Installation

```bash
# From the agentic repository
bun install
bun link  # Makes 'agentic' available globally
```

## Commands

### `agentic pull [project-path]`

Pulls the latest agents and commands to a project's `.opencode` directory.

**Usage:**

```bash
# Pull to current directory (auto-detects project)
cd ~/projects/my-app
agentic pull

# Pull to specific project
agentic pull ~/projects/my-app

# Pull ignoring YAML frontmatter changes
agentic pull --ignore-frontmatter
```

**Options:**

- `--ignore-frontmatter`: Ignore YAML frontmatter in Markdown (.md) files when comparing and preserve target frontmatter during pull

**What it does:**

- Creates `.opencode` directory if it doesn't exist
- Copies all files from `agent/` and `command/` directories
- Preserves directory structure
- Reports progress for each file copied
- When `--ignore-frontmatter` is used: preserves existing frontmatter in target .md files

**Output:**

```
📦 Pulling to: /home/user/projects/my-app/.opencode
📁 Including: agent, command

  ✓ Copied: agent/codebase-analyzer.md
  ✓ Copied: agent/codebase-locator.md
  ✓ Copied: command/research.md
  ✓ Copied: command/plan.md

✅ Pulled 10 files
```

### `agentic status [project-path]`

Checks synchronization status between your project and the agentic repository.

**Usage:**

```bash
# Check status of current directory
cd ~/projects/my-app
agentic status

# Check status of specific project
agentic status ~/projects/my-app

# Check status ignoring YAML frontmatter changes
agentic status --ignore-frontmatter
```

**Options:**

- `--ignore-frontmatter`: Ignore YAML frontmatter in Markdown (.md) files when comparing

**What it does:**

- Compares files in `.opencode` with source repository
- Identifies missing, outdated, or extra files
- Uses SHA-256 hashing for content comparison
- When `--ignore-frontmatter` is used: treats files with only frontmatter changes as up-to-date

**Output:**

```
📊 Status for: /home/user/projects/my-app/.opencode
📁 Checking: agent, command

✅ agent/codebase-analyzer.md
✅ agent/codebase-locator.md
❌ command/research.md (outdated)
❌ command/execute.md (missing in project)

📋 Summary:
  ✅ Up-to-date: 2
  ❌ Outdated: 1
  ❌ Missing: 1

⚠️  2 files need attention
Run 'agentic pull' to update the project
```

### `agentic metadata`

Displays project metadata for use in research documentation.

**Usage:**

```bash
agentic metadata
```

**What it does:**

- Collects current date/time with timezone
- Retrieves git information (commit hash, branch, repository name)
- Generates timestamp for filename formatting

**Output Example:**

```
Current Date/Time (TZ): 01/15/2025 14:30:45 EST
<git_commit>abc123def456789...</git_commit>
<branch>feature/oauth-implementation</branch>
<repository>my-app</repository>
<last_updated>2025-01-15</last_updated>
<date>2025-01-15</date>
```

**Use Cases:**

- Populating research document frontmatter
- Creating timestamped filenames
- Recording project state for documentation
- Tracking when analysis was performed

This command is particularly useful when creating research documents, as it provides all the metadata needed for proper documentation tracking.

### `agentic help`

Displays usage information.

```bash
agentic help
agentic --help
agentic -h
```

### `agentic version`

Shows the installed version of agentic.

```bash
agentic version
agentic --version
```

## Auto-detection

The CLI uses intelligent project detection:

1. **With path argument**: Uses the provided path directly
2. **Without argument**: Searches upward from current directory for `.opencode`
3. **Stops at**: Home directory boundary (won't search outside `$HOME`)

## Configuration

The CLI reads configuration from `config.json` in the agentic repository:

```json
{
  "pull": {
    "include": ["agent", "command"]
  }
}
```

Currently, this specifies which directories to include when pulling.

## Error Handling

The CLI provides clear error messages:

- **No .opencode found**: Suggests running from project directory or specifying path
- **Invalid directory**: Reports if specified path doesn't exist
- **Outside home**: Alerts when auto-detection is outside home directory

## File Management

### Hashing

Uses Bun's built-in SHA-256 hasher for fast, reliable file comparison.

### Directory Walking

Recursively processes all files in configured directories while preserving structure.

### Safe Operations

- Never deletes files
- Only overwrites during `pull` operation
- Reports all changes clearly

## Development

### Running from Source

```bash
# Without installing globally
bun run src/cli/index.ts pull ~/projects/my-app
```

### TypeScript Support

The CLI is written in TypeScript with full type safety:

```bash
bun run typecheck  # Verify types
```

### Adding New Commands

1. Create new command file in `src/cli/`
2. Export async function that handles the command
3. Add case in `src/cli/index.ts` switch statement
4. Update help text

## Best Practices

1. **Regular Updates**: Run `agentic status` periodically to check for updates
2. **Project Setup**: Run `agentic pull` immediately after cloning a project
3. **Version Control**: Add `.opencode/` to `.gitignore` (agents are distributed separately)
4. **Automation**: Consider adding `agentic pull` to project setup scripts

## Troubleshooting

### Command not found

- Ensure you ran `bun link` in the agentic repository
- Check that `~/.bun/bin` is in your PATH

### No .opencode directory found

- Ensure you're in a project directory
- Or specify the project path explicitly

### Files showing as outdated

- Run `agentic pull` to update
- Check if you have local modifications

## Future Enhancements

Planned improvements include:

- Project initialization command
- Selective agent/command installation
- Update notifications
- Dry-run mode for pull command

## Related Documentation

- [Usage Guide](./usage.md)
- [Agents](../AGENTS.md)
- [Commands](./commands.md)
