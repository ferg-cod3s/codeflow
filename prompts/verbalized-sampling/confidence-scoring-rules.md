# Confidence Scoring Rules for Verbalized Sampling

## Scoring Framework

Confidence scores range from 0.0 to 1.0 and are calculated using weighted criteria:

- **Contextual Fit**: 40% weight
- **Success Probability**: 30% weight
- **Efficiency**: 20% weight
- **User Preference**: 10% weight

## Detailed Scoring Guidelines

### Contextual Fit (40% weight)

**Score 0.9-1.0 (Excellent Fit)**

- Strategy perfectly aligns with existing codebase patterns
- Uses established architectural patterns and conventions
- Leverages existing tools and infrastructure
- Minimal disruption to current system design
- Follows team's established coding standards

**Score 0.7-0.8 (Good Fit)**

- Strategy mostly aligns with existing patterns
- Requires minor adaptations to fit current architecture
- Uses mostly familiar tools and approaches
- Some learning curve but manageable
- Generally follows established conventions

**Score 0.5-0.6 (Moderate Fit)**

- Strategy partially aligns with existing patterns
- Requires significant modifications to fit
- Introduces some new concepts or tools
- Moderate disruption to current workflow
- Some deviation from team standards

**Score 0.3-0.4 (Poor Fit)**

- Strategy conflicts with many existing patterns
- Requires major architectural changes
- Introduces unfamiliar tools or approaches
- High disruption to current system
- Significant deviation from established practices

**Score 0.0-0.2 (Very Poor Fit)**

- Strategy completely misaligned with codebase
- Requires complete system redesign
- Introduces entirely new technology stack
- Maximum disruption to current workflow
- Contradicts team conventions and standards

### Success Probability (30% weight)

**Score 0.9-1.0 (Very High Probability)**

- Simple, well-understood problem domain
- Minimal dependencies and external factors
- Clear success criteria and measurable outcomes
- Proven approach with similar implementations
- Low risk of unforeseen complications

**Score 0.7-0.8 (High Probability)**

- Well-understood problem with some complexity
- Manageable dependencies and integration points
- Clear success criteria with some ambiguity
- Similar successful implementations exist
- Moderate risk with identifiable mitigation strategies

**Score 0.5-0.6 (Moderate Probability)**

- Complex problem with multiple variables
- Significant dependencies or external factors
- Partially defined success criteria
- Limited precedent for this approach
- Higher risk requiring careful planning

**Score 0.3-0.4 (Low Probability)**

- Highly complex or poorly understood problem
- Many dependencies or uncertain external factors
- Unclear success criteria or metrics
- Novel approach with limited precedent
- High risk with potential for failure

**Score 0.0-0.2 (Very Low Probability)**

- Extremely complex or unknown problem domain
- Critical dependencies or uncontrollable factors
- Undefined success criteria
- Completely experimental approach
- Very high risk of failure

### Efficiency (20% weight)

**Score 0.9-1.0 (Very High Efficiency)**

- Can be implemented quickly (hours to 1-2 days)
- Minimal resource requirements
- Straightforward implementation with clear steps
- Low complexity and minimal debugging expected
- Immediate value delivery

**Score 0.7-0.8 (High Efficiency)**

- Implementation time of 2-5 days
- Moderate resource requirements
- Clear implementation path with some complexity
- Reasonable debugging and testing effort
- Quick value delivery

**Score 0.5-0.6 (Moderate Efficiency)**

- Implementation time of 1-2 weeks
- Significant resource requirements
- Complex implementation requiring careful planning
- Substantial debugging and testing needed
- Delayed but reasonable value delivery

**Score 0.3-0.4 (Low Efficiency)**

- Implementation time of 2-4 weeks
- High resource requirements
- Very complex implementation with many unknowns
- Extensive debugging and testing required
- Significant delay in value delivery

**Score 0.0-0.2 (Very Low Efficiency)**

- Implementation time of 1+ months
- Very high resource requirements
- Extremely complex with high uncertainty
- Major debugging and testing effort
- Long delay before value delivery

### User Preference (10% weight)

**Score 0.9-1.0 (Strong Preference)**

- Directly matches user's stated preferences
- Aligns with team's established conventions
- Follows organizational best practices
- Matches user's skill level and expertise
- Preferred technology stack or approach

**Score 0.7-0.8 (Good Preference)**

- Mostly aligns with user preferences
- Generally follows team conventions
- Compatible with organizational practices
- Suitable for user's skill level
- Acceptable technology choices

**Score 0.5-0.6 (Moderate Preference)**

- Partially matches user preferences
- Some deviation from team conventions
- Minor conflicts with organizational practices
- Requires some learning or adaptation
- Mixed technology preferences

**Score 0.3-0.4 (Low Preference)**

- Poorly matches user preferences
- Significant deviation from team conventions
- Conflicts with organizational practices
- Requires substantial learning
- Unpreferred technology stack

**Score 0.0-0.2 (Very Low Preference)**

- Directly contradicts user preferences
- Major violation of team conventions
- Conflicts with organizational standards
- Requires extensive new learning
- Unacceptable technology choices

## Score Normalization

After calculating individual strategy scores, normalize them to ensure they sum to approximately 1.0:

```javascript
function normalizeScores(scores) {
  const total = scores.reduce((sum, score) => sum + score, 0);
  return scores.map((score) => score / total);
}
```

## Quality Checks

- Each strategy must have distinct reasoning for scores
- Scores should reflect genuine differences between approaches
- Avoid score inflation - use the full 0.0-1.0 range meaningfully
- Provide specific evidence for each score component
- Consider the relative importance of each criterion for the specific context

## Common Scoring Pitfalls to Avoid

1. **Score Clustering**: Don't give all strategies similar scores (0.45, 0.48, 0.47)
2. **Insufficient Justification**: Always provide specific reasons for scores
3. **Ignoring Context**: Consider the specific project, team, and constraints
4. **Overconfidence**: Be realistic about challenges and risks
5. **Preference Overweighting**: Don't let minor preference issues dominate scores
