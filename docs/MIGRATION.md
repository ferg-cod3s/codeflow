# Migration Guide: CodeFlow MVP Update



<!-- VERBALIZED SAMPLING INTEGRATION -->
<!-- ================================ -->

**Selected Strategy**: Code-Path Analysis
**Confidence**: 71.0%

**Available Strategies**:
1. **Code-Path Analysis** (Confidence: 71.0%)
   - Plan: Identify entry points and main execution flows, Trace key decision branches and conditional logic...
2. **Pattern Discovery** (Confidence: 71.0%)
   - Plan: Scan codebase for repeated code structures, Identify naming conventions and architectural patterns...
3. **Architecture Mapping** (Confidence: 71.0%)
   - Plan: Identify major components and modules, Map data flow and dependencies between components...


This guide explains how to migrate from previous versions of CodeFlow to the streamlined MVP version that focuses on core functionality.

## ⚠️ **Important Changes in MVP Release**

### **Removed Features**

- **MCP Server Integration**: The Model Context Protocol server has been removed
- **REST API Server**: Built-in REST API endpoints have been removed
- **Advanced Commands**: Commands like `mcp`, `server`, `pull`, `commands`, etc. have been removed
- **Diagnostic Tools**: Advanced diagnostic and validation commands have been simplified

### **Retained MVP Commands**

- `codeflow setup` - Initialize projects
- `codeflow status` - Check project status
- `codeflow sync` - Sync agents to projects
- `codeflow convert` - Convert agent formats
- `codeflow watch start` - Watch for changes

### **Supported Flags**

- `--force` - Force overwrite existing files
- `--project` - Specify project path
- `--global` - Use global agent directory
- `--type` - Target platform type (claude-code/opencode)
- `--validate` - Validate agents before conversion
- `--dry-run` - Preview changes without applying them

## 🚨 **Breaking Changes**

### **What Changed**

- **Single Source of Truth**: All agents now use `BaseAgent` format in `codeflow-agents/` directory
- **Unified Validation**: One validation schema for all agent types
- **Simplified Conversion**: Format conversion focuses on data transformation, not interface changes
- **Removed Interfaces**: `ClaudeCodeAgent` and `OpenCodeAgent` are now type aliases to `BaseAgent`

### **What's New**

- **Consistent Structure**: All agents follow the same base format
- **Better Validation**: Comprehensive validation with format-aware recommendations
- **Easier Maintenance**: Update once, convert everywhere
- **Future-Proof**: Easy to add new output formats

## 🔄 **Migration Steps**

### **Step 1: Backup Your Agents**

```bash
# Create backup of existing agents
cp -r claude-agents/ claude-agents-backup/
cp -r opencode-agents/ opencode-agents-backup/
cp -r codeflow-agents/ codeflow-agents-backup/
```

### **Step 2: Consolidate to Single Format**

Move all your agents to the `codeflow-agents/` directory and ensure they follow the `BaseAgent` format:

```markdown
---
name: your-agent-name
description: Description of when this agent should be invoked
mode: subagent # Optional: subagent or primary
temperature: 0.7 # Optional: 0-2 range
model: claude-sonnet-4-20250514 # Optional: model identifier
tools: # Optional: object with boolean values
  read: true
  write: true
  edit: true
  bash: true
  grep: true
  glob: true
  list: true

# OpenCode-specific fields (optional)
usage: When to use this agent
do_not_use_when: When NOT to use this agent
escalation: How to escalate if needed
examples: Example usage scenarios
prompts: Suggested prompts
constraints: Usage constraints
---

Your agent's system prompt and instructions go here...
```

### **Step 3: Update Agent Files**

#### **For Claude Code Agents**

**Before (Old Format):**

```markdown
---
name: your-agent-name
description: Your agent description
tools: tool1, tool2, tool3
---
```

**After (New Format):**

```markdown
---
name: your-agent-name
description: Your agent description
mode: subagent
temperature: 0.7
model: providerId/modelId
tools:
  read: true
  write: true
---
```

##### **Tools Available for Claude Code**

[https://docs.anthropic.com/en/docs/claude-code/settings#tools-available-to-claude](Claude Code Tools)

**Tools Available as of 08-31-2025**
| Tool | Description | Permission Required |
|------|-------------|-------------------|
| Bash | Executes shell commands in your environment | Yes |
| Edit | Makes targeted edits to specific files | Yes |
| Glob | Finds files based on pattern matching | No |
| Grep | Searches for patterns in file contents | No |
| LS | Lists files and directories | No |
| MultiEdit | Performs multiple edits on a single file atomically | Yes |
| NotebookEdit | Modifies Jupyter notebook cells | Yes |
| NotebookRead | Reads and displays Jupyter notebook contents | No |
| Read | Reads the contents of files | No |
| Task | Runs a sub-agent to handle complex, multi-step tasks | No |
| TodoWrite | Creates and manages structured task lists | No |
| WebFetch | Fetches content from a specified URL | Yes |
| WebSearch | Performs web searches with domain filtering | Yes |
| Write | Creates or overwrites files | Yes |

#### **For OpenCode Agents**

**Before (Old Format):**

```markdown
---
description: Your agent description
mode: subagent
model: providerId/modelId
tools:
  tool1: true/false
  tool2: true/false
  tool3: true/false
---
```

**After (New Format):**

```markdown
---
name: your-agent-name
description: Your agent description
mode: subagent
model: providerId/modelId
tools:
  tool1: true/false
  tool2: true/false
  tool3: true/false
---
```

### **Step 4: Regenerate Output Formats**

```bash
# Convert all agents to Claude Code format
codeflow convert-all --format claude-code

# Convert all agents to OpenCode format
codeflow convert-all --format opencode

# Verify the conversion worked
codeflow status
```

### **Step 5: Update Your Workflow**

**Before:**

```bash
# Had to manually sync between formats
codeflow sync-formats
codeflow sync-global
```

**After:**

```bash
# Single source of truth automatically converts
codeflow convert-all --format claude-code
codeflow convert-all --format opencode
```

## 🧪 **Testing Your Migration**

### **Run the Test Suite**

```bash
# Run all tests to ensure everything works
pnpm test

# Run specific migration tests
pnpm test:conversion
```

### **Validate Your Agents**

```bash
# Check for validation issues
codeflow validate

# Test format conversion
codeflow convert-all --dry-run --format claude-code
codeflow convert-all --dry-run --format opencode
```

### **Verify Round-trip Conversion**

```bash
# Test that conversion preserves data integrity
codeflow convert-all --format claude-code
codeflow convert-all --format base
codeflow convert-all --format opencode
```

## 🔧 **Troubleshooting**

### **Common Issues**

#### **Validation Errors**

**Problem:** `Property 'name' is missing`
**Solution:** Add `name` field to all your agents

**Problem:** `Mode must be either "subagent" or "primary"`
**Solution:** Change `mode: agent` to `mode: subagent` or `mode: primary`

#### **Conversion Failures**

**Problem:** `Cannot convert from claude-code to base`
**Solution:** Ensure all agents have required fields (`name`, `description`)

**Problem:** `Tools validation failed`
**Solution:** Convert tools from comma-separated string to object format

### **Rollback Plan**

If you encounter issues, you can rollback:

```bash
# Restore from backup
cp -r claude-agents-backup/ claude-agents/
cp -r opencode-agents-backup/ opencode-agents/
cp -r codeflow-agents-backup/ codeflow-agents/

# Revert to previous version
git checkout HEAD~1
```

## 📚 **New Features to Explore**

### **Enhanced Validation**

```bash
# Get validation recommendations
codeflow validate --recommendations

# Check specific agent
codeflow validate agent-name
```

### **Format Conversion**

```bash
# Convert individual agents
codeflow convert agent-name --format claude-code

# Batch conversion
codeflow convert-all --format opencode --output-dir ./opencode-output
```

### **Status and Monitoring**

```bash
# Check project status
codeflow status

# List all agents
codeflow list-agents

# Show format differences
codeflow show-format-differences
```

## 🎯 **Best Practices After Migration**

### **Agent Management**

1. **Always edit agents in `codeflow-agents/`** - this is your single source of truth
2. **Use descriptive names** - lowercase with hyphens (e.g., `full-stack-developer`)
3. **Include comprehensive descriptions** - helps with automatic delegation
4. **Set appropriate tool permissions** - only enable tools the agent needs

### **Workflow Optimization**

1. **Run conversion after every agent update** - ensures consistency
2. **Use dry-run mode** - preview changes before applying
3. **Monitor validation warnings** - address quality issues proactively
4. **Regular format sync** - keep all directories in sync

### **Team Collaboration**

1. **Version control your agents** - commit changes to `codeflow-agents/`
2. **Document agent purposes** - clear descriptions help team members
3. **Review agent quality** - use validation recommendations
4. **Share agent templates** - create reusable patterns

## 🚀 **What's Next**

After migration, you can:

- **Add new output formats** easily by extending the conversion engine
- **Implement advanced validation** rules specific to your use cases
- **Create agent templates** for common patterns
- **Integrate with CI/CD** for automated agent validation
- **Build custom tools** that work with the unified format

## 📞 **Need Help?**

- **Documentation**: Check the main [README.md](../README.md)
- **Issues**: Report problems on GitHub
- **Discussions**: Join community discussions
- **Examples**: See sample agents in the `examples/` directory

---

**Happy migrating! 🎉** The new single-format approach will make your CodeFlow experience much more maintainable and powerful.
