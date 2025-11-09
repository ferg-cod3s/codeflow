# Platform Adapter Specifications

This document describes the exact specifications for each AI platform adapter in CodeFlow, based on official documentation.

## Table of Contents

- [OpenCode Adapter](#opencode-adapter)
- [Claude Code Adapter](#claude-code-adapter)
- [Format Conversion](#format-conversion)

---

## OpenCode Adapter

**Official Documentation:** https://opencode.ai/docs/agents/

### Directory Structure

```
.opencode/
└── agent/
    ├── agent-1.md       # Flat structure - no subdirectories
    ├── agent-2.md
    └── agent-3.md
```

⚠️ **IMPORTANT:** OpenCode agents use a **flat structure** - agents must be directly in `.opencode/agent/`, NOT in subdirectories.

### Agent File Format

OpenCode agents are Markdown files with YAML frontmatter:

```yaml
---
name: agent-name                    # Required - must match filename
description: Agent description      # Required - minimum 20 characters
mode: subagent                      # Optional - primary|subagent|all (default: subagent)
model: opencode/grok-code          # Optional - provider/model format
temperature: 0.7                    # Optional - 0.0 to 1.0
permission:                         # Optional - granular permissions
  read: allow                       # allow|ask|deny
  write: deny
  edit: deny
  bash: deny
  webfetch: allow
tools:                              # Alternative to permission (deprecated)
  read: true
  write: false
disable: false                      # Optional - disable agent
---

Agent instructions in Markdown format...
```

### Required Fields

- `description` - Minimum 20 characters describing the agent's purpose

### Optional Fields

- `name` - Agent identifier (defaults to filename without .md)
- `mode` - When the agent should be available:
  - `primary` - Only available in primary mode
  - `subagent` - Only available as a subagent (default)
  - `all` - Available in both modes
- `model` - AI model to use (format: `provider/model`)
  - OpenCode models: `opencode/grok-code`, `opencode/code-supernova`, `opencode/grok-code-fast-1`
  - GitHub Copilot: `github-copilot/gpt-5`
- `temperature` - Creativity level (0.0 = deterministic, 1.0 = creative)
- `permission` - Granular permission control (recommended over `tools`)
  - Valid values: `allow`, `ask`, `deny`
  - Available permissions: `read`, `write`, `edit`, `bash`, `webfetch`
- `tools` - Legacy boolean permission format (use `permission` instead)
- `disable` - Set to `true` to disable the agent

### Permission System

OpenCode uses string-based permissions (`allow`/`ask`/`deny`), NOT booleans:

```yaml
permission:
  read: allow      # ✅ Correct
  write: deny      # ✅ Correct
  bash: ask        # ✅ Correct
  edit: true       # ❌ Wrong - use 'allow' instead
```

### Discovery Process

1. MCP-based discovery (if MCP client available):
   - Queries tools with prefix `codeflow.agent.*`
   - Extracts agent metadata from tool descriptions

2. Filesystem-based fallback:
   - Scans `.opencode/agent/*.md` files
   - Parses YAML frontmatter
   - **Flat structure only** - subdirectories are NOT scanned

### Implementation

**File:** `src/adapters/opencode-adapter.ts`

Key methods:
- `discoverAgents()` - Discovers agents via MCP or filesystem
- `discoverAgentsViaMCP()` - MCP-based discovery
- `discoverAgentsFromFiles()` - Filesystem-based discovery (flat)
- `invokeAgent()` - Invokes agent via MCP protocol

---

## Claude Code Adapter

**Official Documentation:** https://docs.claude.com/en/docs/claude-code/

### Directory Structure

```
.claude/
└── agents/
    ├── agent-1.md           # Can use flat structure
    ├── agent-2.md
    └── subdirectory/        # OR nested subdirectories
        ├── agent-3.md
        └── agent-4.md
```

✅ **Claude Code supports both flat and nested directory structures**

### Agent File Format

Claude Code agents are Markdown files with YAML frontmatter:

```yaml
---
name: agent-name                # Required
description: Agent description  # Required
tools: Read, Write, Bash        # Optional - comma-separated string
model: inherit                  # Optional - inherit|sonnet|opus|haiku
---

Agent instructions in Markdown format...
```

### Required Fields

- `name` - Agent identifier
- `description` - Brief description of the agent's purpose

### Optional Fields

- `tools` - **Comma-separated string** of allowed tools (NOT an object!)
  - Example: `"Read, Write, Bash"` ✅
  - Example: `{read: true, write: true}` ❌ (wrong format)
  - Common tools: Read, Write, Edit, Bash, Grep, Glob, WebFetch, Task

- `model` - Which Claude model to use:
  - `inherit` - Use current context model (default)
  - `sonnet` - Claude Sonnet (fast, capable)
  - `opus` - Claude Opus (most capable)
  - `haiku` - Claude Haiku (fastest)

  ⚠️ **IMPORTANT:** Model is configured at Claude Desktop application level, not per-agent. This field is a hint, not a strict requirement.

### Forbidden Fields

Claude Code v2.x.x does NOT support these fields (they will be stripped during conversion):
- `mode` - Not supported
- `temperature` - Not configurable per-agent
- `permission` - Use `tools` instead
- `category`, `tags` - Metadata fields not supported

### Discovery Process

1. Scans `.claude/agents/**/*.md` files recursively
2. Parses YAML frontmatter from each file
3. Extracts description from first heading or paragraph
4. Infers capabilities from content keywords
5. Assigns default permissions: `['read', 'write', 'execute']`

### Implementation

**File:** `src/adapters/claude-adapter.ts`

Key methods:
- `discoverAgents()` - Recursively discovers agents from `.claude/agents/`
- `parseAgentMetadata()` - Parses YAML frontmatter and content
- `invokeAgent()` - Simulates agent invocation (CLI context)

**Note:** In production Claude Code, agents are invoked via the Task tool. The CLI adapter provides simulation for testing.

---

## Format Conversion

**File:** `src/conversion/format-converter.ts`

### Conversion Matrix

| From → To | Base | Claude Code | OpenCode |
|-----------|------|-------------|----------|
| **Base** | — | ✅ | ✅ |
| **Claude Code** | ✅ | — | ✅ |
| **OpenCode** | ✅ | ✅ | — |

### Key Conversion Rules

#### Base → Claude Code

1. **Tools conversion:** Object `{read: true}` → String `"Read"`
2. **Model conversion:** Any model → `inherit|sonnet|opus|haiku`
3. **Field stripping:** Remove `mode`, `temperature`, `permission`, `category`, `tags`
4. **Model default:** If unspecified or unmappable → `inherit`

Example:
```yaml
# Base
tools:
  read: true
  write: true
mode: subagent
temperature: 0.7

# → Claude Code
tools: Read, Write
model: inherit
# (mode and temperature removed)
```

#### Base → OpenCode

1. **Permission conversion:** `tools` object → `permission` object with `allow`/`deny` strings
2. **Mode default:** If unspecified → `subagent`
3. **Model format:** Ensure `provider/model` format
4. **Validation:** Verify all permissions are `allow`/`ask`/`deny` (not booleans)

Example:
```yaml
# Base
tools:
  read: true
  write: false

# → OpenCode
permission:
  read: allow
  write: deny
  edit: deny
  bash: deny
  webfetch: allow
mode: subagent
```

#### Claude Code → OpenCode

1. **Tools parsing:** Parse comma-separated string → permission object
2. **Mode assignment:** All agents become `subagent` mode
3. **Model conversion:** `inherit|sonnet|opus|haiku` → `opencode/grok-code` etc.

Example:
```yaml
# Claude Code
tools: Read, Write, Bash
model: sonnet

# → OpenCode
permission:
  read: allow
  write: allow
  bash: allow
  edit: deny
  webfetch: allow
mode: subagent
model: opencode/grok-code
```

### Internal Metadata Fields

These fields are automatically filtered out during conversion (they're for CodeFlow's internal use only):

- `output_format`
- `requires_structured_output`
- `validation_rules`
- `primary_objective`
- `anti_objectives`
- `intended_followups`

**Implementation:** `filterInternalFields()` method in `FormatConverter` class

---

## Validation & Best Practices

### OpenCode Validation

✅ **DO:**
- Use flat directory structure in `.opencode/agent/`
- Use string permissions: `allow`, `ask`, `deny`
- Specify `description` field (required)
- Use `permission` field (not `tools`)

❌ **DON'T:**
- Put agents in subdirectories
- Use boolean permissions (use strings)
- Forget the `description` field
- Mix `tools` and `permission` formats

### Claude Code Validation

✅ **DO:**
- Use comma-separated tool string: `"Read, Write"`
- Use valid model values: `inherit`, `sonnet`, `opus`, `haiku`
- Keep frontmatter minimal (only name, description, tools, model)

❌ **DON'T:**
- Use tools as object: `{read: true}`
- Add unsupported fields like `mode` or `temperature`
- Expect per-agent model enforcement

### Format Converter Validation

The `FormatConverter` class includes validation:

```typescript
// Permission validation
validatePermissions(permissions: Record<string, any>): {valid: boolean, errors: string[]}

// Model format validation
convertModelForClaudeCode(model: string): string | undefined
convertModelForOpenCode(model: string): string
```

---

## Testing

Run platform-specific tests:

```bash
# Test all adapters
npm run test:agents

# Test format conversion
npm run test:conversion

# Type checking
npm run typecheck
```

---

## References

- **OpenCode Official Docs:** https://opencode.ai/docs/agents/
- **OpenCode Skills Plugin:** https://github.com/malhashemi/opencode-skills
- **Claude Code Docs:** https://docs.claude.com/en/docs/claude-code/
- **Cursor Docs:** https://cursor.com/docs/agent/modes

---

## Version History

- **v0.20.10** - Documentation compliance verification
  - Verified all adapters match official specs
  - Confirmed OpenCode flat structure requirement
  - Added validation for permission formats
  - Documented internal metadata field filtering
