---
name: research
mode: command
description: Research a ticket or provide a prompt for ad-hoc research
version: 2.2.0-configurable
last_updated: 2025-10-13
command_schema_version: 1.0
inputs:
  - name: query
    type: string
    required: true
    description: Research question, topic, or path to ticket file. Accepts freeform text after /research command.
    examples:
      - "How does authentication work?"
      - "docs/tickets/feature-123.md"
      - "Analyze the API rate limiting implementation"
  - name: current_date
    type: string
    required: false
    description: Current date for research document (auto-generated)
    default: auto
  - name: scope
    type: string
    required: false
    description: Research scope hint (codebase|knowledge|both)
    default: both
  - name: depth
    type: string
    required: false
    description: Research depth (shallow|medium|deep)
    default: medium
  - name: knowledge_source_type
    type: string
    required: false
    description: Type of knowledge source (directory|mcp|gh-projects)
    default: directory
  - name: knowledge_source_config
    type: object
    required: false
    description: Configuration for the knowledge source
    properties:
      directory:
        path: thoughts/
        description: Local directory path for documentation
      mcp:
        server: notion
        database_id: optional-notion-database-id
        query_filter: optional-filter-criteria
      gh_projects:
        owner: github-org-or-user
        project_number: 1
        fields: [Status, Priority, Assignees]
outputs:
  - name: research_document
    type: structured
    format: JSON with research findings and document metadata
    description: Comprehensive research findings with document path
cache_strategy:
  type: content_based
  ttl: 3600
  invalidation: manual
  scope: command
success_signals:
  - 'Research completed successfully'
  - 'Findings documented in docs/research/'
  - 'All research questions addressed'
  - 'Knowledge source successfully accessed'
failure_modes:
  - 'Ticket file not found or invalid'
  - 'Research agents unable to complete analysis'
  - 'Insufficient findings to answer research question'
  - 'Knowledge source unavailable or misconfigured'
  - 'MCP server connection failed'
  - 'GitHub API authentication failed'
---


# Deep Research & Analysis Command

Conducts comprehensive research across your codebase, documentation, and external sources to provide deep understanding and actionable insights.

## Usage

```bash
/research <your question or topic>
```

The research command accepts **freeform input** - just type your question or topic after `/research`:

```bash
/research How does the authentication system work?
/research docs/tickets/oauth-implementation.md
/research What are the performance bottlenecks in data processing?
/research Analyze the current API rate limiting approach
```

## Configurable Knowledge Sources

The research command now supports **multiple knowledge sources** beyond the default `thoughts/` directory:

### Supported Source Types

#### 1. 📁 Directory (Default)
Local filesystem directory containing markdown documentation.

```yaml
knowledge_source_type: directory
knowledge_source_config:
  directory:
    path: thoughts/
```

**Use cases:**
- Local documentation in `thoughts/`, `docs/`, or custom paths
- Technical decision records (TDRs/ADRs)
- Meeting notes and research documents

#### 2. 🔌 MCP (Model Context Protocol)
Connect to external services via MCP servers (e.g., Notion, Confluence).

```yaml
knowledge_source_type: mcp
knowledge_source_config:
  mcp:
    server: notion
    database_id: your-notion-database-id
    query_filter: 
      property: Status
      select:
        equals: Active
```

**Use cases:**
- Notion databases with project documentation
- Confluence spaces with technical specs
- Custom MCP servers for proprietary knowledge bases

**MCP Configuration Examples:**

**Notion Integration:**
```yaml
mcp:
  server: notion
  database_id: abc123def456
  query_filter:
    and:
      - property: Status
        select:
          equals: Active
      - property: Team
        multi_select:
          contains: Engineering
```

**Custom MCP Server:**
```yaml
mcp:
  server: custom-docs-server
  endpoint: https://docs.company.com/mcp
  auth:
    type: bearer
    token_env: DOCS_API_TOKEN
```

#### 3. 🐙 GitHub Projects
Query GitHub Projects for issues, tasks, and project planning data.

```yaml
knowledge_source_type: gh-projects
knowledge_source_config:
  gh_projects:
    owner: your-org
    project_number: 1
    fields: [Status, Priority, Assignees, Labels]
    filters:
      status: ["In Progress", "Todo"]
      labels: [backend, api]
```

**Use cases:**
- Project planning and task tracking
- Issue history and discussion threads
- Cross-repository project coordination

**GitHub Projects Configuration Examples:**

**Basic Project Query:**
```yaml
gh_projects:
  owner: mycompany
  project_number: 3
  fields: [Status, Priority, Assignees]
```

**Advanced Filtering:**
```yaml
gh_projects:
  owner: mycompany
  project_number: 3
  fields: [Status, Priority, Labels, Milestone, Assignees]
  filters:
    status: ["In Progress", "In Review"]
    milestone: Q4-2025
    assignees: [username1, username2]
    labels: [high-priority, backend]
  include_closed: false
  max_items: 100
```

### Configuration Priority

1. **Explicit command parameter** (highest priority)
2. **Project-level config** (`.codeflow/config.yaml`)
3. **User-level config** (`~/.codeflow/config.yaml`)
4. **Default** (`thoughts/` directory)

### Example: Project-Level Configuration

Create `.codeflow/config.yaml` in your project:

```yaml
research:
  knowledge_source_type: mcp
  knowledge_source_config:
    mcp:
      server: notion
      database_id: your-database-id
      query_filter:
        property: Status
        select:
          equals: Active
```

Now all research commands will use Notion by default:
```bash
/research How does authentication work?
```

### Example: Override Per Command

Override the default for a specific research query:

```bash
/research Review recent sprint tasks --knowledge_source_type=gh-projects --knowledge_source_config='{"gh_projects": {"owner": "myorg", "project_number": 1}}'
```

### Mixing Multiple Sources

Research across multiple knowledge sources simultaneously:

```yaml
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

The research command will:
1. Query all sources in parallel
2. Aggregate and deduplicate findings
3. Provide unified research document with source attribution

## How It Works

This command orchestrates multiple specialized agents in a carefully designed workflow:

### Phase 1: Discovery (Parallel)
- 🔍 **codebase-locator** finds relevant files and components
- 📚 **knowledge-locator** discovers documentation from configured sources
  - Adapts to source type: directory scan, MCP query, or GitHub API
  - Returns unified result format regardless of source

### Phase 2: Analysis (Sequential)
- 🧠 **codebase-analyzer** understands implementation details
- 💡 **knowledge-analyzer** extracts insights from documentation
  - Processes results from any knowledge source type
  - Maintains source attribution for traceability

### Phase 3: External Research (Optional)
- 🌐 **web-search-researcher** gathers external context and best practices

## When to Use

**Perfect for:**
- Starting work on unfamiliar parts of the codebase
- Planning new features or major changes
- Understanding complex systems or architectures
- Debugging issues that span multiple components
- Creating onboarding documentation
- Researching across distributed knowledge bases (code + Notion + GitHub)

**Example Research Questions:**
- "How does the user authentication system work?"
- "What's the current state of our API rate limiting?"
- "How should we implement real-time notifications?"
- "What are the performance bottlenecks in our data processing pipeline?"
- "What were the decisions made in Q3 sprint planning?" (GitHub Projects)
- "Review all Active engineering documentation" (Notion via MCP)

## What You'll Get

### Research Report Includes:
- **Code Analysis**: File locations, key functions, and implementation patterns
- **Documentation Insights**: Existing docs, decisions, and context (from any source)
- **Source Attribution**: Clear indication of where each insight came from
- **Architecture Overview**: How components interact and data flows
- **External Research**: Best practices, alternatives, and recommendations
- **Action Items**: Specific next steps based on findings

### Sample Output Structure:
```markdown
## Research Summary
- Objective: [Your research question]
- Key Findings: [3-5 major insights]
- Confidence Level: [High/Medium/Low]
- Knowledge Sources: [directory:thoughts/, mcp:notion, gh-projects:myorg/1]

## Codebase Analysis
- Core Files: [List with explanations]
- Key Functions: [Important methods and their purposes]
- Data Flow: [How information moves through the system]

## Documentation Insights

### From Local Docs (thoughts/)
- [Findings from local directory]

### From Notion
- [Findings from Notion database via MCP]
- Source: Notion page "Architecture Decisions" (link)

### From GitHub Projects
- [Findings from GitHub project board]
- Source: Issue #123 in myorg/project-1

## Recommendations
- Immediate Actions: [What to do first]
- Long-term Considerations: [Strategic recommendations]
- Potential Risks: [Things to watch out for]
```

## Pro Tips

1. **Be Specific**: "Research authentication" vs "Research OAuth2 implementation and session management"
2. **Set Context**: Include any constraints, requirements, or specific areas of focus
3. **Configure Once**: Set up `.codeflow/config.yaml` for your preferred knowledge sources
4. **Mix Sources**: Use multiple sources when decisions span tools (code + Notion + GitHub)
5. **Follow Up**: Use results to inform `/plan` and `/execute` commands
6. **Iterate**: Research findings often lead to more specific research questions

## Enhanced Subagent Orchestration

### Advanced Research Workflow

For complex research requiring deep analysis across multiple domains:

#### Phase 1: Comprehensive Discovery (Parallel Execution)
- **codebase-locator**: Maps all relevant files, components, and directory structures
- **knowledge-locator**: Discovers documentation from configured sources
  - Adapts query strategy based on source type
  - Supports simultaneous multi-source queries
- **codebase-pattern-finder**: Identifies recurring implementation patterns and architectural approaches
- **web-search-researcher**: Gathers external best practices and industry standards (when applicable)

#### Phase 2: Deep Analysis (Sequential Processing)
- **codebase-analyzer**: Provides detailed implementation understanding with file:line evidence
- **knowledge-analyzer**: Extracts actionable insights from documentation with source attribution
- **system-architect**: Analyzes architectural implications and design patterns
- **performance-engineer**: Evaluates performance characteristics and optimization opportunities

#### Phase 3: Domain-Specific Assessment (Conditional)
- **database-expert**: Analyzes data architecture and persistence patterns
- **api-builder**: Evaluates API design and integration approaches
- **security-scanner**: Assesses security architecture and potential vulnerabilities
- **compliance-expert**: Reviews regulatory compliance requirements
- **infrastructure-builder**: Analyzes deployment and infrastructure implications

#### Phase 4: Synthesis & Validation (Parallel)
- **code-reviewer**: Validates research findings against code quality standards
- **test-generator**: Identifies testing gaps and coverage requirements
- **quality-testing-performance-tester**: Provides performance benchmarking insights

### Orchestration Best Practices

1. **Parallel Discovery**: Always start with multiple locators running simultaneously for comprehensive coverage
2. **Sequential Analysis**: Process analyzers sequentially to build upon locator findings
3. **Domain Escalation**: Engage domain specialists when research reveals specialized concerns
4. **Validation Gates**: Use reviewer agents to validate findings before synthesis
5. **Iterative Refinement**: Re-engage subagents as new questions emerge from initial findings
6. **Source Diversity**: Leverage multiple knowledge sources for comprehensive context

### Research Quality Indicators

- **Comprehensive Coverage**: Multiple agents provide overlapping validation
- **Evidence-Based**: All findings include specific file:line references or source URLs
- **Contextual Depth**: Historical decisions and architectural rationale included
- **Source Attribution**: Clear indication of information origin (code, docs, external)
- **Actionable Insights**: Clear next steps and implementation guidance provided
- **Risk Assessment**: Potential issues and constraints identified

### Performance Optimization

- **Agent Sequencing**: Optimized order minimizes redundant analysis
- **Context Sharing**: Agents share findings to avoid duplicate work
- **Early Termination**: Stop analysis when sufficient understanding is achieved
- **Caching Strategy**: Leverage cached results for similar research topics
- **Parallel Source Queries**: Query multiple knowledge sources simultaneously

## Integration with Other Commands

- **→ /plan**: Use research findings to create detailed implementation plans
- **→ /execute**: Begin implementation with full context
- **→ /document**: Create documentation based on research insights
- **→ /review**: Validate that implementation matches research findings

---

*Ready to dive deep? Ask me anything about your codebase and I'll provide comprehensive insights from all your configured knowledge sources to guide your next steps.*

## Purpose

Multi-dimensional research via agent coordination for codebase patterns, historical context, and architectural insights, synthesized into documentation. Supports configurable knowledge sources including local directories, MCP servers (Notion, Confluence), and GitHub Projects.

## Inputs

- **query**: Research question, topic, or path to ticket file (captured from `/research <input>`)
- **scope**: Optional scope (codebase|knowledge|both)
- **depth**: Optional depth (shallow|medium|deep)
- **knowledge_source_type**: Type of knowledge source (directory|mcp|gh-projects)
- **knowledge_source_config**: Configuration object for the knowledge source
- **conversation_context**: Related research history

## Preconditions

- Valid research question or ticket file path
- Accessible development environment
- Knowledge source properly configured and accessible
- For MCP: MCP server running and authenticated
- For GitHub: GitHub CLI authenticated (`gh auth status`)
- Time for comprehensive analysis

## Process Phases

### Phase 1: Context Analysis & Planning

1. Parse input from `/research <query>` command
2. Check cache for similar patterns
3. Read ticket file if path provided, otherwise use query as-is
4. Determine knowledge source configuration (explicit → project → user → default)
5. Validate knowledge source accessibility
6. Decompose into investigation areas
7. Create research plan with subtasks
8. Identify agents and strategies

### Phase 2: Parallel Agent Coordination

1. Spawn locators in parallel:
   - **codebase-locator**: Search codebase
   - **knowledge-locator**: Query configured knowledge source(s)
     - Directory: File system scan
     - MCP: Query MCP server with filters
     - GitHub: Query GitHub Projects API
2. Pattern analysis: codebase-pattern-finder for examples
3. Deep analysis: codebase-analyzer, knowledge-analyzer on key findings
4. Domain agents: Deploy specialized agents as needed
5. Wait for completion

### Phase 3: Synthesis & Documentation

1. Aggregate agent results from all sources
2. Deduplicate and cross-reference findings
3. Maintain source attribution (file paths, URLs, issue numbers)
4. Generate insights and patterns
5. Create structured research document with source citations
6. Update cache with patterns

## Error Handling

### Invalid Input

- Phase: context_analysis
- Expected: Valid research question or ticket file path
- Mitigation: Verify path exists or clarify question
- Requires user input: true

### Knowledge Source Unavailable

- Phase: context_analysis
- Expected: Accessible knowledge source
- Mitigation: Verify configuration, check authentication, fallback to default
- Requires user input: depends on error
- Examples:
  - MCP server not running → Start server or use directory fallback
  - GitHub auth expired → Run `gh auth login`
  - Notion database not found → Verify database_id

### Agent Failure

- Phase: agent_execution
- Expected: All agents complete
- Mitigation: Retry or adjust scope
- Requires user input: false

### Insufficient Findings

- Phase: synthesis
- Expected: Adequate findings
- Mitigation: Expand scope/objectives, try additional knowledge sources
- Requires user input: true

## Structured Output

```command-output:research_document
{
  "status": "success|in_progress|error",
  "timestamp": "ISO-8601",
  "cache": {"hit": true|false, "key": "pattern:{hash}:{scope}:{sources}", "ttl_remaining": 3600, "savings": 0.25},
  "research": {
    "question": "string",
    "scope": "codebase|knowledge|both",
    "depth": "shallow|medium|deep",
    "knowledge_sources": [
      {"type": "directory", "path": "thoughts/", "files_found": 12},
      {"type": "mcp", "server": "notion", "pages_found": 8},
      {"type": "gh-projects", "project": "myorg/1", "items_found": 15}
    ]
  },
  "findings": {
    "total_items": 35,
    "codebase": 18,
    "knowledge": 17,
    "insights": 9,
    "patterns": 4,
    "by_source": {
      "directory": 12,
      "mcp": 8,
      "gh-projects": 15
    }
  },
  "document": {
    "path": "docs/research/YYYY-MM-DD-topic.md",
    "sections": ["synopsis", "summary", "findings", "references", "source_attribution"],
    "code_refs": 12,
    "knowledge_refs": 17,
    "external_refs": 3
  },
  "agents_used": ["codebase-locator", "codebase-analyzer", "knowledge-locator", "knowledge-analyzer"],
  "metadata": {
    "processing_time": 180,
    "cache_savings": 0.25,
    "agent_tasks": 8,
    "follow_up": 0,
    "sources_queried": 3
  }
}
```

## Success Criteria

### Automated

- Document created in `docs/research/`
- YAML frontmatter structure with source metadata
- Agents completed successfully
- File:line references included
- Source attribution for all knowledge findings
- Cache updated
- All configured knowledge sources successfully queried

### Manual

- Question fully addressed with evidence
- Cross-component connections identified
- Actionable development insights provided
- Historical context integrated from all sources
- Source attribution allows verification
- Open questions addressed or documented

## Agent Coordination

### Execution Order

1. **Discovery**: Locators in parallel (codebase-locator, knowledge-locator)
   - knowledge-locator adapts to configured source type
2. **Pattern Analysis**: codebase-pattern-finder after locators
3. **Deep Analysis**: Analyzers on key findings (codebase-analyzer, knowledge-analyzer)
   - knowledge-analyzer processes unified format from any source

### Knowledge Source Adapters

The `knowledge-locator` agent uses source-specific adapters:

- **Directory Adapter**: File system operations, glob patterns, ripgrep
- **MCP Adapter**: MCP protocol, server communication, query translation
- **GitHub Adapter**: GitHub CLI (`gh`), GraphQL API, project queries

All adapters return a unified format for downstream analysis.

### Specialized Agents

- operations-incident-commander: Incident response
- development-migrations-specialist: Database migrations
- programmatic-seo-engineer: SEO architecture
- content-localization-coordinator: i18n/l10n
- quality-testing-performance-tester: Performance testing

## Best Practices

### Methodology

- Accept freeform input from user after `/research` command
- Parse input to determine if it's a file path or research question
- Read primary sources fully before agents
- Run same-type agents in parallel
- Prioritize current codebase over cache
- Query multiple knowledge sources when available
- Identify cross-component relationships
- Maintain source attribution throughout

### Configuration

- Set up `.codeflow/config.yaml` for consistent knowledge sources
- Use environment variables for sensitive credentials
- Test knowledge source connectivity before research
- Document custom MCP server configurations

### Documentation

- Consistent YAML frontmatter and sections
- Specific file:line references for code
- URLs and page titles for MCP sources
- Issue/task numbers for GitHub Projects
- Include temporal context
- Self-contained with necessary context

## Document Template

```markdown
---
date: {{current_date}}
researcher: Assistant
topic: 'Research Topic'
tags: [research, tags]
status: complete
knowledge_sources:
  - type: directory
    path: thoughts/
    items: 12
  - type: mcp
    server: notion
    items: 8
  - type: gh-projects
    project: myorg/1
    items: 15
---

## Synopsis

[Brief summary of question/requirements]

## Summary

[High-level findings across all sources]

## Detailed Findings

### From Codebase

#### Component 1

- Finding ([file.ext:line])
- Connections and patterns

### From Local Documentation (thoughts/)

- [Findings from local files]
- Source: `thoughts/2025-10-13-architecture.md`

### From Notion (via MCP)

- [Findings from Notion]
- Source: [Page Title](https://notion.so/page-url)

### From GitHub Projects

- [Findings from project board]
- Source: Issue #123, Task "Implement OAuth2"

## Code References

- `path/file.ext:line` - Description

## Knowledge References

- `thoughts/decisions/auth.md` - Authentication decisions
- [Notion: API Design](https://notion.so/...) - API architecture
- [GitHub Issue #123](https://github.com/org/repo/issues/123) - Implementation task

## Architecture Insights

[Key patterns and decisions from all sources]

## Historical Context

[Insights from knowledge sources]

## Open Questions

[Any further investigation needed]

## Source Summary

- **Codebase**: 18 files analyzed
- **Local Docs**: 12 documents
- **Notion**: 8 pages
- **GitHub Projects**: 15 items
```

## Edge Cases

### Limited Findings

- Expand scope with alternative terms/patterns
- Try additional knowledge sources
- Document what was not found and where

### Multi-Component Systems

- Break into sub-questions
- Use multiple agents per aspect
- Query different knowledge sources per component
- Separate sections per component

### Historical vs Current

- Prioritize current codebase
- Use knowledge sources for context/rationale
- Note discrepancies between sources
- Include timestamps for version awareness

### Knowledge Source Conflicts

- When sources contradict:
  1. Note the conflict explicitly
  2. Prioritize by recency
  3. Include both perspectives
  4. Recommend clarification/consolidation

### Partial Source Availability

- Continue with available sources
- Document which sources were unreachable
- Provide results with caveat
- Suggest retry with full source availability

## Anti-Patterns

- Spawn agents before reading sources
- Run agents sequentially instead of parallel
- Rely solely on cached documentation
- Skip cache checks
- Ignore knowledge source configuration
- Mix findings without source attribution
- Assume single source has complete information
- Fail to parse `/research <input>` format correctly

## Caching

### Usage

- Store successful strategies for similar topics
- Cache effective agent combinations
- Remember question decomposition
- Cache knowledge source query patterns
- Store source-specific optimizations

### Cache Keys

Include knowledge source configuration in cache keys:
```
pattern:{question_hash}:{scope}:{source_type}:{source_config_hash}
```

### Invalidation

- Manual: Clear on standards/structure changes
- Content-based: Significant question changes
- Time-based: Refresh hourly for active sessions
- Source-based: Invalidate when knowledge source configuration changes
- Per-source TTL: Different TTLs for different source types
  - Directory: Short TTL (frequently updated)
  - MCP: Medium TTL (updated less frequently)
  - GitHub: Medium TTL (project data changes)

### Performance

- Hit rate ≥60%
- Memory <30MB
- Response <150ms
- Per-source query timeout: 30s
- Total research timeout: 5min

## Knowledge Source Setup Guides

### Setting Up Notion via MCP

1. Install Notion MCP server:
   ```bash
   npm install -g @modelcontextprotocol/server-notion
   ```

2. Get Notion API key and database ID from https://notion.so/my-integrations

3. Configure in `.codeflow/config.yaml`:
   ```yaml
   research:
     knowledge_source_type: mcp
     knowledge_source_config:
       mcp:
         server: notion
         database_id: YOUR_DATABASE_ID
   ```

4. Set environment variable:
   ```bash
   export NOTION_API_KEY=your_key_here
   ```

### Setting Up GitHub Projects

1. Authenticate GitHub CLI:
   ```bash
   gh auth login
   ```

2. Find your project number:
   ```bash
   gh project list --owner YOUR_ORG
   ```

3. Configure in `.codeflow/config.yaml`:
   ```yaml
   research:
     knowledge_source_type: gh-projects
     knowledge_source_config:
       gh_projects:
         owner: YOUR_ORG
         project_number: 1
         fields: [Status, Priority, Assignees]
   ```

### Testing Your Configuration

Test knowledge source connectivity:
```bash
codeflow research test-connection
```

This will verify:
- Configuration is valid
- Source is accessible
- Authentication works
- Sample query succeeds

{{query}}
