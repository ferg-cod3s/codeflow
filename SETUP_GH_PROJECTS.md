# GitHub Projects Setup Guide

This guide will help you configure Codeflow to use GitHub Projects as your default knowledge source globally.

## Prerequisites

1. **GitHub CLI installed and authenticated**
   ```bash
   gh auth status
   ```

2. **GitHub Projects scope** - Your token needs the `read:project` scope:
   ```bash
   gh auth refresh -s read:project
   ```

## Quick Setup

### Step 1: Find Your Project Number

List your GitHub Projects to find the project number:

```bash
# For personal projects
gh project list --owner YOUR_USERNAME

# For organization projects
gh project list --owner YOUR_ORG_NAME
```

Example output:
```
NUMBER  TITLE           STATE  ID
1       My Project      open   PVT_kwHOABCDEF
2       Another Board   open   PVT_kwHOGHIJKL
```

### Step 2: Copy the Configuration Template

```bash
# Copy the example config to your home directory
cp docs/examples/config/user-global-gh-projects.yaml ~/.codeflow/config.yaml
```

### Step 3: Customize the Configuration

Edit `~/.codeflow/config.yaml` and update:

1. **owner**: Your GitHub username or organization
2. **project_number**: The number from Step 1
3. **filters** (optional): Customize which items to include
4. **fields** (optional): Customize which fields to extract

Example:
```yaml
knowledge_sources:
  - type: gh-projects
    config:
      owner: ferg-cod3s
      project_number: 1
      filters:
        status: 
          - "In Progress"
          - "Todo"
      fields:
        - title
        - body
        - status
        - labels
```

## Verify Setup

Test your configuration by running a research command:

```bash
# In any project with codeflow installed
codeflow research "test query"
```

The research command will now query your GitHub Project board for relevant context.

## Troubleshooting

### "Missing required scopes" error

Run:
```bash
gh auth refresh -s read:project
gh auth status  # Verify 'read:project' is listed
```

### "Project not found" error

Verify:
1. The project number is correct: `gh project list --owner YOUR_OWNER`
2. You have access to the project (it shows in the list)
3. The owner name matches exactly (case-sensitive)

### "No items found" error

Check:
1. The project has items/issues
2. Your filters aren't too restrictive
3. Try removing filters temporarily to test

## Configuration Hierarchy

Codeflow uses this priority order:

1. **Command arguments** (highest priority)
   ```bash
   codeflow research "query" --source=codebase
   ```

2. **Environment variables**
   ```bash
   export CODEFLOW_KNOWLEDGE_SOURCE=gh-projects
   ```

3. **Project config** (`.codeflow/config.yaml` in project root)

4. **User config** (`~/.codeflow/config.yaml` - what we just set up)

5. **Defaults** (uses local `thoughts/` directory)

## Advanced: Per-Project Override

To use different GitHub Projects for different code repositories, create a project-specific config:

```bash
# In your project root
mkdir -p .codeflow
cat > .codeflow/config.yaml << 'YAML'
knowledge_sources:
  - type: gh-projects
    config:
      owner: my-team
      project_number: 5
YAML
```

## See Also

- [CONFIGURATION_GUIDE.md](docs/CONFIGURATION_GUIDE.md) - Full configuration reference
- [github-projects.yaml](docs/examples/config/github-projects.yaml) - Project-level example
- [multiple-sources.yaml](docs/examples/config/multiple-sources.yaml) - Using multiple sources
