---
description: Create a commit from current changes. Analyzes staged and unstaged changes, drafts an appropriate commit message, and creates a commit following repository conventions.
agent: git
model: github-copilot/gpt-5
---

You are tasked with creating a git commit from the current changes in the repository.

## Commit Process

### Step 1: Analyze Current State

1. **Run git commands in parallel** to understand the current state:
   - Run `!git status` to see all untracked files
   - Run `!git diff` to see unstaged changes  
   - Run `!git diff --staged` to see already staged changes
   - Run `!git log --oneline -10` to see recent commit messages for style reference

### Step 2: Draft Commit Message

1. **Analyze all changes** (both staged and unstaged):
   - Identify the nature of changes (new feature, enhancement, bug fix, refactoring, docs, etc.)
   - Determine the primary purpose and impact
   - Check for any sensitive information that shouldn't be committed
   - Ensure changes are coherent and belong together

2. **Draft commit message** following repository conventions:
   - Use imperative mood ("Add" not "Added" or "Adding")
   - Be concise but descriptive (50-72 characters for subject)
   - Focus on the "why" rather than just the "what"
   - Follow any existing patterns from recent commits
   - Accurately reflect the changes and their purpose

### Step 3: Stage and Commit

1. **Stage relevant changes**:
   - Add untracked files that should be included
   - Stage modified files that are part of the commit
   - Be selective - only include changes related to the commit purpose

2. **Create the commit** with the message ending with:
   ```
   🤖 Generated with [OpenCode](https://opencode.ai)
   
   Co-Authored-By: OpenCode <noreply@opencode.ai>
   ```

3. **Verify commit success**:
   - Run `!git status` to confirm the commit was created
   - Show the commit hash and summary

### Step 4: Handle Pre-commit Hooks

If the commit fails due to pre-commit hook changes:
1. **Retry the commit ONCE** to include automated changes
2. **If it fails again**, report the issue - usually means a pre-commit hook is preventing the commit
3. **If commit succeeds but files were modified**, amend the commit to include the changes

## Important Guidelines

1. **Never update git config** - work with existing configuration
2. **Never push** unless explicitly requested by the user
3. **Never use interactive git commands** (like `git rebase -i` or `git add -i`)
4. **Don't create empty commits** - only commit when there are actual changes
5. **Use proper shell commands** with `!` prefix for git operations

## Commit Message Guidelines

**Good commit messages:**
- "Add user authentication middleware"
- "Fix memory leak in WebSocket connections"
- "Update API documentation for v2 endpoints"
- "Refactor database connection pooling"

**Avoid:**
- Vague messages like "Fix bugs" or "Update files"
- Too much technical detail in the subject line
- Present tense like "Adding" or "Fixes"

## Error Handling

If issues occur:
1. **Check for merge conflicts** - resolve if needed
2. **Verify file permissions** - ensure all files are accessible
3. **Check disk space** - ensure sufficient space for the commit
4. **Report specific error messages** to help with troubleshooting

Begin by analyzing the current repository state and determining what changes need to be committed.