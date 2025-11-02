# Verbalized Sampling Infrastructure

A structured approach to problem-solving that generates multiple solution strategies, ranks them by confidence, and executes the most promising approach.

## Overview

Verbalized Sampling (VS) is a methodology that:

1. **Strategy Generation**: Creates 3-5 distinct approaches to solve a problem
2. **Confidence Scoring**: Rates each strategy (0.0-1.0) based on contextual fit, success probability, efficiency, and user preference
3. **Strategy Selection**: Chooses the highest-scoring strategy for execution
4. **Result Validation**: Verifies the solution meets requirements

## Core Components

### StrategyGenerator

Creates and ranks solution strategies based on agent type and problem context.

```typescript
import { generateStrategies } from './verbalized-sampling/index.js';

const result = await generateStrategies({
  problem: 'How does user authentication work in this system?',
  agent_type: 'research',
  context: {
    existing_patterns: ['JWT tokens', 'middleware patterns'],
    constraints: ['Must maintain security'],
  },
});
```

### ConfidenceCalculator

Calculates detailed confidence scores with transparent reasoning.

```typescript
import { calculateConfidence } from './verbalized-sampling/index.js';

const breakdown = calculateConfidence({
  contextual_fit: 0.8,
  success_probability: 0.7,
  efficiency: 0.9,
  user_preference: 0.6,
});
```

### VSOutputFormatter

Formats results in multiple output formats (JSON, Markdown, Terminal, Summary).

```typescript
import { formatVSResult } from './verbalized-sampling/index.js';

const output = formatVSResult(result, {
  format: 'markdown',
  verbose: true,
  include_breakdowns: true,
});
```

## Agent Types

### Research Agent Strategies

- **Code-Path Analysis**: Trace execution flows and identify key decision points
- **Pattern Discovery**: Find recurring patterns and architectural conventions
- **Architecture Mapping**: Map system boundaries and integration points
- **Integration Analysis**: Examine how components interact and depend on each other

### Planning Agent Strategies

- **Sequential Planning**: Step-by-step linear approach with clear dependencies
- **Feature-Driven Planning**: Organize around user-facing features and outcomes
- **Minimal Viable Planning**: Focus on smallest valuable increment first
- **Parallel Planning**: Identify independent workstreams for concurrent execution

### Development Agent Strategies

- **Component-First**: Build UI components before backend integration
- **API-First**: Design and implement endpoints before consumer code
- **Data-First**: Establish data model and persistence before business logic
- **Integration-First**: Focus on connecting existing systems over new development

## Confidence Scoring

Confidence scores use weighted criteria:

```typescript
confidence_score =
  contextual_fit * 0.4 + success_probability * 0.3 + efficiency * 0.2 + user_preference * 0.1;
```

### Scoring Criteria

**Contextual Fit (40%)**: How well does this strategy align with the current codebase, existing patterns, and technical constraints?

**Success Probability (30%)**: Based on complexity, dependencies, and potential obstacles, how likely is this approach to succeed?

**Efficiency (20%)**: How quickly and with how much resources can this strategy be executed?

**User Preference (10%)**: Does this approach align with stated user preferences, team conventions, or organizational priorities?

## Usage Examples

### Complete VS Workflow

```typescript
import { executeVerbalizedSampling } from './verbalized-sampling/index.js';

const result = await executeVerbalizedSampling({
  problem: 'Plan implementation of user profile management feature',
  agent_type: 'planning',
  context: {
    constraints: ['2-week deadline', 'Limited team resources'],
    user_preferences: ['Focus on MVP', 'Include testing strategy'],
    time_constraints: '2 weeks',
  },
  output_format: {
    format: 'terminal',
    include_breakdowns: true,
    verbose: true,
  },
});

console.log(result.outputs.primary.content);
```

### Strategy Generation Only

```typescript
import { VerbalizedSampling } from './verbalized-sampling/index.js';

const vs = new VerbalizedSampling();
const strategies = await vs.generateStrategies({
  problem: 'Build a REST API for user management',
  agent_type: 'development',
  strategy_count: 4,
});

console.log(`Selected: ${strategies.selected_strategy}`);
console.log(`Confidence: ${strategies.total_confidence.toFixed(3)}`);
```

### Custom Formatting

```typescript
import { VSOutputFormatter } from './verbalized-sampling/index.js';

const formatter = new VSOutputFormatter();

// Terminal output with custom colors
const terminalOutput = formatter.formatResult(strategies, {
  format: 'terminal',
  include_plans: true,
  include_breakdowns: true,
});

// Markdown output for documentation
const markdownOutput = formatter.formatResult(strategies, {
  format: 'markdown',
  verbose: true,
  max_description_length: 200,
});
```

## Output Formats

### JSON

Structured data format for programmatic processing:

```json
{
  "strategies": [...],
  "selected_strategy": "Strategy Name",
  "total_confidence": 0.85,
  "execution_summary": "...",
  "metadata": {...}
}
```

### Markdown

Human-readable format for documentation and reports:

```markdown
# Verbalized Sampling Results

## Summary

**Selected Strategy:** Strategy Name
**Total Confidence:** 0.850

## Strategies

### 🎯 **Strategy Name**

**Confidence Score:** 0.850

#### Confidence Breakdown

- **Contextual Fit:** 0.900 (40% weight)
- **Success Probability:** 0.800 (30% weight)
  ...
```

### Terminal

Colored output for interactive terminal sessions:

```
╔══════════════════════════════════════════════════════════════╗
║                    VERBALIZED SAMPLING RESULTS                 ║
╚══════════════════════════════════════════════════════════════╝

📊 SUMMARY
─────────────────────────────────────────────────────────────
Selected Strategy: Strategy Name
Total Confidence: 0.850
...
```

### Summary

Compact format for quick overviews:

```
VS Results: Strategy Name selected with 0.850 confidence
Generated 3 strategies for planning agent
```

## Integration with CodeFlow

The verbalized sampling infrastructure is designed to integrate seamlessly with CodeFlow agents:

```typescript
// In a research agent
import { executeVerbalizedSampling } from '../verbalized-sampling/index.js';

const vsResult = await executeVerbalizedSampling({
  problem: userQuery,
  agent_type: 'research',
  context: {
    codebase_description: analysisResult.description,
    existing_patterns: analysisResult.patterns,
    constraints: projectConstraints,
  },
});

// Use the selected strategy to guide research approach
const researchPlan = vsResult.strategies.strategies.find(
  (s) => s.name === vsResult.strategies.selected_strategy
);
```

## Testing

Run the test example to verify the infrastructure:

```bash
bun run src/verbalized-sampling/test-example.ts
```

This will test:

- Strategy generation for all agent types
- Output formatting in different formats
- Request validation
- Component integration

## Architecture

```
src/verbalized-sampling/
├── index.ts                 # Main interface and exports
├── strategy-generator.ts     # Strategy creation and ranking
├── confidence-calculator.ts  # Confidence scoring logic
├── output-formatter.ts      # Multi-format output handling
├── test-example.ts         # Usage examples and tests
└── README.md              # This documentation
```

## Contributing

When extending the verbalized sampling infrastructure:

1. **New Strategy Types**: Add to the appropriate agent type in `strategy-generator.ts`
2. **Custom Scoring**: Extend confidence calculation logic in `confidence-calculator.ts`
3. **New Output Formats**: Add formatting methods in `output-formatter.ts`
4. **Testing**: Update `test-example.ts` with new functionality tests

## Best Practices

1. **Consistent Scoring**: Use the full 0.0-1.0 range meaningfully
2. **Clear Reasoning**: Provide specific explanations for confidence scores
3. **Distinct Strategies**: Ensure each strategy offers a genuinely different approach
4. **Context Awareness**: Consider the specific project, team, and constraints
5. **Validation**: Always validate requests before processing
