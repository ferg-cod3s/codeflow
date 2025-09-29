---
name: research
description: Comprehensive codebase and documentation analysis using specialized agents to gather context and insights
mode: command
model: anthropic/claude-sonnet-4
version: 2.1.0-optimized
last_updated: 2025-09-29
command_schema_version: "1.0"
outputs:
  - name: result
    type: string
    description: Command execution result
cache_strategy:
  type: content_based
  ttl: 3600
  scope: command
success_signals:
  - Command completed successfully
  - Task executed without errors
failure_modes:
  - Command execution failed
  - Invalid parameters provided
  - System error occurred
---
# Deep Research & Analysis Command

Conducts comprehensive research across your codebase, documentation, and external sources to provide deep understanding and actionable insights.

## How It Works

This command orchestrates multiple specialized agents in a carefully designed workflow:

### Phase 1: Discovery (Parallel)
- 🔍 **codebase-locator** finds relevant files and components
- 📚 **thoughts-locator** discovers existing documentation and notes

### Phase 2: Analysis (Sequential)
- 🧠 **codebase-analyzer** understands implementation details
- 💡 **thoughts-analyzer** extracts insights from documentation

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

## Pro Tips

1. **Be Specific**: "Research authentication" vs "Research OAuth2 implementation and session management"
2. **Set Context**: Include any constraints, requirements, or specific areas of focus
3. **Follow Up**: Use results to inform `/plan` and `/execute` commands
4. **Iterate**: Research findings often lead to more specific research questions

## Enhanced Subagent Orchestration

### Advanced Research Workflow

For complex research requiring deep analysis across multiple domains:

#### Phase 1: Comprehensive Discovery (Parallel Execution)
- **codebase-locator**: Maps all relevant files, components, and directory structures
- **thoughts-locator**: Discovers existing documentation, past decisions, and technical notes
- **codebase-pattern-finder**: Identifies recurring implementation patterns and architectural approaches
- **web-search-researcher**: Gathers external best practices and industry standards (when applicable)

#### Phase 2: Deep Analysis (Sequential Processing)
- **codebase-analyzer**: Provides detailed implementation understanding with file:line evidence
- **thoughts-analyzer**: Extracts actionable insights from documentation and historical context
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

*Ready to dive deep? Ask me anything about your codebase and I'll provide comprehensive insights to guide your next steps.*