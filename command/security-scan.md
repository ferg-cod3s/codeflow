---
name: security-scan
mode: command
description: Perform comprehensive security vulnerability scanning and analysis
subtask: true
version: 1.0.0
inputs:
  - name: target
    description: Target to scan (repository, application, infrastructure, network)
    type: string
    required: true
  - name: scan_type
    description: Type of security scan (sast, dast, sca, dependency, infrastructure)
    type: string
    default: comprehensive
  - name: severity_threshold
    description: Minimum severity level to report (low, medium, high, critical)
    type: string
    default: medium
  - name: compliance_standards
    description: Compliance frameworks to validate against (owasp, nist, pci, hipaa, gdpr)
    type: array
    default: ['owasp']
  - name: remediation_mode
    description: Automatic remediation mode (report, suggest, auto_fix)
    type: string
    default: suggest
outputs:
  - Security vulnerability reports
  - Risk assessment and prioritization
  - Remediation recommendations and patches
  - Compliance validation results
  - Security baseline documentation
cache_strategy:
  type: tiered
  ttl: 1800
  key_pattern: 'security-scan:{target}:{scan_type}'
success_signals:
  - Security scan completed without errors
  - Vulnerability reports generated
  - Risk assessment completed
  - Remediation recommendations provided
failure_modes:
  - Scan tools unavailable or failed
  - Insufficient permissions for scanning
  - Target inaccessible or unreachable
  - Compliance validation failures
---

# Security Scan Command

**Input**: $ARGUMENTS


## Overview

The `security-scan` command performs comprehensive security vulnerability scanning and analysis across code repositories, applications, infrastructure, and networks. It provides multi-layered security assessment including static analysis, dynamic testing, dependency scanning, and compliance validation.

## Phases

### Phase 1: Target Analysis and Preparation

**Agent:** `security-scanner`
**Objective:** Analyze target and prepare scanning strategy

**Tasks:**

- Identify target type and scope
- Map application architecture and dependencies
- Review existing security configurations
- Determine appropriate scanning tools and techniques
- Assess compliance requirements and standards

**Parallel Execution:**

- `codebase-locator` - Map codebase structure and components
- `infrastructure-builder` - Analyze infrastructure security posture

### Phase 2: Static Application Security Testing (SAST)

**Agent:** `backend-security-coder`
**Objective:** Perform static code analysis for security vulnerabilities

**Tasks:**

- Run static analysis security scanners
- Analyze code for security anti-patterns
- Review authentication and authorization implementations
- Check for input validation and output encoding
- Identify hardcoded secrets and credentials

**Parallel Execution:**

- `frontend-security-coder` - Frontend security analysis
- `mobile-security-coder` - Mobile application security

### Phase 3: Dynamic Application Security Testing (DAST)

**Agent:** `security-scanner`
**Objective:** Perform runtime security testing and vulnerability assessment

**Tasks:**

- Configure and run dynamic security scanners
- Perform web application penetration testing
- Test API endpoints for security vulnerabilities
- Conduct authentication and authorization testing
- Validate session management and CSRF protection

**Parallel Execution:**

- `api-builder-enhanced` - API security testing
- `network-engineer` - Network security assessment

### Phase 4: Software Composition Analysis (SCA)

**Agent:** `security-scanner`
**Objective:** Scan dependencies and third-party components for vulnerabilities

**Tasks:**

- Scan package managers and dependency files
- Analyze container images and base images
- Check for known vulnerabilities in dependencies
- Review license compliance and restrictions
- Identify outdated and vulnerable components

**Parallel Execution:**

- `database-expert` - Database security scanning
- `cloud-architect` - Cloud service security assessment

### Phase 5: Infrastructure and Configuration Security

**Agent:** `security-auditor`
**Objective:** Assess infrastructure security and configuration compliance

**Tasks:**

- Scan infrastructure as code (IaC) templates
- Review cloud security configurations
- Analyze network security groups and firewalls
- Check container and Kubernetes security
- Validate secrets management and encryption

**Parallel Execution:**

- `devops-operations-specialist` - DevOps security review
- `compliance-expert` - Compliance validation

### Phase 6: Compliance and Standards Validation

**Agent:** `compliance-expert`
**Objective:** Validate against security standards and compliance frameworks

**Tasks:**

- Assess OWASP Top 10 compliance
- Validate NIST Cybersecurity Framework alignment
- Check PCI DSS requirements (if applicable)
- Review HIPAA compliance (if applicable)
- Validate GDPR data protection requirements

**Parallel Execution:**

- `legal-advisor` - Legal and regulatory compliance
- `risk-manager` - Risk assessment and mitigation

### Phase 7: Risk Assessment and Prioritization

**Agent:** `risk-manager`
**Objective:** Assess security risks and prioritize remediation efforts

**Tasks:**

- Calculate risk scores for identified vulnerabilities
- Prioritize vulnerabilities based on business impact
- Assess exploitability and threat intelligence
- Create remediation roadmap and timeline
- Estimate remediation effort and resources

**Parallel Execution:**

- `business-analyst` - Business impact assessment
- `incident-responder` - Incident response readiness

### Phase 8: Remediation and Reporting

**Agent:** `security-scanner`
**Objective:** Generate remediation plans and security reports

**Tasks:**

- Create detailed vulnerability reports
- Generate remediation recommendations
- Provide code patches and configuration fixes
- Create security baseline documentation
- Generate compliance reports and evidence

**Parallel Execution:**

- `documentation-specialist` - Security documentation
- `code-reviewer` - Security code review

## Implementation Details

### Scan Types

#### Static Application Security Testing (SAST)

- **Code Analysis**: Security anti-patterns, vulnerable code constructs
- **Secret Detection**: Hardcoded credentials, API keys, certificates
- **Input Validation**: SQL injection, XSS, command injection vulnerabilities
- **Authentication/Authorization**: Weak authentication, authorization bypasses
- **Cryptographic Issues**: Weak encryption, insecure random number generation

#### Dynamic Application Security Testing (DAST)

- **Web Application Testing**: OWASP Top 10, business logic flaws
- **API Security Testing**: Authentication, authorization, rate limiting
- **Session Management**: Session hijacking, fixation, timeout issues
- **Input Validation**: Injection attacks, parameter tampering
- **Cross-Site Scripting**: Reflected, stored, DOM-based XSS

#### Software Composition Analysis (SCA)

- **Dependency Scanning**: Known vulnerabilities in third-party libraries
- **License Compliance**: License conflicts and restrictions
- **Container Security**: Vulnerable base images, container configurations
- **Package Managers**: npm, pip, Maven, NuGet, Go modules
- **Supply Chain Security**: Dependency confusion, typosquatting

#### Infrastructure Security

- **IaC Security**: Terraform, CloudFormation, Ansible security issues
- **Cloud Configuration**: S3 bucket misconfigurations, security group rules
- **Container Security**: Docker, Kubernetes security best practices
- **Network Security**: Firewall rules, network segmentation
- **Secrets Management**: Vault, AWS Secrets Manager, Azure Key Vault

### Compliance Frameworks

#### OWASP Top 10

- A01: Broken Access Control
- A02: Cryptographic Failures
- A03: Injection
- A04: Insecure Design
- A05: Security Misconfiguration
- A06: Vulnerable and Outdated Components
- A07: Identification and Authentication Failures
- A08: Software and Data Integrity Failures
- A09: Security Logging and Monitoring Failures
- A10: Server-Side Request Forgery (SSRF)

#### NIST Cybersecurity Framework

- **Identify**: Asset management, risk assessment
- **Protect**: Access control, awareness and training
- **Detect**: Anomalous activity, continuous monitoring
- **Respond**: Response planning, communications
- **Recover**: Recovery planning, improvements

#### Industry-Specific Standards

- **PCI DSS**: Payment card industry security standards
- **HIPAA**: Healthcare information privacy and security
- **GDPR**: European data protection regulations
- **SOX**: Sarbanes-Oxley financial reporting requirements

### Severity Classification

#### Critical (CVSS 9.0-10.0)

- Remote code execution vulnerabilities
- Privilege escalation exploits
- Data breach vulnerabilities
- Complete system compromise

#### High (CVSS 7.0-8.9)

- SQL injection with data access
- Cross-site scripting with session hijacking
- Authentication bypass vulnerabilities
- Sensitive data exposure

#### Medium (CVSS 4.0-6.9)

- Reflected XSS vulnerabilities
- CSRF attacks
- Information disclosure
- Denial of service vulnerabilities

#### Low (CVSS 0.1-3.9)

- Missing security headers
- Weak encryption algorithms
- Information leakage in error messages
- Configuration issues

### Remediation Strategies

#### Automatic Remediation

- Dependency updates and patches
- Configuration fixes
- Security header additions
- Basic code pattern fixes

#### Suggested Remediation

- Code refactoring recommendations
- Architecture improvements
- Security best practices implementation
- Additional security controls

#### Manual Remediation

- Complex vulnerability fixes
- Business logic security improvements
- Custom security implementations
- Third-party integration security

## Integration Examples

### Comprehensive Security Scan

```bash
/security-scan target="web-application" scan_type="comprehensive" severity_threshold="medium" compliance_standards=["owasp","nist"] remediation_mode="suggest"
```

### Dependency Security Scan

```bash
/security-scan target="package.json" scan_type="dependency" severity_threshold="high" compliance_standards=["owasp"] remediation_mode="auto_fix"
```

### Infrastructure Security Scan

```bash
/security-scan target="terraform/" scan_type="infrastructure" severity_threshold="medium" compliance_standards=["nist"] remediation_mode="report"
```

## Output Documentation

The command generates comprehensive security documentation including:

1. **Executive Security Summary**
2. **Detailed Vulnerability Reports**
3. **Risk Assessment Matrix**
4. **Remediation Roadmap**
5. **Compliance Validation Reports**
6. **Security Baseline Documentation**
7. **Incident Response Procedures**

## Success Criteria

- All security scans completed successfully
- Vulnerabilities identified and prioritized
- Compliance validation completed
- Remediation recommendations provided
- Security documentation generated
- Risk assessment completed

## Continuous Integration

### Automated Security Scanning

- Integrate with CI/CD pipelines
- Schedule regular security scans
- Implement security gates in deployment
- Monitor for new vulnerabilities
- Automated dependency updates

### Security Monitoring

- Continuous security monitoring
- Real-time threat intelligence
- Security incident alerting
- Compliance monitoring
- Security metrics and KPI tracking
