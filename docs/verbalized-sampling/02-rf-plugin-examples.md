# Verbalized Sampling: Concrete RF Plugin Examples

Real-world examples of how to integrate VS into your specific rf_plugins.

---

## Example 1: Enhanced RF-Research Command

### Current Command (Before VS)

**File:** `plugins/rf-research-workflows/commands/rf-research`

The current command always uses one research strategy. Here's how to enhance it:

### Enhanced Command (After VS)

#### 1. Update Frontmatter

**Add after line 6 (after `argument-hint`):**

```yaml
# Research strategies ranked by likelihood
research_strategies:
  code_path_analysis:
    name: "Code-Path Analysis"
    description: "Trace how code implements the feature"
    best_for: "Understanding implementation details"
    use_agents: ["codebase-analyzer"]

  pattern_discovery:
    name: "Pattern Discovery"
    description: "Find existing similar implementations"
    best_for: "Learning from existing code"
    use_agents: ["codebase-pattern-finder"]

  architecture_analysis:
    name: "Architecture Analysis"
    description: "Understand feature within system design"
    best_for: "High-level system understanding"
    use_agents: ["system-architect"]

  integration_mapping:
    name: "Integration Mapping"
    description: "Find all system touchpoints"
    best_for: "Understanding dependencies"
    use_agents: ["codebase-locator"]
```

#### 2. Update Research Methodology (Replace Phase 2)

**Replace lines 54-76 with:**

```markdown
## Research Methodology - Verbalized Sampling Approach

### Phase 1: Analysis & Strategy Generation

1. **Parse Research Question**: Break into investigation areas
2. **Generate Strategy Candidates**: Create 4 research strategy options with confidence scores
3. **Rank Strategies**: Order by:
   - Question type match (code details vs. system overview)
   - Likely finding value (highest probability first)
   - Effort required (faster strategies first as tie-breaker)
4. **Select Primary Strategy**: Highest confidence wins (minimum 0.35)

### Phase 2: Primary Strategy Execution

Execute the highest-confidence strategy:

```python
strategies = [
  {"name": "Code-Path Analysis", "confidence": 0.45, "agents": ["codebase-analyzer"]},
  {"name": "Pattern Discovery", "confidence": 0.30, "agents": ["codebase-pattern-finder"]},
  {"name": "Architecture Analysis", "confidence": 0.15, "agents": ["system-architect"]},
  {"name": "Integration Mapping", "confidence": 0.10, "agents": ["codebase-locator"]}
]

# Execute primary strategy
primary = strategies[0]  # confidence=0.45
findings = execute_strategy(primary)
```

### Phase 3: Fallback Strategy (If Insufficient)

If primary findings are incomplete, fall back to next highest-confidence strategy:

```python
if len(findings) < 3:
  fallback = strategies[1]  # confidence=0.30
  additional_findings = execute_strategy(fallback)
  findings.extend(additional_findings)
```

### Phase 4: Synthesis with Options

Return findings with strategy info and available alternatives:

- Primary findings (from Code-Path Analysis at 0.45 confidence)
- Alternative strategies available:
  - Pattern Discovery (0.30): Would find 5-7 similar implementations
  - Architecture Analysis (0.15): Would show system-wide context
  - Integration Mapping (0.10): Would find all dependencies
```

#### 3. Update Success Criteria

**Replace lines 13-20 with:**

```yaml
success_signals:
  - 'Research question clearly answered'
  - 'Primary strategy executed with findings'
  - 'Strategy confidence score provided'
  - 'Fallback strategies documented for user'
  - 'Specific file:line references in findings'
failure_modes:
  - 'Research topic unclear or invalid'
  - 'Primary strategy yields insufficient findings'
  - 'All fallback strategies exhausted without answers'
  - 'Research agents unable to complete'
```

#### 4. Update Output Format

**Add after line 127 in existing JSON output:**

```json
{
  "status": "success",
  "timestamp": "ISO-8601",
  "research_question": "...",
  "research_strategy_used": {
    "name": "Code-Path Analysis",
    "confidence": 0.45,
    "rationale": "Best for detailed implementation understanding",
    "agents_used": ["codebase-analyzer", "codebase-locator"],
    "findings_count": 12
  },
  "findings": {
    "primary_answer": "...",
    "files_analyzed": 12,
    "key_locations": [...]
  },
  "alternative_strategies": [
    {
      "name": "Pattern Discovery",
      "confidence": 0.30,
      "rationale": "Would find similar implementations to learn from",
      "expected_findings": "5-7 similar patterns",
      "request_by_saying": "Research using Pattern Discovery strategy"
    },
    {
      "name": "Architecture Analysis",
      "confidence": 0.15,
      "rationale": "Would show how feature fits in system",
      "expected_findings": "System-wide context and dependencies",
      "request_by_saying": "Research using Architecture Analysis strategy"
    }
  ],
  "related_files": [...],
  "follow_up_recommendations": [...]
}
```

---

## Example 2: Enhanced RF-Plan Command

### Current Implementation (Before VS)

The `rf-plan` command generates one 5-phase implementation plan. Here's the enhancement:

### Enhanced Implementation (After VS)

#### 1. Add Plan Variant Definitions

**Add after line 6 in frontmatter:**

```yaml
# Plan variants with different trade-offs
plan_variants:
  variant_1:
    name: "Sequential Phases"
    description: "Linear progression: Design → Backend → Frontend → Integration → Testing"
    confidence: 0.40
    use_when: "You want maximum clarity and separation of concerns"
    phases_count: 5
    estimated_hours: "20-30"
    pros:
      - "Clear separation of concerns"
      - "Each phase builds on previous"
      - "Easy to distribute across team"
    cons:
      - "Slower feedback from frontend"
      - "Changes upstream might cascade"
      - "Frontend waits on backend"

  variant_2:
    name: "Feature-Driven Phases"
    description: "Build features vertically: Each feature gets Design + Backend + Frontend"
    confidence: 0.35
    use_when: "You want faster feedback and iteration"
    phases_count: 4
    estimated_hours: "18-25"
    pros:
      - "Working features end-to-end sooner"
      - "Faster feedback from demo"
      - "Better for iterative refinement"
    cons:
      - "More context switching"
      - "Backend and frontend less separated"
      - "Harder to parallelize"

  variant_3:
    name: "Minimal Viable Approach"
    description: "Build MVP first (design + basic backend + minimal frontend), then iterate"
    confidence: 0.15
    use_when: "Speed to demo is critical"
    phases_count: 3
    estimated_hours: "12-18"
    pros:
      - "Fastest to working demo"
      - "Get stakeholder feedback early"
      - "Can drop low-priority features"
    cons:
      - "Technical debt accumulation"
      - "Quality concerns"
      - "Major refactoring likely needed"

  variant_4:
    name: "Parallel Tracks"
    description: "Backend and frontend teams work in parallel with async coordination"
    confidence: 0.10
    use_when: "You have multiple teams and tight timeline"
    phases_count: 4
    estimated_hours: "15-20"
    pros:
      - "Shortest calendar time"
      - "Teams work independently"
      - "Scales with team size"
    cons:
      - "Requires careful contract definition"
      - "Integration complexity"
      - "More sync meetings needed"
```

#### 2. Create Plan Generation Logic

**Replace lines 72-87 (Phase 2) with:**

```markdown
### Phase 2: Multi-Variant Planning with Verbalized Sampling

Instead of generating one plan, we'll generate 4 ranked plan variants:

#### Step 1: Generate Candidate Plans

For the given complexity level and plan type, create 4 plan variants:

```python
plans = [
  {
    "name": "Sequential Phases",
    "phases": 5,
    "hours": 24,
    "confidence": 0.40,
    "rationale": "Best separation of concerns for medium complexity"
  },
  {
    "name": "Feature-Driven",
    "phases": 4,
    "hours": 20,
    "confidence": 0.35,
    "rationale": "Faster feedback cycles, good for iteration"
  },
  {
    "name": "Minimal Viable",
    "phases": 3,
    "hours": 14,
    "confidence": 0.15,
    "rationale": "Quickest to working demo"
  },
  {
    "name": "Parallel Tracks",
    "phases": 4,
    "hours": 18,
    "confidence": 0.10,
    "rationale": "For distributed teams"
  }
]

# Sort by confidence (highest first)
plans.sort(by: confidence, descending: true)
```

#### Step 2: Detailed Planning

Generate full detail for primary plan:
- All phases with deliverables
- Success criteria for each phase
- Risk mitigation strategies
- Resource allocation

Generate summaries for alternatives:
- Brief description of approach
- Key differences from primary
- When to use this variant
- Trade-offs vs. primary plan

#### Step 3: Pareto Frontier Analysis

Show the fundamental trade-offs:

```
        Effort
        ▲
        │
     30 │ Sequential ●
        │
     20 │ Feature-Driven ●
        │               ●─── Parallel
        │
     15 │ MVP ●
        │
        └─────────────────────────► Risk
          low      med      high

Fast Path (MVP): 14h, higher risk
Safe Path (Sequential): 24h, lower risk
Recommended (Feature-Driven): 20h, medium risk
```
```

#### 3. Update Output Format

**Add these new sections to JSON output:**

```json
{
  "plan_variants": {
    "primary_plan": {
      "name": "Feature-Driven Phases",
      "confidence": 0.35,
      "rationale": "Best balance of feedback cycles and clarity for this medium-complexity feature",
      "recommended_for": "Teams wanting rapid iteration and stakeholder feedback",

      "summary": "Build complete features vertically (design + backend + frontend per feature) with 4 phases totaling 20-25 hours",

      "phases": [
        {
          "phase": 1,
          "title": "Feature 1: Core Registration (Backend + Frontend)",
          "duration_hours": 6,
          "description": "Implement and demo basic registration",
          "deliverables": [...]
        }
        // ... additional phases
      ],

      "estimated_total_hours": 22,
      "estimated_complexity": "medium"
    },

    "alternative_plans": [
      {
        "name": "Sequential Phases",
        "confidence": 0.40,
        "why_might_prefer": "Maximum clarity and separation of concerns",
        "estimated_hours": 24,
        "trade_off": "Slower to first working feature",
        "ideal_for": "Distributed teams, clear handoffs",
        "phase_breakdown": "Design (4h) → Backend (10h) → Frontend (7h) → Integration (2h) → Testing (1h)"
      },
      {
        "name": "Minimal Viable",
        "confidence": 0.15,
        "why_might_prefer": "Get working demo to stakeholders fastest",
        "estimated_hours": 14,
        "trade_off": "Will need refactoring, technical debt",
        "ideal_for": "Need to validate idea quickly",
        "phase_breakdown": "Design + Backend MVP (8h) → Frontend MVP (4h) → Testing + Polish (2h)"
      },
      {
        "name": "Parallel Tracks",
        "confidence": 0.10,
        "why_might_prefer": "Multiple teams can work independently",
        "estimated_hours": 18,
        "trade_off": "Requires careful API contract upfront",
        "ideal_for": "Large distributed teams",
        "phase_breakdown": "Design (2h) → Backend & Frontend in parallel (12h) → Integration (2h) → Testing (2h)"
      }
    ],

    "pareto_frontier": {
      "fastest_path": {
        "plan": "Minimal Viable",
        "hours": 14,
        "risk": "high",
        "description": "Get to demo fastest but accept technical debt"
      },
      "safest_path": {
        "plan": "Sequential Phases",
        "hours": 24,
        "risk": "low",
        "description": "Maximum clarity and testing, takes longest"
      },
      "recommended_path": {
        "plan": "Feature-Driven",
        "hours": 20,
        "risk": "medium",
        "description": "Sweet spot: Good feedback cycles with reasonable safety"
      },
      "team_size_optimal": {
        "small_team_1_3": "Sequential or Feature-Driven",
        "medium_team_4_6": "Feature-Driven or Parallel",
        "large_team_7_plus": "Parallel Tracks"
      }
    },

    "how_to_choose": {
      "sequential_if": [
        "You prioritize code clarity",
        "Team is small (1-3 people)",
        "Schedule is flexible",
        "You have clear requirements upfront"
      ],
      "feature_driven_if": [
        "You want rapid feedback cycles",
        "Requirements might evolve",
        "Team is medium (4-6 people)",
        "You want working features end-to-end soon"
      ],
      "minimal_viable_if": [
        "Speed to validation is critical",
        "You're testing an idea",
        "Requirements are uncertain",
        "You're okay with refactoring later"
      ],
      "parallel_if": [
        "You have multiple teams",
        "Timeline is very tight",
        "You can define clear API contracts",
        "Team is large (7+ people)"
      ]
    }
  },

  "technical_decisions": [...],
  "risks": [...]
}
```

---

## Example 3: Enhanced Specialist Agents

### Current Agent (Before VS)

**File:** `plugins/rf-specialist-agents/agents/rf-event-management-specialist.md`

All investigations use one approach. Here's the enhancement:

### Enhanced Agent (After VS)

#### 1. Add Strategy Definition

**Add after the frontmatter section:**

```markdown
## Analysis Strategies

This agent can analyze event management questions using different strategies. Each strategy uncovers different insights:

### 1. Workflow Analysis (Confidence: 0.40)
- **Traces**: Event workflows, user journeys, state transitions
- **Finds**: Implementation flow, decision points, business logic
- **Best for**: Understanding how features work end-to-end
- **Example**: "How does event registration flow from form to database?"

### 2. Data Model Analysis (Confidence: 0.30)
- **Examines**: Event schemas, relationships, data integrity
- **Finds**: Schema structure, validation, relationships, constraints
- **Best for**: Understanding data structure and relationships
- **Example**: "How is attendee data stored?"

### 3. Integration Analysis (Confidence: 0.20)
- **Maps**: System touchpoints, external integrations, APIs
- **Finds**: Dependencies, integration points, data flows
- **Best for**: Understanding system interconnections
- **Example**: "How does event system connect to payment processing?"

### 4. Performance Analysis (Confidence: 0.10)
- **Investigates**: Bottlenecks, optimization opportunities, scalability
- **Finds**: Performance issues, query optimization, caching strategies
- **Best for**: Optimization and scalability questions
- **Example**: "How is the event listing query optimized?"

## Default Strategy Selection

The agent automatically selects strategy based on question context:

- Question about "how feature works?" → Workflow Analysis (0.40)
- Question about "how is data...?" → Data Model Analysis (0.30)
- Question about "how connects..." → Integration Analysis (0.20)
- Question about "performance/scale..." → Performance Analysis (0.10)

User can override by requesting specific strategy.
```

#### 2. Update Capabilities

**Update the capabilities list to add:**

```markdown
### Multi-Strategy Analysis
- Analyzes questions using most appropriate strategy (Workflow, Data Model, Integration, or Performance)
- Explains why a particular strategy was chosen
- Can use fallback strategies if primary yields insufficient insights
- Offers to use alternative strategies if user wants different perspective
- Coordinates strategy selection with question context and team needs
```

#### 3. Add Strategy-Aware Prompting

**In the agent invocation, use:**

```
# Current way (single approach)
Analyze how event registration works

# Enhanced way (with strategies)
Analyze how event registration works.

Available strategies:
1. Workflow Analysis (0.40) - Trace registration flow and decision points
2. Data Model Analysis (0.30) - Examine registration data structure
3. Integration Analysis (0.20) - Find payment/email touchpoints
4. Performance Analysis (0.10) - Identify scalability considerations

Primary strategy: Workflow Analysis
If you want different insights, I can use alternative strategies.
```

#### 4. Add Strategy to Output

**Modify agent response format:**

```json
{
  "strategy_used": {
    "name": "Workflow Analysis",
    "confidence": 0.40,
    "rationale": "Your question asks 'how event registration works', which is best answered by tracing the workflow"
  },
  "findings": {
    "primary_insight": "Event registration follows this flow: ...",
    "workflow_stages": [...]
  },
  "alternative_strategies_available": [
    {
      "name": "Data Model Analysis",
      "confidence": 0.30,
      "would_show": "Event and registration schemas, data relationships",
      "request_by_saying": "Can you analyze the data model for event registration?"
    },
    {
      "name": "Integration Analysis",
      "confidence": 0.20,
      "would_show": "Payment, email, and notification integrations",
      "request_by_saying": "Can you analyze what systems event registration integrates with?"
    }
  ]
}
```

---

## Example 4: Real-World Integration

### Scenario: Planning a New Email Notification Feature

#### Step 1: User Requests Enhancement Plan

```bash
/rf-plan feature "Add email notifications for event updates" complexity:medium
```

#### Step 2: Plugin Executes VS-Enhanced Planning

The plugin now:

1. **Analyzes Requirements**: Email notifications, event updates
2. **Generates 4 Plan Variants** with confidence scores
3. **Returns Primary + Alternatives**:

```json
{
  "plan_variants": {
    "primary_plan": {
      "name": "Feature-Driven Phases",
      "confidence": 0.35,
      "phases": [
        {
          "phase": 1,
          "title": "Email Service Integration",
          "hours": 5,
          "includes": "Email provider integration, API setup"
        },
        {
          "phase": 2,
          "title": "Backend: Notification Triggers",
          "hours": 8,
          "includes": "Event update listeners, email templating"
        },
        {
          "phase": 3,
          "title": "Frontend: User Preferences",
          "hours": 6,
          "includes": "Email preference UI, subscription management"
        },
        {
          "phase": 4,
          "title": "Testing & Polish",
          "hours": 3,
          "includes": "Email testing, performance tuning"
        }
      ],
      "total_hours": 22
    },

    "alternative_plans": [
      {
        "name": "Sequential (Design → Backend → Frontend)",
        "confidence": 0.40,
        "hours": 26,
        "best_for": "When you want maximum clarity"
      },
      {
        "name": "Minimal Viable (Core feature only)",
        "confidence": 0.15,
        "hours": 14,
        "best_for": "If you need fastest validation"
      }
    ],

    "how_to_choose": {
      "your_team_size": "3-4 people",
      "recommendation": "Feature-Driven (20 hours, 4 sprints of 5h each)",
      "why": "Your team size works well with feature-driven approach",
      "rationale": "Gives rapid feedback between frontend and backend developers"
    }
  }
}
```

#### Step 3: User Gets Multiple Valid Approaches

Instead of forcing one plan, user sees:
- **Recommended**: Feature-Driven approach (0.35 confidence)
- **Safe alternative**: Sequential (0.40 confidence)
- **Fast alternative**: Minimal Viable (0.15 confidence)

User can pick based on their actual needs vs. recommended approach.

#### Step 4: Follow-up Research

User asks for more details on Sequential approach:

```
/rf-research "Show me examples of sequential implementation in our codebase"
```

Plugin returns:
- **Primary findings** using Code-Path Analysis (0.45)
- **Alternative strategies** available for Pattern Discovery (0.30)

---

## Implementation Priority

### High Impact (Start Here)

1. **RF-Research Command** (2-3 hours)
   - Add strategy selection
   - Provide ranked strategies
   - Allow fallback strategies
   - **Benefit**: Users understand why research approach was chosen

2. **RF-Plan Command** (2-3 hours)
   - Add plan variants
   - Show Pareto frontier
   - Provide trade-off guidance
   - **Benefit**: Users can choose best approach for their situation

### Medium Impact (Next)

3. **Specialist Agents** (2-3 hours)
   - Add analysis strategy options
   - Show strategy selection rationale
   - Offer alternative strategies
   - **Benefit**: More flexible agent behavior

### Lower Priority (When Time Permits)

4. **Output Formats Documentation** (1-2 hours)
   - Document new VS output structures
   - Create user guides
   - Provide examples

---

## Testing Checklist

For each enhanced plugin:

```
[ ] Strategy/variant generation works correctly
[ ] Confidence scores are between 0.0 and 1.0
[ ] Confidence scores sum to approximately 1.0
[ ] Primary option has highest confidence
[ ] Alternative options ranked by confidence
[ ] Rationale for each option is clear
[ ] Trade-offs accurately described
[ ] JSON output valid and well-formed
[ ] Backwards compatible with existing callers
[ ] Documentation updated
```

---

## Next Steps

1. **Start with RF-Research**: Simplest to implement
2. **Test and refine**: Gather feedback on strategy rankings
3. **Move to RF-Plan**: More complex but higher impact
4. **Finalize agents**: Specialist agents last
5. **Document thoroughly**: Make sure users understand new options

