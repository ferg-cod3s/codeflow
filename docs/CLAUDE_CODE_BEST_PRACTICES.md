# Claude Code Best Practices for Codeflow Projects



<!-- VERBALIZED SAMPLING INTEGRATION -->
<!-- ================================ -->

**Selected Strategy**: Code-Path Analysis
**Confidence**: 71.0%

**Available Strategies**:
1. **Code-Path Analysis** (Confidence: 71.0%)
   - Plan: Identify entry points and main execution flows, Trace key decision branches and conditional logic...
2. **Pattern Discovery** (Confidence: 71.0%)
   - Plan: Scan codebase for repeated code structures, Identify naming conventions and architectural patterns...
3. **Architecture Mapping** (Confidence: 71.0%)
   - Plan: Identify major components and modules, Map data flow and dependencies between components...


This guide provides comprehensive best practices for implementing Claude Code commands in codeflow projects, ensuring proper argument handling, template substitution, and integration with Claude Code's slash command system.

## Table of Contents

1. [Command Argument Handling](#command-argument-handling)
2. [Frontmatter Usage](#frontmatter-usage)
3. [Date and Time Handling](#date-and-time-handling)
4. [Template Substitution Patterns](#template-substitution-patterns)
5. [Command Structure Patterns](#command-structure-patterns)
6. [Error Handling and Validation](#error-handling-and-validation)
7. [Common Pitfalls and Solutions](#common-pitfalls-and-solutions)
8. [Testing and Validation](#testing-and-validation)

---

## Command Argument Handling

### Argument Types and Syntax

Claude Code supports two primary argument types in slash commands:

#### 1. All Arguments with `$ARGUMENTS`

The `$ARGUMENTS` placeholder captures all arguments passed to the command as a single string:

```markdown
---
name: deploy
description: Deploy application to specified environment
argument-hint: [environment] [version] [options]
---

Deploying application with arguments: $ARGUMENTS

!`echo "Deployment arguments received: $ARGUMENTS"`
!`opencode deploy $ARGUMENTS`
```

**Usage Examples:**

```bash
/deploy production v0.16.3 --rollback
# $ARGUMENTS becomes: "production v0.16.3 --rollback"

/deploy staging
# $ARGUMENTS becomes: "staging"
```

#### 2. Individual Arguments with `$1`, `$2`, etc.

Access specific arguments individually using positional parameters (similar to shell scripts):

```markdown
---
name: review-pr
description: Review pull request with priority and assignee
argument-hint: [pr-number] [priority] [assignee]
---

Reviewing PR #$1 with priority $2 and assigning to $3.

!`echo "PR: $1, Priority: $2, Assignee: $3"`
!`gh pr view $1 --json title,body,author`
!`gh pr review $1 --body "Reviewed with priority: $2"`
```

**Usage Examples:**

```bash
/review-pr 456 high alice
# $1 becomes "456", $2 becomes "high", $3 becomes "alice"

/review-pr 789
# $1 becomes "789", $2 and $3 are empty/undefined
```

### Argument Validation Patterns

#### Required Arguments Validation

```markdown
---
name: deploy
description: Deploy application to environment
argument-hint: [environment] [version]
---

# Validate required arguments

!`if [ -z "$1" ]; then
  echo "Error: Environment is required"
  echo "Usage: /deploy <environment> [version]"
  exit 1
fi`

!`if [ -z "$2" ]; then
  echo "Warning: No version specified, using latest"
  version="latest"
else
  version="$2"
fi`

Deploying to environment: $1
Version: $version
```

#### Type and Choice Validation

```markdown
---
name: deploy
description: Deploy to validated environment
argument-hint: [environment] [version]
---

# Validate environment choices

!`case "$1" in
  "development"|"staging"|"production")
    echo "✅ Valid environment: $1"
    ;;
  *)
    echo "❌ Invalid environment: $1"
    echo "Valid environments: development, staging, production"
    exit 1
    ;;
esac`

Environment: $1
Version: $2
```

### Advanced Argument Processing

#### Argument Parsing with Defaults

```markdown
---
name: deploy
description: Deploy with argument parsing and defaults
argument-hint: [environment] [version] [options...]
---

# Parse arguments with defaults

environment="$1"
version="${2:-latest}" # Default to "latest" if not provided
shift 2 # Remove first two arguments
options="$@" # Remaining arguments

echo "Environment: $environment"
echo "Version: $version"
echo "Additional options: $options"

# Validate environment

!`if [ -z "$environment" ]; then
  echo "Error: Environment is required"
  exit 1
fi`

!`echo "Starting deployment to $environment with version $version"`
!`if [ -n "$options" ]; then
  echo "Additional options: $options"
fi`
```

#### Array-style Arguments

```markdown
---
name: batch-process
description: Process multiple items
argument-hint: [item1] [item2] [item3...]
---

# Convert arguments to array

items=("$@")

echo "Processing ${#items[@]} items:"
for i in "${!items[@]}"; do
echo " Item $((i+1)): ${items[i]}"
done

!`for item in "$@"; do
echo "Processing: $item"

# Process each item

done`
```

---

## Frontmatter Usage

### Basic Frontmatter Structure

```yaml
---
name: command-name
description: Brief description of command functionality
argument-hint: [required] [optional] [choices...]
allowed-tools: Bash(git:*), Read, Grep
model: claude-3-5-sonnet-20241022
temperature: 0.1
---
```

### Frontmatter Fields for Arguments

#### `argument-hint`

Provides usage guidance and auto-completion hints:

```yaml
---
argument-hint: [environment] [version] [--rollback] [--dry-run]
---
```

**Patterns:**

- `[required]` - Required parameter
- `[optional]` - Optional parameter
- `[choice1|choice2|choice3]` - Enumerated choices
- `[--flag]` - Optional flag
- `[key=value]` - Key-value pair

#### `allowed-tools`

Restrict which tools the command can use:

```yaml
---
allowed-tools: Bash(git add:*), Bash(git commit:*), Read, Grep
---
```

**Examples:**

- `Bash(git:*)` - Allow all git commands
- `Bash(git add:*)` - Allow only git add commands
- `Read, Grep, Glob` - Allow file operations
- `Bash(node:*)` - Allow node.js execution

#### `model` and `temperature`

Control AI behavior:

```yaml
---
model: claude-3-5-haiku-20241022
temperature: 0.1
---
```

---

## Date and Time Handling

### Current Date in Commands

```markdown
---
name: daily-report
description: Generate daily report
---

# Daily Report for !`date +%Y-%m-%d`

Generated on: !`date '+%B %d, %Y at %I:%M %p'`
Timestamp: !`date -u +"%Y-%m-%dT%H:%M:%SZ"`

!`echo "Creating daily report for $(date +%Y-%m-%d)"`
```

### Date Calculations

```markdown
---
name: weekly-report
description: Generate weekly report
---

# Weekly Report

!`start_date=$(date -d 'monday' +%Y-%m-%d)
end_date=$(date -d 'sunday' +%Y-%m-%d)
echo "Weekly Report: $start_date to $end_date"`

Report Period: !`date -d 'monday' +%Y-%m-%d` to !`date -d 'sunday' +%Y-%m-%d`
```

---

## Template Substitution Patterns

### Argument Substitution

#### Basic Substitution

```markdown
---
name: greet
description: Greet with provided name
---

Hello, $1! Welcome to the project.

!`echo "Greeting sent to: $1"`
```

#### Mixed Substitution

```markdown
---
name: deploy-info
description: Show deployment information
---

Deployment Information:

- Environment: $1
- Version: $2
- Timestamp: !`date -u +"%Y-%m-%dT%H:%M:%SZ"`
- User: !`whoami`

!`echo "Deploying $2 to $1 at $(date -u +"%Y-%m-%dT%H:%M:%SZ")"`
```

### File References

#### Single File References

```markdown
---
name: analyze-config
description: Analyze configuration file
---

Analyzing configuration: @package.json

Configuration contents will be processed and validated.

!`echo "Analyzing package.json configuration"`
```

#### Multiple File References

```markdown
---
name: project-setup
description: Setup project with multiple configs
---

Project Configuration Files:

- Main config: @package.json
- TypeScript config: @tsconfig.json
- Environment: @.env.example

!`echo "Setting up project with configuration files"`
```

### Shell Command Execution

#### Simple Commands

```markdown
---
name: status
description: Show project status
---

Current Project Status:

- Git Branch: !`git branch --show-current`
- Git Status: !`git status --porcelain | wc -l` modified files
- Current Directory: !`pwd`
- Node Version: !`node --version`
```

#### Complex Commands with Error Handling

```markdown
---
name: safe-deploy
description: Deploy with error handling
---

!`set -e # Exit on error

echo "Starting deployment..."
if ! opencode deploy $1; then
echo "❌ Deployment failed"
exit 1
fi

echo "✅ Deployment successful"`
```

---

## Command Structure Patterns

### Standard Command Template

```markdown
---
name: command-name
description: Clear, concise description
argument-hint: [required] [optional]
allowed-tools: Bash, Read, Grep
---

# Command Name

Brief description of what this command does.

## Usage

This command processes the provided arguments and performs the specified action.

## Arguments

- **$1**: Description of first argument
- **$2**: Description of second argument (optional)

## Execution

Processing arguments: $ARGUMENTS

!`echo "Executing command with arguments: $ARGUMENTS"`
```

### Multi-Step Commands

```markdown
---
name: full-deploy
description: Complete deployment pipeline
argument-hint: [environment] [version]
---

# Complete Deployment Pipeline

## Step 1: Validation

!`echo "Validating deployment to $1"`
!`if [ "$1" != "production" ] && [ "$1" != "staging" ]; then
  echo "❌ Invalid environment: $1"
  exit 1
fi`

## Step 2: Build

!`echo "Building version $2"`
!`npm run build`

## Step 3: Deploy

!`echo "Deploying to $1"`
!`opencode deploy $1 $2`

## Step 4: Verification

!`echo "Verifying deployment"`
!`curl -f https://$1.example.com/health || exit 1`

✅ Deployment completed successfully!
```

### Conditional Commands

```markdown
---
name: smart-deploy
description: Deploy with environment-specific logic
argument-hint: [environment] [version]
---

# Smart Deployment

Environment: $1
Version: $2

!`case "$1" in
  "production")
    echo "🚀 Production deployment detected"
    echo "Running additional security checks..."
    opencode security-scan
    opencode deploy production $2
    ;;
  "staging")
    echo "🧪 Staging deployment detected"
    opencode deploy staging $2
    opencode run-integration-tests
    ;;
  "development")
    echo "💻 Development deployment detected"
    opencode deploy development $2
    ;;
  *)
    echo "❌ Unknown environment: $1"
    exit 1
    ;;
esac`
```

---

## Error Handling and Validation

### Input Validation

```markdown
---
name: safe-process
description: Process with comprehensive validation
argument-hint: [input] [output]
---

# Safe Processing

## Input Validation

!`if [ -z "$1" ]; then
  echo "❌ Error: Input file is required"
  echo "Usage: /safe-process <input> [output]"
  exit 1
fi`

!`if [ ! -f "$1" ]; then
  echo "❌ Error: Input file '$1' does not exist"
  exit 1
fi`

!`if [ -z "$2" ]; then
  output="processed_$(basename "$1")"
else
  output="$2"
fi`

Processing: $1
Output: $output

!`echo "Processing $1 -> $output"`
```

### Error Recovery

```markdown
---
name: resilient-deploy
description: Deploy with automatic recovery
argument-hint: [environment] [version]
---

# Resilient Deployment

!`max_retries=3
attempt=1

while [ $attempt -le $max_retries ]; do
echo "Deployment attempt $attempt of $max_retries..."

if opencode deploy $1 $2; then
echo "✅ Deployment successful on attempt $attempt"
break
else
echo "❌ Deployment failed on attempt $attempt"

    if [ $attempt -eq $max_retries ]; then
      echo "❌ All deployment attempts failed"
      exit 1
    fi

    echo "Waiting 30 seconds before retry..."
    sleep 30
    attempt=$((attempt + 1))

fi
done`
```

---

## Common Pitfalls and Solutions

### Argument Handling Mistakes

#### ❌ Bad: Unvalidated arguments

```markdown
---
name: deploy
---

!`kubectl apply -f $1`
```

#### ✅ Good: Validated arguments

```markdown
---
name: deploy
argument-hint: [manifest-file]
---

!`if [ -z "$1" ]; then
echo "Error: Manifest file is required"
exit 1
fi

!`if [ ! -f "$1" ]; then
echo "Error: Manifest file '$1' does not exist"
exit 1
fi

!`kubectl apply -f "$1"`
```

### Frontmatter Issues

#### ❌ Bad: Missing required frontmatter

```markdown
# No frontmatter

Deploy to $1
```

#### ✅ Good: Complete frontmatter

```markdown
---
name: deploy
description: Deploy application to environment
argument-hint: [environment] [version]
allowed-tools: Bash(kubectl:*), Read
---

Deploy to $1 with version $2
```

### Shell Command Issues

#### ❌ Bad: Unsafe shell interpolation

```markdown
---
name: process
---

!`rm -rf $1`
```

#### ✅ Good: Safe with validation

```markdown
---
name: process
---

!`if echo "$1" | grep -q "^[a-zA-Z0-9_-]*$"; then
  rm -rf "$1"
else
  echo "❌ Invalid argument format: $1"
  exit 1
fi`
```

---

## Testing and Validation

### Command Testing Framework

````markdown
---
name: test-deploy
description: Test deployment command
---

# Test Deployment Command

## Test Cases

### Test 1: Valid Environment

```bash
/deploy production v1.0.0
```
````

Expected: ✅ Deployment to production with version v1.0.0

### Test 2: Invalid Environment

```bash
/deploy invalid v1.0.0
```

Expected: ❌ Error about invalid environment

### Test 3: Missing Version

```bash
/deploy production
```

Expected: ✅ Deployment to production with latest version

## Validation Script

!`cat > test-deploy.sh << 'EOF'
#!/bin/bash

echo "Testing deployment command..."

# Test 1: Valid environment

echo "Test 1: Valid environment"
if /deploy production v1.0.0 | grep -q "✅"; then
echo "✅ Test 1 passed"
else
echo "❌ Test 1 failed"
fi

# Test 2: Invalid environment

echo "Test 2: Invalid environment"
if /deploy invalid v1.0.0 | grep -q "❌"; then
echo "✅ Test 2 passed"
else
echo "❌ Test 2 failed"
fi

echo "Testing completed."
EOF

chmod +x test-deploy.sh
./test-deploy.sh`

````

### Integration Testing

```markdown
---
name: integration-test
description: Integration test for deployment
---

# Integration Test

## Test Environment Setup
!`kubectl create namespace test-$(date +%s) --dry-run=client -o yaml | kubectl apply -f -`

## Test Deployment
!`echo "Testing deployment to test namespace"`
!`kubectl apply -f k8s/ --dry-run=client`

## Verification
!`kubectl get pods --dry-run=client`

## Cleanup
!`echo "✅ Integration test passed"`
````

---

## Quick Reference

### Argument Patterns

| Pattern          | Description                     | Example                                   |
| ---------------- | ------------------------------- | ----------------------------------------- |
| `$ARGUMENTS`     | All arguments as one string     | `$ARGUMENTS` → "production v1.0.0"        |
| `$1`, `$2`, `$3` | Individual positional arguments | `$1` → "production", `$2` → "v1.0.0"      |
| `$@`             | All arguments as separate words | `$@` → "production" "v1.0.0" "--rollback" |
| `${2:-default}`  | Default value if empty          | `${2:-latest}` → "latest" if $2 is empty  |

### Frontmatter Fields

| Field           | Purpose           | Example                      |
| --------------- | ----------------- | ---------------------------- |
| `name`          | Command name      | `deploy`                     |
| `description`   | Brief description | "Deploy application"         |
| `argument-hint` | Usage hint        | `[environment] [version]`    |
| `allowed-tools` | Tool restrictions | `Bash(git:*), Read`          |
| `model`         | AI model          | `claude-3-5-sonnet-20241022` |
| `temperature`   | AI creativity     | `0.1`                        |

### Shell Command Patterns

| Pattern                        | Purpose               | Example                         |
| ------------------------------ | --------------------- | ------------------------------- |
| `!`command``                   | Execute shell command | `!`git status``                 |
| `!`set -e``                    | Exit on error         | `!`set -e``                     |
| `!`if condition; then ... fi`` | Conditional logic     | `!`if [ -f "$1" ]; then ... fi` |
| `@file`                        | Include file content  | `@package.json`                 |

### Validation Patterns

```bash
# Required argument
if [ -z "$1" ]; then
  echo "Error: Argument is required"
  exit 1
fi

# File exists
if [ ! -f "$1" ]; then
  echo "Error: File does not exist"
  exit 1
fi

# Choice validation
case "$1" in
  "option1"|"option2"|"option3")
    echo "Valid choice"
    ;;
  *)
    echo "Invalid choice"
    exit 1
    ;;
esac
```

---

This comprehensive guide provides the foundation for creating robust, maintainable, and efficient Claude Code commands for codeflow projects. By following these patterns and best practices, you can ensure your commands handle arguments correctly, validate inputs properly, and integrate seamlessly with Claude Code's slash command system.
