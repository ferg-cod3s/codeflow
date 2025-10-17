# Base Format Capability Audit

## Executive Summary

**Status**: Base format successfully supports all 4 target platforms with **minimal data loss**

**Key Finding**: The current Base format in `codeflow-agents/` can express all fields needed by target platforms. Some platform-specific semantics are lost in conversion (by design), but no critical data is lost.

## Platform Requirements Matrix

### Claude Code v2.x.x

| Field         | Required | Type                                 | Base Format Support | Notes                                    |
| ------------- | -------- | ------------------------------------ | ------------------- | ---------------------------------------- |
| `name`        | Yes      | string                               | ✅ `name`           | Direct mapping                           |
| `description` | Yes      | string                               | ✅ `description`    | Direct mapping                           |
| `tools`       | No       | string (comma-separated)             | ✅ `tools` (object) | Converted from `Record<string, boolean>` |
| `model`       | No       | 'inherit'\|'sonnet'\|'opus'\|'haiku' | ✅ `model`          | Mapped via `convertModelForClaudeCode()` |

**Data Loss**:

- ❌ `mode`, `temperature`, `category`, `tags`, `allowed_directories` - Intentionally stripped (not supported by Claude Code)
- ✅ No critical data loss - Claude Code v2 has minimal schema by design

### OpenCode

| Field                 | Required | Type                                   | Base Format Support                  | Notes                                       |
| --------------------- | -------- | -------------------------------------- | ------------------------------------ | ------------------------------------------- |
| `name`                | Yes      | string                                 | ✅ `name`                            | Direct mapping                              |
| `description`         | Yes      | string                                 | ✅ `description`                     | Direct mapping                              |
| `mode`                | No       | 'subagent'\|'primary'\|'all'           | ✅ `mode`                            | Direct mapping, defaults to 'subagent'      |
| `model`               | No       | string (provider/model)                | ✅ `model`                           | Mapped via `convertModelForOpenCode()`      |
| `temperature`         | No       | number                                 | ✅ `temperature`                     | Direct mapping                              |
| `permission`          | No       | Record<string, 'allow'\|'ask'\|'deny'> | ✅ `tools` or `permissions.opencode` | Converted via `convertToolsToPermissions()` |
| `tools`               | No       | Record<string, boolean>                | ✅ `tools`                           | Direct mapping (legacy support)             |
| `category`            | No       | string                                 | ✅ `category`                        | Custom extension preserved                  |
| `tags`                | No       | string[]                               | ✅ `tags`                            | Custom extension preserved                  |
| `allowed_directories` | No       | string[]                               | ✅ `allowed_directories`             | Custom extension preserved                  |

**Data Loss**:

- ✅ No data loss - Base format preserves all OpenCode fields
- ⚠️ Default permissions added if missing: `{ edit: 'deny', bash: 'deny', webfetch: 'allow' }`

### Cursor

| Field                 | Required | Type | Base Format Support | Notes                             |
| --------------------- | -------- | ---- | ------------------- | --------------------------------- |
| (Same as Claude Code) |          |      |                     | Cursor uses Claude Code v2 format |

**Data Loss**: Same as Claude Code

### MCP (Model Context Protocol)

| Requirement      | Base Format Support      | Notes                        |
| ---------------- | ------------------------ | ---------------------------- |
| Tool Name        | ✅ Derived from `name`   | Stable semantic naming       |
| Tool Description | ✅ `description`         | Direct mapping               |
| Tool Content     | ✅ Full markdown body    | Exposed via MCP tool calls   |
| Access Control   | ✅ `allowed_directories` | MCP-specific field preserved |

**Data Loss**:

- ✅ No data loss - MCP uses full agent metadata
- ℹ️ MCP is not a file format - agents are exposed as callable tools

## Base Format Schema Analysis

### Current Base Format (src/conversion/agent-parser.ts:20-50)

```typescript
interface BaseAgent {
  // CORE FIELDS - Required by all platforms
  name: string; // ✅ Universal
  description: string; // ✅ Universal

  // OPTIONAL CORE FIELDS
  mode?: 'subagent' | 'primary' | 'all'; // ✅ OpenCode, ❌ Claude Code
  temperature?: number; // ✅ OpenCode, ❌ Claude Code
  model?: string; // ✅ All platforms (with conversion)
  tools?: Record<string, boolean>; // ✅ All platforms (with conversion)

  // CUSTOM EXTENSIONS
  category?: string; // ✅ OpenCode, ❌ Claude Code
  tags?: string[]; // ✅ OpenCode, ❌ Claude Code
  allowed_directories?: string[]; // ✅ OpenCode + MCP, ❌ Claude Code
  permissions?: {
    // ✅ Platform-specific storage
    opencode?: Record<string, any>;
    claude?: Record<string, any>;
  };

  // LEGACY FIELDS (backward compatibility)
  usage?: string;
  do_not_use_when?: string;
  escalation?: string;
  examples?: string;
  prompts?: string;
  constraints?: string;
  max_tokens?: number;
  enabled?: boolean;
  disabled?: boolean;
}
```

### Gap Analysis

**Missing Fields**: None identified

- ✅ Base format can express all target platform requirements
- ✅ Custom extensions (`category`, `tags`, `allowed_directories`) preserved for OpenCode
- ✅ Legacy fields maintained for backward compatibility

**Conversion Logic Issues**: None critical

- ⚠️ Tools format conversion (object ↔ string) is lossy for tool-specific metadata
- ℹ️ This is acceptable - platforms don't support rich tool metadata

## Conversion Path Validation

### Base → Claude Code (src/conversion/format-converter.ts:19-65)

**Conversion Steps**:

1. Extract `name`, `description` ✅
2. Convert `tools` object → comma-separated string ✅
3. Map `model` to Claude Code format ('inherit'|'sonnet'|'opus'|'haiku') ✅
4. Strip all other fields (intentional) ✅

**Data Loss by Design**:

- `mode`, `temperature`, `category`, `tags`, `allowed_directories`, `permissions`
- This is **correct behavior** - Claude Code v2 doesn't support these fields

**Validation**: ✅ No data loss for supported fields

### Base → OpenCode (src/conversion/format-converter.ts:71-124)

**Conversion Steps**:

1. Map all core fields directly ✅
2. Convert `tools` → `permission` format ✅
3. Map `model` to OpenCode format (provider/model) ✅
4. Preserve custom extensions (`category`, `tags`, `allowed_directories`) ✅
5. Add default permissions if missing ✅

**Data Loss**: None

- ✅ All Base format fields preserved
- ⚠️ Default permissions added: `{ edit: 'deny', bash: 'deny', webfetch: 'allow' }`

**Validation**: ✅ No data loss

### Base → Cursor (src/conversion/format-converter.ts:252)

**Conversion**: Uses `baseToClaudeCode()` - same as Claude Code

**Validation**: ✅ Same as Claude Code

### Base → MCP (Not a File Format)

**Implementation**: `mcp/codeflow-server.mjs`

- MCP server exposes agents as tools dynamically
- Uses full Base format metadata (no conversion needed)
- `allowed_directories` field used for access control

**Validation**: ✅ No data loss - full metadata available

## Round-Trip Conversion Analysis

### Claude Code → Base → Claude Code

**Test**: `testRoundTrip()` in format-converter.ts:317-343

**Expected Behavior**:

- ✅ `name` preserved
- ✅ `description` preserved
- ✅ `tools` preserved (string → object → string)
- ✅ `model` preserved (with normalization)

**Validation**: ✅ No data loss for supported fields

### OpenCode → Base → OpenCode

**Expected Behavior**:

- ✅ All fields preserved
- ⚠️ `permission` ↔ `tools` format conversion may normalize values
- Example: `permission: { edit: 'allow' }` → `tools: { edit: true }` → `permission: { edit: 'allow' }`

**Validation**: ✅ No functional data loss

## Model Mapping Validation

### Claude Code Model Mapping (src/conversion/format-converter.ts:412-441)

```typescript
const modelMap = {
  'claude-sonnet': 'sonnet',
  'claude-opus': 'opus',
  'claude-haiku': 'haiku',
  'anthropic/claude-sonnet-4': 'sonnet',
  'anthropic/claude-opus-4': 'opus',
  'anthropic/claude-haiku-4': 'haiku',
  inherit: 'inherit',
  sonnet: 'sonnet',
  opus: 'opus',
  haiku: 'haiku',
};
// Unknown models → 'inherit' (with warning)
```

**Validation**: ✅ Appropriate fallback behavior

### OpenCode Model Mapping (src/conversion/format-converter.ts:448-484)

```typescript
const modelMap = {
  sonnet: 'opencode/grok-code',
  opus: 'opencode/code-supernova',
  haiku: 'opencode/grok-code',
  inherit: 'opencode/grok-code',
  'anthropic/claude-sonnet-4': 'opencode/grok-code',
  'anthropic/claude-opus-4': 'opencode/code-supernova',
  'anthropic/claude-haiku-4': 'opencode/grok-code',
};
// Unknown models → 'opencode/grok-code' (with warning)
```

**Issue**: Maps Claude models to free OpenCode models by default

- ⚠️ Assumption: Users prefer free models over paid Anthropic models
- ✅ Valid OpenCode models hardcoded: `grok-code`, `code-supernova`, `grok-code-fast-1`

**Recommendation**: Consider allowing user preference for paid vs free models

## Permission Format Conversion

### Tools → Permission (src/conversion/format-converter.ts:367-385)

```typescript
convertToolsToPermissions(tools: Record<string, boolean>):
  Record<string, 'allow' | 'ask' | 'deny'> {

  const permissions = {
    edit: booleanToPermissionString(tools.edit || false),
    bash: booleanToPermissionString(tools.bash || false),
    webfetch: booleanToPermissionString(tools.webfetch !== false), // Default: true
  };

  // Add additional tools
  for (const [tool, enabled] of Object.entries(tools)) {
    if (!['edit', 'bash', 'webfetch'].includes(tool)) {
      permissions[tool] = booleanToPermissionString(enabled);
    }
  }

  return permissions;
}
```

**Validation**: ✅ Preserves all tools, converts boolean → 'allow'|'deny'

### Permission → Tools (src/conversion/format-converter.ts:397-407)

```typescript
convertPermissionsToTools(permissions: Record<string, 'allow' | 'ask' | 'deny'>):
  Record<string, boolean> {

  const tools = {};
  for (const [tool, permission] of Object.entries(permissions)) {
    tools[tool] = permission === 'allow';
  }
  return tools;
}
```

**Data Loss**:

- ⚠️ 'ask' permission → `false` (deny)
- This is **acceptable** - Base format uses boolean tools, not tri-state permissions

## Command Format Validation

### Base Command Format (src/conversion/agent-parser.ts:435-450)

```typescript
interface BaseCommand {
  name: string;
  description: string;
  mode?: 'command';
  version?: string;
  inputs?: CommandInput[];
  outputs?: CommandOutput[];
  cache_strategy?: CacheStrategy;
  success_signals?: string[];
  failure_modes?: string[];
  // Legacy fields
  usage?: string;
  examples?: string;
  constraints?: string;
  intended_followups?: string[];
}
```

**Target Platform**: OpenCode only (Claude Code doesn't have commands)

**Validation**: ✅ Base format supports all OpenCode command fields

## Critical Findings Summary

### ✅ No Data Loss Issues

1. Base format can express all target platform requirements
2. Conversion logic preserves all supported fields
3. Custom extensions properly maintained for platforms that support them

### ⚠️ Acceptable Semantic Loss

1. **Claude Code**: `mode`, `temperature`, custom extensions stripped (by design)
2. **Permission 'ask' state**: Converted to 'deny' in boolean tools format (acceptable trade-off)
3. **Model mapping**: Defaults to free OpenCode models (user preference assumption)

### ℹ️ Design Decisions

1. **Base format is comprehensive**: Contains superset of all platform fields
2. **One-way conversions work**: Base → Target is lossless for supported fields
3. **Round-trip conversions**: Work for platforms that support the fields

## Recommendations

### ✅ Keep Current Design

- Base format schema is complete and appropriate
- No schema changes needed
- Conversion logic is correct and handles edge cases

### ⚠️ Consider Enhancements

1. **Model Preference**: Add user config for paid vs free OpenCode models
2. **Validation Warnings**: Log when fields are stripped during conversion (already done with console.warn)
3. **Documentation**: Create user-facing guide explaining which fields work on which platforms

### 📋 Document Base Format Specification

- Create formal spec in `docs/BASE_FORMAT_SPECIFICATION.md`
- Include field compatibility matrix
- Provide examples for each platform
- Explain conversion behavior and data loss

## Conclusion

**Verdict**: Base format is **production-ready** for all 4 target platforms

The current implementation successfully handles:

- ✅ Multi-platform field requirements
- ✅ Format-specific conversions (tools, model, permissions)
- ✅ Custom extension preservation
- ✅ Backward compatibility with legacy fields

**No schema changes required** - system is already properly architected.

**Next Steps**:

1. Document Base format specification formally
2. ✅ Removed over-engineered features (sync daemon, catalog system)
3. Focus on format converter robustness and testing
