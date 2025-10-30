---
name: audit
description: Perform comprehensive code audits for compliance, security, and best practices
subtask: true
version: 1.0.0
category: development
author: CodeFlow
tags: [audit, compliance, security, best-practices, quality]
parameters:
  - name: scope
    type: string
    required: true
    description: 'Scope of the audit'
    options: ['code', 'dependencies', 'infrastructure', 'compliance', 'security', 'full']
  - name: standards
    type: array
    required: false
    description: 'Standards and frameworks to audit against'
    items:
      type: string
    default: ['OWASP', 'ISO27001', 'SOC2', 'GDPR', 'HIPAA']
  - name: depth
    type: string
    required: false
    description: 'Audit depth level'
    options: ['basic', 'comprehensive', 'deep']
    default: 'comprehensive'
  - name: include-remediation
    type: boolean
    required: false
    description: 'Include remediation recommendations'
    default: true
  - name: format
    type: string
    required: false
    description: 'Output format for the audit report'
    options: ['json', 'markdown', 'html', 'pdf']
    default: 'markdown'
examples:
  - name: 'Comprehensive code audit'
    command: "audit scope=full standards=['OWASP', 'SOC2'] depth=comprehensive include-remediation=true"
    description: 'Full audit against OWASP and SOC2 standards with remediation'
  - name: 'Security-focused audit'
    command: "audit scope=security standards=['ISO27001'] format=json"
    description: 'Security audit against ISO27001 in JSON format'
  - name: 'Dependencies audit'
    command: 'audit scope=dependencies depth=deep include-remediation=true'
    description: 'Deep audit of project dependencies with remediation'
agents:
  - security-scanner
  - compliance-expert
  - code-reviewer
  - risk-manager
  - backend-security-coder
  - frontend-security-coder
phases:
  - name: 'Audit Planning and Scoping'
    description: 'Plan audit scope and gather requirements'
    agents: [compliance-expert, risk-manager]
    steps:
      - 'Define audit objectives and success criteria'
      - 'Identify applicable standards and regulations'
      - 'Map audit scope and boundaries'
      - 'Assess risk levels and priorities'
      - 'Establish audit timeline and resources'
  - name: 'Data Collection'
    description: 'Collect relevant data for audit analysis'
    agents: [security-scanner, code-reviewer]
    steps:
      - 'Scan codebase for security vulnerabilities'
      - 'Analyze dependencies for known issues'
      - 'Review configuration files and settings'
      - 'Collect infrastructure and deployment data'
      - 'Gather compliance-related documentation'
    parallel: true
  - name: 'Compliance Assessment'
    description: 'Assess compliance against specified standards'
    agents: [compliance-expert, security-scanner]
    steps:
      - 'Evaluate adherence to security frameworks'
      - 'Check compliance with regulatory requirements'
      - 'Assess data protection and privacy measures'
      - 'Review access controls and authentication'
      - 'Validate audit trails and logging'
    parallel: true
  - name: 'Risk Analysis'
    description: 'Analyze risks and vulnerabilities'
    agents: [risk-manager, backend-security-coder, frontend-security-coder]
    steps:
      - 'Identify and categorize security risks'
      - 'Assess impact and likelihood of vulnerabilities'
      - 'Review code quality and best practices'
      - 'Analyze third-party dependencies risks'
      - 'Evaluate infrastructure security posture'
    parallel: true
  - name: 'Remediation Planning'
    description: 'Develop remediation strategies and recommendations'
    agents: [compliance-expert, security-scanner]
    steps:
      - 'Prioritize findings based on risk and impact'
      - 'Develop specific remediation actions'
      - 'Estimate effort and resources required'
      - 'Create implementation timelines'
      - 'Define success metrics for remediation'
  - name: 'Reporting and Documentation'
    description: 'Generate comprehensive audit report'
    agents: [compliance-expert, risk-manager]
    steps:
      - 'Compile findings into structured report'
      - 'Generate executive summary and key insights'
      - 'Create detailed findings with evidence'
      - 'Provide remediation roadmap and priorities'
      - 'Document audit methodology and limitations'
implementation_details:
  - 'Use security-scanner for comprehensive vulnerability detection'
  - 'Leverage compliance-expert for regulatory compliance assessment'
  - 'Apply code-reviewer for code quality and best practices'
  - 'Utilize risk-manager for risk prioritization and analysis'
  - 'Integrate backend-security-coder and frontend-security-coder for specialized security reviews'
  - 'Support multiple standards (OWASP, ISO27001, SOC2, GDPR, HIPAA, PCI-DSS)'
  - 'Generate reports in various formats (JSON, Markdown, HTML, PDF)'
  - 'Provide actionable remediation recommendations with effort estimates'
success_criteria:
  - 'Comprehensive audit completed within specified scope'
  - 'All applicable standards assessed and documented'
  - 'Risks identified, categorized, and prioritized'
  - 'Remediation recommendations provided'
  - 'Clear, actionable report generated'
  - 'Audit findings validated and evidence-based'
error_handling:
  - 'Handle cases where audit scope is too broad or undefined'
  - 'Gracefully manage missing or inaccessible data'
  - 'Provide partial audit results when full audit not possible'
  - 'Clear error messages with suggested scope adjustments'
  - 'Retry mechanisms for transient scanning failures'
integration_examples:
  - 'Pre-deployment security audit in CI/CD'
  - 'Compliance audit for regulatory requirements'
  - 'Third-party dependency security assessment'
  - 'Infrastructure security posture review'
best_practices:
  - 'Conduct regular audits to maintain compliance'
  - 'Scope audits appropriately to focus on high-risk areas'
  - 'Involve relevant stakeholders in audit planning'
  - 'Prioritize remediation based on risk and impact'
  - 'Document audit processes for consistency and repeatability'
related_commands:
  - 'security-scan': 'For focused security vulnerability scanning'
  - 'code-review': 'For code quality and best practices review'
  - 'impact-analysis': 'For change impact assessment'
  - 'monitor': 'For ongoing compliance monitoring'
changelog:
  - '1.0.0': 'Initial implementation with comprehensive audit capabilities'
---

# Audit Command

**Input**: $ARGUMENTS


The `audit` command performs comprehensive audits of your codebase, dependencies, and infrastructure against security standards, compliance frameworks, and best practices.

## Overview

This command provides thorough assessment and reporting to ensure your applications meet security, compliance, and quality standards, helping maintain a robust and secure development lifecycle.

## Key Features

- **Multi-Standard Support**: OWASP, ISO27001, SOC2, GDPR, HIPAA, PCI-DSS
- **Comprehensive Scoping**: Code, dependencies, infrastructure, compliance, security
- **Risk-Based Prioritization**: Findings prioritized by risk and impact
- **Remediation Guidance**: Detailed recommendations and implementation steps
- **Multiple Report Formats**: JSON, Markdown, HTML, PDF outputs

## Usage

```bash
# Comprehensive audit against multiple standards
audit scope=full standards=['OWASP', 'SOC2'] depth=comprehensive include-remediation=true

# Security-focused audit with JSON output
audit scope=security standards=['ISO27001'] format=json

# Deep dependency audit with remediation
audit scope=dependencies depth=deep include-remediation=true
```

## Output

The command generates:

- Executive summary with key findings
- Detailed audit report with evidence
- Risk assessment and prioritization matrix
- Compliance status against each standard
- Remediation roadmap with effort estimates
- Supporting documentation and references

## Integration

This command integrates with:

- CI/CD pipelines for automated compliance checks
- Security information and event management (SIEM) systems
- Governance, risk, and compliance (GRC) platforms
- Issue tracking systems for remediation tracking

Use this command to ensure your applications maintain high standards of security, compliance, and quality throughout their lifecycle.
