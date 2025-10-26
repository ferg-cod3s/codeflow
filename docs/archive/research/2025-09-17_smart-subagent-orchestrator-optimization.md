---
date: 2025-09-17T12:00:00Z
researcher: Assistant
git_commit: $(git rev-parse HEAD)
branch: main
repository: codeflow
topic: 'Smart Subagent Orchestrator Prompt Optimization for Cross-Platform Compatibility'
tags: [research, orchestration, prompt-optimization, cross-platform, claude-code, opencode, mcp]
status: complete
last_updated: 2025-09-17
last_updated_by: Assistant
---

## Ticket Synopsis

The ticket requests ensuring the prompt for the smart-subagent-orchestrator.md is efficient and working for both OpenCode and Claude Code. It notes that parallel subagent spawning works well in Claude Code but has problems in OpenCode.

## Summary

The smart-subagent-orchestrator prompt has critical issues preventing effective cross-platform operation:

1. **Incorrect MCP Tool Assumptions**: The prompt references `codeflow.agent.<name>` MCP tools that don't exist
2. **Excessive Verbosity**: 295-line prompt with redundant conceptual documentation  
3. **Platform Invocation Confusion**: Unclear guidance on how to invoke agents in different environments
4. **Missing Context Function Usage**: No explanation of how to use agent functions provided in workflow command context

The root cause is a mismatch between the prompt's assumptions and the actual MCP server implementation, which only exposes workflow commands with agent functions as context, not individual agent tools.

## Detailed Findings

### Current Prompt Issues

#### 1. MCP Tool Availability Mismatch

**Problem**: The prompt assumes individual agents are exposed as MCP tools (`codeflow.agent.full-stack-developer`).

**Evidence**: Lines 101, 183, 246 in smart-subagent-orchestrator.md reference these non-existent tools.

**Actual Implementation**: MCP server only registers workflow commands (research, plan, execute, etc.) and provides agent functions as context:
- `spawnAgent(agentId, task)`
- `parallelAgents(agentIds, tasks)` 
- `sequentialAgents(agentSpecs)`

#### 2. Platform Invocation Pattern Confusion

**Problem**: Invocation instructions are scattered and don't clearly differentiate between platforms.

**Evidence**: 
- Claude Code uses: `Task tool with subagent_type: "agent-name"`
- OpenCode expects: `codeflow.agent.<name>` (but these don't exist)

**Impact**: Users attempt to use non-existent tools in OpenCode, causing failures.

#### 3. Excessive Documentation Length

**Problem**: 295-line prompt with redundant conceptual explanations.

**Evidence**: Multiple sections repeat orchestration philosophy and agent coordination concepts.

**Impact**: Increased cognitive load and potential context window issues.

### Platform-Specific Analysis

#### Claude Code Environment
- ✅ **Works**: Task tool with `subagent_type` parameter
- ✅ **Parallel Spawning**: Functions correctly
- ✅ **Agent Discovery**: Dynamic via Task tool

#### OpenCode/MCP Environment  
- ❌ **Broken**: References non-existent `codeflow.agent.<name>` tools
- ❌ **Parallel Issues**: Attempting to use non-existent tools
- ✅ **Available**: Agent functions in workflow command context

### Code Architecture Findings

#### MCP Server Implementation
```javascript
// From mcp/codeflow-server.mjs
// Only workflow commands are registered as tools
server.registerTool("research", {...})
server.registerTool("plan", {...})

// Agent functions provided as context to commands
const context = {
  spawnAgent: (agentId, task) => spawnAgentTask(agentId, task, globalAgentRegistry),
  parallelAgents: (agentIds, tasks) => executeParallelAgents(agentIds, tasks, globalAgentRegistry),
  // ...
}
```

#### Agent Spawning Infrastructure
```javascript
// From mcp/agent-spawner.mjs
// Parallel execution uses Promise.all correctly
async function executeParallelAgents(agentIds, tasks, registry, options = {}) {
  const promises = agentIds.map((agentId, index) =>
    spawnAgentTask(agentId, tasks[index], registry, options)
  );
  return Promise.all(promises);
}
```

## Architecture Insights

### Root Cause Analysis

The orchestrator prompt was written assuming an MCP tool architecture that doesn't exist. The actual implementation provides agent orchestration capabilities through workflow command context functions, not individual agent tools.

### Platform Invocation Patterns

| Platform | Invocation Method | Parallel Support | Agent Discovery |
|----------|------------------|------------------|-----------------|
| Claude Code | `Task(subagent_type: "agent-name")` | ✅ Works | Dynamic |
| OpenCode | Context functions in workflow commands | ✅ Works | Static list |

### Performance Considerations

- **Prompt Length**: 295 lines may exceed context windows in some scenarios
- **Parallel Execution**: Promise.all implementation is correct but unused due to tool confusion
- **Caching**: No caching mechanism for agent discovery or orchestration patterns

## Optimized Prompt Recommendations

### Core Changes Required

1. **Remove MCP Tool References**: Eliminate all `codeflow.agent.<name>` references
2. **Add Platform-Specific Guidance**: Clear sections for Claude Code vs OpenCode invocation
3. **Condense Conceptual Content**: Reduce from 295 to ~150 lines
4. **Explain Context Functions**: Document how to use workflow command context

### Proposed Prompt Structure

```markdown
---
name: smart-subagent-orchestrator
# ... frontmatter ...

# Smart Subagent Orchestrator

## Purpose
Coordinate complex multi-domain projects by selecting and orchestrating specialized subagents dynamically.

## Platform-Specific Invocation

### Claude Code
Use Task tool with subagent_type parameter:
```
Task tool invocation with: { subagent_type: "full-stack-developer", objective: "..." }
```

### OpenCode/MCP  
Use agent functions provided in workflow command context:
```
# Within workflow commands (research, plan, execute, etc.)
spawnAgent("full-stack-developer", "implement user authentication")
parallelAgents(["agent1", "agent2"], ["task1", "task2"])
```

## Orchestration Strategy
[Condensed version of current strategy sections]

## Agent Selection Heuristics
[Streamlined selection criteria]
```

## Historical Context (from research/)

- `research/plans/command-prompt-optimization-plan.md` - Identified task spawning limits and parallel execution concerns
- `research/research/2025-09-13_command_prompt_baseline.md` - Documented excessive prompt lengths (2,006 tokens for research.md)
- `research/research/2025-09-07_opencode-agents-problems.md` - Agent naming and registry issues
- `research/plans/agent-ecosystem-uats-compliance-implementation.md` - Orchestrator escalation chain updates

## Related Research

- `research/research/2025-09-08_agent-upgrade-guidelines.md` - Agent orchestration patterns
- `research/research/2025-09-08_subagent-test-results-and-docs.md` - Agent registry and orchestration testing

## Open Questions

- Should individual agent MCP tools be implemented to match the prompt assumptions?
- What is the optimal prompt length for different context window sizes?
- How can agent discovery be improved for dynamic environments?

## Recommendations

### Immediate Actions

1. **Update Prompt**: Remove MCP tool references and add platform-specific invocation guidance
2. **Condense Content**: Reduce prompt length by 40-50% through content consolidation  
3. **Add Context Documentation**: Explain workflow command agent functions
4. **Test Cross-Platform**: Validate parallel spawning works in both environments

### Long-term Improvements

1. **Implement Agent MCP Tools**: Consider adding individual `codeflow.agent.<name>` tools if beneficial
2. **Prompt Optimization Framework**: Create guidelines for prompt length and structure
3. **Dynamic Agent Discovery**: Improve agent enumeration and capability detection
4. **Performance Monitoring**: Add metrics for orchestration efficiency and success rates

## Implementation Plan

### Phase 1: Prompt Optimization
- [ ] Remove incorrect MCP tool references
- [ ] Add clear platform invocation sections  
- [ ] Condense redundant conceptual content
- [ ] Document context function usage

### Phase 2: Testing & Validation
- [ ] Test parallel spawning in Claude Code
- [ ] Test parallel spawning in OpenCode via workflow commands
- [ ] Validate prompt length reduction
- [ ] Measure orchestration performance

### Phase 3: Monitoring & Iteration
- [ ] Monitor orchestration success rates
- [ ] Collect user feedback on prompt clarity
- [ ] Iterate based on usage patterns
