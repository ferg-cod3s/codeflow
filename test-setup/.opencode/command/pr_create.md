---
name: pr_create
description: Create pull requests with comprehensive descriptions, reviews, and validation
mode: command
model: opencode/grok-code
version: 2.1.0-optimized
last_updated: 2025-11-03
command_schema_version: "1.0"
outputs:
  - name: result
    type: string
    description: Command execution result
cache_strategy:
  type: content_based
  ttl: 3600
  scope: command
success_signals:
  - Command completed successfully
  - Task executed without errors
failure_modes:
  - Command execution failed
  - Invalid parameters provided
  - System error occurred
---
# Pull Request Creation Command

**Input**: $ARGUMENTS


The `pr-create` command automates the creation of pull requests with comprehensive descriptions, automated reviews, and proper validation, streamlining the code review process.

## Overview

This command ensures pull requests are created with high-quality descriptions, appropriate reviewers, and thorough validation, improving collaboration and code quality.

## Key Features

- **Auto-Generated Descriptions**: Intelligent description generation based on changes
- **Comprehensive Validation**: Code review, security scanning, and performance analysis
- **Reviewer Assignment**: Smart reviewer suggestions and assignment
- **Label Management**: Automatic and manual label application
- **Multi-Platform Support**: GitHub, GitLab, Bitbucket integration

## Usage

```bash
# Create basic PR with auto-generated description
pr-create title='Add user authentication feature'

# Create PR with specific reviewers and labels
pr-create title='Fix security vulnerability' reviewers=['@security-team', '@lead-dev'] labels=['security', 'urgent']

# Create draft PR with automated review
pr-create title='Refactor database layer' draft=true auto-review=true
```

## Output

The command provides:

- Pull request URL and details
- Generated description and summary
- Validation results and feedback
- Assigned reviewers and labels
- Next steps and review guidelines

## Integration

This command integrates with:

- Git hosting platforms for PR creation
- CI/CD systems for automated validation
- Code review tools for enhanced feedback
- Team communication platforms for notifications

Use this command to create high-quality pull requests that facilitate efficient code review and collaboration.