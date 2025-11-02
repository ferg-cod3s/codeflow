# Cursor Best Practices for Codeflow Projects



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


This guide provides comprehensive best practices for implementing Cursor commands in codeflow projects, ensuring proper argument handling, template substitution, and integration with Cursor's rules and command system.

## Table of Contents

1. [Command Argument Handling](#command-argument-handling)
2. [Rules Configuration (.cursorrules)](#rules-configuration-cursorrules)
3. [Command Structure Patterns](#command-structure-patterns)
4. [Template Substitution Patterns](#template-substitution-patterns)
5. [Error Handling and Validation](#error-handling-and-validation)
6. [Integration with Cursor IDE](#integration-with-cursor-ide)
7. [Common Pitfalls and Solutions](#common-pitfalls-and-solutions)
8. [Testing and Validation](#testing-and-validation)

---

## Command Argument Handling

### Cursor Command System

Cursor uses a simpler command system compared to Claude Code. Commands are stored as Markdown files in `.cursor/commands/` and can be invoked using `/command-name`.

#### Argument Syntax

Cursor commands primarily use positional arguments that are passed directly to the command content:

```markdown
---
name: deploy
description: Deploy application to environment
---

Deploying to environment: $1

!`echo "Deployment target: $1"`
!`if [ -z "$1" ]; then
echo "Error: Environment is required"
exit 1
fi

!`kubectl apply -f environments/$1/`
```

**Usage Examples:**

```bash
/deploy production
# $1 becomes "production"

/deploy staging
# $1 becomes "staging"
```

### Multiple Arguments

Cursor supports multiple positional arguments:

```markdown
---
name: review-pr
description: Review pull request with assignee
---

Reviewing PR #$1 and assigning to $2.

!`echo "PR Number: $1"`
!`echo "Assignee: $2"`
!`gh pr view $1`
!`gh pr edit $1 --add-assignee "$2"`
```

**Usage Examples:**

```bash
/review-pr 123 alice
# $1 becomes "123", $2 becomes "alice"

/review-pr 456
# $1 becomes "456", $2 is empty
```

### Argument Validation

#### Required Arguments

```markdown
---
name: deploy
description: Deploy to specified environment
---

# Validate required environment

!`if [ -z "$1" ]; then
  echo "❌ Error: Environment is required"
  echo "Usage: /deploy <environment> [version]"
  exit 1
fi`

Environment: $1
Version: $2

!`echo "Deploying to $1 with version $2"`
```

#### Choice Validation

```markdown
---
name: deploy
description: Deploy to validated environment
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
```

---

## Rules Configuration (.cursorrules)

### Basic Rules Structure

Cursor uses `.cursorrules` files to provide AI context and behavioral guidance. This is where you define project-specific conventions and command patterns.

```plaintext
# Project Rules for AI Assistant

You are an expert developer working on this React/TypeScript project.

## Code Standards
- Use TypeScript strict mode
- Follow functional programming principles
- Write comprehensive tests
- Document complex business logic

## Architecture Decisions
- Prefer composition over inheritance
- Use custom hooks for shared logic
- Implement proper error handling
- Follow domain-driven design

## Command Patterns
- Use /deploy <environment> for deployments
- Use /test <component> for component testing
- Use /review <pr-number> for PR reviews

## File Conventions
- Components in src/components/
- Hooks in src/hooks/
- Utilities in src/utils/
- Tests in __tests__/ directories
```

### Command-Specific Rules

Define command usage patterns and expectations directly in rules:

```plaintext
## Command Usage Guidelines

### /deploy Command
- Usage: /deploy <environment> [version]
- Environments: development, staging, production
- Always validate environment before deployment
- Use kubectl for Kubernetes deployments

### /test Command
- Usage: /test <component|all>
- Components: auth, dashboard, api
- Use Jest for unit tests
- Use Cypress for E2E tests

### /review Command
- Usage: /review <pr-number> [priority]
- Priority: low, medium, high, critical
- Check for security vulnerabilities
- Verify test coverage
- Validate code style
```

### Environment-Specific Rules

```plaintext
## Environment Configuration

### Development Environment
- Use local database
- Enable debug logging
- Hot reload enabled
- Mock external services

### Production Environment
- Use production database
- Disable debug logging
- Optimize for performance
- Use real external services
- Require approval for deployments
```

---

## Command Structure Patterns

### Standard Command Template

```markdown
---
name: command-name
description: Clear, concise description
---

# Command Name

Brief description of what this command does.

## Arguments

- **$1**: Description of first argument
- **$2**: Description of second argument (optional)

## Execution

!`echo "Executing command with arguments: $1 $2"`
```

### Multi-Step Commands

```markdown
---
name: full-deploy
description: Complete deployment pipeline
---

# Complete Deployment Pipeline

## Step 1: Validation

!`echo "Validating deployment to $1"`
!`if [ "$1" != "production" ] && [ "$1" != "staging" ]; then
  echo "❌ Invalid environment: $1"
  exit 1
fi`

## Step 2: Build

!`echo "Building application"`
!`npm run build`

## Step 3: Deploy

!`echo "Deploying to $1"`
!`kubectl apply -f k8s/$1/`

## Step 4: Verification

!`echo "Verifying deployment"`
!`kubectl rollout status deployment/app -n $1`

✅ Deployment completed successfully!
```

### Conditional Commands

```markdown
---
name: smart-deploy
description: Deploy with environment-specific logic
---

# Smart Deployment

Environment: $1

!`case "$1" in
  "production")
    echo "🚀 Production deployment"
    echo "Running security scans..."
    npm run security-scan
    kubectl apply -f k8s/production/
    ;;
  "staging")
    echo "🧪 Staging deployment"
    kubectl apply -f k8s/staging/
    npm run integration-tests
    ;;
  "development")
    echo "💻 Development deployment"
    kubectl apply -f k8s/development/
    ;;
  *)
    echo "❌ Unknown environment: $1"
    exit 1
    ;;
esac`
```

---

## Template Substitution Patterns

### Argument Substitution

#### Basic Positional Arguments

```markdown
---
name: greet
description: Greet team member
---

Hello, $1! Welcome to the project.

!`echo "Sending greeting to $1"`
```

#### Multiple Arguments

```markdown
---
name: create-component
description: Create React component
---

Creating component: $1
Type: $2
Path: src/components/$1/

!`mkdir -p src/components/$1`
!`cat > src/components/$1/$1.tsx << 'EOF'
import React from 'react';

interface $1Props {
// Define props here
}

const $1: React.FC<$1Props> = (props) => {
return (
<div>
<h1>$1 Component</h1>
</div>
);
};

export default $1;
EOF`

echo "✅ Component $1 created successfully!"
```

### File References

Cursor supports file references using the `@` syntax:

```markdown
---
name: analyze-config
description: Analyze project configuration
---

Analyzing configuration files:

- Package: @package.json
- TypeScript: @tsconfig.json
- Environment: @.env.example

!`echo "Configuration analysis complete"`
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
- Node Version: !`node --version`
- NPM Version: !`npm --version`
```

#### Complex Commands with Error Handling

```markdown
---
name: safe-deploy
description: Deploy with comprehensive error handling
---

!`set -e # Exit on error

echo "Starting deployment to $1..."

# Pre-deployment checks

if [ -z "$1" ]; then
echo "❌ Error: Environment is required"
exit 1
fi

# Deployment

if kubectl apply -f k8s/$1/; then
echo "✅ Deployment successful"
else
echo "❌ Deployment failed"
exit 1
fi

# Post-deployment verification

kubectl rollout status deployment/app -n $1`
```

---

## Error Handling and Validation

### Input Validation Patterns

#### Required Arguments

```markdown
---
name: process-file
description: Process specified file
---

# Validate file argument

!`if [ -z "$1" ]; then
  echo "❌ Error: File path is required"
  echo "Usage: /process-file <file-path>"
  exit 1
fi`

!`if [ ! -f "$1" ]; then
  echo "❌ Error: File '$1' does not exist"
  exit 1
fi`

Processing file: $1
```

#### Type Validation

```markdown
---
name: set-port
description: Set application port
---

# Validate port number

!`if ! echo "$1" | grep -q '^[0-9]\+$'; then
  echo "❌ Error: Port must be a number"
  exit 1
fi`

!`if [ "$1" -lt 1 ] || [ "$1" -gt 65535 ]; then
  echo "❌ Error: Port must be between 1 and 65535"
  exit 1
fi`

Setting port to: $1
```

### Error Recovery

```markdown
---
name: resilient-operation
description: Perform operation with retries
---

!`max_attempts=3
attempt=1

while [ $attempt -le $max_attempts ]; do
echo "Attempt $attempt of $max_attempts..."

if your-operation "$1"; then
echo "✅ Operation successful on attempt $attempt"
break
else
echo "❌ Operation failed on attempt $attempt"

    if [ $attempt -eq $max_attempts ]; then
      echo "❌ All attempts failed"
      exit 1
    fi

    echo "Waiting 10 seconds before retry..."
    sleep 10
    attempt=$((attempt + 1))

fi
done`
```

---

## Integration with Cursor IDE

### File Context Awareness

Cursor commands automatically have access to project context and can reference files:

```markdown
---
name: analyze-current-file
description: Analyze currently active file
---

Analyzing current file context:

!`echo "Current working directory: $(pwd)"`
!`echo "Available files:"`
!`ls -la`

# Reference specific files

Current component: @src/components/App.tsx
Configuration: @package.json
Styles: @src/index.css
```

### IDE-Specific Features

Cursor provides IDE-specific context that commands can leverage:

```markdown
---
name: ide-info
description: Show IDE and project information
---

IDE and Project Information:

!`echo "Cursor IDE Information:"`
!`echo "Working Directory: $(pwd)"`
!`echo "Git Repository: $(git rev-parse --show-toplevel 2>/dev/null || echo 'Not a git repo')"`
!`echo "Current Branch: $(git branch --show-current 2>/dev/null || echo 'Not on any branch')"`
!`echo "Node.js Project: $([ -f package.json ] && echo 'Yes' || echo 'No')"`
```

### Integration with Cursor's AI

Commands can provide context and guidance to Cursor's AI:

```markdown
---
name: code-review-setup
description: Setup code review context for AI
---

# Code Review Context

Please review the following code with focus on:

1. **Security**: Check for common vulnerabilities
2. **Performance**: Identify optimization opportunities
3. **Style**: Ensure consistency with project standards
4. **Testing**: Verify adequate test coverage

## Project Standards

- Use TypeScript strict mode
- Follow functional programming patterns
- Implement proper error handling
- Write comprehensive JSDoc comments

## Files to Review

@src/
@tests/

Please provide detailed feedback and suggestions for improvement.
```

---

## Common Pitfalls and Solutions

### Argument Handling Mistakes

#### ❌ Bad: No argument validation

```markdown
---
name: deploy
---

!`kubectl apply -f $1`
```

#### ✅ Good: Proper validation

```markdown
---
name: deploy
---

!`if [ -z "$1" ]; then
echo "❌ Error: Environment is required"
exit 1
fi

!`if [ ! -d "k8s/$1" ]; then
echo "❌ Error: Environment '$1' not found"
exit 1
fi

!`kubectl apply -f k8s/$1/`
```

### Rules Configuration Issues

#### ❌ Bad: Vague rules

```plaintext
# Be helpful and write good code
```

#### ✅ Good: Specific, actionable rules

```plaintext
# React/TypeScript Project Standards

## Code Style
- Use functional components with hooks
- Follow PascalCase for components
- Use camelCase for variables and functions
- Add JSDoc comments for public APIs

## File Organization
- Components: src/components/
- Hooks: src/hooks/
- Utilities: src/utils/
- Types: src/types/

## Testing Requirements
- Unit tests: __tests__/ directories
- Integration tests: tests/integration/
- Minimum 80% code coverage
```

### Shell Command Issues

#### ❌ Bad: Unsafe operations

```markdown
---
name: cleanup
---

!`rm -rf $1`
```

#### ✅ Good: Safe with validation

```markdown
---
name: cleanup
---

!`if [ -z "$1" ]; then
echo "❌ Error: Path is required"
exit 1
fi

!`if echo "$1" | grep -q "^[a-zA-Z0-9/_-]*$"; then
  rm -rf "$1"
  echo "✅ Cleaned up: $1"
else
  echo "❌ Invalid path format: $1"
  exit 1
fi`
```

---

## Testing and Validation

### Command Testing

```markdown
---
name: test-deploy
description: Test deployment command
---

# Test Deployment Command

## Test Cases

### Test 1: Valid Environment

Command: /deploy production
Expected: ✅ Successful deployment to production

### Test 2: Invalid Environment

Command: /deploy invalid
Expected: ❌ Error message about invalid environment

### Test 3: Missing Environment

Command: /deploy
Expected: ❌ Error message about required environment

## Test Execution

!`echo "Running deployment tests..."

# Test valid environment

echo "Test 1: Valid environment"
if echo "production" | grep -q "production\|staging\|development"; then
echo "✅ Valid environment test passed"
else
echo "❌ Valid environment test failed"
fi

# Test invalid environment

echo "Test 2: Invalid environment"
if echo "invalid" | grep -q "production\|staging\|development"; then
echo "❌ Invalid environment test failed"
else
echo "✅ Invalid environment test passed"
fi

echo "Deployment tests completed."`
```

### Rules Validation

Create test scenarios to validate your `.cursorrules`:

```plaintext
## Rules Validation Tests

### Test 1: Code Style Compliance
Test: Create a component without proper TypeScript types
Expected: AI should suggest adding proper types

### Test 2: File Organization
Test: Place utility function in component file
Expected: AI should suggest moving to utils/

### Test 3: Testing Requirements
Test: Commit code without tests
Expected: AI should remind about testing requirements
```

---

## Quick Reference

### Command Patterns

| Pattern         | Description          | Example                      |
| --------------- | -------------------- | ---------------------------- |
| `$1`, `$2`      | Positional arguments | `$1` → "production"          |
| `$#`            | Number of arguments  | `$#` → 2                     |
| `$@`            | All arguments        | `$@` → "production" "v1.0.0" |
| `${1:-default}` | Default value        | `${1:-latest}` → "latest"    |

### Validation Patterns

```bash
# Required argument
if [ -z "$1" ]; then
  echo "Error: Argument required"
  exit 1
fi

# File exists
if [ ! -f "$1" ]; then
  echo "Error: File does not exist"
  exit 1
fi

# Choice validation
case "$1" in
  option1|option2|option3)
    echo "Valid choice"
    ;;
  *)
    echo "Invalid choice"
    exit 1
    ;;
esac

# Number validation
if ! echo "$1" | grep -q '^[0-9]\+$'; then
  echo "Error: Must be a number"
  exit 1
fi
```

### Shell Command Patterns

| Pattern                        | Purpose               | Example                         |
| ------------------------------ | --------------------- | ------------------------------- |
| `!`command``                   | Execute shell command | `!`git status``                 |
| `!`set -e``                    | Exit on error         | `!`set -e``                     |
| `!`if condition; then ... fi`` | Conditional logic     | `!`if [ -f "$1" ]; then ... fi` |
| `@file`                        | Include file content  | `@package.json`                 |

### Rules Template

```plaintext
# Project Rules for AI Assistant

You are an expert developer working on this [PROJECT_TYPE] project.

## Code Standards
- [Specific coding standards]
- [Style guidelines]
- [Best practices]

## Architecture Decisions
- [Architectural patterns]
- [Design principles]
- [Technology choices]

## Command Usage
- [Command patterns and usage]
- [Expected behaviors]
- [Integration guidelines]

## File Organization
- [Directory structure]
- [File naming conventions]
- [Module organization]
```

---

This comprehensive guide provides the foundation for creating robust, maintainable, and efficient Cursor commands and rules for codeflow projects. By following these patterns and best practices, you can ensure your commands handle arguments correctly, integrate seamlessly with Cursor's IDE features, and provide excellent AI assistance.
