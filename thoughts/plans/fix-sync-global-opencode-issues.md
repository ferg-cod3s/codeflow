# Fix sync-global OpenCode Issues Implementation Plan

## Overview

Fix the sync-global command to properly handle your current agent directory structure and OpenCode format validation, ensuring OpenCode agents sync correctly without errors.

## Current State Analysis

The sync-global command exists and is well-implemented, but has misaligned expectations:

### Key Discoveries:
- **sync-global command exists**: `src/cli/sync.ts:70-230` fully implements sync functionality
- **Directory mismatch**: Sync expects `codeflow-agents/` but you also have agents in `/agent/`
- **Format validation works**: `src/conversion/validator.ts:208-255` properly validates OpenCode format
- **Architecture is sound**: Single source of truth approach with format conversion is implemented

### Current Directory Structure:
- `/agent/` - Contains your working agents (mixed formats)  
- `/codeflow-agents/` - Expected source directory for sync-global
- `/claude-agents/` - Target directory for Claude Code format
- Global directories exist but may not match your agent formats

### Validation Requirements:
- **OpenCode validation**: Requires `name`, `description`, `mode` fields
- **Your OpenCode agents**: Use `name`, `description`, `role`, `model`, `temperature`, `tools`, `tags`
- **Format detection**: Works correctly but validation fails due to field mismatch

## Desired End State

sync-global successfully syncs all your agents without validation errors:
- Agents from `/agent/` directory are included in sync process
- OpenCode agents pass validation with your custom format
- Global directories receive properly formatted agents
- OpenCode platform can load and execute all agents

### Verification Criteria:
- `codeflow sync-global` completes without validation errors
- OpenCode agents are copied to global directories
- OpenCode platform loads agents successfully
- No breaking changes to existing Claude Code agents

## What We're NOT Doing

- Changing your agent directory structure (`/agent/` stays as is)
- Converting to official OpenCode.ai format (keeping your custom format)
- Modifying Claude Code format validation (works fine)
- Restructuring the sync-global architecture (it's well designed)

## Implementation Approach

**Two-phase approach**: Update validation to accept your format, then ensure all agent sources are included in sync.

## Phase 1: Update OpenCode Format Validation

### Overview
Modify OpenCode validation to accept your current agent format instead of expecting official OpenCode.ai format.

### Changes Required:

#### 1. Update OpenCode Validation Logic
**File**: `src/conversion/validator.ts`
**Changes**: Modify `validateOpenCode` method to accept your agent format

```typescript
/**
 * Validate OpenCode agent format (custom codeflow format)
 */
validateOpenCode(agent: OpenCodeAgent): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Check required fields for your OpenCode format
  if (!agent.name || agent.name.trim() === '') {
    errors.push({
      field: 'name',
      message: 'Name is required and cannot be empty',
      severity: 'error',
    });
  }

  if (!agent.description || agent.description.trim() === '') {
    errors.push({
      field: 'description',
      message: 'Description is required and cannot be empty',
      severity: 'error',
    });
  }

  // Role field validation (instead of mode)
  if (!agent.role) {
    errors.push({
      field: 'role',
      message: 'Role is required for OpenCode agents',
      severity: 'error',
    });
  } else if (agent.role !== 'system') {
    warnings.push({
      field: 'role',
      message: 'Role is typically "system" for most agents',
    });
  }

  // Model validation
  if (agent.model) {
    if (typeof agent.model !== 'string') {
      errors.push({
        field: 'model',
        message: 'Model must be a string',
        severity: 'error',
      });
    }
  }

  // Temperature validation
  if (agent.temperature !== undefined) {
    if (typeof agent.temperature !== 'number') {
      errors.push({
        field: 'temperature',
        message: 'Temperature must be a number',
        severity: 'error',
      });
    } else if (agent.temperature < 0 || agent.temperature > 2) {
      errors.push({
        field: 'temperature',
        message: 'Temperature must be between 0 and 2',
        severity: 'error',
      });
    }
  }

  // Tools validation (array format in your agents)
  if (agent.tools) {
    if (!Array.isArray(agent.tools)) {
      errors.push({
        field: 'tools',
        message: 'Tools must be an array',
        severity: 'error',
      });
    }
  }

  // Tags validation (array format in your agents)
  if (agent.tags) {
    if (!Array.isArray(agent.tags)) {
      errors.push({
        field: 'tags',
        message: 'Tags must be an array',
        severity: 'error',
      });
    }
  }

  // Name format validation (no spaces)
  if (agent.name && agent.name.includes(' ')) {
    errors.push({
      field: 'name',
      message: 'Agent name should not contain spaces (use hyphens instead)',
      severity: 'error',
    });
  }

  // If there are validation errors, return them
  if (errors.length > 0) {
    return {
      valid: false,
      errors,
      warnings,
    };
  }

  // Convert to base format for additional validation
  const baseAgent: BaseAgent = {
    name: agent.name!,
    description: agent.description!,
    mode: 'subagent', // Default mode for validation
    model: agent.model,
    temperature: agent.temperature,
    tools: agent.tools ? agent.tools.reduce((acc, tool) => {
      acc[tool] = true;
      return acc;
    }, {} as Record<string, boolean>) : undefined,
  };

  return this.validateBase(baseAgent);
}
```

#### 2. Update Agent Parser Types
**File**: `src/conversion/agent-parser.ts`
**Changes**: Update OpenCodeAgent interface to match your format

```typescript
export interface OpenCodeAgent {
  name: string;
  role: string;
  model?: string;
  temperature?: number;
  tools?: string[];
  description: string;
  tags?: string[];
}
```

#### 3. Update Format Detection
**File**: `src/conversion/format-converter.ts` (or wherever format detection is)
**Changes**: Ensure detection works with your OpenCode format

```typescript
// Detect format based on frontmatter structure
detectFormat(frontmatter: any): AgentFormat {
  // Your custom OpenCode format detection
  if (frontmatter.name && frontmatter.role && frontmatter.tags) {
    return 'opencode';
  }
  
  // Claude Code format
  if (frontmatter.role && frontmatter.model && !frontmatter.tags) {
    return 'claude-code';
  }
  
  // Base format (fallback)
  return 'base';
}
```

### Success Criteria:

#### Automated Verification:
- [ ] Unit tests pass: `bun test tests/unit/agent-validator.test.ts`
- [ ] OpenCode agents in `/agent/opencode/` pass validation
- [ ] Format detection correctly identifies your OpenCode agents
- [ ] Type checking passes: `bun run typecheck`

#### Manual Verification:
- [ ] Test validation with actual agent from `/agent/opencode/agent-architect.md`
- [ ] Validation accepts `name`, `role`, `tools`, `description`, `tags` format
- [ ] No breaking changes to Claude Code or base format validation

---

## Phase 2: Include /agent/ Directory in Sync Process

### Overview
Modify sync-global to include agents from your `/agent/` directory in addition to the expected `codeflow-agents/` directory.

### Changes Required:

#### 1. Update Sync Source Logic
**File**: `src/cli/sync.ts`
**Changes**: Modify `syncGlobalAgents` to include multiple source directories

```typescript
export async function syncGlobalAgents(options: SyncOptions = {}) {
  const {
    includeSpecialized = true,
    includeWorkflow = true,
    format = 'all',
    validate = true,
    dryRun = false,
  } = options;

  console.log('🌐 Synchronizing agents to global directories...');
  console.log('📦 Using multiple source directories for comprehensive sync');

  if (dryRun) console.log('🔍 Dry run mode - no files will be written');
  console.log('');

  // Ensure global directories exist
  if (!existsSync(getGlobalPaths().global)) {
    await setupGlobalAgents();
  }

  const codeflowDir = join(import.meta.dir, '../..');
  const globalPaths = getGlobalPaths();

  // Define source directories to check
  const sourcePaths = [
    { path: join(codeflowDir, 'codeflow-agents'), label: 'codeflow-agents (base format)' },
    { path: join(codeflowDir, 'agent'), label: 'agent (mixed formats)' },
  ];

  let allAgents: Agent[] = [];
  let totalParsingErrors = 0;

  // Process each source directory
  for (const source of sourcePaths) {
    if (!existsSync(source.path)) {
      console.log(`⚠️  Source directory not found: ${source.path}`);
      continue;
    }

    console.log(`📦 Processing agents from ${source.label}`);

    try {
      // Parse agents from directory (auto-detect format)
      const { agents, errors } = await parseAgentsFromDirectory(source.path, 'auto');

      if (errors.length > 0) {
        console.log(`⚠️  Found ${errors.length} parsing errors in ${source.label}`);
        for (const error of errors) {
          console.log(`  • ${error.filePath}: ${error.message}`);
        }
        totalParsingErrors += errors.length;
      }

      if (agents.length > 0) {
        console.log(`  📋 Found ${agents.length} agents`);
        allAgents.push(...agents);
      } else {
        console.log(`  ℹ️  No agents found in ${source.label}`);
      }
    } catch (error: any) {
      console.log(`❌ Failed to parse ${source.label}: ${error.message}`);
    }
  }

  // Deduplicate agents by name (prefer agents from earlier sources)
  const uniqueAgents = allAgents.reduce((acc, agent) => {
    if (!acc.find(a => a.name === agent.name)) {
      acc.push(agent);
    }
    return acc;
  }, [] as Agent[]);

  if (allAgents.length > uniqueAgents.length) {
    console.log(`🔄 Deduplicated ${allAgents.length - uniqueAgents.length} duplicate agents`);
  }

  if (uniqueAgents.length === 0) {
    console.log(`❌ No agents found in any source directory`);
    return;
  }

  // Continue with existing filtering and sync logic...
  let filteredAgents = uniqueAgents;

  if (!includeSpecialized) {
    filteredAgents = uniqueAgents.filter((agent) => !agent.name.includes('_'));
  }

  if (!includeWorkflow) {
    const workflowAgents = [
      'codebase-analyzer',
      'codebase-locator',
      'codebase-pattern-finder',
      'thoughts-analyzer',
      'thoughts-locator',
    ];
    filteredAgents = filteredAgents.filter((agent) => !workflowAgents.includes(agent.name));
  }

  console.log(`  📋 Selected ${filteredAgents.length}/${uniqueAgents.length} agents for sync`);

  // Rest of the sync logic remains the same...
  // [existing sync logic continues...]
}
```

#### 2. Add Auto-Format Detection
**File**: `src/conversion/agent-parser.ts`  
**Changes**: Add auto-detection capability for parsing mixed format directories

```typescript
export async function parseAgentsFromDirectory(
  directoryPath: string, 
  expectedFormat: AgentFormat | 'auto'
): Promise<{ agents: Agent[], errors: ParseError[] }> {
  const agents: Agent[] = [];
  const errors: ParseError[] = [];

  if (!existsSync(directoryPath)) {
    return { agents, errors };
  }

  const files = await readdir(directoryPath, { withFileTypes: true });
  const mdFiles = files.filter(f => f.isFile() && f.name.endsWith('.md'));

  for (const file of mdFiles) {
    const filePath = join(directoryPath, file.name);
    
    try {
      const content = await readFile(filePath, 'utf-8');
      
      // Auto-detect format if requested
      let format = expectedFormat;
      if (format === 'auto') {
        format = detectFormatFromContent(content);
      }
      
      const agent = parseAgent(content, format);
      agents.push(agent);
      
    } catch (error: any) {
      errors.push({
        filePath,
        message: error.message,
      });
    }
  }

  return { agents, errors };
}

function detectFormatFromContent(content: string): AgentFormat {
  if (!content.startsWith('---')) {
    return 'base';
  }

  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) {
    return 'base';
  }

  try {
    const frontmatter = parseYaml(frontmatterMatch[1]);
    
    // Your custom OpenCode format
    if (frontmatter.name && frontmatter.tags && Array.isArray(frontmatter.tags)) {
      return 'opencode';
    }
    
    // Claude Code format
    if (frontmatter.role && frontmatter.model && !frontmatter.tags) {
      return 'claude-code';
    }
    
    // Default to base
    return 'base';
    
  } catch {
    return 'base';
  }
}
```

#### 3. Update Tests
**File**: `tests/unit/agent-validator.test.ts`
**Changes**: Add tests for your OpenCode format

```typescript
describe('OpenCode Format (Custom)', () => {
  it('should validate custom opencode format with name, role, tags', () => {
    const content = `---
name: agent-architect
role: system
model: claude-3.5-sonnet-20241022
temperature: 0.1
tools: []
description: Meta-agent for creating specialized AI agents
tags: ["meta", "agent-design"]
---

You are Agent Architect...`;
    
    const agent = parseAgent(content, 'opencode');
    const result = validator.validateAgent(agent);
    
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject opencode format missing required fields', () => {
    const content = `---
name: test-agent
---

You are a test agent.`;
    
    const agent = parseAgent(content, 'opencode');
    const result = validator.validateAgent(agent);
    
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual({
      field: 'description',
      message: 'Description is required and cannot be empty',
      severity: 'error'
    });
    expect(result.errors).toContainEqual({
      field: 'role',
      message: 'Role is required for OpenCode agents', 
      severity: 'error'
    });
  });
});
```

### Success Criteria:

#### Automated Verification:
- [ ] Unit tests pass: `bun test`
- [ ] sync-global processes both directories: `codeflow sync-global --dry-run`
- [ ] All agent formats validate correctly
- [ ] Type checking passes: `bun run typecheck`

#### Manual Verification:
- [ ] Run `codeflow sync-global` and verify no validation errors
- [ ] Check global directories contain agents from both sources
- [ ] Verify OpenCode agents are copied successfully
- [ ] Test that OpenCode can load the synced agents
- [ ] Confirm no duplicate agents in global directories

---

## Testing Strategy

### Unit Tests:
- Test OpenCode validation with your agent format
- Test multi-directory parsing logic
- Test auto-format detection accuracy
- Test agent deduplication logic

### Integration Tests:
- Test full sync-global workflow with mixed formats
- Test that global directories receive correct agents
- Test validation error reporting and handling
- Test dry-run mode accuracy

### Manual Testing Steps:
1. Run `codeflow sync-global --dry-run` to preview changes
2. Run `codeflow sync-global` to perform actual sync
3. Check global directories for expected agents
4. Test OpenCode platform can load synced agents
5. Verify no regressions in Claude Code agent handling

## Performance Considerations

- Auto-format detection adds minimal parsing overhead
- Deduplication ensures no performance impact from duplicates
- Multi-directory processing maintains existing efficiency
- Validation optimized for your specific format requirements

## Migration Notes

### No Breaking Changes:
- Existing sync-global behavior preserved for `codeflow-agents/` directory
- Claude Code and base format validation unchanged
- Global directory structure remains the same
- All existing command-line options continue to work

### Enhancement Only:
- Adds support for `/agent/` directory as additional source
- Improves OpenCode format validation for your agents
- Maintains backward compatibility with existing workflows

## References

- Original research: `thoughts/research/2025-08-31_sync-global-opencode-agent-errors.md`  
- Current sync implementation: `src/cli/sync.ts:70-230`
- Validation logic: `src/conversion/validator.ts:208-255`
- Agent examples: `agent/opencode/*.md`
- Directory structure: `/agent/`, `/codeflow-agents/`, global paths via `getGlobalPaths()`