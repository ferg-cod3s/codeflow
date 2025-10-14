# Codeflow Configuration Guide

Complete guide to configuring Codeflow for your project's storage locations and knowledge sources.

## Quick Start

### 1. Set Up Standard Directories

Run this in your project root:

```bash
# Create all standard directories
mkdir -p docs/research docs/plans docs/tickets docs/architecture thoughts

# Add .gitkeep to preserve empty directories in git
touch docs/research/.gitkeep docs/plans/.gitkeep docs/tickets/.gitkeep thoughts/.gitkeep
```

Or use the setup script:

```bash
curl -sSL https://raw.githubusercontent.com/your-org/codeflow/master/scripts/setup-dirs.sh | bash
```

### 2. Understand the Directory Structure

```
your-project/
├── docs/
│   ├── research/        # 📤 OUTPUT: Research findings from /research
│   ├── plans/           # 📤 OUTPUT: Implementation plans from /plan
│   ├── tickets/         # 📥 INPUT: Feature tickets, requirements
│   └── architecture/    # 📝 OPTIONAL: Architecture documentation
└── thoughts/            # 📥 INPUT: Knowledge base for /research queries
```

## Default Behavior (No Configuration Needed)

Codeflow works **out of the box** with these defaults:

| Command | Input From | Output To |
|---------|------------|-----------|
| `/research` | `thoughts/` | `docs/research/YYYY-MM-DD-topic.md` |
| `/plan` | `docs/tickets/`, `docs/research/` | `docs/plans/YYYY-MM-DD-feature.md` |
| `/execute` | `docs/plans/` | Code changes |
| `/document` | Codebase | `docs/` |

**No configuration file needed for standard usage!**

## Customizing Storage Locations

### Option 1: Project-Level Configuration

Create `.codeflow/config.yaml` in your project root:

```yaml
# .codeflow/config.yaml
# Project-specific configuration

# Where to read knowledge/documentation from
research:
  knowledge_source_type: directory
  knowledge_source_config:
    directory:
      path: knowledge-base/  # Changed from default "thoughts/"
      include_patterns:
        - "*.md"
        - "*.txt"
      exclude_patterns:
        - "**/archive/**"
        - "**/drafts/**"

# Where to output generated files
output:
  research_dir: documentation/research/  # Changed from "docs/research/"
  plans_dir: documentation/plans/        # Changed from "docs/plans/"
  tickets_dir: documentation/tickets/    # Changed from "docs/tickets/"
```

### Option 2: User-Level Configuration

Create `~/.codeflow/config.yaml` for settings across all your projects:

```yaml
# ~/.codeflow/config.yaml
# User-wide default configuration

research:
  knowledge_source_type: directory
  knowledge_source_config:
    directory:
      path: docs/knowledge/  # Your preferred default
      
output:
  research_dir: research/
  plans_dir: plans/
```

### Option 3: Environment Variables

Set via environment variables:

```bash
# Add to your ~/.bashrc or ~/.zshrc
export CODEFLOW_THOUGHTS_DIR="knowledge-base"
export CODEFLOW_OUTPUT_DIR="documentation"
export CODEFLOW_RESEARCH_DIR="documentation/findings"
export CODEFLOW_PLANS_DIR="documentation/implementation"
```

## Configuration Priority

When multiple configurations exist, priority is:

1. **Explicit command parameters** (highest)
2. **Environment variables**
3. **Project config** (`.codeflow/config.yaml`)
4. **User config** (`~/.codeflow/config.yaml`)
5. **Built-in defaults** (lowest)

Example:

```bash
# Uses project config or defaults
/research How does auth work?

# Overrides with explicit parameter
/research How does auth work? --output-dir=custom/research/
```

## Advanced: Custom Directory Structures

### Monorepo Setup

```yaml
# .codeflow/config.yaml for monorepo
research:
  knowledge_source_config:
    directory:
      path: ../../docs/shared/  # Reference parent directory
      
output:
  research_dir: ../../docs/research/
  plans_dir: ../../docs/plans/
```

### Multi-Team Setup

```yaml
# Team-specific knowledge base
research:
  knowledge_source_config:
    directory:
      paths:  # Multiple paths supported
        - thoughts/
        - ../shared-docs/
        - ../../architecture/
```

### Per-Command Output Directories

```yaml
output:
  # Different output locations per command
  research:
    dir: docs/findings/
    naming: "{date}-{topic}-research.md"
  
  plan:
    dir: docs/implementation-plans/
    naming: "{date}-{feature}.md"
  
  document:
    dir: docs/api/
    naming: "{module}-api.md"
```

## Integrating External Knowledge Sources

### Notion Integration

```yaml
# .codeflow/config.yaml
research:
  knowledge_source_type: mcp
  knowledge_source_config:
    mcp:
      server: notion
      database_id: your-notion-db-id
      
# Still output to local files
output:
  research_dir: docs/research/
```

See [Notion Integration Guide](examples/config/notion-integration.yaml) for full setup.

### GitHub Projects Integration

```yaml
# .codeflow/config.yaml
research:
  knowledge_source_type: gh-projects
  knowledge_source_config:
    gh_projects:
      owner: your-org
      project_number: 1
      
output:
  research_dir: docs/research/
```

See [GitHub Projects Guide](examples/config/github-projects.yaml) for full setup.

### Multiple Knowledge Sources

```yaml
# Query all sources simultaneously
research:
  knowledge_sources:
    - type: directory
      config:
        directory:
          path: thoughts/
    
    - type: mcp
      config:
        mcp:
          server: notion
          database_id: your-db-id
    
    - type: gh-projects
      config:
        gh_projects:
          owner: your-org
          project_number: 1

output:
  research_dir: docs/research/
```

## Best Practices

### 1. Use Git-Friendly Paths

```yaml
# Good: Relative to project root
output:
  research_dir: docs/research/

# Avoid: Absolute paths
output:
  research_dir: /Users/you/projects/myapp/docs/  # ❌
```

### 2. Keep Outputs Versioned

```bash
# Add to .gitignore if you DON'T want to version outputs
echo "docs/research/" >> .gitignore

# Most projects SHOULD version these:
# ✅ docs/research/  - Version control research findings
# ✅ docs/plans/     - Version control implementation plans
# ❌ .codeflow/cache/ - Don't version cache
```

### 3. Organize Knowledge Base

```
thoughts/
├── decisions/                    # ADRs, technical decisions
│   └── 2025-10-13-use-postgres.md
├── architecture/                 # High-level architecture
│   └── 2025-10-01-system-design.md
├── research/                     # Background research
│   └── 2025-09-15-auth-options.md
└── meetings/                     # Meeting notes
    └── 2025-10-13-sprint-planning.md
```

### 4. Use Descriptive Filenames

```bash
# Good: Descriptive with dates
2025-10-13-authentication-research.md
2025-10-13-payment-integration-plan.md

# Avoid: Generic names
research.md
plan1.md
```

### 5. Document Your Configuration

```yaml
# .codeflow/config.yaml
# Team Configuration for MyApp
# Last updated: 2025-10-13
# Owner: Platform Team

research:
  knowledge_source_type: directory
  knowledge_source_config:
    directory:
      path: thoughts/
      # We use thoughts/ for historical reasons
      # New projects should consider using docs/knowledge/
```

## Troubleshooting

### "Directory not found" errors

```bash
# Create missing directories
mkdir -p docs/research docs/plans thoughts

# Verify paths in config
cat .codeflow/config.yaml

# Check permissions
ls -la docs/
```

### Outputs going to wrong location

```bash
# Check configuration priority
codeflow config show

# Test with explicit path
/research test --output-dir=docs/research/

# Verify environment variables
env | grep CODEFLOW
```

### Knowledge source not found

```bash
# Verify path exists
ls -la thoughts/

# Check configuration
cat .codeflow/config.yaml | grep -A5 knowledge_source

# Test with default path
/research test
```

## Examples

### Example 1: Startup (Simple Setup)

```bash
# Just create the directories
mkdir -p docs/research docs/plans thoughts

# No config file needed - use defaults
/research How does the API work?
```

**Output:** `docs/research/2025-10-13-api-research.md`

### Example 2: Enterprise (Custom Paths)

```yaml
# .codeflow/config.yaml
research:
  knowledge_source_config:
    directory:
      paths:
        - docs/knowledge-base/
        - docs/shared/architecture/
        - docs/team-wiki/

output:
  research_dir: docs/generated/research/
  plans_dir: docs/generated/plans/
```

### Example 3: Consulting (Per-Client Setup)

```bash
# Directory structure
clients/
├── client-a/
│   ├── .codeflow/config.yaml  # Custom for client A
│   └── docs/
└── client-b/
    ├── .codeflow/config.yaml  # Custom for client B
    └── documentation/
```

## Migration Guide

### Migrating from `thoughts/` to Custom Path

1. **Move existing files:**
   ```bash
   mv thoughts/ knowledge-base/
   ```

2. **Update configuration:**
   ```yaml
   # .codeflow/config.yaml
   research:
     knowledge_source_config:
       directory:
         path: knowledge-base/
   ```

3. **Update documentation references:**
   ```bash
   # Update README and other docs
   sed -i 's/thoughts\//knowledge-base\//g' README.md
   ```

### Migrating Output Locations

1. **Move existing outputs:**
   ```bash
   mkdir -p documentation/
   mv docs/research documentation/findings/
   mv docs/plans documentation/implementation/
   ```

2. **Update configuration:**
   ```yaml
   output:
     research_dir: documentation/findings/
     plans_dir: documentation/implementation/
   ```

3. **Update references in code/docs:**
   ```bash
   grep -r "docs/research" . --include="*.md"
   # Update found references
   ```

## See Also

- [Configuration Examples](examples/config/) - Ready-to-use config files
- [Research Command](../command/research.md) - Full research command docs
- [Plan Command](../command/plan.md) - Full plan command docs
- [MCP Integration](MCP_INTEGRATION.md) - External knowledge sources

## Support

If you have questions or need help:
1. Check the troubleshooting section above
2. Review configuration examples in `docs/examples/config/`
3. File an issue on GitHub
4. Check the community discussions
