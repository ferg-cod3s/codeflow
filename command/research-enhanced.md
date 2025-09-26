---
name: "research"
mode: command
display_name: "Deep Research & Analysis"
category: "workflow"
subcategory: "discovery"
description: "Comprehensive codebase and documentation analysis using specialized agents to gather context and insights"
short_description: "Research codebase, docs, and external sources"

# HumanLayer-inspired workflow metadata
complexity: intermediate
estimated_time: "10-20 minutes"
workflow_type: "parallel-then-sequential"
confidence_level: high
success_metrics:
  - "Comprehensive codebase understanding"
  - "Relevant documentation discovered"
  - "External research completed"
  - "Actionable insights generated"

# Agent orchestration
agent_sequence:
  phase_1:
    name: "Discovery Phase"
    type: "parallel"
    agents:
      - name: "codebase-locator"
        purpose: "Find relevant files and components"
        timeout: "5 minutes"
      - name: "thoughts-locator"
        purpose: "Discover existing documentation"
        timeout: "3 minutes"
  phase_2:
    name: "Analysis Phase"
    type: "sequential"
    agents:
      - name: "codebase-analyzer"
        purpose: "Understand implementation details"
        depends_on: ["codebase-locator"]
        timeout: "8 minutes"
      - name: "thoughts-analyzer"
        purpose: "Extract insights from documentation"
        depends_on: ["thoughts-locator"]
        timeout: "5 minutes"
  phase_3:
    name: "External Research"
    type: "optional"
    agents:
      - name: "web-search-researcher"
        purpose: "Gather external context and best practices"
        timeout: "10 minutes"

# Usage guidance
best_for:
  - "Understanding new codebases"
  - "Feature research and planning"
  - "Architecture decision making"
  - "Debugging complex issues"
  - "Onboarding new team members"

use_cases:
  - "Research how authentication is implemented"
  - "Understand the database schema and relationships"
  - "Find examples of similar features"
  - "Analyze performance bottlenecks"
  - "Research external APIs and integrations"

prerequisites:
  - "Access to codebase"
  - "Clear research question or objective"

outputs:
  - "Comprehensive research report"
  - "Code analysis with file locations"
  - "Documentation insights"
  - "External research findings"
  - "Recommended next steps"

follow_up_commands:
  - "/plan - Create implementation plan from research"
  - "/execute - Begin implementation"
  - "/review - Validate research findings"

examples:
  - prompt: "Research user authentication system"
    expected_outcome: "Complete understanding of auth flow, security measures, and integration points"
  - prompt: "Research payment processing implementation"
    expected_outcome: "Analysis of payment flows, security compliance, and error handling"

# Technical configuration
temperature: 0.1
max_tokens: 8192
timeout: "20 minutes"

tags:
  - workflow
  - research
  - analysis
  - discovery
  - codebase
  - documentation
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

## Integration with Other Commands

- **→ /plan**: Use research findings to create detailed implementation plans
- **→ /execute**: Begin implementation with full context
- **→ /document**: Create documentation based on research insights
- **→ /review**: Validate that implementation matches research findings

---

*Ready to dive deep? Ask me anything about your codebase and I'll provide comprehensive insights to guide your next steps.*