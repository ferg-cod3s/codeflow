# OpenCode `/init` Command Research

**Date:** 2025-11-27  
**Researcher:** Claude AI Assistant  
**Purpose:** Comprehensive analysis of OpenCode's `/init` command implementation for potential integration into CodeFlow

---

## Executive Summary

This document analyzes the OpenCode `/init` command, which creates or updates `AGENTS.md` files to provide AI agents with project-specific context. This is analogous to Claude Code's `CLAUDE.md` but uses a different file name and format.

### Key Findings

- **Output File**: `AGENTS.md` (not `CLAUDE.md`)
- **Purpose**: Generates ~20 line markdown file with build commands and code style guidelines
- **Implementation**: Built-in default command using a text template
- **Customization**: Can be overridden via config

---

## 1. Implementation Details

### 1.1 File Locations

| File | Path | Purpose |
|------|------|---------|
| Main Command | `packages/opencode/src/command/index.ts` | Command definition and registration |
| Template | `packages/opencode/src/command/template/initialize.txt` | Prompt template for `/init` |

### 1.2 Command Definition

From `command/index.ts`:

```typescript
export namespace Command {
  export const Default = {
    INIT: "init",
  } as const

  export const Info = z.object({
    name: z.string(),
    description: z.string().optional(),
    agent: z.string().optional(),      // Optional agent to use
    model: z.string().optional(),      // Optional model override
    template: z.string(),              // The prompt template
    subtask: z.boolean().optional(),   // Run as subtask
  })
}
```

### 1.3 Default Registration

The `/init` command is automatically registered if not overridden in config:

```typescript
if (result[Default.INIT] === undefined) {
  result[Default.INIT] = {
    name: "init",
    description: "create/update AGENTS.md",
    template: PROMPT_INITIALIZE.replace("${path}", Instance.worktree),
  }
}
```

---

## 2. Template Content

### 2.1 Full Template (`initialize.txt`)

```text
Please analyze this codebase and create an AGENTS.md file containing:
1. Build/lint/test commands - especially for running a single test
2. Code style guidelines including imports, formatting, types, naming conventions, error handling, etc.

The file you create will be given to agentic coding agents (such as yourself) that operate in this repository. Make it about 20 lines long.
If there are Cursor rules (in .cursor/rules/ or .cursorrules) or Copilot rules (in .github/copilot-instructions.md), make sure to include them.

If there's already an AGENTS.md, improve it if it's located in ${path}

$ARGUMENTS
```

### 2.2 Template Variables

| Variable | Description |
|----------|-------------|
| `${path}` | Replaced with `Instance.worktree` (project root path) |
| `$ARGUMENTS` | Placeholder for user-provided arguments when invoking command |

---

## 3. Output Format: `AGENTS.md`

### 3.1 Structure

The generated `AGENTS.md` file typically contains:

1. **Header** - Project name and purpose
2. **Build/Test Commands** - Essential commands for development
3. **Code Style** - Project conventions and guidelines
4. **Architecture** - (Optional) Key patterns and structure

### 3.2 Example Output

From OpenCode's own `packages/opencode/AGENTS.md`:

```markdown
# opencode agent guidelines

## Build/Test Commands

- **Install**: `bun install`
- **Run**: `bun run index.ts`
- **Typecheck**: `bun run typecheck` (npm run typecheck)
- **Test**: `bun test` (runs all tests)
- **Single test**: `bun test test/tool/tool.test.ts` (specific test file)

## Code Style

- **Runtime**: Bun with TypeScript ESM modules
- **Imports**: Use relative imports for local modules, named imports preferred
- **Types**: Zod schemas for validation, TypeScript interfaces for structure
- **Naming**: camelCase for variables/functions, PascalCase for classes/namespaces
- **Error handling**: Use Result patterns, avoid throwing exceptions in tools
- **File structure**: Namespace-based organization (e.g., `Tool.define()`, `Session.create()`)

## Architecture

- **Tools**: Implement `Tool.Info` interface with `execute()` method
- **Context**: Pass `sessionID` in tool context, use `App.provide()` for DI
- **Validation**: All inputs validated with Zod schemas
- **Logging**: Use `Log.create({ service: "name" })` pattern
- **Storage**: Use `Storage` namespace for persistence
- **API Client**: Go TUI communicates with TypeScript server via stainless SDK.
```

---

## 4. Command Schema

### 4.1 Full Command Configuration

From `config/config.ts`:

```typescript
command: z
  .record(z.string(), Command)
  .optional()
  .describe("Command configuration, see https://opencode.ai/docs/commands")
```

Each command supports:

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Command name (used as `/name`) |
| `description` | string? | Human-readable description |
| `agent` | string? | Specific agent to use |
| `model` | string? | Model override for this command |
| `template` | string | Prompt template with variables |
| `subtask` | boolean? | Run as subtask in conversation |

### 4.2 Custom Command Example

Users can override `/init` in their `.opencode/config.json`:

```json
{
  "command": {
    "init": {
      "description": "Create custom project context file",
      "template": "Analyze this codebase and create a PROJECT.md with...",
      "agent": "codebase_analyzer"
    }
  }
}
```

---

## 5. Comparison with Claude Code

### 5.1 Key Differences

| Aspect | OpenCode | Claude Code |
|--------|----------|-------------|
| **Output File** | `AGENTS.md` | `CLAUDE.md` |
| **Target Length** | ~20 lines | Variable |
| **Rule Integration** | Includes Cursor/Copilot rules | Project-specific |
| **Customization** | Via config | Via prompt |
| **Default Command** | Built-in `/init` | Built-in `/init` |

### 5.2 Similarities

- Both create project context files for AI agents
- Both include build/test commands and code style
- Both can be customized or extended
- Both are invoked via `/init` slash command

---

## 6. Integration Recommendations for CodeFlow

### 6.1 Create Equivalent Command

CodeFlow should implement an `/init` command that:

1. **Generates `AGENTS.md`** - Following OpenCode convention
2. **Detects existing context** - Cursor rules, Copilot rules, existing CLAUDE.md
3. **Supports customization** - Via CodeFlow config
4. **Integrates with agents** - Can use `codebase_analyzer` agent

### 6.2 Proposed Template

```markdown
Please analyze this codebase and create an AGENTS.md file containing:
1. Build/lint/test commands - especially for running a single test
2. Code style guidelines including imports, formatting, types, naming conventions, error handling
3. Key architecture patterns and conventions

The file will be given to AI coding agents operating in this repository.
Target length: 20-30 lines.

Integration checks:
- Cursor rules: .cursor/rules/, .cursorrules
- Copilot rules: .github/copilot-instructions.md
- Existing CLAUDE.md: incorporate or convert

If AGENTS.md exists at ${path}, improve it.

$ARGUMENTS
```

### 6.3 Command Definition

```yaml
---
name: init
description: Create or update AGENTS.md with project context for AI agents
agent: codebase_analyzer
template: |
  ${TEMPLATE_CONTENT}
---
```

---

## 7. Files to Create in CodeFlow

### 7.1 New Files Needed

1. **`commands/init.md`** - The `/init` command definition
2. **`base-skills/development/project-initialization.md`** - Skill for project context generation
3. **`templates/agents-md.txt`** - Default template for AGENTS.md generation

### 7.2 Updates Needed

1. **`CLAUDE.md`** - Document the `/init` command
2. **`README.md`** - Add `/init` to command list
3. **`docs/COMMANDS_OPENCODE_COMPLIANCE.md`** - Track compliance

---

## 8. Next Steps

1. [ ] Create `/init` command in `commands/init.md`
2. [ ] Create project initialization skill
3. [ ] Test with various project types
4. [ ] Document in CLAUDE.md
5. [ ] Add to command catalog

---

## 9. References

- **OpenCode Source**: `packages/opencode/src/command/index.ts`
- **Template Source**: `packages/opencode/src/command/template/initialize.txt`
- **Config Schema**: `packages/opencode/src/config/config.ts`
- **OpenCode Docs**: https://opencode.ai/docs/commands

---

**Document Version:** 1.0  
**Last Updated:** 2025-11-27  
**Project:** CodeFlow CLI
