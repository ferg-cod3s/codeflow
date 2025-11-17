---
name: sentry-incident-response
description: Comprehensive Sentry incident response workflow that guides teams through detection, analysis, mitigation, and post-incident review using Sentry's powerful error tracking and team coordination capabilities.
license: MIT
allowed-tools:
  [
    sentry_search_issues,
    sentry_get_issue_details,
    sentry_find_teams,
    sentry_use_sentry,
    sentry_find_projects,
    sentry_find_releases,
    sentry_search_events,
  ]
metadata:
  category: mcp/sentry
  mcp_server: sentry
  version: '1.0.0'
  author: 'CodeFlow Team'
  tags: [incident-response, sentry, error-tracking, team-coordination]
noReply: true
---

# Sentry Incident Response Skill

This skill provides a comprehensive workflow for incident response using Sentry's error tracking and team management capabilities. It guides teams through the complete incident lifecycle from detection through resolution and post-incident analysis.

## When to Use This Skill

Use this skill when you need to:

- Respond to critical production incidents affecting users
- Coordinate cross-functional teams during incident response
- Analyze error patterns and identify root causes
- Track incident resolution progress and communication
- Conduct post-incident reviews and improvement planning

## Incident Response Workflow

### 1. Detection & Triage

- Monitor real-time error spikes and critical alerts from Sentry
- Classify incident severity based on user impact and business criticality
- Establish incident command structure (Incident Commander, Operations Lead, Communications Lead)
- Set initial response priorities and checkpoint timelines

### 2. Issue Analysis & Investigation

- Deep-dive into Sentry issues with full stack traces and error context
- Correlate related errors across multiple projects and services
- Analyze error patterns, frequencies, and affected user counts
- Identify environmental factors (deployments, feature flags, infrastructure changes)

### 3. Team Coordination & Communication

- Coordinate response teams using Sentry's team and project structure
- Assign issues to appropriate team members and track ownership
- Maintain incident timeline with key events, decisions, and actions
- Facilitate real-time communication through Sentry issue comments and updates

### 4. Mitigation Strategy & Decision Making

- Evaluate mitigation options using Sentry's release and deployment tracking
- Implement feature flag rollbacks or emergency patches based on error data
- Monitor mitigation effectiveness through real-time error rate changes
- Coordinate with development teams for hotfix deployment and validation

### 5. Resolution & Post-Incident Analysis

- Conduct comprehensive post-incident reviews using Sentry's issue timeline
- Document contributing factors, error patterns, and resolution steps
- Identify detection gaps and alerting improvements
- Track corrective actions with owners and completion dates

## Key Sentry Tools Used

- **sentry_search_issues**: Find and filter issues by severity, status, and impact
- **sentry_get_issue_details**: Deep analysis of individual issues with full context
- **sentry_find_teams**: Coordinate response teams and assign responsibilities
- **sentry_use_sentry**: Leverage Sentry's MCP Agent for complex analysis
- **sentry_find_projects**: Understand project scope and cross-project impact
- **sentry_find_releases**: Correlate incidents with recent deployments
- **sentry_search_events**: Analyze error patterns and user impact metrics

## Best Practices

- **Data-Driven Response**: Use Sentry's quantitative error data to guide decisions
- **Clear Communication**: Regular updates through Sentry issues and external channels
- **Comprehensive Documentation**: Maintain detailed incident logs with timestamps
- **Continuous Learning**: Improve future response through pattern analysis and automation

## Integration with CodeFlow Agents

This skill works seamlessly with CodeFlow's specialized Sentry agents:

- **sentry-incident-commander**: For leading incident response
- **sentry-error-analyst**: For deep technical error analysis
- **sentry-performance-expert**: When performance issues contribute to incidents
- **sentry-release-manager**: For release tracking and deployment monitoring

## Example Usage Scenarios

1. **Critical API Outage**: "Lead response to API timeout errors affecting 40% of users"
2. **Database Performance**: "Coordinate investigation of database connection pool exhaustion"
3. **Deployment Regression**: "Analyze error spike following latest deployment"
4. **Feature Flag Issue**: "Manage response to problematic feature flag configuration"
5. **Security Incident**: "Coordinate security team response to authentication failures"

## Notes

- Requires appropriate Sentry permissions and team access
- Integrates with existing CodeFlow agent ecosystem
- Supports project-local customization and overrides
- Uses noReply message insertion for persistent context throughout conversations
