---
name: code_review
mode: command
description: Perform comprehensive automated code review and quality validation
subtask: true
version: 1.0.0
inputs:
  - name: target
    description: Target for code review (branch, pull request, commit, directory)
    type: string
    required: true
  - name: review_type
    description: Type of review (comprehensive, security, performance, style, architecture)
    type: string
    default: comprehensive
  - name: severity_threshold
    description: Minimum severity level to report (info, minor, major, critical, blocker)
    type: string
    default: minor
  - name: auto_fix
    description: Automatically fix issues where possible (true, false)
    type: boolean
    default: false
  - name: framework_rules
    description: Framework-specific rules and best practices to apply
    type: array
    default: []
outputs:
  - Code review report with findings and recommendations
  - Quality metrics and scores
  - Auto-fixed code changes (if enabled)
  - Style guide compliance report
  - Security and performance analysis
cache_strategy:
  type: tiered
  ttl: 2400
  key_pattern: 'code-review:{target}:{review_type}'
success_signals:
  - Code review completed successfully
  - All findings documented and categorized
  - Quality metrics calculated
  - Recommendations provided
failure_modes:
  - Target not found or inaccessible
  - Code analysis tools failed
  - Insufficient permissions for review
  - Framework rules not applicable
---

# Code Review Command

**Input**: $ARGUMENTS


## Overview

The `code-review` command performs comprehensive automated code review and quality validation across multiple dimensions including security, performance, style, architecture, and best practices. It provides detailed analysis, actionable recommendations, and automatic fixes where possible.

## Phases

### Phase 1: Target Analysis and Setup

**Agent:** `codebase-locator`
**Objective:** Analyze target scope and prepare review strategy

**Tasks:**

- Identify target type and scope (branch, PR, commit, directory)
- Map code structure and dependencies
- Determine programming languages and frameworks
- Review existing code quality standards
- Set up review criteria and thresholds

**Parallel Execution:**

- `codebase-analyzer` - Analyze code patterns and architecture
- `codebase-pattern-finder` - Identify existing patterns and conventions

### Phase 2: Code Quality and Style Analysis

**Agent:** `code-reviewer`
**Objective:** Perform comprehensive code quality and style analysis

**Tasks:**

- Run linting and formatting checks
- Analyze code complexity and maintainability
- Review naming conventions and documentation
- Check for code smells and anti-patterns
- Validate style guide compliance

**Parallel Execution:**

- `typescript-pro` - TypeScript-specific analysis
- `javascript-pro` - JavaScript-specific analysis
- `python-pro` - Python-specific analysis

### Phase 3: Security Analysis

**Agent:** `backend-security-coder`
**Objective:** Perform security-focused code review

**Tasks:**

- Scan for security vulnerabilities and anti-patterns
- Review authentication and authorization implementations
- Check for input validation and output encoding
- Identify hardcoded secrets and credentials
- Validate cryptographic implementations

**Parallel Execution:**

- `frontend-security-coder` - Frontend security analysis
- `mobile-security-coder` - Mobile security analysis

### Phase 4: Performance Analysis

**Agent:** `performance-engineer`
**Objective:** Analyze code for performance issues and optimization opportunities

**Tasks:**

- Identify performance bottlenecks and inefficiencies
- Review algorithm complexity and data structures
- Analyze database query performance
- Check for memory leaks and resource management
- Identify caching and optimization opportunities

**Parallel Execution:**

- `database-optimizer` - Database performance analysis
- `full-stack-developer` - Application performance review

### Phase 5: Architecture and Design Analysis

**Agent:** `architect-review`
**Objective:** Review code architecture and design patterns

**Tasks:**

- Analyze design patterns and architecture compliance
- Review separation of concerns and modularity
- Check for SOLID principles adherence
- Evaluate API design and interface contracts
- Review error handling and resilience patterns

**Parallel Execution:**

- `system-architect` - System architecture review
- `api-builder` - API design analysis

### Phase 6: Testing and Coverage Analysis

**Agent:** `test-automator`
**Objective:** Analyze test coverage and testing quality

**Tasks:**

- Calculate test coverage metrics
- Review test quality and effectiveness
- Identify missing test cases
- Analyze test performance and reliability
- Review test data and mocking strategies

**Parallel Execution:**

- `quality-testing-performance-tester` - Test quality analysis
- `test-generator` - Test gap identification

### Phase 7: Documentation and Maintainability

**Agent:** `documentation-specialist`
**Objective:** Review code documentation and maintainability

**Tasks:**

- Analyze code comments and documentation quality
- Review API documentation completeness
- Check for README and setup instructions
- Evaluate code readability and maintainability
- Review changelog and version documentation

**Parallel Execution:**

- `technical-writer` - Documentation quality review
- `ux-optimizer` - Developer experience analysis

### Phase 8: Integration and Compatibility

**Agent:** `full-stack-developer`
**Objective:** Review integration points and compatibility

**Tasks:**

- Analyze API compatibility and versioning
- Review database schema changes
- Check for breaking changes
- Validate dependency compatibility
- Review deployment and configuration changes

**Parallel Execution:**

- `api-builder-enhanced` - API compatibility analysis
- `database-expert` - Database compatibility review

### Phase 9: Auto-Fix and Recommendations

**Agent:** `code-reviewer`
**Objective:** Generate fixes and actionable recommendations

**Tasks:**

- Apply automatic code fixes where possible
- Generate detailed fix recommendations
- Create refactoring suggestions
- Provide best practice implementations
- Generate improvement roadmap

**Parallel Execution:**

- `legacy-modernizer` - Legacy code modernization
- `refactoring-specialist` - Code refactoring recommendations

## Implementation Details

### Review Categories

#### Code Quality

- **Complexity Analysis**: Cyclomatic complexity, cognitive complexity
- **Code Smells**: Long methods, large classes, duplicate code
- **Maintainability**: Code readability, modularity, documentation
- **Style Compliance**: Formatting, naming conventions, style guides
- **Best Practices**: Language-specific best practices and idioms

#### Security Analysis

- **Injection Vulnerabilities**: SQL injection, XSS, command injection
- **Authentication/Authorization**: Weak authentication, authorization bypasses
- **Data Protection**: Sensitive data exposure, encryption issues
- **Input Validation**: Missing validation, parameter tampering
- **Cryptographic Issues**: Weak encryption, insecure random generation

#### Performance Analysis

- **Algorithm Efficiency**: Time and space complexity analysis
- **Database Performance**: Query optimization, indexing, N+1 problems
- **Memory Management**: Memory leaks, resource cleanup, garbage collection
- **Concurrency Issues**: Race conditions, deadlocks, thread safety
- **Caching Strategies**: Cache hit rates, invalidation, optimization

#### Architecture Review

- **Design Patterns**: Pattern usage, anti-patterns, architectural decisions
- **SOLID Principles**: Single responsibility, open/closed, Liskov substitution
- **Separation of Concerns**: Modularity, coupling, cohesion
- **API Design**: REST principles, versioning, documentation
- **Error Handling**: Exception handling, logging, resilience

#### Testing Analysis

- **Coverage Metrics**: Line coverage, branch coverage, path coverage
- **Test Quality**: Test effectiveness, flaky tests, test isolation
- **Test Types**: Unit tests, integration tests, end-to-end tests
- **Mocking Strategy**: Mock usage, test data management
- **Test Performance**: Test execution time, parallelization

### Severity Classification

#### Blocker

- Security vulnerabilities with immediate risk
- Breaking changes that will fail deployment
- Critical performance issues
- Compilation or runtime errors

#### Critical

- Major security vulnerabilities
- Significant performance degradation
- Architecture violations
- Major code quality issues

#### Major

- Security best practice violations
- Performance optimization opportunities
- Code quality improvements
- Documentation gaps

#### Minor

- Style and formatting issues
- Minor code quality improvements
- Documentation enhancements
- Best practice suggestions

#### Info

- Informational findings
- Optimization suggestions
- Learning opportunities
- Alternative approaches

### Auto-Fix Capabilities

#### Formatting and Style

- Code formatting and indentation
- Import statement organization
- Naming convention corrections
- Whitespace and line ending fixes
- Comment formatting improvements

#### Simple Code Improvements

- Variable renaming for clarity
- Method extraction for complexity reduction
- Simple refactoring patterns
- Dead code removal
- Unused import elimination

#### Security Fixes

- Input validation additions
- Output encoding implementations
- Basic authentication improvements
- Simple cryptographic fixes
- Secret removal and replacement

#### Performance Optimizations

- Simple algorithm improvements
- Database query optimizations
- Memory usage improvements
- Caching additions
- Resource cleanup improvements

## Integration Examples

### Comprehensive Code Review

```bash
/code-review target="feature-branch" review_type="comprehensive" severity_threshold="minor" auto_fix=true framework_rules=["react","nodejs"]
```

### Security-Focused Review

```bash
/code-review target="pull-request-123" review_type="security" severity_threshold="major" auto_fix=false
```

### Performance Review

```bash
/code-review target="src/performance-critical/" review_type="performance" severity_threshold="minor" auto_fix=true
```

## Output Documentation

The command generates comprehensive code review documentation including:

1. **Executive Summary**
2. **Detailed Findings Report**
3. **Quality Metrics Dashboard**
4. **Security Analysis Report**
5. **Performance Analysis**
6. **Architecture Review**
7. **Auto-Fix Summary**
8. **Improvement Roadmap**

## Success Criteria

- Code review completed successfully
- All findings categorized and prioritized
- Quality metrics calculated and reported
- Auto-fixes applied where appropriate
- Recommendations provided and documented
- Improvement roadmap created

## Continuous Integration

### Automated Code Review

- Integrate with CI/CD pipelines
- Set up code review gates
- Configure quality thresholds
- Implement automated fixes
- Monitor quality trends

### Quality Metrics

- Track code quality over time
- Monitor technical debt
- Measure review effectiveness
- Analyze fix patterns
- Report on improvement progress

### Team Integration

- Configure team-specific rules
- Set up custom quality standards
- Integrate with pull request workflows
- Configure notification systems
- Provide learning resources
