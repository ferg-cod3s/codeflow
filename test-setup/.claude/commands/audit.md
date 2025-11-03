---
name: audit
description: Perform comprehensive code audits for compliance, security, and best practices
temperature: 0.1
category: security
---
# Audit Command

**Input**: {{arguments}}


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