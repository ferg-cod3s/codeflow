# Quick Start: Claude Code Plugin Compatibility with OpenCode

## TL;DR

**Good News**: Claude Code commands work directly in OpenCode! 🎉

**Other Components**: Agents, skills, and hooks need conversion (roadmap in progress)

---

## What You Can Do Today

### Option 1: Manual Command Migration (5 minutes)

**If your Claude Code plugin only has commands:**

```bash
# Navigate to your project
cd my-project

# Create OpenCode command directory if it doesn't exist
mkdir -p .opencode/command

# Copy Claude Code commands to OpenCode
cp -r .claude-plugin/commands/* .opencode/command/

# Done! Commands are now available in OpenCode
```

**Test it:**
```bash
opencode
# In OpenCode, type: /your-command-name
```

### Option 2: Use CodeFlow CLI (Recommended)

**Install CodeFlow CLI:**
```bash
npm install -g @codeflow/cli
# or
git clone https://github.com/ferg-cod3s/codeflow
cd codeflow
npm install
npm run build:cli
```

**Convert commands:**
```bash
codeflow convert commands \
  --input .claude-plugin/commands \
  --output .opencode/command
```

---

## Current Compatibility Matrix

| Component | Status | Effort | Method |
|-----------|--------|--------|--------|
| **Commands** | ✅ Works | 5 min | Direct copy or CLI |
| **Agents** | ⚠️ Manual | 30 min | Convert to OpenCode plugin |
| **Skills** | ⚠️ Manual | 20 min | Convert to OpenCode plugin |
| **Hooks** | 🔴 Complex | 1-2 hours | Requires code rewrite |
| **MCP Servers** | ⚠️ Manual | 20 min | Reconfigure for OpenCode |

---

## Example: Migrate Commands

### Before (Claude Code Plugin)

**Directory Structure:**
```
my-security-plugin/
├── .claude-plugin/
│   └── plugin.json
└── commands/
    ├── security-scan.md
    ├── fix-vulnerabilities.md
    └── audit-dependencies.md
```

**commands/security-scan.md:**
```markdown
---
description: "Run comprehensive security scan"
---
Perform a security audit of the codebase:

1. Scan for known vulnerabilities
2. Check dependency versions
3. Review code for security issues
4. Generate security report
```

### After (OpenCode)

**Directory Structure:**
```
my-project/
└── .opencode/
    └── command/
        ├── security-scan.md
        ├── fix-vulnerabilities.md
        └── audit-dependencies.md
```

**No changes to file content needed!**

**Usage in OpenCode:**
```bash
opencode
# Type: /security-scan
# OpenCode executes the command
```

---

## Manual Agent Conversion Example

**If you need agents now and can't wait for automated conversion:**

### Step 1: Extract Agent Details

**Claude Code Agent** (`.claude-plugin/agents/python-expert.md`):
```yaml
---
description: Python development expert
mode: subagent
temperature: 0.1
tools:
  write: true
  edit: true
  bash: true
---
You are a Python expert specialized in:
- Writing clean, Pythonic code
- Following PEP 8 standards
- Implementing type hints
- Writing comprehensive tests
```

### Step 2: Create OpenCode Plugin

**File**: `.opencode/plugin/python-expert.ts`

```typescript
import type { Plugin } from "@opencode-ai/plugin"
import { z } from "zod"

export const PythonExpert: Plugin = async ({ client }) => {
  return {
    tool: {
      name: "python_expert",
      description: "Python development expert",
      args: z.object({
        task: z.string().describe("Python development task"),
        files: z.array(z.string()).optional().describe("Relevant files")
      }),
      execute: async ({ task, files }) => {
        const prompt = `You are a Python expert specialized in:
- Writing clean, Pythonic code
- Following PEP 8 standards
- Implementing type hints
- Writing comprehensive tests

Task: ${task}
${files ? `Files: ${files.join(', ')}` : ''}
`

        const response = await client.chat({
          messages: [{ role: "user", content: prompt }],
          temperature: 0.1,
          tools: {
            write: true,
            edit: true,
            bash: true
          }
        })

        return response
      }
    }
  }
}
```

### Step 3: Use in OpenCode

```bash
opencode
# Agent is now available as a tool
# OpenCode can invoke it automatically when Python tasks are detected
```

---

## Manual Hook Conversion Example

**If you absolutely need hooks now:**

### Claude Code Hook

**File**: `.claude-plugin/hooks/hooks.json`
```json
{
  "PostToolUse": {
    "command": "./scripts/validate-code.sh",
    "description": "Validate code after edits"
  }
}
```

### OpenCode Plugin Hook

**File**: `.opencode/plugin/code-validator.ts`

```typescript
import type { Plugin } from "@opencode-ai/plugin"

export const CodeValidator: Plugin = async ({ $ }) => {
  return {
    tool: {
      execute: {
        after: async (input, output) => {
          // Only validate on edit/write tools
          if (input.tool === 'edit' || input.tool === 'write') {
            console.log('🔍 Validating code...')

            try {
              await $`./scripts/validate-code.sh ${output.args.filePath}`
              console.log('✅ Code validation passed')
            } catch (error) {
              console.error('❌ Code validation failed:', error)
              throw new Error('Code validation failed. Please fix issues.')
            }
          }
        }
      }
    }
  }
}
```

---

## Troubleshooting

### Commands Not Showing Up

**Check:**
1. Files are in `.opencode/command/` directory
2. Files have `.md` extension
3. Files have valid YAML frontmatter with `description` field
4. OpenCode is restarted after adding commands

**Fix:**
```bash
# Verify file structure
ls -la .opencode/command/

# Check file content
cat .opencode/command/my-command.md

# Restart OpenCode
```

### Agent Plugin Not Working

**Check:**
1. Plugin file is in `.opencode/plugin/` or `~/.config/opencode/plugin/`
2. Plugin exports a valid Plugin function
3. TypeScript/JavaScript syntax is correct
4. Required dependencies installed (`@opencode-ai/plugin`, `zod`)

**Fix:**
```bash
# Install dependencies
npm install @opencode-ai/plugin zod

# Check plugin syntax
npx tsc --noEmit .opencode/plugin/my-plugin.ts

# Enable plugin in opencode.json
cat > opencode.json <<EOF
{
  "plugins": {
    "my-plugin": {
      "enabled": true
    }
  }
}
EOF
```

### Hook Not Triggering

**Check:**
1. Hook is in correct event (e.g., `tool.execute.before` vs `tool.execute.after`)
2. Script path is correct and executable
3. Plugin is enabled in configuration

**Debug:**
```typescript
export const MyPlugin: Plugin = async ({ $ }) => {
  return {
    tool: {
      execute: {
        after: async (input, output) => {
          // Add logging
          console.log('🪝 Hook triggered:', input.tool)
          console.log('📦 Output:', output)

          // Your hook logic here
        }
      }
    }
  }
}
```

---

## Best Practices

### 1. Start Simple

Begin with commands only, then add complexity:
```
Phase 1: Migrate commands ✅
Phase 2: Add simple agents
Phase 3: Implement hooks
Phase 4: Complex integrations
```

### 2. Test Incrementally

Don't convert everything at once:
```bash
# Convert one command
cp .claude-plugin/commands/test.md .opencode/command/

# Test it
opencode
# /test

# If it works, convert the rest
cp .claude-plugin/commands/* .opencode/command/
```

### 3. Use Version Control

Track your conversions:
```bash
git checkout -b feature/opencode-migration
# Make conversions
git add .opencode/
git commit -m "Add OpenCode plugin compatibility"
```

### 4. Document Custom Changes

If you manually convert agents/hooks, document it:
```markdown
<!-- .opencode/MIGRATION_NOTES.md -->
# Migration from Claude Code Plugin

## Agents Converted
- python_expert: Converted to custom tool (see plugin/python-expert.ts)
- security_scanner: Manual conversion required due to complex dependencies

## Hooks Converted
- PostToolUse validation: Converted to tool.execute.after hook

## Known Issues
- MCP server config needs manual setup
- Some environment variables need remapping
```

---

## What's Coming Next

### Short Term (Weeks 1-2)
- ✅ Complete research and documentation
- 🔄 Update CodeFlow CLI for command conversion
- 🔄 Create example conversions

### Medium Term (Weeks 3-4)
- ⏳ Automated plugin conversion in CodeFlow CLI
- ⏳ Agent-to-tool converter
- ⏳ Hook-to-event converter

### Long Term (Months 1-2)
- ⏳ Full plugin ecosystem compatibility
- ⏳ Bidirectional conversion
- ⏳ Plugin marketplace integration

**Track progress**: See [PLUGIN_INTEGRATION_ROADMAP.md](./PLUGIN_INTEGRATION_ROADMAP.md)

---

## Get Help

### Documentation
- [Full Integration Guide](./CLAUDE_TO_OPENCODE_PLUGIN_INTEGRATION.md)
- [Implementation Roadmap](./PLUGIN_INTEGRATION_ROADMAP.md)
- [Claude Code Plugin Docs](https://code.claude.com/docs/en/plugins)
- [OpenCode Plugin Docs](https://opencode.ai/docs/plugins/)

### Community
- [CodeFlow CLI Issues](https://github.com/ferg-cod3s/codeflow/issues)
- [OpenCode Community](https://github.com/opencode-ai/opencode/discussions)
- [Claude Code Community](https://github.com/anthropics/claude-code/discussions)

### Examples
- See `examples/` directory (coming soon)
- Community conversions (coming soon)
- Video tutorials (coming soon)

---

## Contributing

**Want to help?**

1. Try converting your Claude Code plugins
2. Report issues you encounter
3. Share successful conversions
4. Contribute to CodeFlow CLI development

**See**: [PLUGIN_INTEGRATION_ROADMAP.md](./PLUGIN_INTEGRATION_ROADMAP.md#resources-needed)

---

**Last Updated**: 2025-11-17
**Status**: Commands supported today, full automation coming soon
**Questions?**: Open an issue on GitHub
