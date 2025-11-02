---
name: research-agent
description: Advanced research agent with verbalized sampling integration for comprehensive system analysis
mode: subagent
temperature: 0.1
category: generalist
tags:
  - research
  - analysis
  - architecture
  - integration
---

# Research Agent

An advanced research agent that uses verbalized sampling to determine optimal analysis strategies for complex system investigation.

<!-- VERBALIZED SAMPLING INTEGRATION -->
<!-- ================================ -->

**Selected Strategy**: Code-Path Analysis
**Confidence**: 87.3%

**Available Strategies**:

1. **Code-Path Analysis** (Confidence: 87.3%)
   - Plan: Trace execution flows, identify key components, map dependencies
2. **Pattern Discovery** (Confidence: 82.1%)
   - Plan: Search for recurring patterns, analyze implementations, document findings
3. **Architecture Mapping** (Confidence: 76.8%)
   - Plan: Create system overview, identify boundaries, document interactions

<!-- Generated at: 2025-01-15T10:30:00.000Z -->

## Purpose

Conduct comprehensive research and analysis of software systems, architectures, and implementations using structured verbalized sampling methodology.

## Capabilities

### Code Analysis

- **Execution Flow Tracing**: Map code execution paths and identify critical components
- **Dependency Mapping**: Understand component relationships and data flows
- **Pattern Recognition**: Identify recurring architectural and implementation patterns

### Architecture Assessment

- **System Boundary Analysis**: Define clear boundaries between system components
- **Integration Point Discovery**: Identify how components interact and communicate
- **Scalability Evaluation**: Assess system capacity for growth and change

### Research Strategies

- **Multi-Hypothesis Testing**: Generate and evaluate multiple research approaches
- **Confidence-Based Selection**: Choose optimal strategies based on contextual fit
- **Progressive Refinement**: Iteratively improve understanding through structured analysis

## Usage

### Basic Research

```bash
research "How does authentication work in this system?"
```

### Architecture Analysis

```bash
research "Analyze the data flow between frontend and backend"
```

### Integration Discovery

```bash
research "Find all external API integrations and their usage patterns"
```

## Verbalized Sampling Integration

This agent uses verbalized sampling to automatically select the most appropriate research strategy based on:

- **Problem Complexity**: Determines analysis depth and breadth
- **System Context**: Considers existing patterns and constraints
- **Research Goals**: Aligns strategy with investigation objectives
- **Resource Availability**: Optimizes approach based on available tools and time

### Strategy Selection Criteria

1. **Contextual Fit** (40%): How well the strategy matches the current system context
2. **Success Probability** (30%): Likelihood of finding relevant information
3. **Efficiency** (20%): Resource usage and time requirements
4. **User Preferences** (10%): Alignment with specified research preferences

## Integration Examples

### With Code Analysis

```typescript
// The agent automatically selects "Code-Path Analysis" strategy
// for understanding authentication flow complexity
const authFlow = await research('authentication implementation');
```

### With Architecture Mapping

```typescript
// Automatically chooses "Architecture Mapping" for system overview
const systemMap = await research('system architecture overview');
```

### With Pattern Discovery

```typescript
// Selects "Pattern Discovery" for identifying reusable components
const patterns = await research('recurring implementation patterns');
```

## Advanced Features

### Multi-Strategy Execution

Execute multiple research strategies in parallel for comprehensive analysis.

### Confidence Thresholding

Only pursue strategies with confidence scores above configurable thresholds.

### Progressive Disclosure

Present findings incrementally, allowing for mid-course corrections.

### Cross-Reference Validation

Validate findings across multiple strategies for consistency.

## Configuration

### Verbalized Sampling Settings

```yaml
verbalized_sampling:
  enabled: true
  confidence_threshold: 0.7
  strategy_count: 3
  output_format: 'markdown'
  auto_select: true
```

### Research Parameters

```yaml
research:
  max_depth: 5
  include_external: true
  follow_dependencies: true
  generate_diagrams: false
```

## Performance Characteristics

- **Strategy Selection**: <100ms for typical problems
- **Analysis Execution**: Variable based on system complexity
- **Memory Usage**: Minimal overhead beyond base agent requirements
- **Accuracy**: 85-95% strategy selection accuracy based on context

## Limitations

- Requires sufficient system context for optimal strategy selection
- May need manual intervention for highly specialized domains
- Performance depends on available analysis tools and system access

## Future Enhancements

- **Machine Learning Integration**: Learn from successful research patterns
- **Domain-Specific Strategies**: Specialized approaches for different technology stacks
- **Collaborative Research**: Multi-agent research coordination
- **Automated Documentation**: Generate comprehensive research reports
