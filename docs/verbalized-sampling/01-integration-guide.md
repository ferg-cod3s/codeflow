# Verbalized Sampling Integration for RF Plugins

A comprehensive guide to integrating Verbalized Sampling into your rf_plugin_marketplace to unlock powerful, diverse plugin outputs.

---

## Quick Overview

**Verbalized Sampling (VS)** enables your plugins to generate multiple ranked alternatives with confidence scores instead of single repetitive outputs.

- **Diversity gain**: 1.6-2.1× more diverse outputs
- **Quality**: Maintained or improved (especially with VS-CoT)
- **Implementation**: Zero retraining, just prompt changes
- **Integration time**: 2-4 hours per plugin type

---

## Why This Matters for RF Plugins

Your current plugin architecture has three powerful integration points. VS can supercharge all of them:

### 1. **Research Workflows** (`rf-research`)
Currently: Returns one research finding per investigation
**With VS**: Returns ranked research approaches with confidence

### 2. **Planning Tools** (`rf-plan`)
Currently: Generates one implementation plan
**With VS**: Generates multiple plan approaches (different phasing, architectural choices)

### 3. **Specialist Agents** (rf-specialist-agents)
Currently: Agents use one analysis method
**With VS**: Agents choose from multiple analysis strategies based on context

---

## Integration Architecture

### Level 1: Plugin Command Prompts

Modify the frontmatter and prompts in your command files to request multiple ranked alternatives.

**Files to modify:**
- `plugins/rf-research-workflows/commands/rf-research`
- `plugins/rf-planning-tools/commands/rf-plan`
- `plugins/rf-execution-validation/commands/*` (when added)

### Level 2: Agent Prompts

Update specialist agents to generate multiple response candidates with probability scores.

**Files to modify:**
- `plugins/rf-specialist-agents/agents/rf-*.md` (all 4 agents)

### Level 3: Output Format Extension

Extend AGENT_OUTPUT_V1 to include alternatives and confidence scores.

**Files to modify:**
- `docs/OUTPUT_FORMATS.md`

---

## Phase 1: Enhanced Research Workflows

### Current Problem

`rf-research` command returns one research path and findings.

```
User asks: "How is event registration handled?"
Output: Single finding about registration logic
```

### VS Enhancement

Request multiple research strategies with confidence scores.

#### Step 1: Update Command Frontmatter

**File:** `plugins/rf-research-workflows/commands/rf-research`

Add to frontmatter after `version`:
```yaml
research_strategies:
  - name: "Code-Path Analysis"
    description: "Trace event registration code paths"
    best_for: "Understanding implementation flow"
  - name: "Pattern Discovery"
    description: "Find similar registration patterns"
    best_for: "Finding examples to model"
  - name: "Architecture Analysis"
    description: "Understand registration within system design"
    best_for: "High-level architectural questions"
  - name: "Integration Investigation"
    description: "Find registration touchpoints and integrations"
    best_for: "Understanding system dependencies"
```

#### Step 2: Update Research Methodology Section

Replace the "Phase 2: Parallel Agent Coordination" section (around line 62) with:

```markdown
### Phase 2: Multi-Strategy Research Coordination

Instead of one fixed research approach, generate multiple ranked strategies:

1. **Strategy Generation** (Verbalized Sampling)
   - Generate 4 research strategies with confidence scores
   - Each strategy includes: name, approach, expected insights, effort estimate
   - Probability based on question type and research scope

2. **Ranked Strategy Selection**
   - Primary strategy (highest probability): Execute first
   - Fallback strategies: Execute if primary is insufficient
   - User can request specific strategy by preference

3. **Parallel Execution**
   - Launch primary strategy investigation
   - Queue fallback strategies for potential execution
   - Combine findings for comprehensive results

**Example Strategy Ranking:**
- Code-Path Analysis (p=0.45): Understand flow and implementation details
- Pattern Discovery (p=0.35): Find similar examples to learn from
- Architecture Analysis (p=0.15): Understand system-wide context
- Integration Investigation (p=0.05): Edge case integrations
```

#### Step 3: Add Strategy Selector to Output Format

Add to the JSON output section (after line 127):

```json
"research_strategies": {
  "primary_strategy": {
    "name": "Code-Path Analysis",
    "confidence": 0.45,
    "rationale": "Best approach for understanding implementation flow",
    "expected_insights": ["Implementation details", "Code structure", "Key functions"]
  },
  "alternative_strategies": [
    {
      "name": "Pattern Discovery",
      "confidence": 0.35,
      "rationale": "Find similar patterns to learn from",
      "when_to_use": "If you want examples to model after"
    }
  ],
  "strategy_selection_rationale": "Ranked based on question type and research scope"
}
```

#### Step 4: Update Success Criteria

Add to success signals (line 13-16):
```yaml
success_signals:
  - 'Research completed with multiple strategy options'
  - 'Strategies ranked by confidence score'
  - 'User can request alternative strategy investigation'
```

---

## Phase 2: Enhanced Planning Tools

### Current Problem

`rf-plan` command generates one implementation plan with fixed phasing.

```
User asks: "Plan a new registration form feature"
Output: Single 5-phase implementation plan
```

### VS Enhancement

Generate multiple plan approaches with different trade-offs.

#### Step 1: Define Plan Variants

**File:** `plugins/rf-planning-tools/commands/rf-plan`

Add after version (line 4):

```yaml
plan_variants:
  phasing_approach:
    - name: "Sequential Phases"
      description: "Linear progression through design, backend, frontend, testing"
      confidence: 0.40
      best_for: "Clean separation of concerns"
      phases: 5
      duration: "20-30 hours"
    - name: "Feature-Driven Phases"
      description: "Build complete features vertically (design + backend + frontend per feature)"
      confidence: 0.35
      best_for: "Faster feedback cycles"
      phases: 4
      duration: "18-25 hours"
    - name: "Minimal Viable Phases"
      description: "Get to working demo ASAP, then iterate"
      confidence: 0.15
      best_for: "Quick validation with stakeholders"
      phases: 3
      duration: "12-18 hours"
    - name: "Parallel Track Phases"
      description: "Backend and frontend developed in parallel"
      confidence: 0.10
      best_for: "Large teams, time-critical"
      phases: 4
      duration: "15-20 hours"

  risk_approach:
    - name: "Conservative"
      description: "Comprehensive testing, detailed documentation"
      confidence: 0.40
    - name: "Balanced"
      description: "Core testing, essential documentation"
      confidence: 0.45
    - name: "Aggressive"
      description: "Focused testing on critical paths"
      confidence: 0.15
```

#### Step 2: Update Planning Process Section

Replace "Phase 3: Implementation Phasing" (around line 80) with:

```markdown
### Phase 3: Multi-Variant Planning

Instead of one implementation plan, generate multiple plan variants ranked by suitability:

1. **Plan Variant Generation** (Verbalized Sampling)
   - Generate 4 plan variants with different approaches
   - Each variant shows: phasing strategy, risk approach, effort estimate, trade-offs
   - Probability based on plan complexity and team preferences

2. **Ranked Plan Selection**
   - Primary plan (highest probability): Recommended approach
   - Alternative plans: Different trade-offs users can choose
   - Pareto frontier visualization: Understand effort vs. risk vs. timeline trade-offs

3. **Detailed Breakdown**
   - Generate primary plan with full phase details
   - Provide summaries of alternative plans
   - User can request full details of any alternative

**Example Plan Ranking:**
- Sequential Phases (p=0.40): Best for maintainability and clear separation
- Feature-Driven Phases (p=0.35): Faster feedback cycles
- Minimal Viable Phases (p=0.15): Fastest to working demo
- Parallel Track Phases (p=0.10): For large distributed teams
```

#### Step 3: Update Output Format

Replace the expected output section (around line 180) with:

```json
{
  "status": "success",
  "timestamp": "ISO-8601",
  "plan_type": "feature|api|migration|refactor",
  "plan_variants": {
    "primary_plan": {
      "variant_name": "Sequential Phases",
      "confidence": 0.40,
      "rationale": "Best for this feature complexity and team size",
      "summary": "Linear progression through design, backend, frontend, testing",
      "estimated_effort_hours": 24,
      "estimated_complexity": "medium",
      "phases": [/* detailed phases as before */]
    },
    "alternative_plans": [
      {
        "variant_name": "Feature-Driven Phases",
        "confidence": 0.35,
        "rationale": "Faster feedback cycles for iterative development",
        "summary": "Build complete features vertically",
        "estimated_effort_hours": 20,
        "trade_offs": "Less separation of concerns but faster feedback"
      }
    ],
    "pareto_frontier": {
      "fastest_path": {
        "name": "Minimal Viable Phases",
        "effort_hours": 12,
        "risk_level": "high"
      },
      "safest_path": {
        "name": "Sequential Phases",
        "effort_hours": 30,
        "risk_level": "low"
      },
      "recommended_path": {
        "name": "Feature-Driven Phases",
        "effort_hours": 20,
        "risk_level": "medium"
      }
    }
  },
  "technical_decisions": [/* as before */],
  "risks": [/* as before */]
}
```

#### Step 4: Add Plan Selection to Output

Add before closing brace:
```json
"plan_selection_guidance": {
  "choose_sequential_if": "You want maximum clarity and separation of concerns",
  "choose_feature_driven_if": "You want faster feedback and iteration cycles",
  "choose_minimal_viable_if": "Speed to demo is critical",
  "choose_parallel_if": "You have a large team and time pressure"
}
```

---

## Phase 3: Enhanced Specialist Agents

### Current Problem

Specialist agents use one analysis approach for all situations.

```
Event Management Agent analyzes registration always the same way
```

### VS Enhancement

Agents choose from multiple analysis strategies based on context.

#### Step 1: Add Strategy Options to Each Agent

**File:** `plugins/rf-specialist-agents/agents/rf-event-management-specialist.md`

Add after the description line:

```yaml
analysis_strategies:
  - name: "Workflow Analysis"
    description: "Trace event workflows and user journeys"
    best_for: "Understanding end-to-end processes"
    probability: 0.35
  - name: "Data Model Analysis"
    description: "Examine event schemas and data relationships"
    best_for: "Understanding data structures"
    probability: 0.30
  - name: "Integration Analysis"
    description: "Find event system touchpoints and dependencies"
    best_for: "Understanding system interconnections"
    probability: 0.20
  - name: "Performance Analysis"
    description: "Identify event handling performance bottlenecks"
    best_for: "Optimization and scalability"
    probability: 0.15
```

#### Step 2: Update Agent Capabilities

In the capabilities section, add:

```
### Multi-Strategy Analysis
- Analyzes problems using strategy ranked by context
- Can switch strategies if initial approach insufficient
- Explains strategy choice and why it's appropriate
- Offers to use alternative strategies if needed
```

#### Step 3: Example Prompt Enhancement

When agents are invoked, use this pattern:

**Before (Single approach):**
```
Analyze the event registration system
```

**After (Multiple strategies with ranking):**
```
Analyze the event registration system. Consider these approaches:
1. Workflow Analysis - Understanding registration flow and user journeys (p=0.40)
2. Data Model Analysis - Event and registration schemas (p=0.35)
3. Integration Analysis - How registration connects to payment, email, analytics (p=0.15)
4. Performance Analysis - Registration system scalability (p=0.10)

Primary approach: Workflow Analysis
Fallback: Use alternative strategies if insufficient findings
```

---

## Phase 4: Output Format Extension

### Update AGENT_OUTPUT_V1

**File:** `docs/OUTPUT_FORMATS.md`

Add new top-level section after metadata:

```json
"alternatives": {
  "primary_option": {
    "approach": "Name of primary recommendation",
    "confidence": 0.45,
    "rationale": "Why this is recommended",
    "effort": "Estimated effort to implement",
    "key_metrics": {}
  },
  "alternative_options": [
    {
      "approach": "Alternative approach name",
      "confidence": 0.30,
      "rationale": "When this would be better",
      "effort": "Estimated effort",
      "trade_offs": "What you gain/lose vs. primary"
    }
  ],
  "selection_guidance": "How to choose between options"
}
```

### Add to Research Output Format

```json
"research_strategies": {
  "primary_strategy": {
    "name": "Strategy name",
    "confidence": 0.45,
    "rationale": "Why this is primary",
    "expected_results": []
  },
  "alternative_strategies": []
}
```

### Add to Planning Output Format

```json
"plan_variants": {
  "primary_plan": {},
  "alternative_plans": [],
  "trade_off_analysis": {}
}
```

---

## Implementation Checklist

### Phase 1: Research Workflows (2-3 hours)
- [ ] Update `rf-research` command frontmatter with strategy definitions
- [ ] Modify research methodology to generate and rank strategies
- [ ] Update JSON output format with strategy fields
- [ ] Test with sample research questions
- [ ] Update documentation

### Phase 2: Planning Tools (2-3 hours)
- [ ] Add plan variant definitions to `rf-plan` frontmatter
- [ ] Modify planning process to generate variant plans
- [ ] Update output format with plan variants and Pareto frontier
- [ ] Add plan selection guidance
- [ ] Test with sample planning requests

### Phase 3: Specialist Agents (2-3 hours)
- [ ] Add analysis strategies to all 4 agents
- [ ] Create context-aware strategy selection logic
- [ ] Update agent capabilities documentation
- [ ] Test strategy selection with various scenarios
- [ ] Document strategy selection criteria

### Phase 4: Output Format (1 hour)
- [ ] Update `OUTPUT_FORMATS.md` with new structures
- [ ] Create examples for each format
- [ ] Add selection guidance sections
- [ ] Document trade-offs and decision criteria

### Phase 5: Documentation & Launch (1-2 hours)
- [ ] Create VS integration guide for users
- [ ] Document strategy selection rationale
- [ ] Add examples of multi-variant outputs
- [ ] Create decision trees for choosing between options

---

## Usage Examples

### Research Workflow Example

**User input:**
```
/rf-research "How is user authentication handled?" scope:api depth:medium
```

**VS-Enhanced output:**
```json
{
  "research_strategies": {
    "primary_strategy": {
      "name": "Code-Path Analysis",
      "confidence": 0.45,
      "rationale": "Best for understanding auth implementation flow",
      "findings": {
        "primary_answer": "Authentication uses JWT tokens with refresh strategy...",
        "key_locations": [...]
      }
    },
    "alternative_strategies": [
      {
        "name": "Pattern Discovery",
        "confidence": 0.35,
        "rationale": "Find similar auth patterns used elsewhere",
        "can_request": "Request detailed analysis of Pattern Discovery approach"
      }
    ]
  }
}
```

### Planning Example

**User input:**
```
/rf-plan feature "Add email notifications to registrations" complexity:medium
```

**VS-Enhanced output:**
```json
{
  "plan_variants": {
    "primary_plan": {
      "variant_name": "Sequential Phases",
      "confidence": 0.40,
      "phases": [5 detailed phases],
      "estimated_effort_hours": 24
    },
    "alternative_plans": [
      {
        "variant_name": "Feature-Driven",
        "confidence": 0.35,
        "estimated_effort_hours": 20,
        "trade_offs": "Faster feedback, less separation"
      },
      {
        "variant_name": "Minimal Viable",
        "confidence": 0.15,
        "estimated_effort_hours": 12,
        "trade_offs": "Quick demo, needs follow-up polish"
      }
    ],
    "pareto_frontier": {
      "fastest": "Minimal Viable (12h)",
      "safest": "Sequential (24h)",
      "recommended": "Feature-Driven (20h)"
    }
  }
}
```

### Agent Example

**Event Management Agent analyzing registration:**

```
Primary strategy selected: Workflow Analysis (confidence: 0.40)
- Examining registration workflow and user journeys
- Findings: [workflow details]
- Alternative strategies available:
  - Data Model Analysis (0.30): Would examine registration schema
  - Integration Analysis (0.20): Would examine touchpoints
- Would you like me to investigate using a different strategy?
```

---

## Advanced: Confidence Score Logic

### How to Calculate Confidence Scores

For each variant, consider:

1. **Fit for Purpose** (40%)
   - How well does this approach solve the problem?
   - Assign 0-1.0 based on relevance

2. **Team Experience** (30%)
   - Have we done similar things before?
   - Assign 0-1.0 based on team familiarity

3. **Risk Profile** (20%)
   - How much technical risk?
   - Assign 0-1.0 (high risk = lower score)

4. **Timeline** (10%)
   - Does timeline pressure favor this?
   - Assign 0-1.0

**Formula:**
```
confidence = (0.40 * fit) + (0.30 * experience) + (0.20 * (1.0 - risk)) + (0.10 * timeline)
```

### Example Calculation

For "Sequential Phases" plan:
- Fit for purpose: 0.95 (excellent separation)
- Team experience: 0.85 (team knows this approach)
- Risk profile: 0.20 (low risk = 0.80)
- Timeline pressure: 0.60 (medium urgency)

```
confidence = (0.40 * 0.95) + (0.30 * 0.85) + (0.20 * 0.80) + (0.10 * 0.60)
           = 0.38 + 0.255 + 0.16 + 0.06
           = 0.855 ≈ 0.40 (after normalization against other options)
```

---

## Testing Your Implementation

### Test Cases for Each Phase

#### Research Workflows
```
1. Test strategy ranking changes based on question type
2. Test fallback to alternative strategies
3. Verify confidence scores are consistent
4. Test output format includes all strategy fields
```

#### Planning Tools
```
1. Test variant selection based on complexity
2. Test Pareto frontier calculation
3. Verify different phasing approaches generate different timelines
4. Test effort estimates vary appropriately
```

#### Specialist Agents
```
1. Test strategy selection based on problem context
2. Test agent can explain strategy choice
3. Test fallback to alternative strategies
4. Verify strategy-specific insights are different
```

---

## Migration Path

If you have existing plugins using old formats:

1. **Backwards Compatibility**: Existing code continues to work
   - Single output can be wrapped in "primary option" field
   - Alternative options default to empty array

2. **Gradual Adoption**: Implement one plugin at a time
   - Start with research workflows
   - Move to planning tools
   - Update specialist agents last

3. **Version Management**: Consider versioning in marketplace.json
   - v1.0.0: Single approach (current)
   - v1.1.0: VS-enhanced research
   - v1.2.0: VS-enhanced planning
   - v2.0.0: Full VS implementation across all components

---

## FAQ

**Q: Will this break existing integrations?**
A: No. Old outputs are wrapped in "primary option" field. Consumers can ignore alternatives.

**Q: How much will plugin performance change?**
A: Minimal. We're asking for ranked options upfront, not multiple sequential calls.

**Q: Can users still get single recommendations?**
A: Yes. Default to primary option. Alternatives are available but not forced.

**Q: Does this increase token usage?**
A: Slightly, but within reason. You're getting multiple ranked options in one call vs. multiple sequential calls.

**Q: How do I decide between alternatives?**
A: Use provided rationale, trade-off analysis, and try the primary first. Fallback to alternatives if needed.

---

## Next Steps

1. **Review this plan** - Ensure approach aligns with your vision
2. **Start with Phase 1** - Enhance research workflows first
3. **Validate with team** - Get feedback on strategy rankings
4. **Iterate quickly** - Test and refine confidence score logic
5. **Document for users** - Show them how to choose between options

---

## Resources

- Main research paper: `/Users/john.ferguson/git/rf_plugin_marketplace/2510.01171.pdf`
- Verbalized Sampling overview: See `VERBALIZED_SAMPLING_INTEGRATION.md` sections 1-3
- Reference implementations: See `VS_IMPLEMENTATION_EXAMPLES.md`
- Prompting techniques: See `VS_QUICK_REFERENCE.md`

