---
name: review
mode: command
description: Validate that an implementation plan was correctly executed
version: 2.0.0-internal
last_updated: 2025-09-13
command_schema_version: 1.0
inputs:
  - name: plan_path
    type: string
    required: false
    description: Path to the implementation plan to validate
  - name: implementation_scope
    type: string
    required: false
    description: Scope of validation (current_session|recent_commits|full_history)
  - name: strictness
    type: string
    required: false
    description: Validation strictness level (lenient|standard|strict)
outputs:
  - name: validation_report
    type: structured
    format: JSON with validation results and findings
    description: Comprehensive validation report with issues and recommendations
cache_strategy:
  type: content_based
  ttl: 1800
  invalidation: manual
  scope: command
success_signals:
  - 'Validation completed successfully'
  - 'Implementation plan verified against execution'
  - 'Validation report generated with findings'
failure_modes:
  - 'Plan file not found or invalid'
  - 'Unable to determine implementation scope'
  - 'Automated verification checks failing'
---

# Validate Implementation

You are tasked with validating that an implementation plan was correctly executed, verifying all success criteria and identifying any deviations or issues. This command uses intelligent caching to optimize validation workflows and maintain consistency across similar verification scenarios.

## Purpose

Systematically validate implementation correctness by comparing executed changes against plan specifications, running automated checks, and identifying gaps or improvements needed.


## 📋 Configuration Resolution

**CRITICAL**: Before executing, resolve configuration to determine correct input/output paths.

### Resolution Priority (First Match Wins)

1. **Environment Variables** - `CODEFLOW_RESEARCH_DIR`, `CODEFLOW_PLANS_DIR`, `CODEFLOW_TICKETS_DIR`, `CODEFLOW_KNOWLEDGE_PATH`
2. **Project Config** - `.codeflow/config.yaml` in project root
3. **User Config** - `~/.codeflow/config.yaml` in home directory  
4. **Defaults** - `docs/research/`, `docs/plans/`, `docs/tickets/`, `thoughts/`

### Resolution Algorithm

```javascript
function resolveConfigPath(key, defaultValue) {
  // 1. Check environment variable
  const envVar = process.env[`CODEFLOW_${key.toUpperCase()}`];
  if (envVar) return envVar;
  
  // 2. Check project config
  const projectConfig = readYAML('.codeflow/config.yaml');
  if (projectConfig?.output?.[key]) return projectConfig.output[key];
  if (projectConfig?.research?.[key]) return projectConfig.research[key];
  
  // 3. Check user config
  const userConfig = readYAML('~/.codeflow/config.yaml');
  if (userConfig?.output?.[key]) return userConfig.output[key];
  if (userConfig?.research?.[key]) return userConfig.research[key];
  
  // 4. Return default
  return defaultValue;
}

// Usage:
const researchDir = resolveConfigPath('research_dir', 'docs/research/');
const plansDir = resolveConfigPath('plans_dir', 'docs/plans/');
const ticketsDir = resolveConfigPath('tickets_dir', 'docs/tickets/');
const knowledgePath = resolveConfigPath('knowledge_path', 'thoughts/');
```

### Example Configurations

**Project Config** (`.codeflow/config.yaml`):
```yaml
output:
  research_dir: documentation/research/
  plans_dir: documentation/plans/
  tickets_dir: documentation/tickets/
research:
  knowledge_source_config:
    directory:
      path: knowledge-base/
```

**Environment Variables**:
```bash
export CODEFLOW_RESEARCH_DIR="custom-research/"
export CODEFLOW_KNOWLEDGE_PATH="kb/"
```

### Resolution Output Example

```
📋 Configuration Resolved:
  ✓ Research output: {resolved_research_dir} (source: {config_source})
  ✓ Plans directory: {resolved_plans_dir} (source: {config_source})
  ✓ Knowledge path: {resolved_knowledge_path} (source: {config_source})
```

**Use resolved paths throughout - NEVER hardcode paths!**


## Inputs

- **plan_path**: Optional path to the implementation plan to validate
- **implementation_scope**: Optional scope for what to validate (current session, recent commits, or full history)
- **strictness**: Optional validation strictness level
- **conversation_context**: History of implementation work and decisions

## Preconditions

- Implementation plan exists and is readable (if path provided)
- Git repository has commit history to analyze
- Development environment configured for running verification commands
- Access to automated testing and build tools

## Process Phases

### Phase 1: Context Analysis & Scope Determination

1. **Check Cache First**: Query cache for similar validation patterns using plan context hash
2. **Determine Validation Scope**: Identify what implementation work needs validation
3. **Locate Implementation Plan**: Find or read the relevant plan document
4. **Gather Implementation Evidence**: Analyze git history and current codebase state
5. **Set Validation Parameters**: Establish strictness level and verification approach

### Phase 2: Systematic Verification

1. **Read Complete Plan**: Understand all phases, changes, and success criteria
2. **Verify Phase Completion**: Check completion markers against actual implementation
3. **Execute Automated Checks**: Run all automated verification commands from plan
4. **Analyze Code Changes**: Compare implemented changes against plan specifications
5. **Assess Manual Criteria**: Identify what requires manual testing and verification

### Phase 3: Analysis & Reporting

1. **Identify Deviations**: Document differences between plan and implementation
2. **Evaluate Edge Cases**: Assess error handling and edge case coverage
3. **Generate Recommendations**: Provide actionable improvement suggestions
4. **Create Validation Report**: Structure findings with clear status and priorities
5. **Update Cache**: Store successful validation patterns for future reviews

## Error Handling

### Plan Not Found Error

```error-context
{
  "command": "review",
  "phase": "context_analysis",
  "error_type": "plan_not_found",
  "expected": "Valid implementation plan",
  "found": "No plan file specified and none found in recent commits",
  "mitigation": "Provide plan path or ensure plan references in commit messages",
  "requires_user_input": true
}
```

### Verification Failure Error

```error-context
{
  "command": "review",
  "phase": "automated_checks",
  "error_type": "verification_failed",
  "expected": "All automated checks pass",
  "found": "Build failing with 5 errors",
  "mitigation": "Fix verification issues before completing validation",
  "requires_user_input": false
}
```

### Scope Ambiguity Error

```error-context
{
  "command": "review",
  "phase": "scope_determination",
  "error_type": "scope_ambiguous",
  "expected": "Clear implementation scope",
  "found": "Multiple recent commits, unclear which to validate",
  "mitigation": "Specify implementation scope or provide commit range",
  "requires_user_input": true
}
```

## Structured Output Specification

### Primary Output

```command-output:validation_report
{
  "status": "success|issues_found|critical_failures",
  "timestamp": "ISO-8601",
  "cache": {
    "hit": true|false,
    "key": "validation_pattern:{plan_hash}:{scope}",
    "ttl_remaining": 1800,
    "savings": 0.20
  },
  "validation": {
    "plan_path": "{resolved_plans_dir}2025-09-13-feature-implementation.md",
    "scope": "current_session|recent_commits|full_history",
    "strictness": "lenient|standard|strict"
  },
  "results": {
    "phases_validated": 4,
    "phases_completed": 3,
    "phases_partial": 1,
    "automated_checks_passed": 8,
    "automated_checks_failed": 2,
    "manual_tests_required": 5
  },
  "findings": {
    "matches_plan": [
      "Database migration correctly implemented",
      "API endpoints match specifications",
      "Error handling follows plan guidelines"
    ],
    "deviations": [
      "Variable naming differs from plan (improvement)",
      "Extra validation added (enhancement)"
    ],
    "issues": [
      "Missing database index could impact performance",
      "No rollback handling in migration",
      "Linting warnings need resolution"
    ]
  },
  "recommendations": [
    "Address linting warnings before merge",
    "Add integration test for edge case scenario",
    "Document new API endpoints in README",
    "Consider performance optimization for large datasets"
  ],
  "metadata": {
    "processing_time": 120,
    "cache_savings": 0.20,
    "files_analyzed": 15,
    "commits_reviewed": 8
  }
}
```

## Success Criteria

#### Automated Verification

- [ ] All automated verification commands from plan execute successfully
- [ ] Implementation matches plan specifications for completed phases
- [ ] Git history analysis completes without errors
- [ ] Validation report generated with proper structure
- [ ] Cache updated with successful validation patterns

#### Manual Verification

- [ ] All plan phases are properly validated against implementation
- [ ] Deviations from plan are documented with rationale
- [ ] Manual testing requirements are clearly specified
- [ ] Recommendations are actionable and prioritized
- [ ] Validation report provides clear next steps

## Validation Methodology

### Scope Determination Strategy

- **Current Session**: Validate work done in active conversation
- **Recent Commits**: Analyze last N commits for implementation
- **Full History**: Comprehensive validation against complete plan

### Verification Levels

- **Lenient**: Focus on major functionality, allow minor deviations
- **Standard**: Balance thoroughness with practicality
- **Strict**: Comprehensive validation of all specifications

## Validation Report Structure

```markdown
## Validation Report: [Plan Name]

### Executive Summary

- **Overall Status**: ✓ Pass | ⚠️ Issues Found | ✗ Critical Failures
- **Completion**: X/Y phases fully implemented
- **Automated Checks**: X passed, Y failed

### Phase-by-Phase Validation

#### Phase 1: [Name]

- **Status**: ✓ Complete | ⚠️ Partial | ✗ Incomplete
- **Automated Checks**: All passing
- **Key Findings**: Implementation matches plan specifications
- **Issues**: None identified

#### Phase 2: [Name]

- **Status**: ⚠️ Partial
- **Automated Checks**: 2/3 passing
- **Key Findings**: Core functionality implemented
- **Issues**: Missing error handling for edge case

### Automated Verification Results

✓ Build passes: `turbo build`
✓ Tests pass: `turbo test`
✗ Linting issues: `turbo check` (3 warnings)
✓ Type checking: `turbo typecheck`

### Code Review Findings

#### Plan Compliance

- **Matches**: Database migration, API endpoints, core logic
- **Deviations**: Variable naming, additional validations (documented improvements)
- **Gaps**: Missing index, rollback handling

#### Quality Assessment

- **Patterns**: Follows existing codebase conventions
- **Error Handling**: Robust for common scenarios
- **Performance**: Adequate for current requirements
- **Maintainability**: Code is well-structured and documented

### Manual Testing Requirements

#### Functional Testing

- [ ] Verify feature works in UI
- [ ] Test error states with invalid input
- [ ] Confirm integration with existing components

#### Performance & Edge Cases

- [ ] Test with large datasets
- [ ] Verify behavior under error conditions
- [ ] Check cross-browser compatibility

### Critical Issues (Must Fix)

1. Address linting warnings before merge
2. Add missing database index
3. Implement migration rollback handling

### Recommendations (Should Consider)

1. Add integration tests for complex scenarios
2. Document new API endpoints
3. Consider performance optimization for scale

### Next Steps

1. Fix critical issues identified
2. Complete manual testing
3. Address recommendations as time permits
4. Ready for code review and merge
```

## Validation Best Practices

### Systematic Approach

- **Complete Plan Review**: Read entire plan before validation
- **Evidence-Based**: Base findings on actual code and test results
- **Balanced Assessment**: Consider both compliance and improvement opportunities
- **Clear Communication**: Document issues with specific file:line references

### Quality Focus Areas

- **Functional Correctness**: Does implementation solve the problem?
- **Code Quality**: Follows patterns, handles errors, maintainable?
- **Testing Coverage**: Automated and manual testing adequate?
- **Performance Impact**: Any performance implications?
- **Security Considerations**: Secure implementation practices?

## Edge Cases

### Partial Implementation Validation

- Clearly distinguish between completed and incomplete phases
- Document what works vs. what doesn't
- Provide clear guidance on remaining work needed

### Legacy Code Integration

- Assess impact on existing functionality
- Verify backward compatibility
- Check for unintended side effects

### Complex Multi-Phase Plans

- Validate phases independently when possible
- Identify phase interdependencies
- Prioritize critical path validation

## Anti-Patterns

### Avoid These Practices

- **Superficial validation**: Don't skip automated checks for speed
- **Biased assessment**: Don't favor implementation over plan requirements
- **Vague findings**: Don't use generic descriptions without specific references
- **Cache bypass**: Don't skip cache checks for performance reasons

## Caching Guidelines

## Enhanced Subagent Orchestration for Review & Validation

### Comprehensive Validation Workflow

For thorough implementation validation requiring multi-domain expertise:

#### Phase 1: Implementation Analysis (Parallel)
- **codebase-locator**: Identify all implemented components and changed files
- **codebase-analyzer**: Understand implementation details and code changes
- **knowledge-analyzer**: Review implementation documentation and notes
- **codebase-pattern-finder**: Validate adherence to established patterns
- **code-reviewer**: Primary agent for comprehensive code quality validation

#### Phase 2: Domain-Specific Validation (Sequential)
- **full-stack-developer**: Validate technical implementation correctness
- **api-builder**: Verify API contracts and integration implementations
- **database-expert**: Validate database changes and data integrity
- **security-scanner**: Assess security implementation and vulnerability mitigation
- **performance-engineer**: Validate performance requirements and optimizations
- **accessibility-pro**: Verify accessibility compliance implementation
- **compliance-expert**: Validate regulatory compliance requirements

#### Phase 3: Quality Assurance Validation (Parallel)
- **test-generator**: Verify test coverage and quality of test implementations
- **quality-testing-performance-tester**: Validate performance testing and benchmarks
- **monitoring-expert**: Verify monitoring and alerting implementations
- **infrastructure-builder**: Validate infrastructure and deployment changes
- **deployment-wizard**: Verify deployment procedures and rollback capabilities

#### Phase 4: Integration & System Validation (Sequential)
- **system-architect**: Validate architectural compliance and design integrity
- **devops-operations-specialist**: Verify operational readiness and procedures
- **cost-optimizer**: Validate cost implications and optimizations
- **content-localization-coordinator**: Verify internationalization implementations

#### Phase 5: Documentation & Reporting (Parallel)
- **knowledge-analyzer**: Validate documentation updates and completeness
- **content-writer**: Review user-facing documentation accuracy
- **code-reviewer**: Final comprehensive quality assessment

### Review Orchestration Best Practices

1. **Comprehensive Analysis**: Use multiple domain experts for thorough validation
2. **Code Quality First**: Always include code-reviewer for fundamental quality assessment
3. **Domain Validation**: Engage appropriate specialists for domain-specific requirements
4. **Integration Testing**: Validate system-level integration and interactions
5. **Documentation Verification**: Ensure all documentation is accurate and complete
6. **Risk Assessment**: Identify and prioritize any remaining issues or gaps

### Validation Quality Gates

- **Code Quality**: Comprehensive code review with all issues addressed
- **Functional Correctness**: All planned features implemented and working
- **Security Compliance**: Security requirements properly implemented
- **Performance Standards**: Performance requirements met and validated
- **Test Coverage**: Adequate test coverage with passing tests
- **Documentation**: Complete and accurate documentation provided
- **Operational Readiness**: Deployment and operational procedures validated

### Review Optimization Strategies

- **Automated Validation**: Leverage automated checks and testing frameworks
- **Parallel Assessment**: Use multiple reviewers simultaneously for efficiency
- **Incremental Validation**: Validate implementation phases as they complete
- **Risk-Based Prioritization**: Focus validation efforts on high-risk areas
- **Continuous Feedback**: Provide ongoing feedback during implementation
- **Comprehensive Reporting**: Generate detailed reports with actionable recommendations


### Cache Usage Patterns

- **Validation approaches**: Store successful validation methodologies for similar plans
- **Issue patterns**: Cache common findings and resolution approaches
- **Report structures**: Remember effective report organization patterns

### Cache Invalidation Triggers

- **Manual**: Clear cache when validation standards change
- **Content-based**: Invalidate when plan structure changes significantly
- **Time-based**: Refresh cache every 30 minutes for active validation sessions

### Performance Optimization

- Cache hit rate target: ≥ 65% for repeated validation patterns
- Memory usage: < 20MB for validation pattern cache
- Response time: < 100ms for cache queries

{{plan_path}}
