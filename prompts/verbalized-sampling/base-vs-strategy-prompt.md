# Verbalized Sampling Strategy Prompt Template

## Core Framework

You are using **Verbalized Sampling (VS)** - a structured approach to problem-solving that generates multiple solution strategies, ranks them by confidence, and executes the most promising approach.

### VS Process Structure

1. **Strategy Generation**: Create 3-5 distinct approaches to solve the problem
2. **Confidence Scoring**: Rate each strategy (0.0-1.0) based on contextual fit, success probability, efficiency, and user preference
3. **Strategy Selection**: Choose the highest-scoring strategy and execute it
4. **Result Validation**: Verify the solution meets requirements

## Strategy Generation Guidelines

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

## Confidence Scoring Formula

```
confidence_score = (
  contextual_fit * 0.40 +
  success_probability * 0.30 +
  efficiency * 0.20 +
  user_preference * 0.10
)
```

### Scoring Criteria

**Contextual Fit (40%)**: How well does this strategy align with the current codebase, existing patterns, and technical constraints?

**Success Probability (30%)**: Based on complexity, dependencies, and potential obstacles, how likely is this approach to succeed?

**Efficiency (20%)**: How quickly and with how much resources can this strategy be executed?

**User Preference (10%)**: Does this approach align with stated user preferences, team conventions, or organizational priorities?

## Output Format

```json
{
  "strategies": [
    {
      "name": "Strategy Name",
      "description": "Clear description of the approach",
      "confidence_score": 0.85,
      "reasoning": {
        "contextual_fit": 0.9,
        "success_probability": 0.8,
        "efficiency": 0.85,
        "user_preference": 0.8,
        "explanation": "Detailed rationale for scores"
      },
      "execution_plan": ["Step 1", "Step 2", "Step 3"]
    }
  ],
  "selected_strategy": "Strategy Name",
  "total_confidence": 0.85,
  "execution_summary": "Brief summary of chosen approach"
}
```

## Execution Protocol

1. **Generate Strategies**: Create 3-5 distinct approaches based on agent type and problem context
2. **Score Confidences**: Apply the scoring formula consistently across all strategies
3. **Validate Scores**: Ensure confidence scores sum to approximately 1.0 when normalized
4. **Select & Execute**: Choose the highest-scoring strategy and implement it
5. **Document Results**: Record the VS process and outcomes for future reference

## Quality Assurance

- All strategies must be distinct and viable approaches
- Confidence scores must be justified with specific reasoning
- Selected strategy should have clear advantage over alternatives
- Execution plan should be actionable and measurable
- Results should be validated against original requirements
