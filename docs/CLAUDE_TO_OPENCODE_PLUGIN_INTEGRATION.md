# Claude Code to OpenCode Plugin Integration Guide

## Executive Summary

This document outlines the differences between Claude Code plugins and OpenCode plugins, and provides strategies for integration and compatibility.

**Key Finding**: Claude Code plugins and OpenCode plugins are fundamentally different architectures that **cannot be directly converted** but can be **bridged** through strategic approaches.

---

## Architecture Comparison

### Claude Code Plugins

**Type**: Declarative Configuration Bundles

**Structure**:
```
my-plugin/
├── .claude-plugin/
│   └── plugin.json         # Metadata
├── commands/               # Markdown files with frontmatter
├── agents/                 # Markdown files with frontmatter
├── skills/                 # Subdirectories with SKILL.md
├── hooks/
│   └── hooks.json          # Hook configurations
└── .mcp.json               # MCP server configs
```

**Key Characteristics**:
- **Format**: Markdown files with YAML frontmatter + JSON configs
- **Distribution**: Git repositories via marketplace system
- **Installation**: `/plugin install plugin-name@marketplace`
- **Execution**: Declarative - Claude Code interprets the configs
- **Components**: Commands, agents, skills, hooks, MCP servers

**Example Agent (agents/python_pro.md)**:
```yaml
---
description: Master Python 3.12+ development
mode: subagent
temperature: 0.1
tools:
  write: true
  edit: true
  bash: true
---
You are a Python expert...
```

### OpenCode Plugins

**Type**: Executable JavaScript/TypeScript Modules

**Structure**:
```
.opencode/plugin/
└── my-plugin.ts            # Single executable module
```

**Key Characteristics**:
- **Format**: JavaScript/TypeScript code
- **Distribution**: File copying or npm packages
- **Installation**: Copy to `.opencode/plugin/` or `~/.config/opencode/plugin/`
- **Execution**: Imperative - Code runs in Node/Bun runtime
- **Components**: Event hooks, custom tools, lifecycle methods

**Example Plugin**:
```typescript
import type { Plugin } from "@opencode-ai/plugin"

export const MyPlugin: Plugin = async ({ app, client, $ }) => {
  return {
    // Event hook
    event: async ({ event }) => {
      console.log("Event:", event.type)
    },

    // Tool execution hooks
    tool: {
      execute: {
        before: async (input, output) => {
          // Intercept tool calls
        },
        after: async (input, output) => {
          // Post-process results
        }
      }
    }
  }
}
```

---

## OpenCode Plugin System Details

### Available Hooks

1. **Event Hooks**
   - `event`: Triggered on lifecycle events (e.g., `session.idle`)

2. **Tool Execution Hooks**
   - `tool.execute.before`: Pre-execution validation/blocking
   - `tool.execute.after`: Post-execution processing

3. **Lifecycle Hooks** (from SDK)
   - `onPreMessage`: Before message processing
   - `onPostMessage`: After message completion
   - `onContextPrime`: Context injection
   - `onPreToolCall`: Before any tool call
   - `onPostToolCall`: After tool completion

4. **Custom Tool Registration**
   - `tool`: Register new tools with Zod schemas

### Plugin Context Parameters

Plugins receive:
- `project`: Current project information
- `client`: OpenCode SDK client for AI interactions
- `$`: Bun's shell API for command execution
- `directory`: Current working directory
- `worktree`: Git worktree path
- `app`: Application context

### Custom Commands in OpenCode

Commands are **Markdown files** in `.opencode/command/`:

```markdown
---
description: "Run tests with coverage"
---
Run the full test suite with coverage:
`!npm test -- --coverage`
```

**Note**: OpenCode commands use the same markdown format as Claude Code!

---

## Key Differences

| Aspect | Claude Code Plugins | OpenCode Plugins |
|--------|-------------------|------------------|
| **Architecture** | Declarative bundles | Executable code |
| **Language** | Markdown + YAML + JSON | JavaScript/TypeScript |
| **Execution** | Interpreted by Claude Code | Runs in Node/Bun runtime |
| **Agents** | Markdown files with frontmatter | Not directly supported* |
| **Commands** | Markdown with frontmatter | Markdown with frontmatter ✓ |
| **Skills** | Markdown files | Not directly supported* |
| **Hooks** | JSON configuration | TypeScript event handlers |
| **Distribution** | Marketplace + Git | File copy / npm |
| **Custom Tools** | Not supported* | Full Zod schema support ✓ |

\* *Can be implemented via plugin code*

---

## Integration Strategies

### Strategy 1: Component Conversion (Partial Compatibility)

**What Works**: Commands can be directly migrated since both systems use markdown with frontmatter.

**Implementation**:
1. Use CodeFlow CLI to convert agents/commands/skills to OpenCode markdown format
2. Place converted commands in `.opencode/command/`
3. Commands work immediately in OpenCode

**Limitations**:
- Agents and skills don't have direct OpenCode equivalents
- Hooks require code rewrite
- MCP servers need separate configuration

**Code Example**:
```bash
# Convert Claude Code commands to OpenCode format
codeflow convert commands --output .opencode/command/

# Commands are now available in OpenCode
```

### Strategy 2: Plugin Wrapper Generator

**Concept**: Generate OpenCode plugin code that wraps Claude Code plugin components.

**Implementation**:
1. Parse Claude Code `plugin.json` and component files
2. Generate TypeScript plugin that:
   - Registers commands programmatically
   - Implements hooks as event handlers
   - Creates custom tools for agents/skills

**Example Generated Code**:
```typescript
export const ClaudePluginWrapper: Plugin = async ({ client, $ }) => {
  return {
    // Convert Claude hooks to OpenCode events
    tool: {
      execute: {
        before: async (input, output) => {
          // Execute Claude Code hook.json logic
        }
      }
    },

    // Register agents as custom tools
    tool: {
      name: "python_pro",
      description: "Master Python 3.12+ development",
      args: z.object({
        task: z.string()
      }),
      execute: async ({ task }) => {
        // Send task to client with agent prompt
        return await client.chat({
          prompt: agentPrompt,
          temperature: 0.1
        })
      }
    }
  }
}
```

**Advantages**:
- One-time conversion process
- Maintains plugin structure
- Enables full OpenCode capabilities

**Challenges**:
- Complex code generation
- Not all Claude features map to OpenCode
- Requires runtime dependency management

### Strategy 3: Dual-Format Plugin Authoring

**Concept**: Maintain both Claude Code and OpenCode versions of the same plugin.

**Implementation**:
1. Author plugin in OpenCode format (TypeScript)
2. Extract declarative components (commands, agents) as markdown
3. Package both formats:
   ```
   my-plugin/
   ├── .claude-plugin/       # Claude Code format
   │   └── plugin.json
   ├── commands/             # Shared markdown
   ├── agents/               # Shared markdown
   └── opencode/
       └── plugin.ts         # OpenCode executable
   ```

**Advantages**:
- Best of both worlds
- Single source repository
- Commands/agents shared as markdown

**Challenges**:
- Double maintenance burden
- Hooks must be maintained separately
- No automatic sync

### Strategy 4: OpenCode Plugin Development Kit (Recommended)

**Concept**: Create an OpenCode plugin that enables Claude Code plugin loading.

**Implementation**:

**Phase 1: Claude Plugin Loader**
```typescript
// .opencode/plugin/claude-plugin-loader.ts
export const ClaudePluginLoader: Plugin = async ({ directory, client }) => {
  const pluginPath = path.join(directory, '.claude-plugin/plugin.json')
  const pluginConfig = await loadClaudePlugin(pluginPath)

  return {
    event: async ({ event }) => {
      // Execute Claude Code hooks based on events
      await executeClaudeHooks(pluginConfig.hooks, event)
    },

    // Register agents as tools
    ...generateAgentTools(pluginConfig)
  }
}
```

**Phase 2: Extend CodeFlow CLI**

Add new command to CodeFlow CLI:
```bash
codeflow generate opencode-plugin --input ./my-claude-plugin --output ./my-opencode-plugin
```

This would:
1. Parse Claude Code plugin structure
2. Generate OpenCode plugin wrapper TypeScript
3. Copy/convert compatible components (commands)
4. Create tool registrations for agents
5. Convert hooks to event handlers

**Advantages**:
- Automated conversion
- Leverages existing CodeFlow CLI infrastructure
- Extensible for future features
- Community can contribute converters

---

## Recommended Implementation Plan

### Phase 1: Research & Documentation ✓ (Complete)

- [x] Analyze Claude Code plugin architecture
- [x] Analyze OpenCode plugin architecture
- [x] Document differences and compatibility matrix
- [x] Identify integration strategies

### Phase 2: Command Compatibility (Low-Hanging Fruit)

**Goal**: Enable Claude Code commands to work in OpenCode immediately

**Tasks**:
1. Update CodeFlow CLI to support command-only conversion mode
2. Add `.opencode/command/` as output target
3. Create migration guide for commands
4. Test with real-world command examples

**Timeline**: 1-2 days

### Phase 3: Plugin Wrapper Generator (Core Feature)

**Goal**: Auto-generate OpenCode plugins from Claude Code plugins

**Tasks**:
1. Create new `PluginConverter` class in CodeFlow CLI
2. Implement Claude Code plugin.json parser
3. Generate TypeScript plugin wrapper code
4. Handle agent-to-tool conversion
5. Handle hook-to-event conversion
6. Create template system for generated code

**Files to Create**:
- `src/converters/plugin-converter.ts`
- `src/generators/opencode-plugin-generator.ts`
- `src/types/plugin-types.ts`
- `templates/opencode-plugin.template.ts`

**Timeline**: 5-7 days

### Phase 4: Testing & Documentation

**Tasks**:
1. Test with example Claude Code plugins
2. Create comprehensive migration guide
3. Add integration tests
4. Document limitations and workarounds
5. Create example plugins demonstrating both formats

**Timeline**: 2-3 days

### Phase 5: Community Release

**Tasks**:
1. Publish updated CodeFlow CLI
2. Release migration guide
3. Create video tutorial
4. Engage with Claude Code and OpenCode communities

---

## Technical Feasibility Matrix

| Claude Code Feature | OpenCode Equivalent | Conversion Difficulty | Notes |
|---------------------|--------------------|-----------------------|-------|
| **Commands** | Commands | ✅ Easy | Same format! |
| **Agents (as markdown)** | Custom tools | ⚠️ Medium | Requires tool wrapper |
| **Skills (as markdown)** | Custom tools | ⚠️ Medium | Similar to agents |
| **Hooks (JSON config)** | Event handlers (TS) | 🔴 Hard | Requires code generation |
| **MCP Servers** | MCP integration | ⚠️ Medium | OpenCode supports MCP |
| **Plugin metadata** | Package.json | ✅ Easy | Standard mapping |
| **Marketplace** | NPM / Git | ⚠️ Medium | Different distribution |

---

## Example: Complete Conversion

### Input: Claude Code Plugin

**Structure**:
```
security-plugin/
├── .claude-plugin/
│   └── plugin.json
├── commands/
│   └── security-scan.md
├── agents/
│   └── security-expert.md
└── hooks/
    └── hooks.json
```

**plugin.json**:
```json
{
  "name": "security-plugin",
  "description": "Security scanning and guidance",
  "version": "1.0.0",
  "author": { "name": "Security Team" }
}
```

**commands/security-scan.md**:
```markdown
---
description: "Run security vulnerability scan"
---
Perform a comprehensive security scan of the codebase:
1. Check for known vulnerabilities
2. Scan dependencies
3. Review code for common security issues
```

**agents/security-expert.md**:
```yaml
---
description: Security analysis and remediation expert
mode: subagent
temperature: 0.2
tools:
  read: true
  grep: true
---
You are a security expert specialized in identifying and fixing vulnerabilities...
```

**hooks/hooks.json**:
```json
{
  "PostToolUse": {
    "command": "./scripts/log-tool-use.sh",
    "description": "Log all tool usage for security audit"
  }
}
```

### Output: Generated OpenCode Plugin

**Structure**:
```
security-plugin-opencode/
├── .opencode/
│   ├── command/
│   │   └── security-scan.md
│   └── plugin/
│       └── security-plugin.ts
└── package.json
```

**Generated .opencode/plugin/security-plugin.ts**:
```typescript
import type { Plugin } from "@opencode-ai/plugin"
import { z } from "zod"

export const SecurityPlugin: Plugin = async ({ client, $, directory }) => {
  // Security Expert Agent as Custom Tool
  const securityExpertTool = {
    name: "security_expert",
    description: "Security analysis and remediation expert",
    args: z.object({
      task: z.string().describe("Security task to perform"),
      context: z.string().optional().describe("Additional context")
    }),
    execute: async ({ task, context }) => {
      const prompt = `You are a security expert specialized in identifying and fixing vulnerabilities...

Task: ${task}
${context ? `Context: ${context}` : ''}
`

      const response = await client.chat({
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
        tools: {
          read: true,
          grep: true
        }
      })

      return response
    }
  }

  return {
    // Register security expert as tool
    tool: securityExpertTool,

    // Convert PostToolUse hook to event handler
    tool: {
      execute: {
        after: async (input, output) => {
          // Log tool usage for security audit
          await $`./scripts/log-tool-use.sh ${input.tool} ${JSON.stringify(output)}`
        }
      }
    }
  }
}
```

**Commands copied directly**:
`.opencode/command/security-scan.md` (same content as Claude version)

---

## Conclusion

### Summary

**Direct Conversion**: ❌ Not possible due to architectural differences

**Hybrid Approach**: ✅ Feasible with strategic conversion

**Best Path Forward**:
1. ✅ **Immediate**: Use commands directly (already compatible)
2. ⚠️ **Short-term**: Manual conversion for simple plugins
3. ✅ **Long-term**: Extend CodeFlow CLI with plugin generator

### Key Takeaways

1. **Commands are compatible** - Both systems use markdown with frontmatter
2. **Agents/Skills need wrappers** - Convert to custom tools in OpenCode
3. **Hooks require code generation** - JSON configs → TypeScript event handlers
4. **CodeFlow CLI is the right place** - Extends existing conversion infrastructure
5. **Not all features map 1:1** - Some manual adaptation required

### Next Steps

1. Update CodeFlow CLI with plugin conversion support
2. Create example conversions for common use cases
3. Document edge cases and limitations
4. Engage communities for feedback and contributions

---

## Resources

### Documentation
- [Claude Code Plugins](https://code.claude.com/docs/en/plugins)
- [Claude Code Plugin Reference](https://code.claude.com/docs/en/plugins-reference)
- [OpenCode Plugins](https://opencode.ai/docs/plugins/)
- [OpenCode Hooks Guide](https://dev.to/einarcesar/does-opencode-support-hooks-a-complete-guide-to-extensibility-k3p)

### Repositories
- [CodeFlow CLI](https://github.com/ferg-cod3s/codeflow)
- [Claude Code Examples](https://github.com/anthropics/claude-code)
- [OpenCode](https://github.com/opencode-ai/opencode)

### Related Issues
- [OpenCode Plugin System Feature Request #753](https://github.com/sst/opencode/issues/753) (Completed)
- [OpenCode Hooks Support #1473](https://github.com/sst/opencode/issues/1473)

---

**Document Version**: 1.0
**Last Updated**: 2025-11-17
**Author**: Claude (via CodeFlow CLI Research)
