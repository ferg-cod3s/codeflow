---
name: impact-analysis
description: Analyze the impact of code changes, dependencies, and architectural decisions
version: 1.0.0
category: development
author: CodeFlow
tags: [analysis, impact, dependencies, architecture, risk-assessment]
parameters:
  - name: scope
    type: string
    required: true
    description: 'Scope of analysis (file, module, feature, system)'
    options: ['file', 'module', 'feature', 'system', 'dependency']
  - name: target
    type: string
    required: true
    description: 'Target to analyze (file path, module name, feature name, etc.)'
  - name: depth
    type: string
    required: false
    description: 'Analysis depth level'
    default: 'comprehensive'
    options: ['basic', 'comprehensive', 'deep']
  - name: include-dependencies
    type: boolean
    required: false
    description: 'Include dependency analysis'
    default: true
  - name: include-security
    type: boolean
    required: false
    description: 'Include security impact analysis'
    default: true
  - name: include-performance
    type: boolean
    required: false
    description: 'Include performance impact analysis'
    default: true
examples:
  - name: 'Analyze file impact'
    command: 'impact-analysis scope=file target=src/auth/login.ts'
    description: 'Analyze impact of changes to a specific file'
  - name: 'Feature impact analysis'
    command: 'impact-analysis scope=feature target=user-authentication depth=deep include-security=true'
    description: 'Deep analysis of user authentication feature impact'
  - name: 'System-wide dependency impact'
    command: 'impact-analysis scope=system target=package.json include-dependencies=true'
    description: 'Analyze system-wide impact of dependency changes'
agents:
  - codebase-analyzer
  - system-architect
  - security-scanner
  - performance-engineer
  - risk-manager
phases:
  - name: 'Scope Definition'
    description: 'Define the scope and boundaries of the impact analysis'
    agents: [system-architect]
    steps:
      - 'Identify the target component/module/feature'
      - 'Map dependencies and dependents'
      - 'Define analysis boundaries and constraints'
      - 'Establish success criteria for the analysis'
  - name: 'Dependency Analysis'
    description: 'Analyze upstream and downstream dependencies'
    agents: [codebase-analyzer, system-architect]
    steps:
      - 'Map direct and indirect dependencies'
      - 'Identify coupling points and interfaces'
      - 'Assess dependency health and maintenance status'
      - 'Calculate dependency risk scores'
    parallel: true
  - name: 'Code Impact Assessment'
    description: 'Analyze code-level impact and changes'
    agents: [codebase-analyzer, performance-engineer]
    steps:
      - 'Review code changes and modifications'
      - 'Identify affected functions, classes, and modules'
      - 'Assess complexity and maintainability impact'
      - 'Calculate technical debt implications'
    parallel: true
  - name: 'Security Impact Analysis'
    description: 'Evaluate security implications of changes'
    agents: [security-scanner, risk-manager]
    steps:
      - 'Identify potential security vulnerabilities introduced'
      - 'Assess compliance impact (GDPR, HIPAA, etc.)'
      - 'Review authentication and authorization changes'
      - 'Calculate security risk scores'
    parallel: true
  - name: 'Performance Impact Evaluation'
    description: 'Analyze performance implications'
    agents: [performance-engineer]
    steps:
      - 'Assess computational complexity changes'
      - 'Identify potential bottlenecks'
      - 'Review resource utilization impact'
      - 'Calculate performance regression risks'
    parallel: true
  - name: 'Risk Assessment and Reporting'
    description: 'Synthesize findings and generate comprehensive report'
    agents: [risk-manager, system-architect]
    steps:
      - 'Aggregate findings from all analysis phases'
      - 'Calculate overall impact scores'
      - 'Generate prioritized recommendations'
      - 'Create mitigation strategies'
      - 'Produce comprehensive impact report'
implementation_details:
  - 'Use codebase-analyzer to understand current code structure and dependencies'
  - 'Leverage system-architect for architectural impact assessment'
  - 'Integrate security-scanner for vulnerability detection'
  - 'Apply performance-engineer for performance modeling'
  - 'Utilize risk-manager for comprehensive risk calculation'
  - 'Generate reports in multiple formats (JSON, Markdown, HTML)'
  - 'Include visual dependency graphs and impact matrices'
  - 'Provide actionable recommendations with effort estimates'
success_criteria:
  - 'Comprehensive impact analysis completed within specified scope'
  - 'All dependencies and dependents identified and assessed'
  - 'Security and performance implications evaluated'
  - 'Clear, actionable report generated with recommendations'
  - 'Risk scores calculated and mitigation strategies provided'
  - 'Analysis completed within reasonable time limits'
error_handling:
  - 'Handle cases where target does not exist or is inaccessible'
  - 'Gracefully manage incomplete dependency information'
  - 'Provide partial analysis when full analysis is not possible'
  - 'Retry mechanisms for transient failures'
  - 'Clear error messages with suggested resolutions'
integration_examples:
  - 'Pre-deployment impact analysis for CI/CD pipelines'
  - 'Code review integration for change impact assessment'
  - 'Dependency update planning and risk evaluation'
  - 'Architectural decision support and validation'
best_practices:
  - 'Always run impact analysis before major changes'
  - 'Include all stakeholders in scope definition'
  - 'Regularly update dependency maps for accuracy'
  - 'Use automated tools for continuous impact monitoring'
  - 'Document assumptions and limitations in reports'
related_commands:
  - 'code-review': 'For detailed code quality assessment'
  - 'security-scan': 'For comprehensive security analysis'
  - 'metrics': 'For performance baseline establishment'
  - 'migrate': 'For database impact analysis'
changelog:
  - '1.0.0': 'Initial implementation with comprehensive impact analysis capabilities'
---

# Impact Analysis Command

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
