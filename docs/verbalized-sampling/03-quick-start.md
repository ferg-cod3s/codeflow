# Verbalized Sampling for RF Plugins: Quick Start Guide

Get Verbalized Sampling integrated into your rf_plugins in under a day.

---

## TL;DR

**Problem**: Your plugins generate one output. Users want choices.

**Solution**: Ask models for multiple ranked alternatives with confidence scores.

**Result**: 1.6-2.1× more useful plugin outputs, zero retraining.

---

## What Changes?

### Before (Single Output)
```
User: /rf-plan feature "Add email notifications"
Plugin: [Returns 1 implementation plan with 5 phases]
```

### After (Multiple Ranked Options)
```
User: /rf-plan feature "Add email notifications"
Plugin: [Returns]
- Primary plan: Feature-Driven (22h, confidence: 0.35)
- Alternative 1: Sequential (26h, confidence: 0.40)
- Alternative 2: Minimal Viable (14h, confidence: 0.15)
→ User picks what fits their situation
```

---

## Step 1: Update One Command (15 minutes)

### File: `plugins/rf-research-workflows/commands/rf-research`

**Add after line 6:**

```yaml
research_strategies:
  - name: "Code-Path"
    prob: 0.45
  - name: "Pattern Discovery"
    prob: 0.30
  - name: "Architecture"
    prob: 0.15
  - name: "Integration"
    prob: 0.10
```

**Replace line 189 output with:**

```
Add to JSON output:
"strategy_used": {
  "name": "Code-Path",
  "confidence": 0.45
},
"alternatives": [
  {"name": "Pattern Discovery", "confidence": 0.30}
]
```

**Test it:**
```bash
/rf-research "How is event registration handled?"
```

You should see strategy info in output with alternatives listed.

---

## Step 2: Update Another Command (15 minutes)

### File: `plugins/rf-planning-tools/commands/rf-plan`

**Add after line 6:**

```yaml
plan_variants:
  sequential:
    name: "Sequential"
    hours: 24
    confidence: 0.40
  feature_driven:
    name: "Feature-Driven"
    hours: 20
    confidence: 0.35
  minimal:
    name: "Minimal Viable"
    hours: 14
    confidence: 0.15
```

**Replace line 250 output section with:**

```
Add to JSON:
"plan_variants": {
  "primary": {
    "name": "Feature-Driven",
    "confidence": 0.35,
    "hours": 20
  },
  "alternatives": [
    {"name": "Sequential", "confidence": 0.40, "hours": 24},
    {"name": "Minimal Viable", "confidence": 0.15, "hours": 14}
  ]
}
```

**Test it:**
```bash
/rf-plan feature "New registration form"
```

You should see 3 plan options ranked by confidence.

---

## Step 3: Update Specialist Agents (15 minutes)

### File: `plugins/rf-specialist-agents/agents/rf-event-management-specialist.md`

**Add after frontmatter:**

```markdown
## Analysis Strategies

1. **Workflow** (0.40) - How things flow
2. **Data Model** (0.30) - How data is structured
3. **Integration** (0.20) - How systems connect
4. **Performance** (0.10) - How to optimize
```

**When invoking agent, add:**

```
Available strategies:
- Workflow Analysis (0.40)
- Data Model Analysis (0.30)
- Integration Analysis (0.20)
- Performance Analysis (0.10)

I'll use Workflow first. Ask for alternatives if you want different insights.
```

**Test it:** Ask event management agent questions and note which strategy it picked.

---

## Step 4: Update Output Format Doc (10 minutes)

### File: `docs/OUTPUT_FORMATS.md`

Add new section:

```markdown
## Verbalized Sampling Format

All outputs now support alternatives:

```json
{
  "primary_option": {
    "name": "...",
    "confidence": 0.45,
    "rationale": "..."
  },
  "alternatives": [
    {
      "name": "...",
      "confidence": 0.30
    }
  ]
}
```
```

---

## Confidence Score Rules

When generating alternatives, make sure:

1. **Scores sum to ~1.0** (accounting for rounding)
2. **Primary is highest** (at least 0.30 confidence)
3. **Ordered by confidence** (descending)
4. **Include rationale** (why this ranking)

**Example:**
```json
{
  "primary": 0.40,
  "alt1": 0.35,
  "alt2": 0.15,
  "alt3": 0.10
  // Total: 1.0 ✓
}
```

---

## Common Patterns

### For Research Commands

```python
strategies = [
  ("Code Analysis", 0.45),
  ("Pattern Discovery", 0.30),
  ("Architecture", 0.15),
  ("Integration", 0.10)
]
# Always: execute primary (0.45), offer others as alternatives
```

### For Planning Commands

```python
plans = [
  ("Sequential", 24, 0.40),
  ("Feature-Driven", 20, 0.35),
  ("Minimal Viable", 14, 0.15),
  ("Parallel", 18, 0.10)
]
# Always: recommend primary, show Pareto frontier
```

### For Agent Selection

```python
strategies = [
  ("Workflow", 0.40),
  ("Data Model", 0.30),
  ("Integration", 0.20),
  ("Performance", 0.10)
]
# Always: pick highest, offer to switch if user asks
```

---

## Testing (10 minutes)

For each plugin/command:

```bash
# Test 1: Run command, verify VS output appears
/rf-research "question"
/rf-plan feature "description"
/rf-event-management-specialist "question"

# Test 2: Verify JSON structure
- [ ] Has "confidence" field
- [ ] Confidence between 0.0-1.0
- [ ] Primary has highest confidence
- [ ] Alternatives listed
- [ ] Rationale provided

# Test 3: Verify usability
- [ ] Users understand why option was chosen
- [ ] Trade-offs are clear
- [ ] Can easily choose alternative
```

---

## Results to Expect

After implementing VS in your plugins:

- **Users see ranked options** instead of single output
- **Plugins feel more powerful** (multiple valid approaches)
- **Decision-making clearer** (rationale provided)
- **Flexibility improved** (users pick what fits their needs)

**Real metrics from the research paper:**
- Diversity: 1.6-2.1× improvement
- User satisfaction: +25.7%
- Quality: Maintained (98%+)
- Safety: Maintained (97%+)

---

## Troubleshooting

### Issue: Confidence scores don't sum to 1.0

**Solution**: Renormalize
```python
scores = [0.45, 0.30, 0.20, 0.05]  # Sums to 1.0
# If different: total = sum(scores)
# Then: scores = [s/total for s in scores]
```

### Issue: All strategies seem equally good

**Solution**: Consider these factors:
- **Question context** (what does user ask determines best strategy)
- **Team expertise** (what has your team done before)
- **Time available** (fast vs. thorough trade-offs)
- **Risk tolerance** (safe vs. aggressive)

### Issue: Users always pick the alternative, not primary

**Solution**: Review your confidence scoring. If alternatives are chosen 50%+ of the time:
- Recalibrate confidence scores
- Ensure primary truly is most suitable
- Gather feedback on why users prefer alternatives

### Issue: Output format breaks existing code

**Solution**: Wrap old format in "primary_option" field for backwards compatibility:
```json
{
  "primary_option": {/* old output here */},
  "alternatives": []  // empty if single option
}
```

---

## Integration Timeline

| Time | Task | Impact |
|------|------|--------|
| **15 min** | Update rf-research | 🟡 Medium |
| **15 min** | Update rf-plan | 🟢 High |
| **15 min** | Update agents | 🟡 Medium |
| **10 min** | Update docs | 🔵 Low |
| **10 min** | Test all | 🟢 High |
| **Total: ~65 minutes** | Full integration | ✨ Powerful |

---

## Key Insights

1. **Zero Retraining**: This works by changing prompts, not retraining models

2. **Backwards Compatible**: Old code can ignore alternatives field

3. **Pareto Frontier**: Show users the fundamental trade-offs (fast vs. safe vs. simple)

4. **Strategy Matters**: Why you chose option X is as important as option X itself

5. **Let Users Decide**: Give ranked recommendations, let users pick what fits their situation

---

## Next Level: Advanced Features

After basic implementation, consider:

### 1. **User Preference Learning**
Track which alternatives users actually choose, adjust confidence scores accordingly

### 2. **Context-Aware Ranking**
If you know user's team size, timeline, and risk tolerance, update confidence scores

### 3. **Hybrid Approaches**
Let users request combinations of alternatives (e.g., "Feature-Driven planning with Parallel execution")

### 4. **Feedback Loop**
After user implements chosen option, gather feedback on how well it worked

---

## Resources

- **Full integration guide**: `VERBALIZED_SAMPLING_INTEGRATION.md`
- **Concrete examples**: `VS_RF_PLUGIN_EXAMPLES.md`
- **Research paper**: `2510.01171.pdf` (Chapters 3-5 on methodology)
- **Prompting techniques**: `VS_QUICK_REFERENCE.md`

---

## Success Checklist

- [ ] RF-Research returns ranked strategies
- [ ] RF-Plan shows multiple plan variants with Pareto frontier
- [ ] Specialist agents explain strategy choice
- [ ] All outputs include confidence scores
- [ ] Documentation updated with examples
- [ ] Team can explain when to use each variant
- [ ] Users report better decision-making
- [ ] Output quality maintained

---

## Final Thoughts

Verbalized Sampling transforms your plugins from single-answer tools to decision-support tools. Instead of forcing one approach, you're saying:

> "Here are 4 valid approaches ranked by suitability. Primary is X for these reasons. Alternatives are Y and Z if you prefer different trade-offs."

This small change makes your plugins dramatically more powerful and useful.

**Start with 15 minutes. See the impact. Expand from there.**

Good luck! 🚀

