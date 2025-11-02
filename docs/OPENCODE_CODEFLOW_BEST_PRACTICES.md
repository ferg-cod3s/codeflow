# OpenCode Best Practices Guide for Codeflow Projects



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


## Executive Summary

This comprehensive guide provides best practices for creating robust, maintainable, and efficient OpenCode commands specifically tailored for codeflow projects (workflow automation, CI/CD, and pipeline management). It covers command argument handling, frontmatter usage, template substitution patterns, error handling, and integration strategies to ensure commands work reliably in automated environments.

**Related Guides:**

- [Claude Code Best Practices](./CLAUDE_CODE_BEST_PRACTICES.md) - For Claude Code slash commands
- [Cursor Best Practices](./CURSOR_BEST_PRACTICES.md) - For Cursor commands and rules

## Table of Contents

1. [Command Argument Handling Best Practices](#command-argument-handling-best-practices)
2. [Frontmatter Usage Patterns](#frontmatter-usage-patterns)
3. [Date and Time Handling](#date-and-time-handling)
4. [Command Structure Patterns](#command-structure-patterns)
5. [Template Substitution Patterns](#template-substitution-patterns)
6. [Error Handling and Validation](#error-handling-and-validation)
7. [Codeflow-Specific Patterns](#codeflow-specific-patterns)
8. [Common Pitfalls and Solutions](#common-pitfalls-and-solutions)
9. [Testing and Validation Strategies](#testing-and-validation-strategies)
10. [Integration Guidelines](#integration-guidelines)

---

## Command Argument Handling Best Practices

### 1. CLI Command Arguments

#### Positional Arguments

```typescript
// packages/opencode/src/cli/cmd/deploy.ts
export const DeployCommand = cmd({
  command: 'deploy <environment> [service..]',
  describe: 'Deploy services to specified environment',
  builder: (yargs: Argv) => {
    return yargs
      .positional('environment', {
        describe: 'Target environment (dev, staging, prod)',
        type: 'string',
        choices: ['dev', 'staging', 'prod'],
      })
      .positional('service', {
        describe: 'Services to deploy (optional, deploys all if not specified)',
        type: 'string',
        array: true,
        default: [],
      });
  },
  handler: async (argv) => {
    const { environment, service } = argv;
    // Implementation
  },
});
```

#### Array Arguments with Proper Processing

```typescript
// Headers processing for API calls
.option("headers", {
  alias: "H",
  type: "string",
  array: true,
  describe: "Headers in format 'Key: Value'",
})

// Environment variables processing
.option("env", {
  alias: "e",
  type: "string",
  array: true,
  describe: "Environment variables in format 'KEY=VALUE'",
})

// Handler with proper array processing
async handler(argv: any) {
  const { headers, env } = argv

  // Process headers array into object
  const parsedHeaders = headers?.reduce((acc: Record<string, string>, header: string) => {
    const [key, ...valueParts] = header.split(":")
    if (key && valueParts.length > 0) {
      acc[key.trim()] = valueParts.join(":").trim()
    }
    return acc
  }, {}) || {}

  // Process environment variables
  const parsedEnv = env?.reduce((acc: Record<string, string>, envVar: string) => {
    const [key, ...valueParts] = envVar.split("=")
    if (key && valueParts.length > 0) {
      acc[key] = valueParts.join("=")
    }
    return acc
  }, {}) || {}
}
```

### 2. Slash Command Arguments

#### Basic $ARGUMENTS Usage

```markdown
---
description: Deploy application to environment
agent: ops
subtask: true
---

Deploying application: $ARGUMENTS

!`opencode deploy $ARGUMENTS --format json`

The deployment process will begin shortly.
```

#### Complex Argument Processing

```markdown
---
description: Multi-service deployment with validation
agent: ops
subtask: true
---

Validating deployment configuration for: $ARGUMENTS

Current environment: !`echo $NODE_ENV`
Available services: !`ls services/`

!`opencode deploy $ARGUMENTS --validate-only`

If validation passes, proceed with full deployment.
```

### 3. Argument Validation Patterns

#### Required Arguments

```typescript
// CLI command validation
if (!argv.environment) {
  throw new Error('Environment is required. Use: dev, staging, or prod');
}

if (argv.service && argv.service.length === 0) {
  throw new Error('At least one service must be specified when using service flag');
}
```

#### Type Validation

```typescript
// URL validation for remote services
if (argv.url && !URL.canParse(argv.url)) {
  throw new Error(`Invalid URL format: ${argv.url}. Expected format: https://example.com/path`);
}

// Port validation
if (argv.port && (argv.port < 1 || argv.port > 65535)) {
  throw new Error(`Port must be between 1 and 65535, got: ${argv.port}`);
}
```

---

## Frontmatter Usage Patterns

### 1. Basic Frontmatter Structure

```markdown
---
description: Deploy services to specified environment
agent: ops
model: anthropic/claude-3-sonnet
subtask: true
timeout: 300000
retry: 3
---

Command description and template content here.
```

### 2. Dynamic Frontmatter Values

#### Date and Time Integration

```markdown
---
description: Deploy build from !`date +%Y-%m-%d`
agent: ops
version: !`git describe --tags --abbrev=0`
build_number: !`echo $BUILD_NUMBER`
environment: !`echo $NODE_ENV`
---

Deploying version {{version}} (build {{build_number}}) to {{environment}} environment.
Build date: !`date +%Y-%m-%d %H:%M:%S`
```

#### Version and Metadata

```markdown
---
description: Release version !`git describe --tags`
agent: build
version: !`git rev-parse --short HEAD`
branch: !`git branch --show-current`
author: !`git config user.name`
---

Creating release for version {{version}} on branch {{branch}}.
Committed by: {{author}}
```

### 3. Conditional Frontmatter

```markdown
---
description: !`if [ "$NODE_ENV" = "production" ]; then echo "Production deployment"; else echo "Development deployment"; fi`
agent: !`if [ "$CI" = "true" ]; then echo "build"; else echo "dev"; fi`
subtask: !`if [ "$AUTO_DEPLOY" = "true" ]; then echo "true"; else echo "false"; fi`
---

{{description}} initiated.
Environment: !`echo $NODE_ENV`
CI/CD Pipeline: !`if [ "$CI" = "true" ]; then echo "Running in CI"; else echo "Local execution"; fi`
```

### 4. Frontmatter Validation

```typescript
// Frontmatter schema validation
export const CommandFrontmatter = z.object({
  description: z.string(),
  agent: z.string().optional(),
  model: z.string().optional(),
  subtask: z.boolean().optional(),
  timeout: z.number().optional(),
  retry: z.number().optional(),
  environment: z.string().optional(),
  version: z.string().optional(),
});

// Validation during command loading
const parsed = CommandFrontmatter.safeParse(frontmatterData);
if (!parsed.success) {
  throw new Error(`Invalid frontmatter: ${parsed.error.message}`);
}
```

---

## Date and Time Handling

### 1. Shell Command Date Generation

#### Current Date and Time

```markdown
---
description: Daily backup for !`date +%Y-%m-%d`
agent: ops
---

Starting backup process at: !`date '+%Y-%m-%d %H:%M:%S %Z'`

Backup file: backup-!`date +%Y%m%d_%H%M%S`.tar.gz
```

#### Relative Dates

```markdown
---
description: Weekly report for week of !`date -d 'monday' +%Y-%m-%d`
agent: analytics
---

Generating weekly report covering: !`date -d 'monday' +%Y-%m-%d` to !`date -d 'sunday' +%Y-%m-%d`

Previous week: !`date -d 'last monday' +%Y-%m-%d`
```

### 2. Template Variable Date Handling

#### Frontmatter Date Variables

```markdown
---
description: Deploy build from {{build_date}}
agent: ops
build_date: !`date +%Y-%m-%d`
build_time: !`date +%H:%M:%S`
timestamp: !`date +%s`
---

Build Information:

- Date: {{build_date}}
- Time: {{build_time}}
- Timestamp: {{timestamp}}
- ISO Format: !`date -Iseconds`
```

#### Dynamic Date Calculations

```markdown
---
description: Process data from {{start_date}} to {{end_date}}
agent: data
start_date: !`date -d '7 days ago' +%Y-%m-%d`
end_date: !`date +%Y-%m-%d`
---

Processing data range: {{start_date}} to {{end_date}}

Days in range: !`echo $(( ($(date -d "{{end_date}}" +%s) - $(date -d "{{start_date}}" +%s)) / 86400 ))`
```

### 3. Timezone Handling

```markdown
---
description: Scheduled deployment for !`TZ=America/New_York date '+%Y-%m-%d %H:%M:%S %Z'`
agent: ops
timezone: !`echo $TZ || echo UTC`
local_time: !`date '+%Y-%m-%d %H:%M:%S %Z'`
utc_time: !`date -u '+%Y-%m-%d %H:%M:%S UTC'`
---

Deployment scheduled for:

- Local time: {{local_time}}
- UTC time: {{utc_time}}
- Timezone: {{timezone}}
```

---

## Command Structure Patterns

### 1. Standard Command Structure

```markdown
---
description: Clear and concise command description
agent: appropriate-agent-name
subtask: true
---

Human-readable description of what this command does.

Context or setup information:
!`shell-command-for-context`

Main command execution:
!`opencode main-command $ARGUMENTS`

Follow-up actions or validation:
!`opencode validate-result $ARGUMENTS`
```

### 2. Multi-Stage Commands

```markdown
---
description: Complete CI/CD pipeline execution
agent: build
subtask: true
---

# Stage 1: Environment Setup

Current branch: !`git branch --show-current`
Environment: !`echo $NODE_ENV`

!`opencode setup-environment $ARGUMENTS`

# Stage 2: Build Process

!`opencode build $ARGUMENTS --parallel`

# Stage 3: Testing

!`opencode test $ARGUMENTS --coverage`

# Stage 4: Deployment

!`opencode deploy $ARGUMENTS`

Pipeline completed successfully!
```

### 3. Conditional Execution

```markdown
---
description: Conditional deployment based on environment
agent: ops
---

# Environment Detection

Environment: !`echo $NODE_ENV`
Branch: !`git branch --show-current`

# Conditional Logic

!`if [ "$NODE_ENV" = "production" ]; then
  echo "Production deployment detected"
  opencode deploy-production $ARGUMENTS
elif [ "$NODE_ENV" = "staging" ]; then
  echo "Staging deployment detected"
  opencode deploy-staging $ARGUMENTS
else
  echo "Development deployment detected"
  opencode deploy-dev $ARGUMENTS
fi`
```

### 4. Error Recovery Commands

```markdown
---
description: Deploy with automatic rollback on failure
agent: ops
subtask: true
---

# Pre-deployment Backup

!`opencode backup-create $ARGUMENTS --tag pre-deploy-$(date +%s)`

# Deployment Attempt

!`opencode deploy $ARGUMENTS || {
  echo "Deployment failed, initiating rollback..."
  opencode rollback-last $ARGUMENTS
  exit 1
}`

# Post-deployment Validation

!`opencode health-check $ARGUMENTS || {
  echo "Health check failed, initiating rollback..."
  opencode rollback-last $ARGUMENTS
  exit 1
}`

Deployment completed successfully!
```

---

## Template Substitution Patterns

### 1. $ARGUMENTS Substitution

#### Basic Usage

```markdown
---
description: Process user arguments
agent: build
---

Processing arguments: $ARGUMENTS

!`opencode process $ARGUMENTS --format json`

Arguments received and processed.
```

#### Arguments with Validation

```markdown
---
description: Validated argument processing
agent: build
---

Validating arguments: $ARGUMENTS

!`if [ -z "$ARGUMENTS" ]; then
  echo "Error: No arguments provided"
  exit 1
fi`

!`opencode validate-args $ARGUMENTS`

!`opencode process $ARGUMENTS`
```

### 2. Shell Command Substitution (!`command`)

#### Simple Shell Commands

```markdown
---
description: Get current system information
agent: system
---

Current System Information:

- User: !`whoami`
- Directory: !`pwd`
- Date: !`date`
- Git Branch: !`git branch --show-current`
```

#### Complex Shell Commands

```markdown
---
description: Advanced system analysis
agent: system
---

# System Analysis Report

Disk Usage:
!`df -h | head -5`

Memory Usage:
!`free -h`

Process Count:
!`ps aux | wc -l`

Network Connections:
!`netstat -an | grep ESTABLISHED | wc -l`

Git Status:
!`git status --porcelain | wc -l` modified files
```

#### Shell Commands with Error Handling

```markdown
---
description: Safe shell command execution
agent: ops
---

Executing commands with error handling:

!`command_result=$(git status --porcelain 2>/dev/null || echo "git_error")
if [ "$command_result" = "git_error" ]; then
  echo "Git command failed, repository may not be initialized"
else
  echo "Git status: $command_result"
fi`

!`docker_running=$(docker ps 2>/dev/null | wc -l || echo "0")
echo "Docker containers running: $docker_running"`
```

### 3. File Reference Substitution (@file)

#### Single File References

```markdown
---
description: Analyze configuration file
agent: build
---

Analyzing configuration: @opencode.jsonc

Configuration contents will be processed and validated.

Additional context: @README.md
```

#### Multiple File References

```markdown
---
description: Comprehensive project analysis
agent: build
---

Project Configuration Files:

- Main config: @opencode.jsonc
- Package info: @package.json
- Build config: @tsconfig.json
- Environment: @.env.example

Documentation:

- Main README: @README.md
- Contributing: @CONTRIBUTING.md
- Changelog: @CHANGELOG.md
```

#### Directory References

```markdown
---
description: Process source code directory
agent: build
---

Source Code Analysis:

- Main source: @src/
- Test files: @test/
- Configuration: @config/
- Documentation: @docs/

Processing all files in these directories...
```

### 4. Combined Substitution Patterns

#### Complex Template with All Patterns

```markdown
---
description: Complete deployment pipeline
agent: ops
version: !`git describe --tags`
timestamp: !`date +%s`
---

# Deployment Pipeline for version {{version}}

Environment: !`echo $NODE_ENV`
Timestamp: {{timestamp}}
Arguments: $ARGUMENTS

Configuration Files:

- Main config: @opencode.jsonc
- Environment: @.env.{{NODE_ENV}}
- Secrets: @secrets/production.yml

Pre-deployment checks:
!`opencode validate-config @opencode.jsonc`
!`opencode check-dependencies @package.json`

Deployment process:
!`opencode deploy $ARGUMENTS --version {{version}}`

Post-deployment validation:
!`opencode health-check --timeout 30`
!`opencode rollback-if-failed $ARGUMENTS`
```

---

## Error Handling and Validation

### 1. Input Validation Patterns

#### Argument Validation

```markdown
---
description: Validated deployment command
agent: ops
---

Validating deployment arguments: $ARGUMENTS

!`if [ -z "$ARGUMENTS" ]; then
  echo "Error: Deployment target is required"
  echo "Usage: /deploy <environment> [options]"
  exit 1
fi`

!`environment=$(echo "$ARGUMENTS" | cut -d' ' -f1)
if [ "$environment" != "dev" ] && [ "$environment" != "staging" ] && [ "$environment" != "prod" ]; then
  echo "Error: Invalid environment '$environment'"
  echo "Valid environments: dev, staging, prod"
  exit 1
fi`

Environment validation passed for: $environment
```

#### File Validation

```markdown
---
description: File validation before processing
agent: build
---

Validating required files:

!`for file in "opencode.jsonc" "package.json" ".env"; do
  if [ ! -f "$file" ]; then
    echo "Error: Required file '$file' not found"
    exit 1
  fi
  echo "✓ $file exists"
done`

All required files found and accessible.
```

### 2. Command Execution Error Handling

#### Safe Command Execution

```markdown
---
description: Safe command execution with error handling
agent: ops
---

Executing deployment with error handling:

!`set -e # Exit on any error

echo "Starting deployment..."
if ! opencode deploy $ARGUMENTS; then
echo "Deployment failed, attempting rollback..."
opencode rollback-last
echo "Rollback completed"
exit 1
fi

echo "Deployment successful, running health checks..."
if ! opencode health-check; then
echo "Health check failed, initiating rollback..."
opencode rollback-last
exit 1
fi

echo "Deployment and health checks completed successfully!"`
```

#### Retry Logic

```markdown
---
description: Command execution with retry logic
agent: ops
---

Executing with retry logic:

!`max_retries=3
retry_count=0
command="opencode deploy $ARGUMENTS"

while [ $retry_count -lt $max_retries ]; do
echo "Attempt $((retry_count + 1)) of $max_retries..."
  if $command; then
    echo "Command succeeded on attempt $((retry_count + 1))"
    break
  else
    echo "Command failed, waiting 10 seconds before retry..."
    sleep 10
    retry_count=$((retry_count + 1))
fi
done

if [ $retry_count -eq $max_retries ]; then
echo "Command failed after $max_retries attempts"
exit 1
fi`
```

### 3. Validation Commands

#### Pre-deployment Validation

```markdown
---
description: Comprehensive pre-deployment validation
agent: build
---

Running pre-deployment validation checks:

1. Configuration Validation:
   !`opencode validate-config @opencode.jsonc || {
  echo "Configuration validation failed"
  exit 1
}`

2. Dependency Check:
   !`opencode check-dependencies @package.json || {
  echo "Dependency check failed"
  exit 1
}`

3. Security Scan:
   !`opencode security-scan @src/ || {
  echo "Security scan failed"
  exit 1
}`

4. Test Suite:
   !`opencode test --coverage || {
  echo "Test suite failed"
  exit 1
}`

All validation checks passed!
```

---

## Codeflow-Specific Patterns

### 1. CI/CD Pipeline Commands

#### GitHub Actions Integration

```markdown
---
description: GitHub Actions deployment pipeline
agent: build
subtask: true
---

# GitHub Actions Pipeline

Environment Information:

- Repository: !`echo $GITHUB_REPOSITORY`
- Branch: !`echo $GITHUB_REF_NAME`
- Workflow: !`echo $GITHUB_WORKFLOW`
- Run ID: !`echo $GITHUB_RUN_ID`

Build Process:
!`opencode build --parallel --cache`

Test Execution:
!`opencode test --coverage --junit`

Security Scan:
!`opencode security-scan --sarif`

Deployment:
!`if [ "$GITHUB_REF_NAME" = "main" ]; then
  opencode deploy production --version $GITHUB_SHA
elif [ "$GITHUB_REF_NAME" = "develop" ]; then
  opencode deploy staging --version $GITHUB_SHA
fi`

Pipeline completed successfully!
```

#### Jenkins Pipeline Integration

```markdown
---
description: Jenkins pipeline execution
agent: build
---

# Jenkins Pipeline Execution

Build Information:

- Job Name: !`echo $JOB_NAME`
- Build Number: !`echo $BUILD_NUMBER`
- Branch: !`echo $GIT_BRANCH`
- Node: !`echo $NODE_NAME`

Build Steps:

1. Checkout: !`echo "Code checked out to $(pwd)"`
2. Dependencies: !`opencode install-dependencies`
3. Build: !`opencode build --incremental`
4. Test: !`opencode test --parallel`
5. Package: !`opencode package --format docker`

Deployment:
!`if [ "$ENVIRONMENT" = "production" ]; then
  opencode deploy production --build-number $BUILD_NUMBER
else
  opencode deploy staging --build-number $BUILD_NUMBER
fi`
```

### 2. Multi-Environment Deployment

#### Environment-Specific Configuration

```markdown
---
description: Multi-environment deployment
agent: ops
---

# Multi-Environment Deployment

Target Environment: !`echo $TARGET_ENVIRONMENT`

Configuration Loading:
!`case "$TARGET_ENVIRONMENT" in
  "production")
    config_file="config/production.json"
    env_file=".env.production"
    ;;
  "staging")
    config_file="config/staging.json"
    env_file=".env.staging"
    ;;
  "development")
    config_file="config/development.json"
    env_file=".env.development"
    ;;
  *)
    echo "Unknown environment: $TARGET_ENVIRONMENT"
    exit 1
    ;;
esac`

echo "Using configuration: $config_file"
echo "Using environment file: $env_file"

Deployment:
!`opencode deploy --config $config_file --env $env_file $ARGUMENTS`
```

#### Blue-Green Deployment

```markdown
---
description: Blue-green deployment strategy
agent: ops
---

# Blue-Green Deployment

Current Environment: !`echo $TARGET_ENVIRONMENT`

1. Determine Active Environment:
   !`active_env=$(opencode get-active-environment $TARGET_ENVIRONMENT)
echo "Currently active: $active_env"`

2. Prepare Inactive Environment:
   !`if [ "$active_env" = "blue" ]; then
  target_env="green"
else
  target_env="blue"
fi
echo "Deploying to: $target_env"`

3. Deploy to Inactive:
   !`opencode deploy-to-environment $target_env $ARGUMENTS`

4. Health Check on New:
   !`opencode health-check-environment $target_env || {
  echo "Health check failed on $target_env"
  exit 1
}`

5. Switch Traffic:
   !`opencode switch-traffic $target_env`

6. Verify Switch:
   !`opencode verify-traffic-switch $target_env || {
  echo "Traffic switch verification failed, rolling back..."
  opencode switch-traffic $active_env
  exit 1
}`

Blue-green deployment completed successfully!
```

### 3. Automated Testing Integration

#### Test Pipeline

```markdown
---
description: Comprehensive test pipeline
agent: test
---

# Automated Test Pipeline

Test Environment Setup:
!`opencode setup-test-environment $ARGUMENTS`

Unit Tests:
!`opencode test-unit --coverage --junit || {
  echo "Unit tests failed"
  exit 1
}`

Integration Tests:
!`opencode test-integration --parallel || {
  echo "Integration tests failed"
  exit 1
}`

End-to-End Tests:
!`opencode test-e2e --browser chrome --browser firefox || {
  echo "E2E tests failed"
  exit 1
}`

Performance Tests:
!`opencode test-performance --threshold 1000 || {
  echo "Performance tests failed"
  exit 1
}`

Security Tests:
!`opencode test-security --owasp-top-10 || {
  echo "Security tests failed"
  exit 1
}`

All test suites passed successfully!
```

---

## Common Pitfalls and Solutions

### 1. Argument Handling Pitfalls

#### Problem: Missing $ARGUMENTS in Templates

```markdown
## <!-- ❌ Wrong - No $ARGUMENTS placeholder -->

description: Deploy application
agent: ops

---

!`opencode deploy production`

## <!-- ✅ Correct - Includes $ARGUMENTS -->

description: Deploy application
agent: ops

---

!`opencode deploy $ARGUMENTS`
```

#### Problem: Incorrect Array Argument Processing

```typescript
// ❌ Wrong - Assumes single string
.option("headers", { type: "string" })

// ✅ Correct - Handles array properly
.option("headers", {
  type: "string",
  array: true,
  describe: "Headers in format 'Key: Value'"
})

// Process array correctly
function parseHeaders(headers?: string[]): Record<string, string> | undefined {
  if (!headers || headers.length === 0) return undefined

  return headers.reduce((acc, header) => {
    const [key, ...valueParts] = header.split(":")
    if (key && valueParts.length > 0) {
      acc[key.trim()] = valueParts.join(":").trim()
    }
    return acc
  }, {})
}
```

### 2. Template Substitution Pitfalls

#### Problem: Nested Substitution Conflicts

```markdown
<!-- ❌ Problematic - Nested substitutions can conflict -->

!`echo "Processing $ARGUMENTS with @config"`

<!-- ✅ Better - Separate concerns -->

Processing arguments: $ARGUMENTS
Config file: @config
Shell output: !`echo "Processing complete"`
```

#### Problem: Shell Command Injection

```markdown
<!-- ❌ Dangerous - Direct argument interpolation -->

!`rm -rf $ARGUMENTS`

<!-- ✅ Safe - Validate arguments first -->

!`if echo "$ARGUMENTS" | grep -q "^[a-zA-Z0-9_-]*$"; then
  rm -rf "$ARGUMENTS"
else
  echo "Invalid argument format"
  exit 1
fi`
```

### 3. File Reference Pitfalls

#### Problem: Relative Path Issues

```markdown
<!-- ❌ Wrong - May not resolve correctly -->

@../config/settings.json

<!-- ✅ Correct - Use absolute paths or project-relative paths -->

@config/settings.json
@./config/settings.json
```

#### Problem: Missing File Validation

```markdown
<!-- ❌ Wrong - No file existence check -->

Processing @nonexistent-file.json

<!-- ✅ Correct - Validate file exists -->

!`if [ -f "config.json" ]; then
  echo "Processing @config.json"
else
  echo "Error: config.json not found"
  exit 1
fi`
```

### 4. Error Handling Pitfalls

#### Problem: Silent Failures

```markdown
<!-- ❌ Wrong - No error checking -->

!`opencode deploy $ARGUMENTS`
!`opencode notify-success`

<!-- ✅ Correct - Proper error handling -->

!`if opencode deploy $ARGUMENTS; then
  opencode notify-success
else
  opencode notify-failure
  exit 1
fi`
```

#### Problem: Inadequate Logging

```markdown
<!-- ❌ Wrong - No logging information -->

!`opencode process-data`

<!-- ✅ Correct - Comprehensive logging -->

!`echo "Starting data processing at $(date)"
opencode process-data
echo "Data processing completed at $(date)"`
```

---

## Testing and Validation Strategies

### 1. Command Testing Framework

#### Unit Test Structure

```typescript
// tests/commands/deploy.test.ts
import { DeployCommand } from '../../src/cli/cmd/deploy';

describe('DeployCommand', () => {
  it('should validate environment arguments correctly', async () => {
    const mockHandler = jest.fn();
    const command = {
      ...DeployCommand,
      handler: mockHandler,
    };

    // Test valid environments
    await command.handler({
      environment: 'production',
      service: ['api', 'web'],
    });

    expect(mockHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        environment: 'production',
        service: ['api', 'web'],
      })
    );
  });

  it('should reject invalid environments', async () => {
    const mockHandler = jest.fn();
    const command = {
      ...DeployCommand,
      handler: mockHandler,
    };

    await expect(
      command.handler({
        environment: 'invalid',
      })
    ).rejects.toThrow('Invalid environment');
  });
});
```

#### Integration Test Structure

```typescript
// tests/integration/deploy-pipeline.test.ts
describe('Deployment Pipeline Integration', () => {
  it('should execute complete deployment pipeline', async () => {
    // Setup test environment
    await setupTestEnvironment();

    // Execute deployment command
    const result = await executeCommand('/deploy production --service api');

    // Validate results
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('Deployment successful');

    // Verify deployment state
    const deploymentStatus = await getDeploymentStatus('production', 'api');
    expect(deploymentStatus).toBe('active');

    // Cleanup
    await cleanupTestEnvironment();
  });
});
```

### 2. Template Validation

#### Template Syntax Validation

```bash
#!/bin/bash
# validate-templates.sh - Validate command templates

set -e

COMMANDS_DIR=".opencode/command"
VALIDATION_ERRORS=()

echo "🔍 Validating command templates..."

for cmd_file in "$COMMANDS_DIR"/*.md; do
  cmd_name=$(basename "$cmd_file" .md)
  echo "Validating template: $cmd_name"

  # Extract template content
  template_content=$(sed -n '/^---$/,/^---$/{p; /^---$/q;}' "$cmd_file" | tail -n +2)

  # Check for $ARGUMENTS placeholder
  if ! echo "$template_content" | grep -q '\$ARGUMENTS'; then
    VALIDATION_ERRORS+=("$cmd_name: Missing \$ARGUMENTS placeholder")
  fi

  # Validate shell command syntax
  shell_commands=$(echo "$template_content" | grep -o '!`[^`]*`' || true)
  for shell_cmd in $shell_commands; do
    cmd_content=$(echo "$shell_cmd" | sed 's/!`\([^`]*\)`/\1/')
    if ! bash -n "$cmd_content" 2>/dev/null; then
      VALIDATION_ERRORS+=("$cmd_name: Invalid shell syntax: $cmd_content")
    fi
  done

  # Check file references
  file_refs=$(echo "$template_content" | grep -o '@[^[:space:],.`]*' || true)
  for file_ref in $file_refs; do
    filename=$(echo "$file_ref" | sed 's/@//')
    if [ ! -f "$filename" ] && [ ! -d "$filename" ]; then
      VALIDATION_ERRORS+=("$cmd_name: File not found: $filename")
    fi
  done
done

if [ ${#VALIDATION_ERRORS[@]} -gt 0 ]; then
  echo "❌ Template validation failed:"
  for error in "${VALIDATION_ERRORS[@]}"; do
    echo "  - $error"
  done
  exit 1
else
  echo "✅ All templates validated successfully!"
fi
```

### 3. Automated Testing Pipeline

#### CI/CD Test Pipeline

```yaml
# .github/workflows/test-commands.yml
name: Test OpenCode Commands

on: [push, pull_request]

jobs:
  test-commands:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install OpenCode
        run: |
          curl -fsSL https://opencode.ai/install | bash

      - name: Validate Templates
        run: |
          chmod +x scripts/validate-templates.sh
          ./scripts/validate-templates.sh

      - name: Test CLI Commands
        run: |
          # Test command help
          opencode --help
          opencode deploy --help
          opencode mcp --help

      - name: Test Slash Commands
        run: |
          # Test slash command execution
          opencode run --command "/mcp-user test https://example.com/mcp"

      - name: Integration Tests
        run: |
          # Run integration test suite
          npm run test:integration
```

---

## Integration Guidelines

### 1. CI/CD Platform Integration

#### GitHub Actions Integration

```yaml
# .github/workflows/opencode-integration.yml
name: OpenCode Integration

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  opencode-pipeline:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Code
        uses: actions/checkout@v3

      - name: Setup OpenCode
        run: |
          curl -fsSL https://opencode.ai/install | bash
          echo "$HOME/.opencode/bin" >> $GITHUB_PATH

      - name: Configure OpenCode
        run: |
          cat > opencode.jsonc << EOF
          {
            "mcp": {
              "github": {
                "type": "remote",
                "url": "https://api.github.com/mcp",
                "headers": {
                  "Authorization": "Bearer ${{ secrets.GITHUB_TOKEN }}"
                }
              }
            }
          }
          EOF

      - name: Run Analysis
        run: |
          opencode run --command "/analyze-project" --model anthropic/claude-3-sonnet

      - name: Run Tests
        run: |
          opencode run --command "/run-tests" --format json

      - name: Deploy if Main Branch
        if: github.ref == 'refs/heads/main'
        run: |
          opencode run --command "/deploy production"
```

#### Jenkins Pipeline Integration

```groovy
// Jenkinsfile
pipeline {
    agent any

    environment {
        OPENCODE_INSTALL_DIR = "${WORKSPACE}/opencode"
    }

    stages {
        stage('Setup') {
            steps {
                sh '''
                    curl -fsSL https://opencode.ai/install | bash
                    export PATH="$OPENCODE_INSTALL_DIR/bin:$PATH"
                '''
            }
        }

        stage('Analysis') {
            steps {
                sh '''
                    export PATH="$OPENCODE_INSTALL_DIR/bin:$PATH"
                    opencode run --command "/analyze-project" --format json
                '''
            }
        }

        stage('Test') {
            steps {
                sh '''
                    export PATH="$OPENCODE_INSTALL_DIR/bin:$PATH"
                    opencode run --command "/run-tests --coverage"
                '''
            }
        }

        stage('Deploy') {
            when {
                branch 'main'
            }
            steps {
                sh '''
                    export PATH="$OPENCODE_INSTALL_DIR/bin:$PATH"
                    opencode run --command "/deploy ${ENVIRONMENT}"
                '''
            }
        }
    }
}
```

### 2. Docker Integration

#### Dockerfile with OpenCode

```dockerfile
FROM node:18-alpine

# Install OpenCode
RUN apk add --no-cache curl
RUN curl -fsSL https://opencode.ai/install | sh

# Set working directory
WORKDIR /app

# Copy application code
COPY . .

# Copy OpenCode configuration
COPY opencode.jsonc /app/

# Add OpenCode to PATH
ENV PATH="/root/.opencode/bin:$PATH"

# Default command
CMD ["opencode", "run", "--help"]
```

#### Docker Compose Integration

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    environment:
      - NODE_ENV=production
      - TARGET_ENVIRONMENT=production
    volumes:
      - ./config:/app/config
      - ./logs:/app/logs
    command: >
      sh -c "
        opencode run --command '/setup-environment' &&
        opencode run --command '/run-tests' &&
        opencode run --command '/deploy production'
      "

  opencode-agent:
    image: opencode/agent:latest
    environment:
      - OPENCODE_SERVER_URL=http://app:3000
    depends_on:
      - app
```

### 3. Kubernetes Integration

#### Kubernetes Deployment with OpenCode

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: opencode-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: opencode-app
  template:
    metadata:
      labels:
        app: opencode-app
    spec:
      containers:
        - name: app
          image: myapp:latest
          env:
            - name: NODE_ENV
              value: 'production'
            - name: TARGET_ENVIRONMENT
              value: 'production'
          command:
            - sh
            - -c
            - |
              # Install OpenCode
              curl -fsSL https://opencode.ai/install | sh
              export PATH="/root/.opencode/bin:$PATH"

              # Run OpenCode commands
              opencode run --command "/setup-environment"
              opencode run --command "/health-check"

              # Start application
              npm start
```

### 4. Monitoring and Observability

#### Logging Integration

```markdown
---
description: Deploy with comprehensive logging
agent: ops
---

# Deployment with Logging

Start Time: !`date -Iseconds`

!`exec 2>&1
set -e
set -o pipefail

# Log deployment start

echo "$(date -Iseconds) [INFO] Starting deployment: $ARGUMENTS" | tee -a /var/log/deployments.log

# Run deployment with logging

if opencode deploy $ARGUMENTS 2>&1 | tee -a /var/log/deployments.log; then
  echo "$(date -Iseconds) [INFO] Deployment successful" | tee -a /var/log/deployments.log
else
echo "$(date -Iseconds) [ERROR] Deployment failed" | tee -a /var/log/deployments.log
exit 1
fi`

End Time: !`date -Iseconds`
```

#### Metrics Collection

```markdown
---
description: Deploy with metrics collection
agent: ops
---

# Deployment with Metrics

!`start_time=$(date +%s)
deployment_id="deploy-$(date +%s)"

# Record deployment start

curl -X POST http://metrics-server/metrics \
 -H "Content-Type: application/json" \
 -d '{
"event": "deployment_started",
"deployment_id": "'$deployment_id'",
    "timestamp": '$start_time',
"arguments": "'$ARGUMENTS'"
}'

# Run deployment

if opencode deploy $ARGUMENTS; then
  end_time=$(date +%s)
duration=$((end_time - start_time))

# Record deployment success

curl -X POST http://metrics-server/metrics \
 -H "Content-Type: application/json" \
 -d '{
"event": "deployment_completed",
"deployment_id": "'$deployment_id'",
      "timestamp": '$end_time',
"duration": '$duration',
      "status": "success"
    }'
else
  end_time=$(date +%s)

# Record deployment failure

curl -X POST http://metrics-server/metrics \
 -H "Content-Type: application/json" \
 -d '{
"event": "deployment_failed",
"deployment_id": "'$deployment_id'",
      "timestamp": '$end_time',
"status": "failed"
}'
exit 1
fi`
```

---

## Conclusion

This comprehensive best practices guide provides the foundation for creating robust, maintainable, and efficient OpenCode commands for codeflow projects. By following these patterns and guidelines, you can ensure your commands:

1. **Handle Arguments Correctly**: Use proper argument parsing, validation, and error handling
2. **Leverage Frontmatter Effectively**: Create dynamic, context-aware commands with metadata
3. **Manage Dates and Times**: Handle temporal data consistently across environments
4. **Structure Commands Logically**: Organize commands for clarity and maintainability
5. **Use Templates Wisely**: Master substitution patterns for dynamic content
6. **Handle Errors Gracefully**: Implement comprehensive error handling and recovery
7. **Integrate Seamlessly**: Work effectively with CI/CD platforms and containerized environments
8. **Test Thoroughly**: Validate commands through automated testing frameworks

Remember that the key to successful OpenCode command development is:

- **Consistency**: Use consistent patterns across all commands
- **Validation**: Always validate inputs and handle errors gracefully
- **Observability**: Provide clear logging and monitoring capabilities
- **Security**: Validate and sanitize all inputs to prevent injection attacks
- **Maintainability**: Write clear, well-documented commands that are easy to understand and modify

By applying these best practices, you'll create OpenCode commands that are reliable, secure, and perfectly suited for automated codeflow environments.
