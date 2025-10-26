---
date: 2025-09-17T13:00:00Z
researcher: Assistant
git_commit: $(git rev-parse HEAD)
branch: main
repository: codeflow
topic: 'Smart Subagent Orchestrator Prompt Optimization Implementation Plan'
tags: [implementation, orchestration, prompt-optimization, cross-platform, claude-code, opencode, mcp]
status: draft
last_updated: 2025-09-17
last_updated_by: Assistant
---

## Ticket Synopsis

Implement optimization of the smart-subagent-orchestrator prompt to ensure efficient operation and working parallel subagent spawning across both OpenCode and Claude Code environments.

## Summary

The smart-subagent-orchestrator prompt contains critical issues preventing effective cross-platform operation: incorrect MCP tool assumptions, excessive verbosity (295 lines), platform invocation confusion, and missing context function documentation. This implementation plan outlines a phased approach to optimize the prompt for both Claude Code and OpenCode/MCP environments.

## Detailed Analysis

### Current Issues

#### 1. MCP Tool Availability Mismatch
- **Problem**: Prompt references `codeflow.agent.<name>` tools that don't exist
- **Impact**: Users attempt non-existent tools in OpenCode, causing failures
- **Evidence**: Lines 56-57, 101, 183, 246 in smart-subagent-orchestrator.md

#### 2. Excessive Prompt Length  
- **Problem**: 295-line prompt exceeds context windows and increases cognitive load
- **Impact**: Potential context window issues and reduced efficiency
- **Evidence**: Multiple redundant sections repeating orchestration concepts

#### 3. Platform Invocation Confusion
- **Problem**: Invocation patterns scattered and not clearly differentiated
- **Impact**: Users confused about correct syntax for each platform
- **Evidence**: Mixed references to Task tool, MCP tools, and context functions

#### 4. Missing Context Function Documentation
- **Problem**: No explanation of workflow command agent functions
- **Impact**: Users don't know how to properly spawn agents in OpenCode
- **Evidence**: Context functions (spawnAgent, parallelAgents) not documented in prompt

### Technical Architecture

#### Current Implementation
```javascript
// MCP server provides agent functions in workflow command context
const context = {
  spawnAgent: (agentId, task) => spawnAgentTask(agentId, task, globalAgentRegistry),
  parallelAgents: (agentIds, tasks) => executeParallelAgents(agentIds, tasks, globalAgentRegistry),
  sequentialAgents: (agentSpecs) => executeSequentialAgents(agentSpecs, globalAgentRegistry)
}
```

#### Platform Invocation Patterns
| Platform | Method | Parallel Support | Agent Discovery |
|----------|--------|------------------|-----------------|
| Claude Code | `Task(subagent_type: "agent-name")` | ✅ Works | Dynamic |
| OpenCode | Context functions in workflow commands | ✅ Works | Static list |

## Implementation Plan

### Phase 1: Prompt Structure Optimization

#### Overview
Restructure the smart-subagent-orchestrator.md prompt to remove incorrect assumptions, add clear platform guidance, and condense verbose sections.

#### Tasks

##### 1.1 Remove MCP Tool References
- **File**: `codeflow-agents/generalist/smart-subagent-orchestrator.md`
- **Changes**: 
  - Remove all `codeflow.agent.<name>` references (lines 56-57, 101, 183, 246)
  - Replace with context function usage examples
- **Success Criteria**: No references to non-existent MCP tools remain

##### 1.2 Add Platform-Specific Invocation Sections
- **File**: `codeflow-agents/generalist/smart-subagent-orchestrator.md` 
- **Changes**:
  - Add clear "Claude Code" section with Task tool examples
  - Add clear "OpenCode/MCP" section with context function examples
  - Remove scattered platform references
- **Success Criteria**: Each platform has dedicated, unambiguous invocation guidance

##### 1.3 Condense Conceptual Content
- **File**: `codeflow-agents/generalist/smart-subagent-orchestrator.md`
- **Changes**:
  - Reduce prompt from 295 to ~150 lines (40-50% reduction)
  - Merge redundant sections (orchestration philosophy repeated 3+ times)
  - Remove illustrative agent lists (lines 188-225)
  - Condense FAQ section (lines 279-288)
- **Success Criteria**: Prompt length reduced by 40-50%, redundant content eliminated

##### 1.4 Document Context Functions
- **File**: `codeflow-agents/generalist/smart-subagent-orchestrator.md`
- **Changes**:
  - Add section explaining workflow command context functions
  - Include examples: `spawnAgent()`, `parallelAgents()`, `sequentialAgents()`
  - Clarify when and how to use each function
- **Success Criteria**: Users understand how to spawn agents in OpenCode environment

#### Success Criteria (Phase 1)
- [ ] Prompt length reduced from 295 to ~150 lines
- [ ] No MCP tool references remain
- [ ] Clear platform-specific invocation sections exist
- [ ] Context function usage documented
- [ ] UATS compliance maintained
- [ ] Manual review confirms clarity and correctness

#### Testing (Phase 1)
- [ ] Validate prompt parses correctly
- [ ] Check UATS compliance validation passes
- [ ] Manual review by team members for clarity

### Phase 2: Cross-Platform Testing & Validation

#### Overview  
Test the optimized prompt works correctly in both Claude Code and OpenCode environments, with focus on parallel agent spawning.

#### Tasks

##### 2.1 Claude Code Testing
- **Environment**: Claude Code environment
- **Changes**: Deploy updated prompt and test Task tool invocation
- **Test Cases**:
  - Single agent spawning with Task tool
  - Parallel agent spawning with multiple Task tools
  - Error handling for invalid agent names
- **Success Criteria**: Parallel spawning works correctly in Claude Code

##### 2.2 OpenCode/MCP Testing
- **Environment**: OpenCode/MCP environment  
- **Changes**: Deploy updated prompt and test context function usage
- **Test Cases**:
  - Single agent spawning via workflow command context
  - Parallel agent spawning via `parallelAgents()` function
  - Sequential agent spawning via `sequentialAgents()` function
  - Error handling for invalid agent names
- **Success Criteria**: Parallel spawning works correctly in OpenCode

##### 2.3 Integration Testing
- **Environment**: Both platforms
- **Changes**: Test end-to-end orchestration workflows
- **Test Cases**:
  - Research workflow with parallel locator agents
  - Planning workflow with parallel specialist agents
  - Error propagation and recovery
- **Success Criteria**: Orchestration workflows complete successfully on both platforms

#### Success Criteria (Phase 2)
- [ ] Parallel agent spawning works in Claude Code
- [ ] Parallel agent spawning works in OpenCode via context functions
- [ ] Error handling works correctly on both platforms
- [ ] Orchestration workflows complete successfully
- [ ] Performance metrics collected (response time, success rate)

#### Testing (Phase 2)
- [ ] Automated tests for agent spawning functions
- [ ] Manual testing in both environments
- [ ] Performance benchmarking
- [ ] Error scenario testing

### Phase 3: Monitoring & Iteration

#### Overview
Monitor orchestration performance and gather feedback for future improvements.

#### Tasks

##### 3.1 Performance Monitoring
- **Changes**: Add metrics collection for orchestration operations
- **Metrics**:
  - Agent spawning success rate
  - Parallel execution time
  - Context function usage patterns
  - Error rates by platform
- **Success Criteria**: Baseline performance metrics established

##### 3.2 User Feedback Collection
- **Changes**: Gather feedback from users on prompt clarity
- **Methods**:
  - Usage surveys
  - Error report analysis
  - Success rate monitoring
- **Success Criteria**: User feedback collected and analyzed

##### 3.3 Documentation Updates
- **Files**: 
  - `docs/AGENT_REGISTRY.md`
  - `docs/ARCHITECTURE_OVERVIEW.md`
- **Changes**: Update documentation to reflect optimized prompt
- **Success Criteria**: Documentation accurately reflects current implementation

#### Success Criteria (Phase 3)
- [ ] Performance metrics collected and analyzed
- [ ] User feedback gathered and incorporated
- [ ] Documentation updated
- [ ] Improvement opportunities identified

#### Testing (Phase 3)
- [ ] Metrics collection working
- [ ] Feedback mechanisms in place
- [ ] Documentation review completed

## Risk Assessment

### High Risk
- **Platform Compatibility Breakage**: Changes might break existing Claude Code workflows
  - **Mitigation**: Extensive testing in both environments before deployment
  - **Rollback**: Revert to previous prompt version

- **Context Function Misuse**: Users might misuse context functions causing errors
  - **Mitigation**: Clear documentation and examples
  - **Rollback**: Additional guidance in prompt

### Medium Risk  
- **Prompt Length Issues**: Condensed prompt might lose important information
  - **Mitigation**: Careful review and team validation
  - **Rollback**: Restore condensed sections if needed

- **Performance Regression**: Changes might affect orchestration speed
  - **Mitigation**: Performance testing and monitoring
  - **Rollback**: Optimize based on metrics

## Dependencies

### External Dependencies
- Claude Code environment access for testing
- OpenCode/MCP environment access for testing
- Team members available for manual review

### Internal Dependencies
- UATS compliance validation scripts working
- Agent registry properly configured
- MCP server running correctly

## Success Metrics

### Automated Verification
- [ ] Prompt length reduced by 40-50%
- [ ] UATS compliance validation passes
- [ ] No MCP tool references in prompt
- [ ] Platform-specific sections exist
- [ ] Context function documentation present

### Manual Verification
- [ ] Parallel spawning works in Claude Code
- [ ] Parallel spawning works in OpenCode
- [ ] Prompt clarity confirmed by team review
- [ ] Error handling works correctly
- [ ] Performance acceptable

## Timeline

### Phase 1: Prompt Optimization (2-3 days)
- Day 1: Remove MCP tool references and add platform sections
- Day 2: Condense content and document context functions  
- Day 3: Review, testing, and validation

### Phase 2: Cross-Platform Testing (3-4 days)
- Day 1-2: Claude Code testing
- Day 3-4: OpenCode testing and integration testing

### Phase 3: Monitoring & Iteration (1-2 weeks)
- Week 1: Performance monitoring and feedback collection
- Week 2: Documentation updates and improvement planning

## Open Questions

- Should individual agent MCP tools be implemented to simplify usage?
- What is the optimal prompt length for different context window sizes?
- How can agent discovery be improved for dynamic environments?

## Related Research

- `research/research/2025-09-17_smart-subagent-orchestrator-optimization.md` - Root cause analysis
- `research/plans/command-prompt-optimization-plan.md` - General prompt optimization guidelines
- `research/plans/agent-ecosystem-uats-compliance-implementation.md` - Agent ecosystem requirements
- `research/research/2025-09-08_agent-upgrade-guidelines.md` - Agent upgrade standards

## Implementation Checklist

### Pre-Implementation
- [ ] Research document reviewed and understood
- [ ] Team alignment on approach
- [ ] Test environments prepared
- [ ] Backup of current prompt created

### During Implementation
- [ ] Changes made incrementally with testing
- [ ] UATS compliance maintained
- [ ] Cross-platform testing performed
- [ ] Performance monitored

### Post-Implementation
- [ ] Documentation updated
- [ ] Team training completed
- [ ] Monitoring in place
- [ ] Feedback mechanisms active

## Rollback Plan

### Immediate Rollback
1. Revert `codeflow-agents/generalist/smart-subagent-orchestrator.md` to previous version
2. Restart MCP server
3. Verify functionality restored

### Partial Rollback
1. Keep platform-specific sections but revert content condensation
2. Re-add context function documentation but keep MCP tool removal
3. Test incrementally

### Validation After Rollback
- [ ] Parallel spawning works in both environments
- [ ] No functionality regressions
- [ ] User impact minimized
