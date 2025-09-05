# Fix OpenCode Agent Format Compliance Implementation Plan

## Overview

Convert the custom OpenCode agent format to official OpenCode.ai specification compliance to fix sync-global validation errors and ensure proper OpenCode platform compatibility.

## Current State Analysis

The codebase currently uses a **custom OpenCode format** that differs significantly from the **official OpenCode.ai specification**, causing sync-global validation failures and OpenCode platform incompatibility.

### Key Discoveries:

- **Working validation logic exists**: `src/core/agent-validator.ts:102-165` fully implements OpenCode validation
- **Custom format in use**: 9+ agents in `/agent/opencode/` use non-standard YAML schema
- **Official format documented**: OpenCode.ai uses `description`, `mode`, `model`, `temperature`, `tools`, `permission`, `disable`
- **Validation mismatch**: Current validation requires `name`, `role`, `model`, `temperature`, `tools`, `description`, `tags`

## Desired End State

All OpenCode agents conform to the official OpenCode.ai YAML frontmatter specification, enabling:

- Successful sync-global operations without validation errors
- Full compatibility with OpenCode platform and tooling
- Proper agent loading and execution in OpenCode environments

### Verification Criteria:

- All OpenCode agents pass validation with official schema
- sync-global copies OpenCode agents successfully
- OpenCode platform can load and execute all agents
- No breaking changes to Claude Code format agents

## What We're NOT Doing

- Changing Claude Code format agents (maintain current schema)
- Modifying base format agents (no frontmatter)
- Changing command format (different validation path)
- Breaking existing non-OpenCode workflows

## Implementation Approach

**Two-phase approach**: Update validation schema first, then convert agents to avoid validation failures during conversion process.

## Phase 1: Update OpenCode Validation Schema

### Overview

Update validation logic to match official OpenCode.ai specification and ensure proper format detection.

### Changes Required:

#### 1. OpenCode Validation Logic

**File**: `src/core/agent-validator.ts`
**Changes**: Replace custom validation with official OpenCode schema validation

```typescript
function validateOpenCodeFormat(content: string): ValidationResult {
  const errors: ValidationError[] = [];

  // Must start with frontmatter
  if (!content.startsWith('---')) {
    errors.push({
      field: 'frontmatter',
      message: 'OpenCode format must start with YAML frontmatter',
    });
    return { isValid: false, errors };
  }

  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) {
    errors.push({
      field: 'frontmatter',
      message: 'Invalid YAML frontmatter structure',
    });
    return { isValid: false, errors };
  }

  try {
    const frontmatter = parseYaml(frontmatterMatch[1]);

    // Required fields for official OpenCode format
    const requiredFields = ['description', 'mode'];
    for (const field of requiredFields) {
      if (!frontmatter.hasOwnProperty(field)) {
        errors.push({
          field,
          message: `Missing required field: ${field}`,
        });
      }
    }

    // Validate mode field
    if (frontmatter.mode && !['primary', 'subagent', 'all'].includes(frontmatter.mode)) {
      errors.push({
        field: 'mode',
        message: 'Mode must be one of: primary, subagent, all',
      });
    }

    // Validate temperature range (if provided)
    if (
      frontmatter.temperature !== undefined &&
      (frontmatter.temperature < 0.0 || frontmatter.temperature > 1.0)
    ) {
      errors.push({
        field: 'temperature',
        message: 'Temperature must be between 0.0 and 1.0',
      });
    }

    // Validate tools object structure (if provided)
    if (
      frontmatter.tools &&
      typeof frontmatter.tools === 'object' &&
      !Array.isArray(frontmatter.tools)
    ) {
      for (const [tool, enabled] of Object.entries(frontmatter.tools)) {
        if (typeof enabled !== 'boolean') {
          errors.push({
            field: 'tools',
            message: `Tool '${tool}' must have boolean value (true/false)`,
          });
        }
      }
    }

    // Validate permission object structure (if provided)
    if (frontmatter.permission && typeof frontmatter.permission === 'object') {
      for (const [action, permission] of Object.entries(frontmatter.permission)) {
        if (!['allow', 'ask', 'deny'].includes(permission as string)) {
          errors.push({
            field: 'permission',
            message: `Permission for '${action}' must be one of: allow, ask, deny`,
          });
        }
      }
    }

    // Validate disable field (if provided)
    if (frontmatter.disable !== undefined && typeof frontmatter.disable !== 'boolean') {
      errors.push({
        field: 'disable',
        message: 'Disable field must be boolean (true/false)',
      });
    }
  } catch (error) {
    errors.push({
      field: 'frontmatter',
      message: 'Invalid YAML syntax in frontmatter',
    });
  }

  return { isValid: errors.length === 0, errors };
}
```

#### 2. Format Detection Logic

**File**: `src/core/agent-converter.ts`
**Changes**: Update format detection to handle official OpenCode format

```typescript
function detectAgentFormat(content: string): AgentFormat {
  if (!content.startsWith('---')) {
    return 'base';
  }

  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) {
    return 'claude-code'; // Has --- but malformed, assume claude-code
  }

  try {
    const frontmatter = parseYaml(frontmatterMatch[1]);

    // Official OpenCode format detection
    if (frontmatter.description && frontmatter.mode) {
      return 'opencode';
    }

    // Legacy custom OpenCode format detection (temporary during transition)
    if (frontmatter.name && frontmatter.tags) {
      return 'opencode';
    }

    // Claude Code format (has role but not OpenCode markers)
    return 'claude-code';
  } catch {
    return 'claude-code';
  }
}
```

#### 3. Conversion Logic Update

**File**: `src/core/agent-converter.ts`
**Changes**: Update base-to-OpenCode conversion to use official format

```typescript
function convertFromBase(content: string, targetFormat: AgentFormat): string {
  if (targetFormat === 'claude-code') {
    const frontmatter: ClaudeCodeMetadata = {
      role: 'system',
      model: 'claude-3.5-sonnet-20241022',
      temperature: 0.1,
    };

    return `---\n${stringifyYaml(frontmatter).trim()}\n---\n\n${content}`;
  } else if (targetFormat === 'opencode') {
    const frontmatter = {
      description: 'Converted agent from base format',
      mode: 'subagent',
      model: 'opencode/grok-code-fast',
      temperature: 0.1,
      tools: {
        write: true,
        edit: true,
        bash: true,
      },
    };

    return `---\n${stringifyYaml(frontmatter).trim()}\n---\n\n${content}`;
  }

  return content;
}
```

### Success Criteria:

#### Automated Verification:

- [x] Unit tests pass: `bun test tests/unit/agent-validator.test.ts`
- [x] Type checking passes: `bun run typecheck`
- [x] Validation logic correctly identifies official OpenCode format
- [x] Format detection distinguishes between old and new OpenCode formats

#### Manual Verification:

- [x] Test agent with official format passes validation
- [x] Test agent with old format still detected as OpenCode during transition
- [x] Claude Code agents unaffected by validation changes

---

## Phase 2: Convert Existing OpenCode Agents

### Overview

Convert all existing OpenCode agents from custom format to official OpenCode.ai specification.

### Changes Required:

#### 1. Agent Conversion Script

**File**: `scripts/convert-opencode-agents.ts`
**Changes**: Create conversion script for bulk agent updates

```typescript
import { promises as fs } from 'fs';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import { glob } from 'glob';
import { basename } from 'path';

interface CustomOpenCodeMetadata {
  name: string;
  role: string;
  model: string;
  temperature: number;
  tools: string[];
  description: string;
  tags: string[];
}

interface OfficialOpenCodeMetadata {
  description: string;
  mode: 'primary' | 'subagent' | 'all';
  model?: string;
  temperature?: number;
  tools?: Record<string, boolean>;
  permission?: Record<string, 'allow' | 'ask' | 'deny'>;
  disable?: boolean;
}

async function convertOpenCodeAgent(filePath: string): Promise<void> {
  const content = await fs.readFile(filePath, 'utf-8');

  // Extract frontmatter and content
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n\n([\s\S]*)$/);
  if (!frontmatterMatch) {
    console.warn(`Skipping ${filePath}: No valid frontmatter found`);
    return;
  }

  try {
    const oldFrontmatter = parseYaml(frontmatterMatch[1]) as CustomOpenCodeMetadata;
    const agentContent = frontmatterMatch[2];

    // Convert to official OpenCode format
    const newFrontmatter: OfficialOpenCodeMetadata = {
      description: oldFrontmatter.description,
      mode: 'subagent', // Most agents are subagents
      model: convertModelName(oldFrontmatter.model),
      temperature: oldFrontmatter.temperature,
      tools: convertToolsArray(oldFrontmatter.tools),
    };

    // Generate new agent file content
    const newContent = `---\n${stringifyYaml(newFrontmatter).trim()}\n---\n\n${agentContent}`;

    // Write converted agent
    await fs.writeFile(filePath, newContent, 'utf-8');
    console.log(`✅ Converted: ${basename(filePath)}`);
  } catch (error) {
    console.error(`❌ Failed to convert ${filePath}:`, error);
  }
}

function convertModelName(oldModel: string): string {
  // Convert internal model names to OpenCode format
  const modelMap: Record<string, string> = {
    'claude-3.5-sonnet-20241022': 'opencode/grok-code-fast',
    'claude-3-5-sonnet-latest': 'opencode/grok-code-fast',
  };

  return modelMap[oldModel] || oldModel;
}

function convertToolsArray(tools: string[]): Record<string, boolean> {
  const toolsObj: Record<string, boolean> = {};

  // Convert from array to boolean object
  const defaultTools = ['write', 'edit', 'bash', 'read', 'grep', 'glob', 'list'];
  for (const tool of defaultTools) {
    toolsObj[tool] = tools.length === 0 ? true : tools.includes(tool);
  }

  return toolsObj;
}

// Main conversion function
async function main() {
  const agentFiles = await glob('agent/opencode/*.md');

  console.log(`Found ${agentFiles.length} OpenCode agents to convert`);

  for (const file of agentFiles) {
    await convertOpenCodeAgent(file);
  }

  console.log('🎉 OpenCode agent conversion complete!');
}

if (import.meta.main) {
  main().catch(console.error);
}
```

#### 2. Individual Agent Conversions

**Files**: All agents in `agent/opencode/` directory
**Changes**: Convert each agent from custom to official format

**Example Conversion - agent-architect.md**:

```yaml
# FROM (Custom Format):
---
name: agent-architect
role: system
model: claude-3.5-sonnet-20241022
temperature: 0.1
tools: []
description: Meta-agent for creating specialized AI agents and defining their capabilities, prompts, and interaction patterns
tags: ['meta', 'agent-design', 'prompts', 'system-architecture']
---
# TO (Official Format):
---
description: Meta-agent for creating specialized AI agents and defining their capabilities, prompts, and interaction patterns
mode: subagent
model: opencode/grok-code-fast
temperature: 0.1
tools:
  write: true
  edit: true
  bash: false
  read: true
  grep: true
  glob: true
  list: true
permission:
  write: ask
  edit: ask
  bash: deny
---
```

#### 3. Update Test Files

**File**: `tests/unit/agent-validator.test.ts`
**Changes**: Update test cases for official OpenCode format

```typescript
describe('OpenCode Format', () => {
  it('should validate valid official opencode format agent', () => {
    const content = `---
description: A test agent for validation
mode: subagent
model: opencode/grok-code-fast
temperature: 0.1
tools:
  write: true
  edit: false
permission:
  write: ask
  edit: deny
---

You are a helpful assistant.`;

    const result = validateAgent(content, 'opencode');

    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject opencode format with invalid mode', () => {
    const content = `---
description: A test agent
mode: invalid-mode
---

You are a helpful assistant.`;

    const result = validateAgent(content, 'opencode');

    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual({
      field: 'mode',
      message: 'Mode must be one of: primary, subagent, all',
    });
  });

  it('should reject opencode format with invalid permission', () => {
    const content = `---
description: A test agent
mode: subagent
permission:
  write: invalid-permission
---

You are a helpful assistant.`;

    const result = validateAgent(content, 'opencode');

    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual({
      field: 'permission',
      message: "Permission for 'write' must be one of: allow, ask, deny",
    });
  });
});
```

#### 4. Update Documentation

**File**: `README.md`
**Changes**: Document official OpenCode format support

````markdown
### OpenCode Format (Official OpenCode.ai Specification)

```yaml
---
description: Brief explanation of the agent's purpose
mode: subagent # primary, subagent, or all
model: opencode/grok-code-fast # Optional
temperature: 0.1 # Optional, 0.0-1.0 range
tools: # Optional tool access configuration
  write: true
  edit: false
  bash: ask
permission: # Optional action permissions
  edit: deny
  bash: ask
disable: false # Optional, set to true to disable agent
---
Agent-specific system prompt goes here...
```
````

```

### Success Criteria:

#### Automated Verification:
- [x] All unit tests pass: `bun test`
- [x] Type checking passes: `bun run typecheck`
- [x] Conversion script runs without errors: `bun run scripts/convert-opencode-agents.ts`
- [x] All converted agents pass OpenCode validation

#### Manual Verification:
- [x] All OpenCode agents conform to official specification
- [x] sync-global successfully copies OpenCode agents without validation errors
- [x] OpenCode platform can load and execute converted agents
- [x] Agent functionality unchanged after conversion
- [x] No regressions in Claude Code or base format agents

---

## Testing Strategy

### Unit Tests:
- Test official OpenCode format validation with all field combinations
- Test format detection with official vs custom OpenCode formats
- Test conversion logic for base-to-OpenCode transformation
- Test edge cases: malformed YAML, missing required fields, invalid values

### Integration Tests:
- Test sync-global with official OpenCode agents
- Test agent loading in actual OpenCode environment
- Test format conversion pipeline end-to-end
- Test backward compatibility during transition period

### Manual Testing Steps:
1. Convert one agent manually and test in OpenCode
2. Run conversion script on all agents
3. Verify sync-global copies agents without errors
4. Test agent execution in OpenCode platform
5. Verify Claude Code agents unaffected

## Performance Considerations

- Bulk conversion script processes agents sequentially to avoid file system contention
- Validation logic optimized for common case (official format) first
- Format detection uses minimal parsing for performance
- Backward compatibility adds minimal overhead during transition

## Migration Notes

### Conversion Process:
1. **Phase 1**: Update validation and detection logic (non-breaking)
2. **Run conversion script**: Convert all agents in batch operation
3. **Phase 2**: Remove legacy format detection after verification
4. **Cleanup**: Remove custom format references from documentation

### Rollback Plan:
- Keep backup of original agents before conversion
- Validation logic supports both formats during transition
- Can revert individual agents if issues found
- Full rollback possible by reverting validation changes

## References

- Original research: `thoughts/research/2025-08-31_sync-global-opencode-agent-errors.md`
- Official OpenCode documentation: `https://opencode.ai/docs/agents/`
- Validation implementation: `src/core/agent-validator.ts:102-165`
- Format detection: `src/core/agent-converter.ts:44-58`
- Agent examples: `agent/opencode/*.md`
```
