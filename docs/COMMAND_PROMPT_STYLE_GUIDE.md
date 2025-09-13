# Command Prompt Style Guide

## Overview

This guide establishes the canonical standards for CodeFlow command prompts, ensuring consistency, clarity, and optimal performance across all workflow commands. It includes comprehensive caching integration patterns for maximum efficiency.

## Core Principles

### 1. Clarity and Precision

- Use imperative, action-first language
- Be specific about expected inputs and outputs
- Avoid ambiguous terms and vague instructions

### 2. Consistency

- Follow standardized section structure
- Use consistent terminology across commands
- Maintain uniform formatting and style

### 3. Performance Optimization

- Minimize token usage through modular design
- Leverage intelligent caching mechanisms
- Optimize for common use cases

### 4. Maintainability

- Include comprehensive error handling
- Provide clear success criteria
- Document edge cases and anti-patterns

## Command Structure

### Required Frontmatter Fields

```yaml
---
name: command-name
description: Brief description of command purpose
version: 2.0.0-internal
last_updated: YYYY-MM-DD
command_schema_version: 1.0
inputs:
  - name: input_name
    type: string|file|path
    required: true|false
    description: Input description
outputs:
  - name: output_name
    type: structured|file|text
    format: Format specification
cache_strategy:
  type: agent_specific|shared|hierarchical
  ttl: 3600
  invalidation: content_based|time_based|manual
  scope: command|workflow|global
success_signals:
  - 'Success indicator 1'
  - 'Success indicator 2'
failure_modes:
  - 'Failure mode 1'
  - 'Failure mode 2'
---
```

### Standard Section Order

1. **Purpose** - High-level objective
2. **Inputs** - Required and optional inputs
3. **Preconditions** - Required state/setup
4. **Process Phases** - Step-by-step execution
5. **Error Handling** - Failure recovery patterns
6. **Structured Output Specification** - Output format requirements
7. **Success Criteria** - Verification requirements
8. **Edge Cases** - Special scenarios
9. **Anti-Patterns** - What to avoid
10. **Caching Guidelines** - Cache usage patterns

## Caching Integration Patterns

### Cache Strategy Types

#### 1. Agent-Specific Cache

```yaml
cache_strategy:
  type: agent_specific
  ttl: 1800
  invalidation: content_based
  scope: command
```

- Used for: File analysis, pattern recognition, code parsing
- Cache keys: Content hash, file path, modification time
- Examples: Locator agents, analyzer agents

#### 2. Shared Cache

```yaml
cache_strategy:
  type: shared
  ttl: 3600
  invalidation: time_based
  scope: workflow
```

- Used for: Cross-command data sharing, workflow state
- Cache keys: Workflow ID, session hash, user context
- Examples: Plan execution state, research findings

#### 3. Hierarchical Cache

```yaml
cache_strategy:
  type: hierarchical
  ttl: 7200
  invalidation: manual
  scope: global
```

- Used for: System-wide patterns, templates, configurations
- Cache keys: Pattern hash, template ID, config version
- Examples: Code patterns, documentation templates

### Cache Usage Guidelines

#### Cache-Aware Instructions

```markdown
## Process Phases

1. **Check Cache First**
   - Query cache for existing analysis of target files
   - Use cache key: `analysis:{file_path}:{content_hash}`
   - If cache hit: proceed to step 3

2. **Perform Analysis**
   - Analyze files not found in cache
   - Store results in cache with appropriate TTL

3. **Generate Output**
   - Include cache metadata in structured output
   - Update cache with new findings
```

#### Cache Invalidation Triggers

```markdown
## Cache Management

- **Automatic Invalidation**: File modification detected
- **Manual Invalidation**: Use `/clear-cache` command
- **Selective Clearing**: Clear specific cache segments
- **Emergency Reset**: Full cache wipe for debugging
```

### Cache Performance Optimization

#### Cache Key Generation

- **Content-based**: SHA-256 hash of file contents
- **Path-based**: Normalized file paths
- **Query-based**: Hash of search parameters
- **Context-aware**: Include user/session context

#### Cache Compression

- **Automatic compression** for entries > 1KB
- **Format-specific compression** (JSON, text, binary)
- **Memory-efficient storage** with size limits

## Structured Output Conventions

### Output Block Format

````markdown
## Structured Output Specification

### Primary Output

```command-output:output_name
{
  "status": "success|error",
  "timestamp": "ISO-8601",
  "cache": {
    "hit": true|false,
    "key": "cache_key_hash",
    "ttl_remaining": 1234
  },
  "data": {
    // Command-specific data
  },
  "metadata": {
    "processing_time": 150,
    "cache_savings": 0.25
  }
}
```
````

### Error Output Format

````markdown
### Error Handling

```error-context
{
  "command": "command_name",
  "phase": "phase_name",
  "error_type": "validation|execution|cache",
  "expected": "Expected outcome",
  "found": "Actual outcome",
  "mitigation": "Recovery steps",
  "requires_user_input": true|false,
  "cache_invalidated": true|false
}
```
````

## Terminology Standards

### Agent References

- ✅ **Locator agents**: For finding files and components
- ✅ **Analyzer agents**: For examining code and patterns
- ✅ **Generator agents**: For creating outputs and templates
- ❌ **Sub-agents**: Use specific agent types instead

### Action Verbs

- ✅ **Execute**: Run commands or processes
- ✅ **Analyze**: Examine and understand code
- ✅ **Generate**: Create new content or files
- ❌ **Implement**: Use "execute" for consistency

### File References

- ✅ **Use relative paths**: `src/components/Button.tsx`
- ✅ **Include line numbers**: `file.ext:123`
- ✅ **Normalize paths**: Use forward slashes consistently

## Error Handling Patterns

### Standard Error Blocks

````markdown
## Error Handling

### File Not Found

```error-context
{
  "error_type": "file_not_found",
  "expected": "File exists at specified path",
  "found": "File does not exist",
  "mitigation": "Verify file path and permissions",
  "requires_user_input": true
}
```
````

### Cache Corruption

```error-context
{
  "error_type": "cache_corruption",
  "expected": "Valid cache entry",
  "found": "Corrupted cache data",
  "mitigation": "Clear cache and retry operation",
  "requires_user_input": false,
  "cache_invalidated": true
}
```

## Success Criteria Format

### Automated Verification

```markdown
### Success Criteria

#### Automated Verification

- [ ] Command completes without errors
- [ ] Output matches expected format
- [ ] Cache hit rate ≥ 70% for repeated operations
- [ ] Processing time < threshold (command-specific)
```

### Manual Verification

```markdown
#### Manual Verification

- [ ] Output is human-readable and accurate
- [ ] Edge cases handled appropriately
- [ ] Performance acceptable for use case
- [ ] No regressions in related functionality
```

## Performance Guidelines

### Token Budgets

- **Small commands** (commit, test): < 500 tokens
- **Medium commands** (document, review): < 1,000 tokens
- **Large commands** (plan, research): < 2,500 tokens
- **Expansion blocks**: < 500 tokens each

### Cache Performance Targets

- **Hit rate**: ≥ 70% for repeated operations
- **Memory usage**: < 50MB per command session
- **Load time**: < 100ms for cache queries
- **Invalidation time**: < 50ms for cache updates

## Maintenance and Evolution

### Version Control

- **Schema versioning**: Increment on breaking changes
- **Command versioning**: Track in frontmatter
- **Cache versioning**: Handle format changes gracefully

### Review Process

- **Quarterly reviews**: Assess style guide effectiveness
- **Performance monitoring**: Track cache and token metrics
- **User feedback**: Incorporate improvement suggestions

### Extension Guidelines

- **New sections**: Must follow standard order
- **New cache types**: Document integration patterns
- **New terminology**: Add to standards before use

## Implementation Checklist

### For Each Command

- [ ] Frontmatter includes all required fields
- [ ] Sections follow standard order
- [ ] Cache strategy properly configured
- [ ] Error handling patterns implemented
- [ ] Success criteria clearly defined
- [ ] Token budget within limits
- [ ] Performance targets documented

### For Cache Integration

- [ ] Cache strategy documented
- [ ] Cache keys properly generated
- [ ] Invalidation triggers defined
- [ ] Performance metrics tracked
- [ ] Error recovery implemented

This style guide ensures all CodeFlow commands provide consistent, efficient, and cache-optimized experiences while maintaining high standards of clarity and reliability.
