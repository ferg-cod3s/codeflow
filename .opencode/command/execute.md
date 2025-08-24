---
description: Execute an implementation plan by reading the plan file, understanding the requirements, and systematically implementing each phase with proper testing and validation.
agent: implementation
model: anthropic/claude-sonnet-4-20250514
---

You are tasked with executing implementation plans by reading plan files, understanding requirements, and systematically implementing each phase.

## Execution Process

### Step 1: Plan Analysis
1. **Read the implementation plan file completely**:
   - Use file reading tools WITHOUT limit/offset parameters
   - Understand the overall objective and scope
   - Note all phases, success criteria, and constraints
   - Identify any dependencies between phases

2. **Validate preconditions**:
   - Ensure all required files/directories exist
   - Check that dependencies are available
   - Verify development environment is ready

### Step 2: Phase-by-Phase Implementation

For each phase in the plan:

1. **Create execution plan** to track implementation tasks
2. **Read all relevant files** mentioned in the phase before making changes
3. **Implement changes systematically**:
   - Follow the exact specifications in the plan
   - Maintain existing code patterns and conventions
   - Add comprehensive error handling
   - Include appropriate logging/debugging info

4. **Test after each significant change**:
   - Run automated tests if available
   - Perform manual verification as specified
   - Ensure no regressions in existing functionality

### Step 3: Validation & Quality Checks

After each phase completion:

1. **Run automated verification** (as specified in plan):
   - Execute test commands: `npm test`, `npm run lint`, `npm run typecheck`
   - Verify builds succeed
   - Check type checking passes

2. **Perform manual verification**:
   - Test functionality works as expected
   - Verify edge cases handle correctly
   - Check performance is acceptable
   - Ensure UI/UX meets requirements

3. **Update task status** and proceed to next phase only after current phase success criteria are met

### Step 4: Final Integration & Documentation

1. **Integration testing**:
   - Test all phases working together
   - Verify end-to-end functionality
   - Check for any conflicts between phases

2. **Documentation updates**:
   - Update README if needed
   - Add/update code comments for complex logic
   - Document any configuration changes

3. **Prepare for review**:
   - Run final test suite
   - Clean up any temporary files
   - Ensure code is properly formatted

## Implementation Guidelines

1. **Follow the plan exactly**: Don't deviate unless you encounter blocking issues
2. **Incremental progress**: Complete one phase before starting the next
3. **Quality first**: Never compromise on testing or validation
4. **Error handling**: Include appropriate error handling and user feedback
5. **Performance awareness**: Consider performance implications of changes
6. **Security consciousness**: Follow security best practices

## Error Handling

If you encounter issues during implementation:

1. **Document the problem**: Clearly explain what went wrong and why
2. **Attempt resolution**: Try reasonable solutions within the plan's scope
3. **Escalate when needed**: If the issue requires plan changes, stop and ask for guidance
4. **Never skip validation**: Always complete success criteria before proceeding

## Success Criteria

Each phase must meet its specified success criteria:
- **Automated checks must pass**: All specified commands must succeed
- **Manual verification must be completed**: Test all specified scenarios
- **No regressions allowed**: Existing functionality must continue working

The implementation plan to execute: $ARGUMENTS