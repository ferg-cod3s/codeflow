# Research Command Enhancement Summary

**Date**: 2025-10-13  
**Version**: 2.2.0-configurable

## Overview

Enhanced the `/research` command to support configurable knowledge sources beyond the default `thoughts/` directory, including MCP integrations (Notion, Confluence) and GitHub Projects. Also updated all related commands to use generic "knowledge" terminology instead of "thoughts".

## Key Changes

### 1. Research Command (`command/research.md`)

#### Input Changes
- **Renamed**: `ticket` → `query` 
- **Purpose**: Better reflects that the command accepts freeform input, not just ticket files
- **Format**: Captures everything after `/research <input>`
- **Examples**:
  - `/research How does authentication work?`
  - `/research docs/tickets/oauth-implementation.md`
  - `/research Analyze the current API rate limiting approach`

#### New Configuration Options

**Added `knowledge_source_type` input:**
- `directory` (default) - Local filesystem directories
- `mcp` - Model Context Protocol servers (Notion, Confluence, custom)
- `gh-projects` - GitHub Projects integration

**Added `knowledge_source_config` input:**
- Complex object supporting multiple configuration formats
- Different properties for each source type
- Examples for Notion, GitHub Projects, and custom MCP servers

#### Configuration Hierarchy
1. Explicit command parameter (highest priority)
2. Project-level config (`.codeflow/config.yaml`)
3. User-level config (`~/.codeflow/config.yaml`)
4. Default (`thoughts/` directory)

### 2. Agent Naming Updates

**Renamed agents across all commands:**
- `thoughts-locator` → `knowledge-locator`
- `thoughts-analyzer` → `knowledge-analyzer`

**Rationale**: Generic terminology supports multiple knowledge sources

**Files Updated:**
- `command/plan.md`
- `command/execute.md`
- `command/review.md`
- `command/commit.md`
- `command/document.md`
- `command/test.md`
- `command/project-docs.md`
- `command/help.md`
- `command/research-enhanced.md`

### 3. Knowledge Source Adapters

The `knowledge-locator` agent now uses source-specific adapters:

#### Directory Adapter
- File system operations
- Glob patterns and ripgrep
- Local markdown files

#### MCP Adapter
- MCP protocol communication
- Server query translation
- Supports Notion, Confluence, custom servers

#### GitHub Adapter
- GitHub CLI (`gh`) integration
- GraphQL API queries
- Project board filtering

All adapters return a **unified format** for downstream analysis.

### 4. Enhanced Documentation

#### New Sections Added:
- **Usage**: Clear examples of `/research <input>` format
- **Configurable Knowledge Sources**: Detailed configuration guide
- **MCP Configuration Examples**: Notion and custom server setup
- **GitHub Projects Configuration**: Basic and advanced filtering
- **Configuration Priority**: Explicit hierarchy explanation
- **Knowledge Source Setup Guides**: Step-by-step setup for Notion and GitHub
- **Testing Your Configuration**: Connectivity testing instructions

#### Enhanced Sections:
- **How It Works**: Updated to show knowledge-locator adaptation
- **Phase 1 Discovery**: Now mentions multi-source support
- **Phase 2 Analysis**: Includes source attribution
- **What You'll Get**: Shows sample output with multiple sources
- **Error Handling**: Added knowledge source-specific errors
- **Structured Output**: Includes source metadata
- **Edge Cases**: Added knowledge source conflict handling

### 5. Source Attribution

All research findings now include:
- File paths for local docs
- URLs and page titles for MCP sources
- Issue/task numbers for GitHub Projects
- Timestamps for version awareness

**Example Output:**
```markdown
### From Local Documentation (thoughts/)
- Finding from local file
- Source: `thoughts/2025-10-13-architecture.md`

### From Notion (via MCP)
- Finding from Notion
- Source: [Page Title](https://notion.so/page-url)

### From GitHub Projects
- Finding from project board
- Source: Issue #123, Task "Implement OAuth2"
```

## Configuration Examples

### Example 1: Project-Level Configuration

`.codeflow/config.yaml`:
```yaml
research:
  knowledge_source_type: mcp
  knowledge_source_config:
    mcp:
      server: notion
      database_id: abc123def456
      query_filter:
        property: Status
        select:
          equals: Active
```

### Example 2: GitHub Projects

`.codeflow/config.yaml`:
```yaml
research:
  knowledge_source_type: gh-projects
  knowledge_source_config:
    gh_projects:
      owner: mycompany
      project_number: 3
      fields: [Status, Priority, Labels, Milestone, Assignees]
      filters:
        status: ["In Progress", "In Review"]
        labels: [high-priority, backend]
```

### Example 3: Multiple Sources

`.codeflow/config.yaml`:
```yaml
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
          owner: myorg
          project_number: 1
```

## Command Updates Summary

| Command | Changes |
|---------|---------|
| `research.md` | Complete rewrite with configurable sources, renamed input to `query`, added MCP/GH integration |
| `plan.md` | Updated agent names: `knowledge-locator`, `knowledge-analyzer` |
| `execute.md` | Updated agent name: `knowledge-analyzer` |
| `review.md` | Updated agent name: `knowledge-analyzer` |
| `commit.md` | Updated agent name: `knowledge-analyzer` |
| `document.md` | Updated agent name: `knowledge-analyzer` |
| `test.md` | Updated agent name: `knowledge-analyzer` |
| `project-docs.md` | Updated agent names: `knowledge-locator`, `knowledge-analyzer` |
| `help.md` | Updated agent names and usage examples |
| `research-enhanced.md` | Updated agent names: `knowledge-locator`, `knowledge-analyzer` |

## Breaking Changes

### Input Parameter Rename
- **Before**: `{{ticket}}`
- **After**: `{{query}}`

**Impact**: Commands or scripts explicitly referencing `ticket` parameter need to use `query` instead.

**Migration**: Update any automation that passes the `ticket` parameter to use `query`.

### Agent Names
- **Before**: `thoughts-locator`, `thoughts-analyzer`
- **After**: `knowledge-locator`, `knowledge-analyzer`

**Impact**: Any custom commands or scripts invoking these agents need to use new names.

**Migration**: Search and replace agent names in custom configurations.

## Backward Compatibility

### Default Behavior Preserved
- Default knowledge source remains `thoughts/` directory
- Existing behavior unchanged when no configuration provided
- All existing `/research` commands continue to work

### Gradual Adoption
- Configuration is optional
- Can be enabled project-by-project
- No breaking changes to existing workflows

## Setup Instructions

### For Notion Integration

1. Install MCP server:
   ```bash
   npm install -g @modelcontextprotocol/server-notion
   ```

2. Get Notion API credentials from https://notion.so/my-integrations

3. Configure project:
   ```bash
   echo "research:
     knowledge_source_type: mcp
     knowledge_source_config:
       mcp:
         server: notion
         database_id: YOUR_DATABASE_ID" > .codeflow/config.yaml
   ```

4. Set environment:
   ```bash
   export NOTION_API_KEY=your_key_here
   ```

### For GitHub Projects Integration

1. Authenticate:
   ```bash
   gh auth login
   ```

2. Find project:
   ```bash
   gh project list --owner YOUR_ORG
   ```

3. Configure:
   ```bash
   echo "research:
     knowledge_source_type: gh-projects
     knowledge_source_config:
       gh_projects:
         owner: YOUR_ORG
         project_number: 1
         fields: [Status, Priority, Assignees]" > .codeflow/config.yaml
   ```

### Testing Configuration

```bash
codeflow research test-connection
```

## Benefits

### 1. Centralized Knowledge Access
- Query multiple knowledge sources from one interface
- Unified research workflow across tools
- Single source of truth in research output

### 2. Team Collaboration
- Connect to team knowledge bases (Notion, Confluence)
- Access project management data (GitHub Projects)
- Share research configurations across team

### 3. Flexibility
- Choose appropriate source per project
- Mix multiple sources for comprehensive research
- Easy to add custom MCP servers

### 4. Better Context
- Richer research with cross-tool insights
- Source attribution for verification
- Historical context from project management tools

### 5. Extensibility
- MCP protocol supports many integrations
- Easy to add new source types
- Custom adapters for proprietary systems

## Future Enhancements

### Potential Additions
- **Confluence MCP Server**: Direct Confluence integration
- **Slack Integration**: Research from team discussions
- **Jira Integration**: Query issue history and comments
- **Google Docs MCP**: Access shared documentation
- **Linear Integration**: Project management alternative to GitHub
- **Custom Webhooks**: Real-time knowledge updates

### Planned Improvements
- Intelligent source selection based on query type
- Caching across knowledge sources
- Incremental research updates
- Knowledge graph visualization
- Automated source discovery

## Testing Checklist

- [ ] Basic research with default directory source
- [ ] Research with custom directory path
- [ ] Notion MCP integration (if available)
- [ ] GitHub Projects integration
- [ ] Multiple sources simultaneously
- [ ] Error handling for unavailable sources
- [ ] Fallback to default when source fails
- [ ] Source attribution in output
- [ ] Cache invalidation with source changes
- [ ] Configuration priority (explicit > project > user > default)

## Documentation Updates

All documentation has been updated to:
- Use `knowledge-locator` and `knowledge-analyzer` terminology
- Show examples with multiple knowledge sources
- Include setup guides for MCP and GitHub
- Provide migration path from `thoughts` to `knowledge`
- Document configuration hierarchy
- Add troubleshooting for common issues

## Questions & Answers

**Q: Do I need to configure knowledge sources?**  
A: No, the default `thoughts/` directory still works.

**Q: Can I use multiple sources at once?**  
A: Yes, configure multiple sources and research will query all in parallel.

**Q: What if my MCP server is down?**  
A: Research will fall back to available sources and document which were unreachable.

**Q: How do I authenticate with Notion/GitHub?**  
A: See setup guides in the enhanced research documentation.

**Q: Can I create custom knowledge sources?**  
A: Yes, implement a custom MCP server following the MCP protocol.

**Q: Does this change existing workflows?**  
A: No, existing `/research` commands work exactly as before.

## Conclusion

The enhanced research command provides a flexible, extensible foundation for accessing knowledge across multiple tools and systems. The generic "knowledge" terminology and configurable sources enable teams to research comprehensively without leaving their development workflow.

The changes maintain backward compatibility while opening up powerful new capabilities for teams using Notion, GitHub Projects, or custom knowledge management systems.
