---
name: research
description: Research a ticket or provide a prompt for ad-hoc research
version: 2.0.0-internal
last_updated: 2025-09-13
command_schema_version: 1.0
inputs:
  - name: ticket
    type: string
    required: true
    description: Path to ticket file or research question/topic
  - name: scope
    type: string
    required: false
    description: Research scope hint (codebase|thoughts|both)
  - name: depth
    type: string
    required: false
    description: Research depth (shallow|medium|deep)
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
  - 'Findings documented in thoughts/research/'
  - 'All research questions addressed'
failure_modes:
  - 'Ticket file not found or invalid'
  - 'Research agents unable to complete analysis'
  - 'Insufficient findings to answer research question'
---

# Research Codebase

You are tasked with conducting comprehensive research across the codebase to answer user questions by spawning specialized agents and synthesizing their findings. This command uses intelligent caching to optimize research workflows and maintain consistency across similar investigations.

## Purpose

Conduct thorough, multi-dimensional research by coordinating specialized agents to explore codebase patterns, historical context, and architectural insights, then synthesize findings into actionable documentation.

## Inputs

- **ticket**: Path to ticket file or specific research question/topic
- **scope**: Optional scope hint to guide research focus (codebase, thoughts, or both)
- **depth**: Optional depth parameter for research thoroughness
- **conversation_context**: History of related research and discussions

## Preconditions

- Ticket file exists and is readable (if path provided)
- Research question is clearly defined
- Development environment accessible for agent coordination
- Sufficient time allocated for comprehensive analysis

## Process Phases

### Phase 1: Context Analysis & Planning

1. **Check Cache First**: Query cache for similar research patterns using ticket/question hash
2. **Read Primary Source**: Completely read the ticket file or understand the research question
3. **Decompose Research Scope**: Break down the query into specific investigation areas
4. **Create Research Plan**: Set up todo list to track all research subtasks
5. **Identify Research Strategy**: Determine which agents and approaches to use

### Phase 2: Parallel Agent Coordination

1. **Spawn Locator Agents**: Launch codebase-locator and thoughts-locator in parallel
2. **Gather Pattern Intelligence**: Use codebase-pattern-finder for similar implementation examples
3. **Deep Analysis**: Execute codebase-analyzer and thoughts-analyzer on key findings
4. **Domain-Specific Research**: Deploy specialized agents as needed for domain expertise
5. **Wait for Completion**: Ensure all agents finish before synthesis

### Phase 3: Synthesis & Documentation

1. **Compile Findings**: Aggregate results from all research agents
2. **Cross-Reference Analysis**: Connect findings across components and contexts
3. **Generate Insights**: Identify patterns, architectural decisions, and key relationships
4. **Create Research Document**: Structure findings with proper metadata and references
5. **Update Cache**: Store successful research patterns for future investigations

## Error Handling

### Invalid Ticket Error

```error-context
{
  "command": "research",
  "phase": "context_analysis",
  "error_type": "invalid_ticket",
  "expected": "Valid ticket file or research question",
  "found": "File not found: thoughts/tickets/missing-ticket.md",
  "mitigation": "Verify ticket path or clarify research question",
  "requires_user_input": true
}
```

### Agent Coordination Failure

```error-context
{
  "command": "research",
  "phase": "agent_execution",
  "error_type": "agent_failure",
  "expected": "All research agents complete successfully",
  "found": "codebase-locator agent failed with timeout",
  "mitigation": "Retry agent execution or adjust research scope",
  "requires_user_input": false
}
```

### Insufficient Findings Error

```error-context
{
  "command": "research",
  "phase": "synthesis",
  "error_type": "insufficient_findings",
  "expected": "Adequate findings to answer research question",
  "found": "Only 2 relevant files found for complex architectural question",
  "mitigation": "Expand research scope or clarify research objectives",
  "requires_user_input": true
}
```

## Structured Output Specification

### Primary Output

```command-output:research_document
{
  "status": "success|in_progress|error",
  "timestamp": "ISO-8601",
  "cache": {
    "hit": true|false,
    "key": "research_pattern:{ticket_hash}:{scope}",
    "ttl_remaining": 3600,
    "savings": 0.25
  },
  "research": {
    "question": "How does the authentication system work?",
    "scope": "codebase|thoughts|both",
    "depth": "shallow|medium|deep"
  },
  "findings": {
    "total_files_analyzed": 23,
    "codebase_findings": 18,
    "thoughts_findings": 5,
    "key_insights": 7,
    "architectural_patterns": 3
  },
  "document": {
    "path": "thoughts/research/2025-09-13-authentication-system.md",
    "sections": ["synopsis", "summary", "detailed_findings", "references"],
    "code_references": 12,
    "historical_context": 3
  },
  "agents_used": [
    "codebase-locator",
    "codebase-analyzer",
    "thoughts-locator",
    "thoughts-analyzer"
  ],
  "metadata": {
    "processing_time": 180,
    "cache_savings": 0.25,
    "agent_tasks": 6,
    "follow_up_questions": 0
  }
}
```

## Success Criteria

#### Automated Verification

- [ ] Research document created in `thoughts/research/` directory
- [ ] Document follows required structure with YAML frontmatter
- [ ] All specified agents completed their analysis successfully
- [ ] Document includes specific file:line references for key findings
- [ ] Cache updated with successful research patterns

#### Manual Verification

- [ ] Research question is fully addressed with concrete evidence
- [ ] Findings connect across different components and contexts
- [ ] Document provides actionable insights for development
- [ ] Historical context from thoughts/ is properly integrated
- [ ] Open questions are identified and addressed

## Agent Coordination Strategy

### Agent Execution Order

1. **Phase 1 - Discovery**: Run locator agents in parallel
   - codebase-locator: Find relevant files and components
   - thoughts-locator: Discover existing documentation

2. **Phase 2 - Pattern Analysis**: Execute pattern-finder after locators complete
   - codebase-pattern-finder: Identify similar implementation examples

3. **Phase 3 - Deep Analysis**: Run analyzers on most promising findings
   - codebase-analyzer: Understand how specific code works
   - thoughts-analyzer: Extract insights from key documents

### Specialized Agent Selection

- **operations-incident-commander**: Incident response and operational issues
- **development-migrations-specialist**: Database changes and migrations
- **programmatic-seo-engineer**: SEO architecture and content generation
- **content-localization-coordinator**: i18n/l10n workflows
- **quality-testing-performance-tester**: Performance analysis and testing

## Research Best Practices

### Investigation Methodology

- **Complete Context First**: Always read primary sources fully before agent coordination
- **Parallel Execution**: Maximize efficiency by running same-type agents concurrently
- **Fresh Analysis**: Prioritize current codebase over cached documentation
- **Cross-Component Connections**: Identify relationships between different system parts

### Documentation Standards

- **Structured Format**: Use consistent YAML frontmatter and section organization
- **Concrete References**: Include specific file paths and line numbers
- **Temporal Context**: Document when research was conducted
- **Self-Contained**: Ensure documents stand alone with necessary context

## Research Document Template

```markdown
---
date: 2025-09-13T10:30:00Z
researcher: Assistant
git_commit: abc123def456
branch: main
repository: codeflow
topic: 'Authentication System Architecture'
tags: [research, authentication, security, architecture]
status: complete
last_updated: 2025-09-13
last_updated_by: Assistant
---

## Ticket Synopsis

[Brief summary of the research question or ticket requirements]

## Summary

[High-level findings answering the research question]

## Detailed Findings

### [Component/Area 1]

- Finding with reference ([file.ext:line])
- Connection to other components
- Implementation details and patterns

### [Component/Area 2]

- Finding with reference ([file.ext:line])
- Architectural insights
- Usage patterns discovered

## Code References

- `path/to/auth.ts:123` - Main authentication logic
- `src/components/Login.tsx:45-67` - Frontend implementation

## Architecture Insights

[Key patterns, conventions, and design decisions]

## Historical Context (from thoughts/)

[Relevant insights from thoughts/ directory]

- `thoughts/architecture/auth-design.md` - Previous authentication decisions
- `thoughts/research/2024-12-01-auth-analysis.md` - Related research

## Related Research

[Links to other relevant research documents]

## Open Questions

[Any areas requiring further investigation]
```

## Edge Cases

### Limited Findings Scenario

- When research yields minimal results, expand scope systematically
- Consider alternative search terms and directory patterns
- Document what was NOT found as well as what was discovered

### Complex Multi-Component Systems

- Break research into focused sub-questions
- Use multiple specialized agents for different aspects
- Create separate sections for each major component

### Historical vs Current Analysis

- Always prioritize current codebase as source of truth
- Use historical documents for context and decision rationale
- Note any discrepancies between documentation and implementation

## Anti-Patterns

### Avoid These Practices

- **Incomplete context**: Don't spawn agents before reading primary sources
- **Sequential execution**: Don't run agents one at a time when parallel execution is possible
- **Stale research**: Don't rely solely on existing documentation without fresh analysis
- **Cache bypass**: Don't skip cache checks for performance reasons

## Caching Guidelines

### Cache Usage Patterns

- **Research strategies**: Store successful investigation approaches for similar topics
- **Agent combinations**: Cache effective agent coordination patterns
- **Question decomposition**: Remember how to break down complex research questions

### Cache Invalidation Triggers

- **Manual**: Clear cache when research standards or codebase structure change
- **Content-based**: Invalidate when research questions change significantly
- **Time-based**: Refresh cache every hour for active research sessions

### Performance Optimization

- Cache hit rate target: ≥ 60% for repeated research patterns
- Memory usage: < 30MB for research pattern cache
- Response time: < 150ms for cache queries

<ticket>$ARGUMENTS</ticket>
