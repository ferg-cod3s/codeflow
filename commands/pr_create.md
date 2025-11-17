---
name: pr_create
description: Create pull requests with comprehensive descriptions, reviews, and validation
version: 1.0.0
category: development
author: CodeFlow
tags: [pull-request, review, collaboration, validation, git]
parameters:
  - name: title
    type: string
    required: true
    description: 'Pull request title'
  - name: base-branch
    type: string
    required: false
    description: 'Base branch to merge into'
    default: 'main'
  - name: head-branch
    type: string
    required: false
    description: 'Head branch containing changes'
    default: 'current branch'
  - name: description
    type: string
    required: false
    description: 'Pull request description (auto-generated if not provided)'
  - name: reviewers
    type: array
    required: false
    description: 'List of reviewers to assign'
    items:
      type: string
  - name: labels
    type: array
    required: false
    description: 'Labels to apply to the PR'
    items:
      type: string
  - name: draft
    type: boolean
    required: false
    description: 'Create as draft PR'
    default: false
  - name: auto-review
    type: boolean
    required: false
    description: 'Request automated code review'
    default: true
examples:
  - name: 'Basic PR creation'
    command: "pr-create title='Add user authentication feature'"
    description: 'Create a basic pull request with auto-generated description'
  - name: 'PR with specific reviewers'
    command: "pr-create title='Fix security vulnerability' reviewers=['@security-team', '@lead-dev'] labels=['security', 'urgent']"
    description: 'Create PR with specific reviewers and labels'
  - name: 'Draft PR for review'
    command: "pr-create title='Refactor database layer' draft=true auto-review=true"
    description: 'Create draft PR with automated review'
agents:
  - code-reviewer
  - technical-writer
  - security-scanner
  - performance-engineer
  - api-documenter
phases:
  - name: 'Change Analysis'
    description: 'Analyze changes and gather context'
    agents: [code-reviewer, technical-writer]
    steps:
      - 'Review git diff and identify changed files'
      - 'Categorize changes (feature, bug fix, refactor, etc.)'
      - 'Extract commit messages and context'
      - 'Identify related issues and requirements'
  - name: 'Description Generation'
    description: 'Generate comprehensive PR description'
    agents: [technical-writer, code-reviewer]
    steps:
      - 'Summarize changes and their purpose'
      - 'Document technical implementation details'
      - 'Include code examples and usage instructions'
      - 'Add testing and validation information'
      - 'Reference related issues and documentation'
    parallel: true
  - name: 'Code Review and Validation'
    description: 'Perform automated code review and validation'
    agents: [code-reviewer, security-scanner, performance-engineer]
    steps:
      - 'Run automated code quality checks'
      - 'Perform security vulnerability scanning'
      - 'Analyze performance implications'
      - 'Validate code style and conventions'
      - 'Check test coverage and quality'
    parallel: true
  - name: 'PR Creation'
    description: 'Create the pull request with all details'
    agents: [technical-writer]
    steps:
      - 'Create PR with generated title and description'
      - 'Apply appropriate labels and metadata'
      - 'Assign reviewers and set up notifications'
      - 'Configure branch protection and merge requirements'
      - 'Set up automated checks and validations'
  - name: 'Review Coordination'
    description: 'Coordinate review process and follow-up'
    agents: [code-reviewer]
    steps:
      - 'Notify reviewers and stakeholders'
      - 'Set up review reminders and deadlines'
      - 'Track review progress and status'
      - 'Facilitate discussion and feedback'
      - 'Prepare merge readiness assessment'
implementation_details:
  - 'Use code-reviewer for comprehensive code analysis and feedback'
  - 'Leverage technical-writer for clear, comprehensive descriptions'
  - 'Integrate security-scanner for vulnerability detection'
  - 'Apply performance-engineer for performance impact assessment'
  - 'Utilize api-documenter for API change documentation'
  - 'Support multiple git platforms (GitHub, GitLab, Bitbucket)'
  - 'Auto-generate descriptions based on commit analysis'
  - 'Integrate with CI/CD for automated validation'
success_criteria:
  - 'Pull request created successfully with comprehensive description'
  - 'All changes reviewed and validated'
  - 'Reviewers assigned and notified'
  - 'Labels and metadata applied correctly'
  - 'Automated checks configured and passing'
  - 'Clear next steps and expectations communicated'
error_handling:
  - "Handle cases where base or head branch doesn't exist"
  - 'Retry mechanisms for network or API failures'
  - 'Graceful handling of missing reviewers or labels'
  - 'Clear error messages with suggested fixes'
  - 'Preserve draft state for incomplete PRs'
integration_examples:
  - 'GitHub Actions workflow integration'
  - 'GitLab CI/CD pipeline automation'
  - 'Bitbucket pipeline integration'
  - 'IDE extension for quick PR creation'
best_practices:
  - 'Use descriptive titles that clearly indicate changes'
  - 'Include comprehensive descriptions with context'
  - 'Assign appropriate reviewers based on expertise'
  - 'Apply relevant labels for easy categorization'
  - 'Request automated reviews for quality assurance'
related_commands:
  - 'code-review': 'For detailed code review and feedback'
  - 'security-scan': 'For security validation in PRs'
  - 'impact-analysis': 'For change impact assessment'
  - 'test': 'For automated testing in PR validation'
---

# Create Pull Request

Create PR with title **$TITLE** from **$HEAD_BRANCH** to **$BASE_BRANCH**.

**PR Parameters:**
- Title: $TITLE (required - pull request title)
- Base Branch: $BASE_BRANCH (optional - default: main)
- Head Branch: $HEAD_BRANCH (optional - default: current branch)
- Description: $DESCRIPTION (optional - auto-generated if not provided)
- Reviewers: $REVIEWERS (optional - list of reviewers)
- Labels: $LABELS (optional - labels to apply)
- Draft: $DRAFT (optional - true|false, default: false)
- Auto Review: $AUTO_REVIEW (optional - true|false, default: true)
changelog:
  - '1.0.0': 'Initial implementation with comprehensive PR creation and review coordination'
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
