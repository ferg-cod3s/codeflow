# OpenCode Best Practices for Codeflow Projects



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


This guide provides comprehensive best practices for implementing OpenCode commands in codeflow projects, ensuring proper argument handling, template substitution, and integration with CI/CD workflows.

**Related Guides:**

- [Claude Code Best Practices](./CLAUDE_CODE_BEST_PRACTICES.md) - For Claude Code slash commands
- [Cursor Best Practices](./CURSOR_BEST_PRACTICES.md) - For Cursor commands and rules

## Table of Contents

1. [Command Argument Handling](#command-argument-handling)
2. [Frontmatter Usage](#frontmatter-usage)
3. [Date and Time Handling](#date-and-time-handling)
4. [Template Substitution Patterns](#template-substitution-patterns)
5. [Command Structure Patterns](#command-structure-patterns)
6. [Error Handling and Validation](#error-handling-and-validation)
7. [Codeflow-Specific Patterns](#codeflow-specific-patterns)
8. [Common Pitfalls and Solutions](#common-pitfalls-and-solutions)
9. [Testing and Validation](#testing-and-validation)
10. [Integration Guidelines](#integration-guidelines)

---

## Command Argument Handling

### CLI Commands with yargs

```typescript
// Good: Proper argument validation
export const DeployCommand = cmd({
  command: 'deploy <environment> [version]',
  describe: 'Deploy application to specified environment',
  builder: (yargs) =>
    yargs
      .positional('environment', {
        describe: 'Target environment',
        type: 'string',
        choices: ['development', 'staging', 'production'],
      })
      .positional('version', {
        describe: 'Version to deploy',
        type: 'string',
      })
      .option('rollback-on-failure', {
        alias: 'r',
        type: 'boolean',
        default: true,
        describe: 'Automatically rollback on failure',
      })
      .option('headers', {
        alias: 'H',
        type: 'string',
        array: true,
        describe: "Headers in format 'Key: Value'",
      }),
  async handler(argv) {
    const { environment, version, headers, rollbackOnFailure } = argv;
    // Process arguments...
  },
});
```

### Array Argument Processing

```typescript
// Good: Proper header parsing
function parseHeaders(headers?: string[]): Record<string, string> | undefined {
  if (!headers || headers.length === 0) return undefined;

  return headers.reduce(
    (acc, header) => {
      const [key, ...valueParts] = header.split(':');
      if (key && valueParts.length > 0) {
        acc[key.trim()] = valueParts.join(':').trim();
      }
      return acc;
    },
    {} as Record<string, string>
  );
}

// Good: Environment variable parsing
function parseEnvironment(env?: string[]): Record<string, string> | undefined {
  if (!env || env.length === 0) return undefined;

  return env.reduce(
    (acc, envVar) => {
      const [key, ...valueParts] = envVar.split('=');
      if (key && valueParts.length > 0) {
        acc[key] = valueParts.join('=');
      }
      return acc;
    },
    {} as Record<string, string>
  );
}
```

### Slash Command $ARGUMENTS Usage

```markdown
---
name: deploy
description: Deploy application with environment and version
template: |
  Deploy application to {{environment}} with version {{version}}.

  Arguments received: $ARGUMENTS

  !`opencode deploy $ARGUMENTS`
---

# Deploy Application

Environment: {{environment}}
Version: {{version}}
Additional arguments: $ARGUMENTS
```

---

## Frontmatter Usage

### Basic Structure

```yaml
---
name: deploy
mode: command
description: Execute deployment workflow with comprehensive validation
version: 1.0.0
last_updated: 2025-10-21
command_schema_version: 1.0
author: codeflow-team
tags: [deployment, ci-cd, automation]
---
# Deploy Application
```

### Dynamic Values Using Shell Commands

```yaml
---
name: deploy
version: "1.0.0-!`date +%Y%m%d`"
last_updated: !`date +%Y-%m-%d`
execution_timestamp: !`date -u +"%Y-%m-%dT%H:%M:%SZ"`
build_number: !`echo $BUILD_NUMBER || echo 'local'`
git_commit: !`git rev-parse --short HEAD`
git_branch: !`git rev-parse --abbrev-ref HEAD`
---

# Deploy Application

**Deployment Info:**
- Version: {{version}}
- Last Updated: {{last_updated}}
- Execution Time: {{execution_timestamp}}
- Build: {{build_number}}
- Commit: {{git_commit}}
- Branch: {{git_branch}}
```

### Conditional Frontmatter

```yaml
---
name: deploy
description: Deploy to {{environment}}
environment: !`echo $DEPLOYMENT_ENV || echo 'development'`
debug_mode: !`if [[ "$DEBUG" == "true" ]]; then echo "true"; else echo "false"; fi`
---

# Deploy Application

Environment: {{environment}}
Debug Mode: {{debug_mode}}
```

---

## Date and Time Handling

### Multiple Approaches for Current Dates

#### Method 1: Shell Command in Frontmatter (Recommended)

```yaml
---
name: deploy
last_updated: !`date +%Y-%m-%d`
execution_time: !`date -u +"%Y-%m-%dT%H:%M:%SZ"`
unix_timestamp: !`date +%s`
file_safe_timestamp: !`date +%Y-%m-%d_%H-%M-%S`
---

# Deploy Application

**Deployment Timestamp:** {{execution_time}}
**File Safe:** {{file_safe_timestamp}}
```

#### Method 2: Shell Command in Body

```markdown
---
name: deploy
---

# Deploy Application

**Static Date:** {{last_updated}}
**Dynamic Date:** !`date +%Y-%m-%d %H:%M:%S`
**ISO 8601:** !`date -u +"%Y-%m-%dT%H:%M:%SZ"`
**Unix Timestamp:** !`date +%s`
**Readable Format:** !`date +"%B %d, %Y at %I:%M %p"`
```

#### Method 3: Template Variables with Shell

```markdown
---
name: deploy
---

# Deploy Application

{{current-date}}
`!date +%Y-%m-%d %H:%M:%S`
{{/current-date}}

{{execution-timestamp}}
`!date -u +"%Y-%m-%dT%H:%M:%SZ"`
{{/execution-timestamp}}
```

### Timezone Considerations

```markdown
---
name: deploy
---

# Deploy Application

**UTC Time:** !`date -u +"%Y-%m-%dT%H:%M:%SZ"`
**Local Time:** !`date +"%Y-%m-%dT%H:%M:%S %Z"`
**Timezone Offset:** !`date +%z`
**ISO with Offset:** !`date -Iseconds`
```

### Relative Date Calculations

```markdown
---
name: deploy
---

# Deploy Application

**Yesterday:** !`date -d "yesterday" +%Y-%m-%d`
**Tomorrow:** !`date -d "tomorrow" +%Y-%m-%d`
**Next Week:** !`date -d "next week" +%Y-%m-%d`
**30 Days Ago:** !`date -d "30 days ago" +%Y-%m-%d`
```

---

## Template Substitution Patterns

### $ARGUMENTS Substitution with Validation

```markdown
---
name: deploy
description: Deploy with validated arguments
---

# Deploy Application

Arguments received: "$ARGUMENTS"

{{#if arguments}}
Processing arguments: $ARGUMENTS
{{#each (split arguments " ")}}

- Argument: {{this}}
  {{/each}}
  {{else}}
  No arguments provided
  {{/if}}
```

### Shell Command Execution (!`command`)

```markdown
---
name: deploy
---

# Deploy Application

**Current Directory:** !`pwd`
**User:** !`whoami`
**Environment:** !`echo $NODE_ENV`
**Git Status:** !`git status --porcelain`
**Available Memory:** !`free -h | grep '^Mem:' | awk '{print $7}'`

**Complex Command:**
!`if [ -f "package.json" ]; then echo "Node.js project detected"; else echo "Not a Node.js project"; fi`
```

### File References (@file)

```markdown
---
name: deploy
---

# Deploy Application

**Configuration:** @config/deployment.yml
**Environment File:** @.env.production
**Dockerfile:** @Dockerfile
**Package JSON:** @package.json

**Multiple Files:**
@src/deploy/
@tests/integration/
```

### Combined Substitution Patterns

```markdown
---
name: deploy
version: '1.0.0-!`date +%Y%m%d`'
---

# Deploy Application

**Version:** {{version}}
**Arguments:** $ARGUMENTS
**Config:** @config/{{environment}}.yml
**Timestamp:** !`date -u +"%Y-%m-%dT%H:%M:%SZ"`

**Deployment Script:**
!`cat scripts/deploy.sh | envsubst`

**Environment Variables:**
!`printenv | grep DEPLOY_`
```

---

## Command Structure Patterns

### Standard Command Template

```markdown
---
name: deploy
mode: command
description: Execute deployment with comprehensive validation
version: 1.0.0
last_updated: !`date +%Y-%m-%d`
command_schema_version: 1.0
inputs:
  - name: environment
    type: string
    required: true
    description: Target deployment environment
    validation: ^(development|staging|production)$
  - name: version
    type: string
    required: false
    description: Version to deploy
    default: latest
outputs:
  - name: deployment_status
    type: structured
    format: JSON with deployment results
    description: Comprehensive deployment execution results
cache_strategy:
  type: agent_specific
  ttl: 600
  invalidation: manual
  scope: command
success_signals:
  - 'Deployment completed successfully'
  - 'All health checks passing'
failure_modes:
  - 'Pre-deployment validation failed'
  - 'Deployment execution failed'
  - 'Post-deployment verification failed'
---

# Deploy Application

Execute deployment workflow with comprehensive validation, execution, and verification phases.

## Purpose

Orchestrate deployment processes across environments with pre-deployment validation, controlled execution, and post-deployment verification.

## Inputs

- **environment**: Target deployment environment (development|staging|production)
- **version**: Optional version to deploy (defaults to latest)
- **arguments**: Additional deployment arguments ($ARGUMENTS)

## Process Phases

### Phase 1: Pre-Deployment Validation

1. **Environment Validation**: Verify target environment is ready
2. **Version Validation**: Confirm specified version exists
3. **Dependency Check**: Validate all dependencies are available
4. **Configuration Validation**: Ensure environment-specific configs are valid

### Phase 2: Deployment Execution

1. **Prepare Deployment**: Stage artifacts and configure parameters
2. **Execute Deployment**: Deploy using appropriate strategy
3. **Monitor Progress**: Track deployment health and progress
4. **Handle Failures**: Respond to deployment issues immediately

### Phase 3: Post-Deployment Verification

1. **Health Checks**: Verify service endpoints are responding
2. **Smoke Tests**: Execute critical path tests
3. **Performance Validation**: Confirm performance metrics are acceptable
4. **Rollback if Needed**: Execute rollback if critical failures detected

## Execution

**Environment:** {{environment}}
**Version:** {{version}}
**Arguments:** $ARGUMENTS
**Timestamp:** !`date -u +"%Y-%m-%dT%H:%M:%SZ"`

{{environment}}
{{version}}
{{arguments}}
```

### Multi-Stage Commands

```markdown
---
name: deploy
description: Multi-stage deployment with validation
---

# Deploy Application

## Stage 1: Validation

!`echo "Validating deployment to {{environment}}"`
!`if [ "{{environment}}" = "production" ]; then echo "Production deployment requires approval"; fi`

## Stage 2: Preparation

!`echo "Preparing deployment artifacts"`
!`docker build -t myapp:{{version}} .`

## Stage 3: Deployment

!`echo "Deploying to {{environment}}"`
!`kubectl apply -f k8s/{{environment}}/`

## Stage 4: Verification

!`echo "Verifying deployment"`
!`kubectl rollout status deployment/myapp -n {{environment}}`
```

### Conditional Execution

```markdown
---
name: deploy
---

# Deploy Application

{{#if (eq environment "production")}}

## Production Deployment

!`echo "Executing production deployment"`
!`./scripts/deploy-production.sh {{version}}`
{{else}}

## Non-Production Deployment

!`echo "Executing {{environment}} deployment"`
!`./scripts/deploy.sh {{environment}} {{version}}`
{{/if}}

{{#if rollback}}

## Rollback Mode

!`echo "Rolling back deployment"`
!`kubectl rollout undo deployment/myapp -n {{environment}}`
{{/if}}
```

---

## Error Handling and Validation

### Input Validation Patterns

```markdown
---
name: deploy
---

# Deploy Application

{{#validate environment "^(development|staging|production)$"}}
✅ Environment is valid: {{environment}}
{{else}}
❌ Invalid environment: {{environment}}
!`echo "Error: Environment must be development, staging, or production"`
{{/validate}}

{{#validate version "^[v]?[0-9]+\.[0-9]+\.[0-9]+$"}}
✅ Version format is valid: {{version}}
{{else}}
❌ Invalid version format: {{version}}
!`echo "Error: Version must follow semantic versioning (e.g., 1.0.0 or v1.0.0)"`
{{/validate}}
```

### Safe Command Execution

```markdown
---
name: deploy
---

# Deploy Application

## Safe Command Execution

**Set Error Handling:**
!`set -euo pipefail`

**Check Command Exists:**
!`if ! command -v kubectl &> /dev/null; then echo "Error: kubectl is not installed"; exit 1; fi`

**Validate Environment:**
!`if ! kubectl get namespace {{environment}} &> /dev/null; then echo "Error: Namespace {{environment}} does not exist"; exit 1; fi`

**Execute with Timeout:**
!`timeout 300 kubectl apply -f k8s/{{environment}}/ || echo "Deployment timed out or failed"`

**Check Exit Status:**
!`if [ $? -eq 0 ]; then echo "✅ Deployment successful"; else echo "❌ Deployment failed"; exit 1; fi`
```

### Retry Logic

```markdown
---
name: deploy
---

# Deploy Application

## Retry Logic for Health Checks

!`max_attempts=5
attempt=1
while [ $attempt -le $max_attempts ]; do
echo "Health check attempt $attempt of $max_attempts"
if kubectl get pods -n {{environment}} -l app=myapp | grep -q "Running"; then
echo "✅ Health check passed"
break
fi

if [ $attempt -eq $max_attempts ]; then
echo "❌ Health check failed after $max_attempts attempts"
exit 1
fi

echo "Waiting 30 seconds before retry..."
sleep 30
attempt=$((attempt + 1))
done`
```

---

## Codeflow-Specific Patterns

### GitHub Actions Integration

```markdown
---
name: deploy
description: Deploy with GitHub Actions integration
---

# Deploy Application

## GitHub Actions Context

**Workflow:** !`echo $GITHUB_WORKFLOW || echo "local"`
**Repository:** !`echo $GITHUB_REPOSITORY || echo "local"`
**Branch:** !`echo $GITHUB_REF_NAME || echo $(git rev-parse --abbrev-ref HEAD)`
**Commit:** !`echo $GITHUB_SHA || echo $(git rev-parse HEAD)`
**Actor:** !`echo $GITHUB_ACTOR || echo $(whoami)`
**Run ID:** !`echo $GITHUB_RUN_ID || echo "local"`

## Deployment Steps

1. **Set GitHub Context:**
   !`echo "GITHUB_WORKFLOW=${GITHUB_WORKFLOW:-local}" >> $GITHUB_ENV`
   !`echo "GITHUB_REPOSITORY=${GITHUB_REPOSITORY:-local}" >> $GITHUB_ENV`

2. **Deploy with GitHub Annotations:**
   !`echo "::group::Deploying to {{environment}}"`
   !`kubectl apply -f k8s/{{environment}}/`
   !`echo "::endgroup::"`

3. **Set Output for GitHub Actions:**
   !`echo "deployment_url=https://{{environment}}.example.com" >> $GITHUB_OUTPUT`
```

### Jenkins Pipeline Integration

```markdown
---
name: deploy
description: Deploy with Jenkins pipeline integration
---

# Deploy Application

## Jenkins Context

**Build Number:** !`echo $BUILD_NUMBER || echo "local"`
**Job Name:** !`echo $JOB_NAME || echo "local"`
**Node Name:** !`echo $NODE_NAME || echo $(hostname)`
**Workspace:** !`echo $WORKSPACE || echo $(pwd)`

## Jenkins Integration

1. **Update Build Description:**
   !`if command -v jenkins-cli &> /dev/null; then jenkins-cli set-build-description $JOB_NAME $BUILD_NUMBER "Deploy to {{environment}}"; fi`

2. **Archive Artifacts:**
   !`mkdir -p deployment-artifacts`
   !`cp -r k8s/{{environment}}/* deployment-artifacts/`
   !`tar -czf deployment-artifacts-{{environment}}-{{version}}.tar.gz deployment-artifacts/`

3. **Trigger Downstream Jobs:**
   !`if command -v jenkins-cli &> /dev/null; then jenkins-cli build integration-tests -p ENVIRONMENT={{environment}} -p VERSION={{version}}; fi`
```

### Multi-Environment Deployment

```markdown
---
name: deploy
description: Multi-environment deployment strategy
---

# Deploy Application

## Environment-Specific Configuration

{{#if (eq environment "development")}}
**Development Environment:**

- Namespace: dev
- Replicas: 1
- Resources: minimal
- Debug: enabled
  !`kubectl apply -f k8s/development/`
  !`kubectl set image deployment/myapp myapp=myapp:dev-{{version}} -n dev`
  {{/if}}

{{#if (eq environment "staging")}}
**Staging Environment:**

- Namespace: staging
- Replicas: 2
- Resources: moderate
- Debug: disabled
  !`kubectl apply -f k8s/staging/`
  !`kubectl set image deployment/myapp myapp=myapp:staging-{{version}} -n staging`
  {{/if}}

{{#if (eq environment "production")}}
**Production Environment:**

- Namespace: production
- Replicas: 5
- Resources: high
- Debug: disabled
- Blue-green deployment
  !`kubectl apply -f k8s/production/`
  !`kubectl set image deployment/myapp myapp=myapp:{{version}} -n production`
  {{/if}}
```

### Blue-Green Deployment

```markdown
---
name: deploy
description: Blue-green deployment strategy
---

# Deploy Application

## Blue-Green Deployment

**Current Active:** !`kubectl get service myapp-active -o jsonpath='{.spec.selector.version}' || echo "none"`

**Deploy to Inactive:**
!`CURRENT_VERSION=$(kubectl get service myapp-active -o jsonpath='{.spec.selector.version}' 2>/dev/null || echo "none")`
!`NEW_VERSION={{version}}`
!`INACTIVE_COLOR=$(if [ "$CURRENT_VERSION" = "blue" ]; then echo "green"; else echo "blue"; fi)`

**Deploy New Version:**
!`kubectl apply -f k8s/{{environment}}/ -l color=$INACTIVE_COLOR`
!`kubectl set image deployment/myapp-$INACTIVE_COLOR myapp=myapp:$NEW_VERSION -n {{environment}}`

**Wait for Deployment:**
!`kubectl rollout status deployment/myapp-$INACTIVE_COLOR -n {{environment}} --timeout=300s`

**Health Check:**
!`kubectl wait --for=condition=ready pod -l app=myapp,color=$INACTIVE_COLOR -n {{environment}} --timeout=300s`

**Switch Traffic:**
!`kubectl patch service myapp-active -p '{"spec":{"selector":{"color":"'$INACTIVE_COLOR'"}}}' -n {{environment}}`

**Verification:**
!`sleep 30`
!`curl -f https://{{environment}}.example.com/health || exit 1`
```

---

## Common Pitfalls and Solutions

### Argument Handling Mistakes

#### ❌ Bad: Unvalidated arguments

```markdown
---
name: deploy
---

# Deploy Application

!`kubectl apply -f $ARGUMENTS`
```

#### ✅ Good: Validated arguments

```markdown
---
name: deploy
---

# Deploy Application

{{#validate arguments "^[a-zA-Z0-9/_-]+$"}}
!`kubectl apply -f $ARGUMENTS`
{{else}}
❌ Invalid arguments: $ARGUMENTS
{{/validate}}
```

### Template Substitution Conflicts

#### ❌ Bad: Conflicting substitutions

```markdown
---
name: deploy
version: !`date +%Y-%m-%d`
---

# Deploy Application

Version: {{version}}
Date: !`date +%Y-%m-%d`
```

#### ✅ Good: Clear separation

```markdown
---
name: deploy
version_date: !`date +%Y-%m-%d`
---

# Deploy Application

Version: {{version_date}}
Current Date: !`date +%Y-%m-%d %H:%M:%S`
```

### File Reference Issues

#### ❌ Bad: Hardcoded paths

```markdown
---
name: deploy
---

# Deploy Application

Config: @/absolute/path/to/config.yml
```

#### ✅ Good: Relative paths

```markdown
---
name: deploy
---

# Deploy Application

Config: @config/{{environment}}.yml
Local Config: @./config.local.yml
```

### Error Handling Problems

#### ❌ Bad: No error handling

```markdown
---
name: deploy
---

# Deploy Application

!`kubectl apply -f k8s/{{environment}}/`
!`kubectl rollout status deployment/myapp -n {{environment}}`
```

#### ✅ Good: Comprehensive error handling

```markdown
---
name: deploy
---

# Deploy Application

!`set -euo pipefail`
!`if ! kubectl apply -f k8s/{{environment}}/; then echo "❌ Failed to apply manifests"; exit 1; fi`
!`if ! kubectl rollout status deployment/myapp -n {{environment}} --timeout=300s; then echo "❌ Deployment timeout"; exit 1; fi`
!`echo "✅ Deployment successful"`
```

---

## Testing and Validation

### Unit Test Framework

````markdown
---
name: test-deploy
description: Test deployment command
---

# Test Deployment Command

## Test Cases

### Test 1: Valid Environment

```bash
opencode run --command deploy -- "staging v1.0.0"
```
````

Expected: ✅ Deployment to staging with version v1.0.0

### Test 2: Invalid Environment

```bash
opencode run --command deploy -- "invalid v1.0.0"
```

Expected: ❌ Error about invalid environment

### Test 3: Missing Version

```bash
opencode run --command deploy -- "production"
```

Expected: ✅ Deployment to production with latest version

## Validation Script

!`cat > test-deploy.sh << 'EOF'
#!/bin/bash

echo "Testing deployment command..."

# Test 1: Valid environment

echo "Test 1: Valid environment"
if opencode run --command deploy -- "staging v1.0.0" | grep -q "✅"; then
echo "✅ Test 1 passed"
else
echo "❌ Test 1 failed"
fi

# Test 2: Invalid environment

echo "Test 2: Invalid environment"
if opencode run --command deploy -- "invalid v1.0.0" | grep -q "❌"; then
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

!`kubectl create namespace test-{{timestamp}} --dry-run=client -o yaml | kubectl apply -f -`

## Test Deployment

!`echo "Testing deployment to test-{{timestamp}} namespace"`
!`sed 's/namespace: {{environment}}/namespace: test-{{timestamp}}/g' k8s/staging/* | kubectl apply -f -`

## Verification

!`kubectl wait --for=condition=ready pod -l app=myapp -n test-{{timestamp}} --timeout=120s`
!`kubectl port-forward -n test-{{timestamp}} svc/myapp 8080:80 &`
!`sleep 5`
!`curl -f http://localhost:8080/health || exit 1`

## Cleanup

!`kubectl delete namespace test-{{timestamp}}`
!`echo "✅ Integration test passed"`
````

### Template Validation Script

```markdown
---
name: validate-templates
description: Validate all command templates
---

# Template Validation

## Validate Frontmatter

!`for file in .opencode/command/*.md; do
  echo "Validating $file..."
  if ! yamllint "$file" 2>/dev/null; then
    echo "❌ YAML validation failed for $file"
  else
    echo "✅ YAML validation passed for $file"
  fi
done`

## Validate Template Syntax

!`for file in .opencode/command/*.md; do
  echo "Checking template syntax in $file..."
  if grep -q "{{" "$file" && ! grep -q "{{/" "$file"; then
    echo "❌ Unclosed template tags in $file"
  else
    echo "✅ Template syntax valid in $file"
  fi
done`

## Validate Shell Commands

!`for file in .opencode/command/*.md; do
  echo "Checking shell commands in $file..."
  if grep -q "!\`" "$file"; then
    echo "Found shell commands in $file"
    # Extract and validate shell commands
    grep -o "!\`[^`]*\`" "$file" | while read -r cmd; do
clean_cmd=${cmd:2:-1}
      if bash -n <<<"$clean_cmd" 2>/dev/null; then
echo "✅ Shell syntax valid: $clean_cmd"
else
echo "❌ Shell syntax invalid: $clean_cmd"
fi
done
fi
done`
```

---

## Integration Guidelines

### GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy Application

on:
  workflow_dispatch:
    inputs:
      environment:
        required: true
        type: choice
        options: [development, staging, production]
      version:
        required: false
        type: string

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup OpenCode
        uses: sst/opencode/setup@v1
        with:
          api-key: ${{ secrets.OPENCODE_API_KEY }}

      - name: Deploy Application
        run: |
          opencode run --command deploy -- "${{ github.event.inputs.environment }} ${{ github.event.inputs.version }}"
        env:
          GITHUB_WORKFLOW: ${{ github.workflow }}
          GITHUB_REPOSITORY: ${{ github.repository }}
          GITHUB_REF_NAME: ${{ github.ref_name }}
          GITHUB_SHA: ${{ github.sha }}
          GITHUB_ACTOR: ${{ github.actor }}
          GITHUB_RUN_ID: ${{ github.run_id }}
```

### Jenkins Pipeline

```groovy
// Jenkinsfile
pipeline {
    agent any

    parameters {
        choice(name: 'ENVIRONMENT', choices: ['development', 'staging', 'production'], description: 'Target environment')
        string(name: 'VERSION', defaultValue: 'latest', description: 'Version to deploy')
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Setup OpenCode') {
            steps {
                sh 'curl -fsSL https://opencode.ai/install.sh | sh'
            }
        }

        stage('Deploy') {
            steps {
                withEnv([
                    "BUILD_NUMBER=${env.BUILD_NUMBER}",
                    "JOB_NAME=${env.JOB_NAME}",
                    "NODE_NAME=${env.NODE_NAME}",
                    "WORKSPACE=${env.WORKSPACE}"
                ]) {
                    sh "opencode run --command deploy -- '${params.ENVIRONMENT} ${params.VERSION}'"
                }
            }
        }
    }
}
```

### Docker Integration

```dockerfile
# Dockerfile
FROM node:18-alpine

# Install OpenCode
RUN curl -fsSL https://opencode.ai/install.sh | sh

# Copy application code
COPY . .

# Copy OpenCode commands
COPY .opencode/ /root/.opencode/

# Set working directory
WORKDIR /app

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Run application
CMD ["npm", "start"]
```

### Kubernetes Deployment

```yaml
# k8s/deployment.yml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: opencode-deployer
spec:
  replicas: 1
  selector:
    matchLabels:
      app: opencode-deployer
  template:
    metadata:
      labels:
        app: opencode-deployer
    spec:
      containers:
        - name: deployer
          image: myapp/deployer:latest
          env:
            - name: ENVIRONMENT
              value: 'production'
            - name: VERSION
              value: 'latest'
            - name: OPENCODE_API_KEY
              valueFrom:
                secretKeyRef:
                  name: opencode-secrets
                  key: api-key
          command:
            - /bin/sh
            - -c
            - |
              opencode run --command deploy -- "${ENVIRONMENT} ${VERSION}"
```

### Monitoring and Observability

```markdown
---
name: deploy-with-monitoring
description: Deploy with comprehensive monitoring
---

# Deploy Application with Monitoring

## Pre-Deployment Monitoring Setup

!`echo "Setting up monitoring for deployment to {{environment}}"`

**Create Monitoring Dashboard:**
!`curl -X POST "https://monitoring.example.com/api/dashboards" \
  -H "Authorization: Bearer $MONITORING_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "deployment-{{environment}}-{{timestamp}}",
    "environment": "{{environment}}",
    "version": "{{version}}",
    "timestamp": "{{timestamp}}"
  }'`

**Set Up Alerts:**
!`curl -X POST "https://alerts.example.com/api/rules" \
  -H "Authorization: Bearer $ALERTS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "deployment-{{environment}}-{{timestamp}}",
    "condition": "deployment_failure_rate > 0.1",
    "duration": "5m",
    "severity": "critical"
  }'`

## Deployment with Metrics

!`echo "Starting deployment with metrics collection"`

**Deploy Application:**
!`START_TIME=$(date +%s)`
!`kubectl apply -f k8s/{{environment}}/`
!`DEPLOYMENT_STATUS=$?`
!`END_TIME=$(date +%s)`
!`DURATION=$((END_TIME - START_TIME))`

**Report Metrics:**
!`curl -X POST "https://metrics.example.com/api/measurements" \
  -H "Authorization: Bearer $METRICS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "metric": "deployment_duration",
    "value": '$DURATION',
    "environment": "{{environment}}",
    "version": "{{version}}",
    "status": "'$DEPLOYMENT_STATUS'",
    "timestamp": '$START_TIME'
  }'`

## Post-Deployment Verification

!`echo "Verifying deployment health"`

**Health Check Metrics:**
!`HEALTH_CHECK_START=$(date +%s)`
!`if curl -f https://{{environment}}.example.com/health; then
  HEALTH_STATUS="success"
else
  HEALTH_STATUS="failure"
fi`
!`HEALTH_CHECK_END=$(date +%s)`
!`HEALTH_CHECK_DURATION=$((HEALTH_CHECK_END - HEALTH_CHECK_START))`

**Report Health Metrics:**
!`curl -X POST "https://metrics.example.com/api/measurements" \
  -H "Authorization: Bearer $METRICS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "metric": "health_check_duration",
    "value": '$HEALTH_CHECK_DURATION',
    "environment": "{{environment}}",
    "version": "{{version}}",
    "status": "'$HEALTH_STATUS'",
    "timestamp": '$HEALTH_CHECK_START'
  }'`

## Cleanup Monitoring

!`echo "Cleaning up monitoring resources"`

**Remove Temporary Dashboards:**
!`curl -X DELETE "https://monitoring.example.com/api/dashboards/deployment-{{environment}}-{{timestamp}}" \
  -H "Authorization: Bearer $MONITORING_API_KEY"`

**Disable Temporary Alerts:**
!`curl -X POST "https://alerts.example.com/api/rules/deployment-{{environment}}-{{timestamp}}/disable" \
  -H "Authorization: Bearer $ALERTS_API_KEY"`
```

---

## Quick Reference

### Command Structure Template

```markdown
---
name: command-name
mode: command
description: Brief description of what the command does
version: 1.0.0
last_updated: !`date +%Y-%m-%d`
command_schema_version: 1.0
inputs:
  - name: required-input
    type: string
    required: true
    description: Description of required input
  - name: optional-input
    type: string
    required: false
    description: Description of optional input
    default: default-value
outputs:
  - name: output-name
    type: structured
    format: Description of output format
    description: Description of what the output contains
---

# Command Name

Brief description of what this command does.

## Purpose

Detailed explanation of the command's purpose and goals.

## Inputs

- **required-input**: Description of required input
- **optional-input**: Description of optional input (default: default-value)
- **arguments**: Additional arguments ($ARGUMENTS)

## Process

1. Step 1 description
2. Step 2 description
3. Step 3 description

## Execution

**Input:** {{required-input}}
**Optional:** {{optional-input}}
**Arguments:** $ARGUMENTS
**Timestamp:** !`date -u +"%Y-%m-%dT%H:%M:%SZ"`

{{required-input}}
{{optional-input}}
{{arguments}}
```

### Common Shell Commands

```bash
# Date and time
date +%Y-%m-%d                    # 2025-10-21
date -u +"%Y-%m-%dT%H:%M:%SZ"   # 2025-10-21T14:30:00Z
date +%s                         # Unix timestamp
date +"%B %d, %Y"               # October 21, 2025

# Git operations
git rev-parse --short HEAD       # Short commit hash
git rev-parse --abbrev-ref HEAD  # Branch name
git status --porcelain          # Git status in porcelain format
git log -1 --pretty=format:"%h" # Latest commit short hash

# Environment variables
echo $NODE_ENV                   # Node environment
echo $BUILD_NUMBER              # Build number
printenv | grep DEPLOY_         # All DEPLOY_ variables

# File operations
pwd                             # Current directory
whoami                          # Current user
ls -la                          # Directory listing
cat file.txt                    # File contents

# Kubernetes operations
kubectl get pods                 # List pods
kubectl get services            # List services
kubectl apply -f file.yaml      # Apply manifest
kubectl rollout status deployment/app # Check rollout status
```

### Template Variables

```handlebars
{{variable}}
# Simple variable
{{#if condition}}
  # Conditional block
{{else}}
  # Else block
{{/if}}
# End conditional block
{{#each array}}
  # Loop over array
  {{this}}
  # Current item in loop
{{/each}}
# End loop
{{#eq var 'value'}}
  # Equality check
{{/eq}}
# End equality check $ARGUMENTS # Command arguments @file # File reference !`command` # Shell
command
```

---

This comprehensive guide provides the foundation for implementing robust OpenCode commands in codeflow projects. Follow these patterns to ensure proper argument handling, template substitution, and integration with CI/CD workflows.
