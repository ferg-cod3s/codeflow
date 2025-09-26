---
name: commit
mode: command
description: Commits the local changes in multiple atomic commits
version: 2.0.0-internal
last_updated: 2025-09-13
command_schema_version: 1.0
inputs:
  - name: git_status
    type: string
    required: true
    description: Current git status output
  - name: git_diff
    type: string
    required: true
    description: Git diff of changes to be committed
outputs:
  - name: commit_plan
    type: structured
    format: JSON with commit messages and file groupings
    description: Structured plan of commits to be created
cache_strategy:
  type: agent_specific
  ttl: 300
  invalidation: content_based
  scope: command
success_signals:
  - 'Successfully created N commit(s)'
  - 'All changes committed atomically'
  - 'Commit messages follow conventional format'
failure_modes:
  - 'Git repository not clean'
  - 'No changes to commit'
  - 'Commit message validation failed'
---

# Commit Changes

You are tasked with creating git commits for the changes made during this session. This command uses intelligent caching to optimize performance and maintain consistency across similar commit operations.

## Purpose

Create atomic, well-structured git commits that follow conventional commit standards and group related changes logically.

## Inputs

- **git_status**: Current repository status showing modified files
- **git_diff**: Detailed diff of changes to be committed
- **conversation_context**: History of changes made in this session

## Preconditions

- Git repository is initialized and clean (no uncommitted changes in staging area)
- All changes have been reviewed and approved
- Repository is in a valid state for committing

## Process Phases

### Phase 1: Context Analysis & Cache Check

1. **Check Cache First**: Query cache for similar commit patterns using conversation context hash
2. **Analyze Changes**: Review git status and diff to understand scope and nature of changes
3. **Determine Commit Strategy**: Decide on single vs. multiple commits based on change patterns

### Phase 2: Commit Planning

1. **Group Related Files**: Identify logical groupings based on functionality and file types
2. **Draft Commit Messages**: Create conventional commit messages following project standards
3. **Validate Commit Structure**: Ensure commits will be atomic and focused

### Phase 3: Execution & Verification

1. **Stage Files Selectively**: Use `git add` with specific file paths (never `-A` or `.`)
2. **Create Commits**: Execute commits with planned messages
3. **Update Cache**: Store successful commit patterns for future reference

## Error Handling

### Repository State Errors

```error-context
{
  "command": "commit",
  "phase": "precondition_check",
  "error_type": "repository_state",
  "expected": "Clean working directory",
  "found": "Uncommitted changes in staging area",
  "mitigation": "Stash or commit existing changes first",
  "requires_user_input": true
}
```

### No Changes Error

```error-context
{
  "command": "commit",
  "phase": "analysis",
  "error_type": "no_changes",
  "expected": "Modified files to commit",
  "found": "Working directory clean",
  "mitigation": "No action needed - no changes to commit",
  "requires_user_input": false
}
```

## Structured Output Specification

### Primary Output

```command-output:commit_plan
{
  "status": "success|planning|error",
  "timestamp": "ISO-8601",
  "cache": {
    "hit": true|false,
    "key": "commit_pattern:{context_hash}",
    "ttl_remaining": 300,
    "savings": 0.15
  },
  "analysis": {
    "total_files": 5,
    "change_types": ["feature", "fix", "docs"],
    "commit_strategy": "multiple"
  },
  "commits": [
    {
      "type": "feat",
      "scope": "auth",
      "message": "add user authentication system",
      "files": ["src/auth/login.ts", "src/auth/session.ts"],
      "body": "Implements JWT-based authentication with session management"
    },
    {
      "type": "docs",
      "scope": "api",
      "message": "update API documentation",
      "files": ["docs/api/auth.md"],
      "body": "Document new authentication endpoints and usage"
    }
  ],
  "metadata": {
    "processing_time": 150,
    "cache_savings": 0.15
  }
}
```

## Success Criteria

#### Automated Verification

- [ ] Git repository remains in clean state after commits
- [ ] All specified files are committed
- [ ] Commit messages follow conventional format
- [ ] No merge conflicts or git errors
- [ ] Cache updated with successful patterns

#### Manual Verification

- [ ] Commit history shows logical grouping of changes
- [ ] Commit messages are clear and descriptive
- [ ] Each commit represents a single, focused change
- [ ] Repository status shows clean working directory

## Edge Cases

### Large Diff Handling

- For diffs > 1000 lines, suggest breaking into multiple focused commits
- Cache large diff patterns to optimize future similar operations

### Binary Files

- Handle binary files appropriately (don't diff, but include in commits)
- Cache binary file commit patterns separately

### Partial Staging

- Detect when only some changes should be committed
- Provide clear guidance on selective staging

## Anti-Patterns

### Avoid These Practices

- **Mass commits**: Don't commit all changes as one large commit
- **Vague messages**: Avoid generic messages like "fix bug" or "update code"
- **Mixed concerns**: Don't mix feature changes with refactoring in same commit
- **Cache bypass**: Don't skip cache checks for performance reasons

## Caching Guidelines

### Cache Usage Patterns

- **Pattern caching**: Store successful commit grouping patterns
- **Message templates**: Cache conventional commit message structures
- **File grouping**: Remember successful file grouping strategies

### Cache Invalidation Triggers

- **Manual**: Clear cache when commit conventions change
- **Content-based**: Invalidate when repository structure changes significantly
- **Time-based**: Refresh cache every 5 minutes for active development

### Performance Optimization

- Cache hit rate target: ≥ 70% for repeated commit patterns
- Memory usage: < 10MB for commit pattern cache
- Response time: < 50ms for cache queries

{{git-status}}
`!git status -s`
{{/git-status}}

{{git-diff}}
`!git diff`
{{/git-diff}}
