---
name: bug_fix
description: Systematic workflow for fixing bugs including issue creation,
  branch management, testing, and PR submission
template: >-
  # Bug Fix Workflow


  **Input**: $ARGUMENTS (bug description or issue number)


  Systematic workflow for fixing bugs with proper documentation, testing, and
  version control practices.


  ## Purpose


  Guide developers through a structured bug fix process that ensures:

  - Proper documentation of the bug

  - Reproducible test cases

  - Clean fix implementation

  - Comprehensive testing

  - Proper version control workflow

  - Traceability between issues, code, and PRs


  ## Workflow Phases


  ### Phase 1: Bug Documentation


  #### 1.1 Create or Link GitHub Issue


  **If issue doesn't exist:**


  ```bash

  # Create new issue

  gh issue create \
    --title "Bug: [Short descriptive title]" \
    --body "$(cat <<'EOF'
  ## Description

  [Detailed description of the bug]


  ## Steps to Reproduce

  1. Step 1

  2. Step 2

  3. Step 3


  ## Expected Behavior

  [What should happen]


  ## Actual Behavior

  [What actually happens]


  ## Environment

  - OS: [e.g., Ubuntu 22.04]

  - Browser: [e.g., Chrome 120]

  - Version: [e.g., 1.2.3]


  ## Additional Context

  [Screenshots, logs, error messages]


  ## Acceptance Criteria

  - [ ] Bug is fixed

  - [ ] Tests pass

  - [ ] No regressions introduced

  EOF

  )" \
    --label "bug" \
    --assignee @me
  ```


  **If issue exists:**


  ```bash

  # Reference existing issue

  ISSUE_NUMBER=$1  # From arguments

  echo "Working on issue #$ISSUE_NUMBER"

  ```


  #### 1.2 Understand the Bug


  Review:

  - Issue description and reproduction steps

  - Related code areas

  - Recent changes that might have introduced the bug

  - Existing tests and their coverage


  ```bash

  # Check recent changes to affected files

  git log -p --follow path/to/affected/file.ts


  # Search for related issues

  gh issue list --label bug --search "keyword"

  ```


  ### Phase 2: Branch Management


  #### 2.1 Create Bug Fix Branch


  ```bash

  # Update main branch

  git checkout main

  git pull origin main


  # Create bug fix branch

  git checkout -b fix/issue-${ISSUE_NUMBER}-short-description


  # Example: fix/issue-123-login-error

  ```


  Branch naming conventions:

  - `fix/issue-<number>-<short-desc>` for bugs with issues

  - `fix/<short-desc>` for quick fixes without issues

  - `hotfix/<short-desc>` for critical production bugs


  #### 2.2 Verify Starting State


  ```bash

  # Ensure tests pass before changes

  npm test


  # Check for any uncommitted changes

  git status

  ```


  ### Phase 3: Reproduce the Bug


  #### 3.1 Create Reproduction Test


  Write a failing test that reproduces the bug:


  ```typescript

  // Example: tests/bug-reproduction.test.ts

  describe('Bug #123: Login error on special characters', () => {
    it('should handle usernames with special characters', () => {
      // This test should FAIL before the fix
      const username = 'user+test@example.com';
      const result = validateUsername(username);
      expect(result.isValid).toBe(true);
    });
  });

  ```


  ```bash

  # Run the reproduction test (should fail)

  npm test -- bug-reproduction.test.ts

  ```


  If unable to reproduce:

  1. Request clarification on issue

  2. Update issue with findings

  3. Add "needs-reproduction" label


  ### Phase 4: Implement Fix


  #### 4.1 Identify Root Cause


  Analyze the code to find:

  - Where the bug originates

  - Why the bug occurs

  - Scope of impact


  Use debugging tools:

  ```bash

  # Add debugging breakpoints

  # Use console.log or debugger statements

  # Run with debugger: node --inspect

  ```


  #### 4.2 Implement Minimal Fix


  Principles:

  - **Minimal changes**: Fix only what's necessary

  - **No refactoring**: Save refactoring for separate PRs

  - **Maintain style**: Follow existing code patterns

  - **Add comments**: Explain non-obvious fixes


  Example fix:

  ```typescript

  // Before (buggy code)

  function validateUsername(username: string): ValidationResult {
    // Bug: Doesn't handle special characters in email format
    return /^[a-zA-Z0-9]+$/.test(username);
  }


  // After (fixed)

  function validateUsername(username: string): ValidationResult {
    // Fixed: Allow email format with special characters (+, @, .)
    // Addresses issue #123
    return /^[a-zA-Z0-9+@.]+$/.test(username);
  }

  ```


  ### Phase 5: Testing


  #### 5.1 Verify Reproduction Test Passes


  ```bash

  # The previously failing test should now pass

  npm test -- bug-reproduction.test.ts

  ```


  #### 5.2 Run Full Test Suite


  ```bash

  # Run all tests to check for regressions

  npm test


  # Run specific test suites related to the fix

  npm test -- path/to/related-tests/

  ```


  #### 5.3 Add Additional Tests


  Add tests for:

  - Edge cases around the fix

  - Different variations of the bug

  - Regression prevention


  ```typescript

  describe('Username validation fixes', () => {
    it('should handle email addresses', () => {
      expect(validateUsername('user@example.com').isValid).toBe(true);
    });

    it('should handle plus addressing', () => {
      expect(validateUsername('user+tag@example.com').isValid).toBe(true);
    });

    it('should reject invalid characters', () => {
      expect(validateUsername('user<>@example.com').isValid).toBe(false);
    });
  });

  ```


  #### 5.4 Manual Testing


  If applicable:

  1. Test in development environment

  2. Verify fix in browser/application

  3. Test with various inputs

  4. Confirm no visual regressions


  ### Phase 6: Code Quality


  #### 6.1 Self-Review


  Review your changes:

  ```bash

  # View your changes

  git diff main


  # Review each file

  git diff main path/to/file.ts

  ```


  Checklist:

  - [ ] Fix is minimal and focused

  - [ ] No unrelated changes

  - [ ] No commented-out code

  - [ ] No debug statements left

  - [ ] Code follows project style

  - [ ] Comments explain "why" not "what"


  #### 6.2 Lint and Format


  ```bash

  # Run linter

  npm run lint


  # Auto-fix linting issues

  npm run lint:fix


  # Format code

  npm run format

  ```


  ### Phase 7: Commit Changes


  #### 7.1 Stage Changes


  ```bash

  # Stage only the fix-related files

  git add path/to/fixed/file.ts

  git add path/to/test/file.test.ts


  # Review staged changes

  git diff --staged

  ```


  #### 7.2 Create Descriptive Commit


  ```bash

  git commit -m "fix: resolve username validation for special characters


  - Allow email format usernames with special characters (+, @, .)

  - Add comprehensive tests for email validation

  - Fix regex pattern to match email standard


  Fixes #123"

  ```


  Commit message format:

  ```

  fix: <short summary>


  <detailed explanation>


  Fixes #<issue-number>

  ```


  ### Phase 8: Push and Create PR


  #### 8.1 Push Branch


  ```bash

  # Push to remote

  git push -u origin fix/issue-${ISSUE_NUMBER}-short-description


  # Or if branch already exists

  git push

  ```


  #### 8.2 Create Pull Request


  ```bash

  gh pr create \
    --title "Fix: Username validation for special characters" \
    --body "$(cat <<'EOF'
  ## Description

  Fixes username validation to properly handle email addresses with special
  characters.


  ## Changes

  - Updated regex pattern in `validateUsername()` to allow +, @, . characters

  - Added comprehensive test suite for email validation

  - Added edge case tests for invalid characters


  ## Related Issue

  Fixes #123


  ## Testing

  - [x] All existing tests pass

  - [x] New tests added and passing

  - [x] Manual testing completed

  - [x] No regressions detected


  ## Screenshots

  [If applicable]


  ## Checklist

  - [x] Code follows project style guidelines

  - [x] Tests added for the bug fix

  - [x] Documentation updated (if needed)

  - [x] Commit message follows conventional format

  - [x] Issue linked to PR

  EOF

  )" \
    --label "bug,fix" \
    --assignee @me
  ```


  #### 8.3 Link Issue to PR


  The `Fixes #123` in PR body automatically links and closes issue when PR
  merges.


  Alternatively:

  ```bash

  # Link manually

  gh pr edit --add-project "Project Name"

  ```


  ### Phase 9: Code Review


  #### 9.1 Request Review


  ```bash

  # Request review from team members

  gh pr edit --add-reviewer username1,username2


  # Or add specific reviewers

  gh pr edit --add-reviewer @team-name

  ```


  #### 9.2 Address Feedback


  When reviewers request changes:


  ```bash

  # Make requested changes

  # Stage and commit

  git add .

  git commit -m "fix: address code review feedback"


  # Push changes

  git push

  ```


  #### 9.3 Merge PR


  After approval:


  ```bash

  # Merge via GitHub CLI

  gh pr merge --squash --delete-branch


  # Or merge via UI with appropriate merge strategy:

  # - Squash for small bug fixes

  # - Merge commit for larger fixes with history

  # - Rebase for linear history

  ```


  ## Best Practices


  ### Bug Fix Principles


  1. **Reproduce First**: Always reproduce the bug before fixing

  2. **Test-Driven**: Write failing test, then fix

  3. **Minimal Changes**: Fix only what's needed

  4. **Document Well**: Explain the fix in code and PR

  5. **Prevent Regression**: Add tests to prevent recurrence


  ### Testing Guidelines


  1. **Test the Fix**: Ensure bug is actually fixed

  2. **Test Regressions**: Ensure no new bugs introduced

  3. **Test Edge Cases**: Cover boundary conditions

  4. **Test Related Features**: Verify connected functionality


  ### Git Workflow


  1. **Small Branches**: One bug per branch

  2. **Descriptive Names**: Clear branch and commit names

  3. **Clean History**: Squash if needed

  4. **Link Issues**: Always reference issue numbers


  ### Code Review


  1. **Self-Review First**: Review your own code before submitting

  2. **Clear PR Description**: Explain the fix and testing

  3. **Respond Promptly**: Address feedback quickly

  4. **Be Open**: Accept constructive criticism


  ## Common Bug Fix Patterns


  ### Null/Undefined Checks


  ```typescript

  // Before

  function processUser(user) {
    return user.name.toUpperCase();
  }


  // After

  function processUser(user) {
    return user?.name?.toUpperCase() ?? 'Unknown';
  }

  ```


  ### Race Condition Fixes


  ```typescript

  // Before

  async function loadData() {
    const data = await fetchData();
    setState(data);  // May be stale if component unmounted
  }


  // After

  async function loadData() {
    let isCancelled = false;
    const data = await fetchData();
    if (!isCancelled) setState(data);
    return () => { isCancelled = true; };
  }

  ```


  ### Off-by-One Errors


  ```typescript

  // Before (excludes last item)

  for (let i = 0; i < arr.length - 1; i++) {
    process(arr[i]);
  }


  // After (includes all items)

  for (let i = 0; i < arr.length; i++) {
    process(arr[i]);
  }

  ```


  ## Output


  This command will:


  1. ✅ Create or link GitHub issue

  2. ✅ Create properly named bug fix branch

  3. ✅ Guide through reproduction and fix

  4. ✅ Ensure comprehensive testing

  5. ✅ Create descriptive commit

  6. ✅ Push changes to remote

  7. ✅ Create and link pull request

  8. ✅ Track through to merge


  ## Notes


  - Always reproduce bug before fixing

  - Write tests first (TDD approach)

  - Keep fixes minimal and focused

  - Link issues to PRs for traceability

  - Request review before merging

  - Delete branch after merge
---

# Bug Fix Workflow

**Input**: $ARGUMENTS (bug description or issue number)

Systematic workflow for fixing bugs with proper documentation, testing, and version control practices.

## Purpose

Guide developers through a structured bug fix process that ensures:
- Proper documentation of the bug
- Reproducible test cases
- Clean fix implementation
- Comprehensive testing
- Proper version control workflow
- Traceability between issues, code, and PRs

## Workflow Phases

### Phase 1: Bug Documentation

#### 1.1 Create or Link GitHub Issue

**If issue doesn't exist:**

```bash
# Create new issue
gh issue create \
  --title "Bug: [Short descriptive title]" \
  --body "$(cat <<'EOF'
## Description
[Detailed description of the bug]

## Steps to Reproduce
1. Step 1
2. Step 2
3. Step 3

## Expected Behavior
[What should happen]

## Actual Behavior
[What actually happens]

## Environment
- OS: [e.g., Ubuntu 22.04]
- Browser: [e.g., Chrome 120]
- Version: [e.g., 1.2.3]

## Additional Context
[Screenshots, logs, error messages]

## Acceptance Criteria
- [ ] Bug is fixed
- [ ] Tests pass
- [ ] No regressions introduced
EOF
)" \
  --label "bug" \
  --assignee @me
```

**If issue exists:**

```bash
# Reference existing issue
ISSUE_NUMBER=$1  # From arguments
echo "Working on issue #$ISSUE_NUMBER"
```

#### 1.2 Understand the Bug

Review:
- Issue description and reproduction steps
- Related code areas
- Recent changes that might have introduced the bug
- Existing tests and their coverage

```bash
# Check recent changes to affected files
git log -p --follow path/to/affected/file.ts

# Search for related issues
gh issue list --label bug --search "keyword"
```

### Phase 2: Branch Management

#### 2.1 Create Bug Fix Branch

```bash
# Update main branch
git checkout main
git pull origin main

# Create bug fix branch
git checkout -b fix/issue-${ISSUE_NUMBER}-short-description

# Example: fix/issue-123-login-error
```

Branch naming conventions:
- `fix/issue-<number>-<short-desc>` for bugs with issues
- `fix/<short-desc>` for quick fixes without issues
- `hotfix/<short-desc>` for critical production bugs

#### 2.2 Verify Starting State

```bash
# Ensure tests pass before changes
npm test

# Check for any uncommitted changes
git status
```

### Phase 3: Reproduce the Bug

#### 3.1 Create Reproduction Test

Write a failing test that reproduces the bug:

```typescript
// Example: tests/bug-reproduction.test.ts
describe('Bug #123: Login error on special characters', () => {
  it('should handle usernames with special characters', () => {
    // This test should FAIL before the fix
    const username = 'user+test@example.com';
    const result = validateUsername(username);
    expect(result.isValid).toBe(true);
  });
});
```

```bash
# Run the reproduction test (should fail)
npm test -- bug-reproduction.test.ts
```

If unable to reproduce:
1. Request clarification on issue
2. Update issue with findings
3. Add "needs-reproduction" label

### Phase 4: Implement Fix

#### 4.1 Identify Root Cause

Analyze the code to find:
- Where the bug originates
- Why the bug occurs
- Scope of impact

Use debugging tools:
```bash
# Add debugging breakpoints
# Use console.log or debugger statements
# Run with debugger: node --inspect
```

#### 4.2 Implement Minimal Fix

Principles:
- **Minimal changes**: Fix only what's necessary
- **No refactoring**: Save refactoring for separate PRs
- **Maintain style**: Follow existing code patterns
- **Add comments**: Explain non-obvious fixes

Example fix:
```typescript
// Before (buggy code)
function validateUsername(username: string): ValidationResult {
  // Bug: Doesn't handle special characters in email format
  return /^[a-zA-Z0-9]+$/.test(username);
}

// After (fixed)
function validateUsername(username: string): ValidationResult {
  // Fixed: Allow email format with special characters (+, @, .)
  // Addresses issue #123
  return /^[a-zA-Z0-9+@.]+$/.test(username);
}
```

### Phase 5: Testing

#### 5.1 Verify Reproduction Test Passes

```bash
# The previously failing test should now pass
npm test -- bug-reproduction.test.ts
```

#### 5.2 Run Full Test Suite

```bash
# Run all tests to check for regressions
npm test

# Run specific test suites related to the fix
npm test -- path/to/related-tests/
```

#### 5.3 Add Additional Tests

Add tests for:
- Edge cases around the fix
- Different variations of the bug
- Regression prevention

```typescript
describe('Username validation fixes', () => {
  it('should handle email addresses', () => {
    expect(validateUsername('user@example.com').isValid).toBe(true);
  });

  it('should handle plus addressing', () => {
    expect(validateUsername('user+tag@example.com').isValid).toBe(true);
  });

  it('should reject invalid characters', () => {
    expect(validateUsername('user<>@example.com').isValid).toBe(false);
  });
});
```

#### 5.4 Manual Testing

If applicable:
1. Test in development environment
2. Verify fix in browser/application
3. Test with various inputs
4. Confirm no visual regressions

### Phase 6: Code Quality

#### 6.1 Self-Review

Review your changes:
```bash
# View your changes
git diff main

# Review each file
git diff main path/to/file.ts
```

Checklist:
- [ ] Fix is minimal and focused
- [ ] No unrelated changes
- [ ] No commented-out code
- [ ] No debug statements left
- [ ] Code follows project style
- [ ] Comments explain "why" not "what"

#### 6.2 Lint and Format

```bash
# Run linter
npm run lint

# Auto-fix linting issues
npm run lint:fix

# Format code
npm run format
```

### Phase 7: Commit Changes

#### 7.1 Stage Changes

```bash
# Stage only the fix-related files
git add path/to/fixed/file.ts
git add path/to/test/file.test.ts

# Review staged changes
git diff --staged
```

#### 7.2 Create Descriptive Commit

```bash
git commit -m "fix: resolve username validation for special characters

- Allow email format usernames with special characters (+, @, .)
- Add comprehensive tests for email validation
- Fix regex pattern to match email standard

Fixes #123"
```

Commit message format:
```
fix: <short summary>

<detailed explanation>

Fixes #<issue-number>
```

### Phase 8: Push and Create PR

#### 8.1 Push Branch

```bash
# Push to remote
git push -u origin fix/issue-${ISSUE_NUMBER}-short-description

# Or if branch already exists
git push
```

#### 8.2 Create Pull Request

```bash
gh pr create \
  --title "Fix: Username validation for special characters" \
  --body "$(cat <<'EOF'
## Description
Fixes username validation to properly handle email addresses with special characters.

## Changes
- Updated regex pattern in `validateUsername()` to allow +, @, . characters
- Added comprehensive test suite for email validation
- Added edge case tests for invalid characters

## Related Issue
Fixes #123

## Testing
- [x] All existing tests pass
- [x] New tests added and passing
- [x] Manual testing completed
- [x] No regressions detected

## Screenshots
[If applicable]

## Checklist
- [x] Code follows project style guidelines
- [x] Tests added for the bug fix
- [x] Documentation updated (if needed)
- [x] Commit message follows conventional format
- [x] Issue linked to PR
EOF
)" \
  --label "bug,fix" \
  --assignee @me
```

#### 8.3 Link Issue to PR

The `Fixes #123` in PR body automatically links and closes issue when PR merges.

Alternatively:
```bash
# Link manually
gh pr edit --add-project "Project Name"
```

### Phase 9: Code Review

#### 9.1 Request Review

```bash
# Request review from team members
gh pr edit --add-reviewer username1,username2

# Or add specific reviewers
gh pr edit --add-reviewer @team-name
```

#### 9.2 Address Feedback

When reviewers request changes:

```bash
# Make requested changes
# Stage and commit
git add .
git commit -m "fix: address code review feedback"

# Push changes
git push
```

#### 9.3 Merge PR

After approval:

```bash
# Merge via GitHub CLI
gh pr merge --squash --delete-branch

# Or merge via UI with appropriate merge strategy:
# - Squash for small bug fixes
# - Merge commit for larger fixes with history
# - Rebase for linear history
```

## Best Practices

### Bug Fix Principles

1. **Reproduce First**: Always reproduce the bug before fixing
2. **Test-Driven**: Write failing test, then fix
3. **Minimal Changes**: Fix only what's needed
4. **Document Well**: Explain the fix in code and PR
5. **Prevent Regression**: Add tests to prevent recurrence

### Testing Guidelines

1. **Test the Fix**: Ensure bug is actually fixed
2. **Test Regressions**: Ensure no new bugs introduced
3. **Test Edge Cases**: Cover boundary conditions
4. **Test Related Features**: Verify connected functionality

### Git Workflow

1. **Small Branches**: One bug per branch
2. **Descriptive Names**: Clear branch and commit names
3. **Clean History**: Squash if needed
4. **Link Issues**: Always reference issue numbers

### Code Review

1. **Self-Review First**: Review your own code before submitting
2. **Clear PR Description**: Explain the fix and testing
3. **Respond Promptly**: Address feedback quickly
4. **Be Open**: Accept constructive criticism

## Common Bug Fix Patterns

### Null/Undefined Checks

```typescript
// Before
function processUser(user) {
  return user.name.toUpperCase();
}

// After
function processUser(user) {
  return user?.name?.toUpperCase() ?? 'Unknown';
}
```

### Race Condition Fixes

```typescript
// Before
async function loadData() {
  const data = await fetchData();
  setState(data);  // May be stale if component unmounted
}

// After
async function loadData() {
  let isCancelled = false;
  const data = await fetchData();
  if (!isCancelled) setState(data);
  return () => { isCancelled = true; };
}
```

### Off-by-One Errors

```typescript
// Before (excludes last item)
for (let i = 0; i < arr.length - 1; i++) {
  process(arr[i]);
}

// After (includes all items)
for (let i = 0; i < arr.length; i++) {
  process(arr[i]);
}
```

## Output

This command will:

1. ✅ Create or link GitHub issue
2. ✅ Create properly named bug fix branch
3. ✅ Guide through reproduction and fix
4. ✅ Ensure comprehensive testing
5. ✅ Create descriptive commit
6. ✅ Push changes to remote
7. ✅ Create and link pull request
8. ✅ Track through to merge

## Notes

- Always reproduce bug before fixing
- Write tests first (TDD approach)
- Keep fixes minimal and focused
- Link issues to PRs for traceability
- Request review before merging
- Delete branch after merge
