# Platform Arguments & Defaults



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


This document explains how arguments and defaults work across different AI coding platforms that integrate with Codeflow.

## Supported Platforms

### 1. Claude Code (.claude.ai/code)
- **Agent System**: Native (no MCP needed)
- **Argument Style**: Direct command arguments
- **Documentation**: https://docs.claude.ai/code

### 2. OpenCode (opencode.ai)
- **Agent System**: Native (no MCP needed)
- **Argument Style**: YAML frontmatter
- **Documentation**: https://opencode.ai/docs

### 3. MCP-Compatible Clients (Cursor, VS Code, etc.)
- **Agent System**: MCP bridge
- **Argument Style**: JSON parameters
- **Documentation**: https://modelcontextprotocol.io

## Argument Handling Patterns

### Claude Code Arguments

```bash
# Direct argument passing
/research "Analyze authentication system" --scope=codebase --depth=deep
/plan --files="ticket.md,research.md" --scope=feature --complexity=medium
/execute --plan_path="plan.md" --start_phase=1 --strictness=standard
/test --scope="OAuth implementation" --files="auth.js" --plan="plan.md"
/document --audience="developer" --files="api.js" --changelog="changes.md"
/review --plan_path="plan.md" --scope="current_session" --strictness="standard"
/commit  # No arguments needed - analyzes git state automatically
```

**Default Values:**
- `scope`: `"codebase"` (research), `"feature"` (plan)
- `depth`: `"medium"` (research)
- `start_phase`: `1` (execute)
- `strictness`: `"standard"` (review)
- `audience`: `"developer"` (document)
- `complexity`: `"medium"` (plan)

### OpenCode Arguments

```yaml
---
name: research
mode: command
scope: codebase
depth: deep
model: anthropic/claude-sonnet-4
temperature: 0.1
---

Analyze the authentication system including user models, session handling, middleware, and security patterns.
```

**Default Values:**
- `scope`: `"both"` (codebase + thoughts)
- `depth`: `"medium"`
- `model`: `"anthropic/claude-sonnet-4"`
- `temperature`: `0.1`
- `mode`: `"command"`

### Body Content Variable Syntax

Commands reference input parameters in their body content using platform-specific syntax:

#### OpenCode: `$ARGUMENTS`

OpenCode uses a **single generic placeholder** for all command arguments:

```markdown
Create a new React component named $ARGUMENTS with TypeScript support.
```

**Important Limitation**: OpenCode can only pass arguments as a single string. Commands with multiple parameters will receive all arguments as one value.

**Example**:
- Command: `/research authentication flows`
- `$ARGUMENTS` receives: `"authentication flows"`

#### Claude Code & Cursor: `{{variable}}`

Claude and Cursor use **named parameters** matching frontmatter inputs:

```markdown
Research the {{topic}} in {{scope}} with {{depth}} analysis.
```

**Multiple parameters work independently**:
- `{{ticket}}` - receives ticket file path
- `{{query}}` - receives search query
- `{{scope}}` - receives scope parameter
- `{{depth}}` - receives depth parameter

#### Conversion Behavior

When converting commands:

**To OpenCode**: All `{{variable}}` → `$ARGUMENTS`
- Multi-parameter commands get a warning comment
- OpenCode users must provide arguments as single string

**To Claude/Cursor**: `$ARGUMENTS` → `{{primary_parameter}}`
- Uses first required input parameter name
- Falls back to first input if no required parameters
- Enables proper multi-parameter functionality

### MCP Arguments

```json
{
  "tool": "research",
  "parameters": {
    "ticket": "docs/tickets/auth-ticket.md",
    "scope": "codebase",
    "depth": "deep"
  }
}
```

**Default Values:**
- Same as Claude Code defaults
- JSON schema validation
- Structured parameter passing

## Date Formatting

### Research Document Dates

**Correct Format:** `2025-09-27T12:00:00Z` (current date/time)
**Incorrect Format:** `2025-01-26T...` (placeholder or wrong date)

**Platform-Specific Handling:**

**Claude Code:**
```bash
# Uses current system time automatically
/research "topic"  # Date: 2025-09-27T12:00:00Z
```

**OpenCode:**
```yaml
---
name: research
current_date: "2025-09-27T12:00:00Z"  # Auto-generated
---
```

**MCP:**
```json
{
  "current_date": "2025-09-27T12:00:00Z"
}
```

### Date Utility Functions

The system provides consistent date formatting:

```typescript
import { getCurrentDateForResearch, formatResearchDate } from './utils/date-utils';

// For research docs
const date = getCurrentDateForResearch(); // "2025-09-27T12:00:00Z"

// For file naming
const filenameDate = getDateForFilename(); // "2025-09-27"
```

## Common Issues & Solutions

### Issue: Wrong Dates in Research Docs

**Problem:** Getting `2025-01-26` instead of current date
**Cause:** Template placeholder not replaced or wrong timezone
**Solution:**
- Ensure `current_date` variable is properly set
- Use UTC timezone for consistency
- Verify system clock is correct

### Issue: Missing Arguments

**Problem:** Command fails due to missing required arguments
**Solution:**
- Check platform-specific syntax
- Use defaults where available
- Provide explicit values for required parameters

### Issue: Platform-Specific Syntax Errors

**Problem:** Arguments work on one platform but not another
**Solution:**
- Use platform-specific syntax (direct args vs YAML vs JSON)
- Check platform documentation
- Test with minimal arguments first

## Platform Feature Comparison

| Feature | Claude Code | OpenCode | MCP Clients |
|---------|-------------|----------|-------------|
| Native Agents | ✅ | ✅ | ❌ (uses MCP) |
| Direct Args | ✅ | ❌ | ❌ |
| YAML Frontmatter | ❌ | ✅ | ❌ |
| JSON Parameters | ❌ | ❌ | ✅ |
| Auto-Defaults | ✅ | ✅ | ✅ |
| Date Formatting | ✅ | ✅ | ✅ |
| Documentation | docs.claude.ai | opencode.ai/docs | modelcontextprotocol.io |

## Best Practices

1. **Test on Target Platform**: Arguments that work on Claude Code may need YAML format for OpenCode
2. **Use Defaults**: Rely on sensible defaults to reduce argument complexity
3. **Validate Dates**: Always check that research docs use current date, not placeholders
4. **Check Documentation**: Refer to platform-specific docs for syntax requirements
5. **Start Simple**: Use minimal arguments first, then add complexity

## Migration Guide

### From Claude Code to OpenCode

```bash
# Claude Code
/research "topic" --scope=codebase --depth=deep

# OpenCode (YAML)
/research
---
name: research
scope: codebase
depth: deep
---
topic
```

### From OpenCode to MCP

```yaml
# OpenCode
---
name: research
scope: codebase
---

# MCP
{
  "tool": "research",
  "parameters": {
    "scope": "codebase"
  }
}
```

This ensures consistent behavior across all supported platforms while respecting each platform's native argument handling patterns.
