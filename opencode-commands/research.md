---
name: research
description: Comprehensive codebase and documentation analysis using specialized agents to gather context and insights
mode: command
version: 1.0.0
outputs:
  - Comprehensive research report
  - Code analysis with file locations
  - Documentation insights
  - External research findings
  - Recommended next steps
cache_strategy:
  type: content_based
  ttl: 600
  max_size: 100
success_signals:
  - Command completed successfully
failure_modes:
  - Command execution failed
examples:
  - prompt: Research user authentication system
    expected_outcome: Complete understanding of auth flow, security measures, and integration points
  - prompt: Research payment processing implementation
    expected_outcome: Analysis of payment flows, security compliance, and error handling
allowed_directories:
  - /Users/johnferguson/Github/codeflow
  - /Users/johnferguson/Github/codeflow/src
  - /Users/johnferguson/Github/codeflow/tests
  - /Users/johnferguson/Github/codeflow/docs
  - /Users/johnferguson/Github/codeflow/thoughts
  - /Users/johnferguson/Github/codeflow/packages/*/src
  - /Users/johnferguson/Github/codeflow/packages/*/tests
permission:
  edit: ask
  bash: ask
  webfetch: allow
---
set -euo pipefail

# Deep Research & Analysis Command

Conducts comprehensive research across your codebase, documentation, and external sources to provide deep understanding and actionable insights.

## How It Works

This command orchestrates multiple specialized agents in a carefully designed workflow:

### Phase 1: Discovery (Parallel)

- 🔍 **codebase-locator** finds relevant files and components
- 📚 **research-locator** discovers existing documentation and notes

### Phase 2: Analysis (Sequential)

- 🧠 **codebase-analyzer** understands implementation details
- 💡 **research-analyzer** extracts insights from documentation

### Phase 3: External Research (Optional)

- 🌐 **web-search-researcher** gathers external context and best practices

## When to Use

**Perfect for:**

- Starting work on unfamiliar parts of the codebase
- Planning new features or major changes
- Understanding complex systems or architectures
- Debugging issues that span multiple components
- Creating onboarding documentation

**Example Research Questions:**

- "How does the user authentication system work?"
- "What's the current state of our API rate limiting?"
- "How should we implement real-time notifications?"
- "What are the performance bottlenecks in our data processing pipeline?"

## What You'll Get

### Research Report Includes:

- **Code Analysis**: File locations, key functions, and implementation patterns
- **Documentation Insights**: Existing docs, decisions, and context
- **Architecture Overview**: How components interact and data flows
- **External Research**: Best practices, alternatives, and recommendations
- **Action Items**: Specific next steps based on findings

### Sample Output Structure:

```
## Research Summary
- Objective: [Your research question]
- Key Findings: [3-5 major insights]
- Confidence Level: [High/Medium/Low]

## Codebase Analysis
- Core Files: [List with explanations]
- Key Functions: [Important methods and their purposes]
- Data Flow: [How information moves through the system]

## Documentation Insights
- Existing Docs: [Relevant documentation found]
- Past Decisions: [Architecture decisions and reasoning]
- Known Issues: [Documented problems or limitations]

## Recommendations
- Immediate Actions: [What to do first]
- Long-term Considerations: [Strategic recommendations]
- Potential Risks: [Things to watch out for]
```

## Platform-Specific Usage

### Claude Code (.claude.ai/code)

Use direct command arguments with native parsing:

```bash
# Basic research with defaults
/research "How does the authentication system work?"

# Advanced research with explicit parameters
/research "Analyze user session management" --scope=codebase --depth=deep

# Research from ticket file
/research --ticket="docs/tickets/auth-ticket.md" --scope=both --depth=medium
```

**Default Values:**

- `scope`: `"codebase"`
- `depth`: `"medium"`

### OpenCode (opencode.ai)

Use YAML frontmatter format for argument specification:

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

### MCP-Compatible Clients (Cursor, VS Code, etc.)

Use JSON parameter format for structured arguments:

```json
{
  "tool": "research",
  "parameters": {
    "query": "How does the authentication system work?",
    "scope": "codebase",
    "depth": "deep",
    "ticket": "docs/tickets/auth-ticket.md"
  }
}
```

**Default Values:**

- Same as Claude Code defaults
- JSON schema validation
- Structured parameter passing

## Pro Tips

1. **Be Specific**: "Research authentication" vs "Research OAuth2 implementation and session management"
2. **Set Context**: Include any constraints, requirements, or specific areas of focus
3. **Follow Up**: Use results to inform `/plan` and `/execute` commands
4. **Iterate**: Research findings often lead to more specific research questions
5. **Platform Awareness**: Use platform-specific syntax (direct args vs YAML vs JSON) for optimal results

## Enhanced Subagent Orchestration

### Advanced Research Workflow

For complex research requiring deep analysis across multiple domains:

#### Phase 1: Comprehensive Discovery (Parallel Execution)

- **codebase-locator**: Maps all relevant files, components, and directory structures
- **research-locator**: Discovers existing documentation, past decisions, and technical notes
- **codebase-pattern-finder**: Identifies recurring implementation patterns and architectural approaches
- **web-search-researcher**: Gathers external best practices and industry standards (when applicable)

#### Phase 2: Deep Analysis (Sequential Processing)

- **codebase-analyzer**: Provides detailed implementation understanding with file:line evidence
- **research-analyzer**: Extracts actionable insights from documentation and historical context
- **system-architect**: Analyzes architectural implications and design patterns
- **performance-engineer**: Evaluates performance characteristics and optimization opportunities

#### Phase 3: Domain-Specific Assessment (Conditional)

- **database-expert**: Analyzes data architecture and persistence patterns
- **api-builder**: Evaluates API design and integration approaches
- **security-scanner**: Assesses security architecture and potential vulnerabilities
- **compliance-expert**: Reviews regulatory compliance requirements
- **infrastructure-builder**: Analyzes deployment and infrastructure implications

#### Phase 4: Synthesis & Validation (Parallel)

- **code-reviewer**: Validates research findings against code quality standards
- **test-generator**: Identifies testing gaps and coverage requirements
- **quality-testing-performance-tester**: Provides performance benchmarking insights

### Orchestration Best Practices

1. **Parallel Discovery**: Always start with multiple locators running simultaneously for comprehensive coverage
2. **Sequential Analysis**: Process analyzers sequentially to build upon locator findings
3. **Domain Escalation**: Engage domain specialists when research reveals specialized concerns
4. **Validation Gates**: Use reviewer agents to validate findings before synthesis
5. **Iterative Refinement**: Re-engage subagents as new questions emerge from initial findings

### Research Quality Indicators

- **Comprehensive Coverage**: Multiple agents provide overlapping validation
- **Evidence-Based**: All findings include specific file:line references
- **Contextual Depth**: Historical decisions and architectural rationale included
- **Actionable Insights**: Clear next steps and implementation guidance provided
- **Risk Assessment**: Potential issues and constraints identified

### Performance Optimization

- **Agent Sequencing**: Optimized order minimizes redundant analysis
- **Context Sharing**: Agents share findings to avoid duplicate work
- **Early Termination**: Stop analysis when sufficient understanding is achieved
- **Caching Strategy**: Leverage cached results for similar research topics

## Integration with Other Commands

- **→ /plan**: Use research findings to create detailed implementation plans
- **→ /execute**: Begin implementation with full context
- **→ /document**: Create documentation based on research insights
- **→ /review**: Validate that implementation matches research findings

---

_Ready to dive deep? Ask me anything about your codebase and I'll provide comprehensive insights to guide your next steps._

$ARGUMENTS 

## Example Usage

!`echo "Processing arguments: $ARGUMENTS"`

## File References

Use @filename to reference files in arguments