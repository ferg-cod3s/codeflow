---
name: env_setup
description: Set up development environments, dependencies, and project configurations
version: 1.0.0
category: development
author: CodeFlow
tags: [environment, setup, dependencies, configuration, devops]
parameters:
  - name: environment
    type: string
    required: true
    description: 'Target environment type'
    options: ['development', 'staging', 'production', 'testing', 'local']
  - name: platform
    type: string
    required: false
    description: 'Target platform or runtime'
    options: ['node', 'python', 'java', 'docker', 'kubernetes', 'aws', 'azure', 'gcp']
  - name: dependencies
    type: boolean
    required: false
    description: 'Install and configure dependencies'
    default: true
  - name: configuration
    type: boolean
    required: false
    description: 'Apply configuration files and settings'
    default: true
  - name: validation
    type: boolean
    required: false
    description: 'Validate setup and run tests'
    default: true
  - name: cleanup
    type: boolean
    required: false
    description: 'Clean up previous installations'
    default: false
examples:
  - name: 'Local development setup'
    command: 'env-setup environment=local platform=node dependencies=true configuration=true'
    description: 'Set up local Node.js development environment'
  - name: 'Docker production environment'
    command: 'env-setup environment=production platform=docker dependencies=true validation=true'
    description: 'Set up Docker-based production environment'
  - name: 'Kubernetes staging with cleanup'
    command: 'env-setup environment=staging platform=kubernetes cleanup=true configuration=true'
    description: 'Set up Kubernetes staging environment with cleanup'
agents:
  - infrastructure-builder
  - deployment-engineer
  - database-admin
  - security-scanner
  - monitoring-expert
phases:
  - name: 'Environment Assessment'
    description: 'Assess current environment and requirements'
    agents: [infrastructure-builder, deployment-engineer]
    steps:
      - 'Analyze current system state and configurations'
      - 'Identify required tools, dependencies, and services'
      - 'Check platform compatibility and prerequisites'
      - 'Validate environment constraints and limitations'
  - name: 'Dependency Management'
    description: 'Install and configure project dependencies'
    agents: [deployment-engineer, database-admin]
    steps:
      - 'Install package managers and runtime environments'
      - 'Configure dependency sources and repositories'
      - 'Install project-specific dependencies'
      - 'Set up database connections and migrations'
      - 'Configure environment variables and secrets'
    parallel: true
  - name: 'Configuration Application'
    description: 'Apply configuration files and settings'
    agents: [infrastructure-builder, security-scanner]
    steps:
      - 'Apply environment-specific configuration files'
      - 'Set up security policies and access controls'
      - 'Configure networking and firewall rules'
      - 'Initialize logging and monitoring systems'
      - 'Set up backup and recovery procedures'
    parallel: true
  - name: 'Service Initialization'
    description: 'Initialize and start required services'
    agents: [deployment-engineer, monitoring-expert]
    steps:
      - 'Start database and cache services'
      - 'Initialize message queues and background workers'
      - 'Configure load balancers and proxies'
      - 'Set up monitoring and alerting systems'
      - 'Initialize logging and tracing infrastructure'
    parallel: true
  - name: 'Validation and Testing'
    description: 'Validate setup and run comprehensive tests'
    agents: [deployment-engineer, security-scanner]
    steps:
      - 'Run environment health checks'
      - 'Execute integration tests'
      - 'Validate security configurations'
      - 'Perform load and performance tests'
      - 'Verify monitoring and alerting functionality'
  - name: 'Documentation and Handover'
    description: 'Generate documentation and provide access'
    agents: [infrastructure-builder]
    steps:
      - 'Generate environment documentation'
      - 'Create access credentials and instructions'
      - 'Document troubleshooting procedures'
      - 'Provide rollback and recovery guides'
      - 'Update team notifications and runbooks'
implementation_details:
  - 'Use infrastructure-builder for environment provisioning and configuration'
  - 'Leverage deployment-engineer for automated deployment workflows'
  - 'Integrate database-admin for database setup and migrations'
  - 'Apply security-scanner for secure configuration validation'
  - 'Utilize monitoring-expert for observability setup'
  - 'Support multiple platforms (Node.js, Python, Java, Docker, K8s, Cloud)'
  - 'Handle environment-specific configurations and secrets'
  - 'Provide rollback capabilities for failed setups'
success_criteria:
  - 'Environment successfully provisioned and configured'
  - 'All dependencies installed and functional'
  - 'Configuration applied and validated'
  - 'Services running and accessible'
  - 'Tests passing and validation complete'
  - 'Documentation generated and accessible'
error_handling:
  - 'Handle platform-specific installation failures'
  - 'Retry mechanisms for network-related issues'
  - 'Graceful rollback for configuration errors'
  - 'Clear error messages with resolution steps'
  - 'Environment state preservation for debugging'
integration_examples:
  - 'CI/CD pipeline environment provisioning'
  - 'Local development environment automation'
  - 'Multi-environment deployment workflows'
  - 'Containerized application setup'
best_practices:
  - 'Use infrastructure as code for reproducible setups'
  - 'Implement security best practices from the start'
  - 'Validate configurations before deployment'
  - 'Document environment requirements clearly'
  - 'Plan for rollback and disaster recovery'
related_commands:
  - 'deploy': 'For application deployment after setup'
  - 'monitor': 'For environment monitoring and alerting'
  - 'security-scan': 'For security configuration validation'
  - 'migrate': 'For database setup and migrations'
changelog:
  - '1.0.0': 'Initial implementation with multi-platform environment setup'
---

# Environment Setup Command

**Input**: $ARGUMENTS

The `env-setup` command automates the setup of development, staging, and production environments, ensuring consistent and secure configurations across platforms.

## Overview

This command streamlines environment provisioning, dependency management, and configuration application, reducing setup time and minimizing configuration errors.

## Key Features

- **Multi-Platform Support**: Node.js, Python, Java, Docker, Kubernetes, Cloud platforms
- **Automated Dependency Management**: Package installation and configuration
- **Security-First Setup**: Secure configurations and access controls
- **Validation and Testing**: Comprehensive validation and testing phases
- **Rollback Capabilities**: Safe rollback for failed setups

## Usage

```bash
# Set up local development environment
env-setup environment=local platform=node dependencies=true configuration=true

# Production Docker environment with validation
env-setup environment=production platform=docker dependencies=true validation=true

# Kubernetes staging with cleanup
env-setup environment=staging platform=kubernetes cleanup=true configuration=true
```

## Output

The command provides:

- Environment setup summary and status
- Installed dependencies and versions
- Configuration validation results
- Service initialization status
- Test execution results
- Access credentials and documentation

## Integration

This command integrates with:

- CI/CD pipelines for automated environment provisioning
- Development workflows for consistent local setups
- Deployment processes for production readiness
- Monitoring systems for environment observability

Use this command to ensure environments are set up quickly, securely, and consistently.
