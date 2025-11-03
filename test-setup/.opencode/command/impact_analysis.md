---
name: impact_analysis
description: Analyze the impact of code changes, dependencies, and architectural decisions
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
# Impact Analysis Command

**Input**: $ARGUMENTS


The `impact-analysis` command provides comprehensive analysis of the potential impact of code changes, dependency updates, or architectural decisions across your codebase.

## Overview

This command helps you understand the ripple effects of changes before implementation, enabling informed decision-making and risk mitigation.

## Key Features

- **Multi-dimensional Analysis**: Code, security, performance, and dependency impact
- **Scope Flexibility**: From single files to entire systems
- **Risk Assessment**: Quantitative risk scoring and mitigation strategies
- **Visual Reporting**: Dependency graphs and impact matrices
- **Integration Ready**: Designed for CI/CD and code review workflows

## Usage

```bash
# Analyze impact of a specific file change
impact-analysis scope=file target=src/auth/login.ts

# Deep analysis of a feature with security focus
impact-analysis scope=feature target=user-authentication depth=deep include-security=true

# System-wide dependency impact analysis
impact-analysis scope=system target=package.json include-dependencies=true
```

## Output

The command generates a comprehensive report including:

- Impact summary with risk scores
- Dependency analysis with health metrics
- Security implications and vulnerabilities
- Performance impact assessment
- Actionable recommendations and mitigation strategies
- Visual representations of dependencies and impact areas

## Integration

This command integrates seamlessly with:

- CI/CD pipelines for pre-deployment analysis
- Code review processes for change validation
- Dependency management workflows
- Architectural decision frameworks

Use this command to ensure changes are made with full awareness of their broader implications.