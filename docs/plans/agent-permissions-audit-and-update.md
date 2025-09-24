# Agent Permissions Audit and Update Implementation Plan

## Overview

Implement proper permissions for all subagents in both OpenCode and Claude Code
by auditing current agent configurations, defining role-based permission
templates, and updating all agent frontmatter to ensure security-first,
least-privilege access patterns.

## Current State Analysis

### What Exists Now
- **OpenCode agents:** 29 markdown files in `.opencode/agent/` with potential
permission blocks in frontmatter
- **Claude Code agents:** 29+ markdown files in `.claude/agents/` and `~/.
claude/agents/` with potential tools blocks in frontmatter
- **Parsing logic:** Robust system in `src/conversion/agent-parser.ts` and
`src/security/opencode-permissions.ts` for reading and applying permissions
- **Documentation:** Best practices documented in
`docs/opencode-permissions-setup.md` and
`thoughts/plans/opencode-file-editing-compatibility-fix.md`

### What's Missing
- Consistent permission/tool settings across all agents
- Role-based permission templates
- Automated validation of permission configurations
- Security audit of current agent access levels

### Key Constraints Discovered
- Permission parsing logic already exists but may not be consistently applied
- Agent files may have outdated or missing permission blocks
- Need to maintain backward compatibility while enforcing security

## Desired End State

All subagents have properly configured permissions/tools that:
- Follow the principle of least privilege
- Are consistent across OpenCode and Claude Code formats
- Include read-only access for reviewer agents (Read, Grep, Glob, Webfetch)
- Restrict dangerous tools (Edit, Bash) to appropriate agent types
- Are validated through automated tests

### Key Discoveries:
- `src/security/opencode-permissions.ts:106-145` - Logic for updating agent
frontmatter with permissions
- `src/conversion/agent-parser.ts:126-222` - Frontmatter parsing including
permission/tools blocks
- `thoughts/plans/opencode-file-editing-compatibility-fix.md` - Historical
context on permission issues
- `.opencode/agent/code-reviewer.md` - Example agent that may need permission
updates

## What We're NOT Doing

- Changing the core permission parsing logic (already implemented)
- Modifying agent functionality beyond permission restrictions
- Creating new agent types or roles
- Breaking existing agent workflows

## Implementation Approach

Phase-by-phase approach starting with audit, then template creation, then
systematic updates with validation at each step.

## Phase 1: Audit Current State

### Overview
Analyze all existing agent files to understand current permission/tool
configurations and identify gaps.

### Changes Required:

#### 1. Analyze OpenCode Agents
**File**: `.opencode/agent/*.md` (29 files)
**Changes**: Read frontmatter of each agent file to check for:
- Presence of `permission:` block
- Correct permission values (edit, bash, webfetch)
- Mode setting (primary/subagent)
- Allowed directories configuration

#### 2. Analyze Claude Code Agents
**File**: `.claude/agents/**/*.md` and `~/.claude/agents/*.md` (29+ files)
**Changes**: Read frontmatter of each agent file to check for:
- Presence of `tools:` block
- Correct tool listings
- Name and description fields

### Success Criteria:

#### Automated Verification:
- [x] All agent files can be parsed without errors: `node -e "require('.
/src/conversion/agent-parser').parseFrontmatter(require('fs').readFileSync('.
opencode/agent/code-reviewer.md', 'utf8'))"`
- [x] Permission parsing tests pass: `bun test tests/conversion/agent-formats.
test.ts`

#### Manual Verification:
- [x] All 29 OpenCode agents have been reviewed for permission blocks
- [x] All 29+ Claude Code agents have been reviewed for tools blocks
- [x] Gap analysis document created identifying which agents need updates

---

## Phase 2: Define Permission Templates

### Overview
Create standardized permission/tool templates for different agent roles based on
their intended functionality.

### Changes Required:

#### 1. Create Permission Template File
**File**: `src/security/agent-permission-templates.ts` (new)
**Changes**: Define templates for different agent types:

```typescript
export const AGENT_PERMISSION_TEMPLATES = {
  reviewer: {
    opencode: {
      edit: 'deny',
      bash: 'deny',
      webfetch: 'allow'
    },
    claude: ['Read', 'Grep', 'Glob', 'Webfetch']
  },
  builder: {
    opencode: {
      edit: 'allow',
      bash: 'ask',
      webfetch: 'allow'
    },
    claude: ['Read', 'Edit', 'Bash', 'Webfetch']
  },
  analyzer: {
    opencode: {
      edit: 'deny',
      bash: 'deny',
      webfetch: 'allow'
    },
    claude: ['Read', 'Grep', 'Glob', 'Webfetch']
  }
};
```

### Success Criteria:

#### Automated Verification:
- [x] Template file compiles without errors: `bun run typecheck`
- [x] Template exports are properly typed and accessible

#### Manual Verification:
- [x] Templates cover all major agent types (reviewer, builder, analyzer, etc.)
- [x] Templates align with security best practices
- [x] Templates are consistent between OpenCode and Claude Code formats

---

## Phase 3: Update OpenCode Agents

### Overview
Apply correct permissions to all OpenCode agent frontmatter using the defined
templates.

### Changes Required:

#### 1. Update Agent Frontmatter
**File**: `.opencode/agent/*.md` (29 files)
**Changes**: For each agent file, update or add permission block:

```yaml
---
description: [Agent description]
mode: subagent
permission:
  edit: deny
  bash: deny
  webfetch: allow
---
```

#### 2. Update Permission Application Script
**File**: `src/security/opencode-permissions.ts`
**Changes**: Enhance `updateOpenCodeAgentPermissions()` to use role-based templates:

```typescript
// Add logic to determine agent role from filename or description
const agentRole = determineAgentRole(agentPath);
// Apply appropriate template
const permissions = AGENT_PERMISSION_TEMPLATES[agentRole].opencode;
```

### Success Criteria:

#### Automated Verification:
- [x] Permission update script runs without errors: `node src/security/opencode-permissions.ts`
- [x] All OpenCode agents have valid permission blocks: `grep -l "permission:" .opencode/agent/*.md | wc -l` returns 29

#### Manual Verification:
- [x] Sample agents (code-reviewer, full-stack-developer) have correct permissions
- [x] No agents have overly permissive settings
- [x] Permission blocks follow consistent format

---

## Phase 4: Update Claude Code Agents

### Overview
Apply correct tools to all Claude Code agent frontmatter using the defined
templates.

### Changes Required:

#### 1. Update Agent Frontmatter
**File**: `.claude/agents/**/*.md` and `~/.claude/agents/*.md` (29+ files)
**Changes**: For each agent file, update or add tools block:

```yaml
---
name: code-reviewer
description: [Agent description]
tools: Read, Grep, Glob, Webfetch
---
```

#### 2. Create Tools Update Script
**File**: `scripts/update-claude-agent-tools.js` (new)
**Changes**: Script to batch update Claude Code agent tools:

```javascript
const fs = require('fs');
const path = require('path');

// Read all agent files
// Parse frontmatter
// Update tools based on role
// Write back to files
```

### Success Criteria:

#### Automated Verification:
- [x] Tools update script runs without errors: `node scripts/update-claude-agent-tools.js`
- [x] All Claude Code agents have valid tools blocks: `grep -l "tools:" .claude/agents/**/*.md ~/.claude/agents/*.md | wc -l` returns 29+

#### Manual Verification:
- [x] Sample agents have appropriate tool restrictions
- [x] No agents have dangerous tools (Edit, Bash) without justification
- [x] Tools blocks are comma-separated and properly formatted

---

## Phase 5: Verify and Test

### Overview
Ensure all changes work correctly and agents have proper permissions.

### Changes Required:

#### 1. Add Permission Validation Tests
**File**: `tests/integration/agent-permissions.test.ts` (new)
**Changes**: Tests to validate:

```typescript
describe('Agent Permissions', () => {
  test('reviewer agents have read-only permissions', () => {
    // Test OpenCode reviewer permissions
    // Test Claude Code reviewer tools
  });

  test('builder agents have appropriate permissions', () => {
    // Test builder permissions/tools
  });
});
```

#### 2. Update Existing Tests
**File**: `tests/conversion/agent-formats.test.ts`
**Changes**: Add tests for permission/tool parsing with updated agents.

### Success Criteria:

#### Automated Verification:
- [x] New permission tests pass: `bun test tests/integration/agent-permissions.test.ts`
- [x] Existing agent format tests pass: `bun test tests/conversion/agent-formats.test.ts`
- [x] Permission parsing works: `node -e "require('./src/conversion/agent-parser').parseFrontmatter(require('fs').readFileSync('.opencode/agent/code-reviewer.md', 'utf8'))"`

#### Manual Verification:
- [x] Test agents in both platforms with their new permissions
- [x] Verify reviewer agents cannot edit files or run bash
- [x] Verify builder agents can perform their intended functions
- [x] No permission-related errors in agent execution

## Testing Strategy

### Unit Tests:
• Test permission template application logic
• Test frontmatter parsing with various permission formats
• Test role determination from agent filenames/descriptions

### Integration Tests:
• Test end-to-end permission application during agent setup
• Test permission inheritance and overrides
• Test cross-platform permission consistency

### Manual Testing Steps:
1. Load a reviewer agent and attempt to edit a file (should fail)
2. Load a reviewer agent and attempt to run bash (should fail)
3. Load a reviewer agent and attempt to fetch web content (should succeed)
4. Load a builder agent and verify it can edit files and run commands appropriately
5. Test permission parsing with malformed frontmatter

## Performance Considerations

• Permission updates are done at setup/sync time, not runtime
• Frontmatter parsing is lightweight and cached
• No impact on agent execution performance

## Migration Notes

• Existing agents will be updated automatically during next setup/sync
• No breaking changes to agent functionality (only permission restrictions)
• Backward compatibility maintained for agents with existing permission blocks

## References

• Original research: thoughts/research/YYYY-MM-DD_topic.md
• Permission logic: src/security/opencode-permissions.ts:106-145
• Frontmatter parsing: src/conversion/agent-parser.ts:126-222
• Historical context: thoughts/plans/opencode-file-editing-compatibility-fix.md
• Documentation: docs/opencode-permissions-setup.md