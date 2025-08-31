---
date: 2025-08-30T05:46:29-07:00
researcher: johnferguson
git_commit: 63ddfd7
branch: master
repository: codeflow
topic: "Agent Format Validation - Claude Code, OpenCode, and Base Agents for MCP"
tags: [research, agents, validation, claude-code, opencode, mcp, format-compliance]
status: complete
last_updated: 2025-08-30
last_updated_by: johnferguson
---

## Ticket Synopsis

Deep research to validate all agent formats (Claude Code, OpenCode, and base agents) for proper formatting and setup, ensuring compliance with official documentation and MCP integration requirements.

## Summary

The Codeflow system contains **445+ agent files** across three distinct formats with varying levels of compliance:
- **Claude Code format**: 73% compliance (241/330 files) - Missing descriptions primary issue
- **OpenCode format**: 55% compliance (63/115 files) - YAML frontmatter and missing fields
- **MCP Base Agents**: Generally excellent with critical OpenCode subfolder issues

The MCP integration is production-ready with comprehensive documentation, but format inconsistencies need immediate attention for reliable agent registry parsing.

## Detailed Findings

### Agent Distribution and Locations

**Total Agent Ecosystem**:
- **330 Claude Code format** agents across `.claude/`, `claude-agents/`, and global directories
- **115 OpenCode format** agents in `.opencode/`, `opencode-agents/`, and nested subdirectories
- **29 base agents** in `codeflow-agents/` directory with MCP integration
- **Significant overlap**: Many agents exist in multiple formats (converted/duplicated)

**Key Directories**:
- `codeflow-agents/` - Base format agents for MCP integration
- `.claude/` - Project-specific Claude Code agents
- `.opencode/` - Project-specific OpenCode agents
- `claude-agents/`, `opencode-agents/` - Format-specific collections
- `mcp/` - MCP server and agent registry implementation

### Claude Code Format Validation Results

**Compliance**: 73% (241/330 files compliant)

**Critical Issues Identified**:
1. **Missing descriptions (83 files)**: Most common error - empty or malformed `description` fields
   - `/Users/<user_name>/codeflow/claude-agents/operations_incident_commander.md` - Empty pipe delimiter
   - `/Users/<user_name>/codeflow/claude-agents/content_localization_coordinator.md` - Malformed structure

2. **Missing YAML frontmatter (6 files)**: Files without proper `---` delimiters
   - `/Users/johnferguson/.claude/agents/README.md` - Documentation file mixed with agents

3. **Field inconsistencies (45+ files)**: Missing `name` or `mode` fields required for proper agent identification

**Recommended Claude Code Format**:
```yaml
---
name: agent-name
description: Clear description of when this agent should be invoked
tools: Read, Write, Grep, Bash  # Optional - inherits all if omitted
model: sonnet  # Optional - sonnet, opus, haiku
color: "#HEX_COLOR"  # Optional
priority: high  # Optional
---

System prompt content defining role and capabilities.
```

### OpenCode Format Validation Results

**Compliance**: 55% (63/115 files compliant)

**Critical Issues Identified**:
1. **Invalid YAML frontmatter (6 files)**: Malformed structure preventing parsing
   - `.opencode/agent/opencode/content_localization_coordinator.md`
   - `.opencode/agent/opencode/operations_incident_commander.md`
   - `.opencode/agent/opencode/quality-testing_performance_tester.md`

2. **Missing required fields (20+ files)**: Files lacking `mode`, `model`, `temperature`, `tools`
   - `monitoring_expert.md`, `analytics_engineer.md`, `system_architect.md`

3. **Invalid tools configuration (15+ files)**: `tools: undefined` instead of object structure
   - Should be: `tools: { write: true, read: false, bash: true }`

**Proper OpenCode Format**:
```yaml
---
description: Agent purpose and capabilities
mode: primary|subagent|all
model: provider/model-name
temperature: 0.0-2.0
tools:
  write: true
  edit: true
  read: true
  bash: true
  grep: true
---

Agent system prompt and instructions.
```

### Base Agents and MCP Integration Assessment

**Overall Status**: Excellent foundation with specific issues in OpenCode subfolder

**Strengths**:
- **Robust MCP Server**: `mcp/codeflow-server.mjs` implements comprehensive Model Context Protocol
- **Agent Registry**: Dynamic discovery with priority-based loading
- **Tool Registration**: Clean 7-command interface (research, plan, execute, test, document, commit, review)
- **Documentation Quality**: `AGENT_REGISTRY.md` and `MCP_INTEGRATION.md` are comprehensive

**Critical Issues**:
- **Malformed OpenCode Agents in `/agent/opencode/`**: Missing closing frontmatter delimiters
- **Field Name Inconsistencies**: Using `role:` instead of `description:` breaks parsing
- **Documentation Gaps**: Missing agent format validation specifications

### Format Compliance by Location

**High Compliance Areas**:
- `/agent/` base directory: ~90% compliant
- Core workflow agents: Consistently well-formatted
- MCP server integration: Production-ready

**Problem Areas**:
- `.opencode/agent/opencode/` subdirectory: Multiple malformed files
- `claude-agents/` directory: High rate of missing descriptions
- Global agent directories: Mixed quality and inconsistent formatting

## Code References

**MCP Server Implementation**:
- `mcp/codeflow-server.mjs:1-200` - Main MCP server with agent registry integration
- `mcp/agent-registry.mjs:112` - Agent parsing expecting `description` field
- `mcp/agent-spawner.mjs:1-50` - Agent instantiation logic

**Agent Registry Documentation**:
- `AGENT_REGISTRY.md:1-100` - Comprehensive agent catalog and usage guidelines
- `MCP_INTEGRATION.md:1-50` - Setup and integration documentation

**Problem Files Requiring Immediate Attention**:
- `.opencode/agent/opencode/content_localization_coordinator.md:1-10` - Malformed frontmatter
- `claude-agents/operations_incident_commander.md:1-5` - Empty description field
- `.opencode/agent/opencode/quality-testing_performance_tester.md:1-8` - Missing frontmatter delimiter

## Architecture Insights

**Multi-Format Strategy**: The system successfully supports three agent formats with conversion capabilities, enabling broad compatibility across AI platforms.

**MCP Integration Pattern**: Uses dynamic agent discovery with priority-based loading (project > global > default) ensuring flexible agent management.

**Agent Specialization**: Clear separation between:
- **Core workflow agents**: Research, analysis, and pattern finding
- **Domain specialists**: Operations, database, performance, SEO, localization
- **Platform-specific agents**: Claude Code vs OpenCode optimized variants

## Historical Context (from thoughts/)

**Previous Research**:
- `thoughts/research/2025-08-26_automated-global-configs-mcp-integration.md` - Established MCP architecture
- `thoughts/research/2025-08-28_phase-7-completion-gaps-analysis.md` - Validated system completeness
- `thoughts/documentation/2025-08-27-codeflow-developer-guide.md` - Documents agent format patterns

**Architecture Decisions**:
- Multi-format support chosen for maximum AI platform compatibility
- Priority-based agent loading for flexible override patterns
- MCP integration for standardized AI tool protocols

## Open Questions

1. **Format Standardization**: Should the system converge on fewer formats or maintain multi-format flexibility?

2. **Validation Pipeline**: Should agent format validation be integrated into CI/CD to prevent malformed agents?

3. **Agent Deduplication**: How should the system handle duplicate agents across different format directories?

4. **Documentation Strategy**: Should format specifications be separated into dedicated technical documentation?

## Immediate Action Items

### Critical (Fix Immediately):
1. **Fix malformed OpenCode agents** in `.opencode/agent/opencode/` - 6 files with invalid YAML
2. **Complete missing descriptions** in Claude Code agents - 83 files affected
3. **Standardize field names** - Convert `role:` to `description:` for MCP compatibility

### High Priority:
1. **Add missing required fields** in OpenCode agents - 20+ files incomplete
2. **Fix tools configuration** - Replace `tools: undefined` with proper object structure
3. **Update documentation** - Add format validation specifications to registry documentation

### Medium Priority:
1. **Standardize model format** - Use consistent `provider/model-name` pattern
2. **Consolidate duplicate agents** - Reduce redundancy across format directories
3. **Enhance validation** - Create format validation script for development workflow

The system demonstrates excellent architectural foundation and MCP integration, but requires immediate attention to format compliance issues to ensure reliable agent registry parsing and cross-platform compatibility.
