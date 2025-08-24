---
description: Review an implementation against its original plan. Validates that the implementation adhered to the plan specifications and identifies any deviations or improvements needed.
---

You are tasked with reviewing an implementation to ensure it adhered to the details of the original plan and identify any deviations.

## Review Process

### Step 1: Plan Analysis

1. **Read the original implementation plan**:
   - Use the Read tool WITHOUT limit/offset parameters
   - Understand the planned phases, requirements, and success criteria
   - Note the expected outcomes and constraints
   - Identify key architectural decisions and patterns

### Step 2: Implementation Analysis

1. **Examine the current implementation**:
   - Read all files that were supposed to be modified according to the plan
   - Check git history to understand what was actually implemented
   - Run `git log --oneline --since="1 day ago"` to see recent commits
   - Use `git diff` to see any uncommitted changes

2. **Create review todo list** using TodoWrite to track validation tasks

### Step 3: Systematic Validation

For each phase in the original plan:

1. **Verify phase completion**:
   - Check if all specified changes were made
   - Validate that files were modified as described
   - Ensure code follows the planned approach

2. **Test success criteria**:
   - **Automated verification**: Run all specified commands (tests, linting, building)
   - **Manual verification**: Test functionality as described in the plan
   - Document which criteria pass/fail

3. **Identify deviations**:
   - Note where implementation differs from the plan
   - Categorize deviations as:
     - **Acceptable**: Improvements or necessary adaptations
     - **Concerning**: Significant departures that may cause issues
     - **Missing**: Planned features/changes that weren't implemented

### Step 4: Quality Assessment

1. **Code quality review**:
   - Check if code follows existing patterns and conventions
   - Verify error handling is appropriate
   - Ensure performance considerations were addressed
   - Validate security best practices were followed

2. **Integration testing**:
   - Test that all phases work together correctly
   - Verify end-to-end functionality
   - Check for any regressions in existing features

### Step 5: Review Report

Generate a comprehensive review report:

```markdown
# Implementation Review: [Plan Name]

## Overview
- **Plan**: [path to original plan]
- **Review Date**: [current date]
- **Implementation Status**: [Complete/Partial/Issues]

## Phase-by-Phase Analysis

### Phase 1: [Name]
- **Status**: ✅ Complete / ⚠️ Partial / ❌ Missing
- **Planned Changes**: [what was supposed to happen]
- **Actual Implementation**: [what was actually done]
- **Deviations**: [any differences and their rationale]
- **Success Criteria**: [automated/manual verification results]

[Repeat for each phase]

## Overall Assessment

### ✅ What Went Well
- [Aspects that were implemented correctly]
- [Good decisions or improvements made]

### ⚠️ Deviations & Concerns
- [Significant departures from the plan]
- [Potential issues or risks identified]

### ❌ Missing or Incomplete
- [Features/changes that weren't implemented]
- [Success criteria that failed]

## Quality Review

### Code Quality
- **Conventions**: [follows existing patterns Y/N]
- **Error Handling**: [appropriate error handling Y/N]
- **Performance**: [performance considerations addressed Y/N]
- **Security**: [security best practices followed Y/N]

### Testing Results
- **Automated Tests**: [pass/fail status]
- **Manual Testing**: [summary of manual verification]
- **Integration**: [end-to-end functionality works Y/N]

## Recommendations

### Immediate Actions Needed
- [Critical issues that must be addressed]

### Future Improvements
- [Suggestions for enhancement]

### Process Learnings
- [Insights for improving future implementations]
```

## Important Guidelines

1. **Be objective**: Focus on facts, not opinions
2. **Be thorough**: Check every aspect mentioned in the plan
3. **Be constructive**: When identifying issues, suggest solutions
4. **Validate thoroughly**: Actually run tests and verify functionality
5. **Document everything**: Include specific file paths and line numbers

## Success Criteria for Review

The review is complete when:
- ✅ All planned phases have been analyzed
- ✅ All success criteria have been tested
- ✅ Deviations have been identified and categorized
- ✅ Quality assessment has been performed
- ✅ Comprehensive report has been generated
- ✅ Clear recommendations have been provided

The implementation plan to review: $ARGUMENTS