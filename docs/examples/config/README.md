# Codeflow Configuration Examples

This directory contains example configuration files for different knowledge source integrations with the `/research` command.

## Available Examples

### 1. **default-directory.yaml**
Default configuration using local filesystem directory. This is the simplest setup and works without any external dependencies.

**Use when:** You store all documentation locally in markdown files.

### 2. **notion-integration.yaml**
Notion workspace integration via Model Context Protocol (MCP).

**Use when:** Your team uses Notion for documentation and knowledge management.

**Requirements:**
- `@modelcontextprotocol/server-notion` npm package
- Notion API key
- Notion integration configured

### 3. **github-projects.yaml**
GitHub Projects integration for project management data.

**Use when:** You use GitHub Projects for task tracking and want to research issues/tasks.

**Requirements:**
- GitHub CLI (`gh`) installed
- Authenticated GitHub account
- Access to the target project

### 4. **multiple-sources.yaml**
Configuration for querying multiple knowledge sources simultaneously.

**Use when:** You want comprehensive research across local docs, team wiki, and project management tools.

**Requirements:** Dependencies for each configured source

### 5. **custom-mcp-server.yaml**
Template for integrating custom MCP servers with proprietary or specialized knowledge sources.

**Use when:** You have internal systems (wiki, docs, databases) you want to query.

**Requirements:** Custom MCP server implementation following the MCP protocol

## How to Use

### Project-Level Configuration

Copy the relevant example to your project:

```bash
# Create config directory
mkdir -p .codeflow

# Copy example (choose one)
cp docs/examples/config/notion-integration.yaml .codeflow/config.yaml

# Edit with your specific settings
vim .codeflow/config.yaml
```

### User-Level Configuration

For global settings across all projects:

```bash
# Create user config directory
mkdir -p ~/.codeflow

# Copy example
cp docs/examples/config/multiple-sources.yaml ~/.codeflow/config.yaml

# Edit with your settings
vim ~/.codeflow/config.yaml
```

### Configuration Priority

When multiple configs exist, they are applied in this order (highest priority first):

1. **Explicit command parameters** - Passed directly to `/research`
2. **Project config** - `.codeflow/config.yaml` in project root
3. **User config** - `~/.codeflow/config.yaml` in home directory
4. **Default** - Local `thoughts/` directory

## Testing Your Configuration

After setting up a configuration, test the connection:

```bash
# Test if knowledge source is accessible
codeflow research test-connection

# Try a simple research query
/research test query
```

## Common Configuration Patterns

### Team with Notion + GitHub Projects

```yaml
research:
  knowledge_sources:
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
```

### Local Docs with Custom Paths

```yaml
research:
  knowledge_source_type: directory
  knowledge_source_config:
    directory:
      path: docs/knowledge-base/
      include_patterns:
        - "**/*.md"
        - "**/*.txt"
```

### GitHub Projects with Advanced Filtering

```yaml
research:
  knowledge_source_type: gh-projects
  knowledge_source_config:
    gh_projects:
      owner: myorg
      project_number: 3
      filters:
        status: ["In Progress", "In Review"]
        labels: [critical, backend]
        assignees: [myusername]
      include_closed: true
      closed_since_days: 7
```

## Troubleshooting

### Notion Connection Issues
- Verify API key: `echo $NOTION_API_KEY`
- Check integration permissions in Notion
- Ensure database is shared with integration
- Test MCP server: `npx @modelcontextprotocol/server-notion --help`

### GitHub Projects Issues
- Check authentication: `gh auth status`
- Verify project access: `gh project list --owner YOUR_ORG`
- Test project view: `gh project view PROJECT_NUMBER`
- Check permissions: Need read access to project

### Configuration Not Loading
- Verify file location: `.codeflow/config.yaml` in project root
- Check YAML syntax: `yamllint .codeflow/config.yaml`
- Look for parsing errors in command output
- Try with explicit parameter to confirm it works

## Environment Variables

Some configurations require environment variables:

```bash
# Notion integration
export NOTION_API_KEY=secret_xxxxxxxxxxxxx

# Custom MCP server authentication
export CUSTOM_SERVER_TOKEN=your-token-here

# GitHub (usually set by gh auth login)
export GITHUB_TOKEN=ghp_xxxxxxxxxxxxx
```

Add these to your shell profile (`.bashrc`, `.zshrc`) to persist across sessions.

## Security Best Practices

1. **Never commit credentials** - Use environment variables or local config files
2. **Add `.codeflow/` to `.gitignore`** if it contains sensitive data
3. **Use project-specific tokens** with minimal required permissions
4. **Rotate API keys regularly** especially for production systems
5. **Review access logs** in external systems (Notion, GitHub) periodically

## Next Steps

After setting up your configuration:

1. Test connection: `codeflow research test-connection`
2. Try simple research: `/research test query`
3. Review output for source attribution
4. Adjust filters/settings as needed
5. Document team-specific setup in project README

## Getting Help

- Full documentation: See `command/research.md`
- MCP Protocol: https://modelcontextprotocol.io
- GitHub Projects API: https://docs.github.com/en/issues/planning-and-tracking-with-projects
- Notion API: https://developers.notion.com

For issues or questions, check the troubleshooting section above or file an issue in the codeflow repository.
