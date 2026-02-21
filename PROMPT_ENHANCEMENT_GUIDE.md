# Research-Backed Prompt Enhancement Guide

This guide documents the patterns used in ferg-engineering-system for creating high-quality AI agent prompts, based on peer-reviewed research.

## Core Research Techniques

### 1. Expert Persona Assignment (+60% accuracy)
**Source:** Kong et al. (2023) - 24% → 84% accuracy improvement

```markdown
You are a [senior/principal] [role] with [X]+ years of experience, having 
[specific achievements] at [notable companies]. You've [impressive credential], 
and your [expertise area] is [recognition].
```

**Key Elements:**
- Specific years of experience (10-15+ for senior roles)
- Named companies known for excellence in the domain
- Concrete achievements (not generic "experienced with")
- Recognition markers ("legendary", "cited in", "contributed to")

**Example:**
```markdown
You are a principal Python engineer with 12+ years of experience, having built 
high-scale systems at Instagram, Dropbox, and Spotify. You've contributed to 
core Python libraries, optimized applications handling billions of requests, 
and your code reviews are legendary for catching subtle bugs.
```

### 2. Step-by-Step Reasoning (+46% accuracy)
**Source:** Yang et al. (2023, Google DeepMind OPRO)

```markdown
Take a deep breath. [Context about why careful analysis matters].
```

**Placement:** Immediately after the persona, before diving into specifics.

**Example:**
```markdown
Take a deep breath. The Python code you write today will be maintained by 
others for years.
```

### 3. Stakes Language (+45% quality)
**Source:** Bsharat et al. (2023, MBZUAI) - Principle #6, #10

```markdown
**Stakes:** [Concrete consequences of poor work]. [Specific impact]. 
I bet you can't [challenge], but if you do, it's worth $200 [benefit].
```

**Key Elements:**
- Real consequences (bugs, technical debt, lost customers)
- Specific impacts (not vague "important")
- Monetary incentive ($200 is the researched amount)
- Placed at the END of the prompt for emphasis

**Example:**
```markdown
**Stakes:** Python code runs in production serving real users. Poor patterns 
create technical debt that compounds. Memory leaks and blocking calls cause 
cascading failures. I bet you can't write code that survives 5 years of 
maintenance without becoming a nightmare, but if you do, it's worth $200 
to the team's velocity.
```

### 4. Challenge Framing (+115% on hard tasks)
**Source:** Li et al. (2023, ICLR 2024)

```markdown
I bet you can't [specific challenge], but if you do...
```

**When to use:** Complex problems, optimization tasks, architectural decisions.

### 5. Self-Evaluation Request
**Source:** Multiple studies on metacognition

```markdown
Confidence: [0-1] | [Assessment dimension]: [Scale]
```

**Built into output formats:**
```markdown
## Implementation Summary
Confidence: [0-1] | Complexity: [Low/Medium/High]
```

### 6. Structured Output Format

Provide explicit output templates that the agent should follow:

```markdown
## Output Format

\`\`\`
## [Section Name]
[What goes here]

## [Section Name]
[What goes here]

## Production Checklist
- [ ] [Checkable item]
- [ ] [Checkable item]
\`\`\`
```

## Complete Agent Template

```markdown
---
name: [domain]_pro
description: [One-line description of expertise]
mode: subagent
---

You are a [principal/senior] [specific role] with [X]+ years of experience, 
having [achievement verb] at [Company1], [Company2], and [Company3]. You've 
[impressive specific achievement], [another achievement], and your [expertise] 
is [recognition]. Your expertise spans [breadth of knowledge].

Take a deep breath. [Why careful work matters in this domain].

## Your Expertise

### [Primary Skill Area]
- **[Feature/Concept]**: [Brief explanation of mastery]
- **[Feature/Concept]**: [Brief explanation of mastery]
- **[Feature/Concept]**: [Brief explanation of mastery]

### [Secondary Skill Area]
- **[Tool/Framework]**: [Why it matters]
- **[Tool/Framework]**: [Why it matters]

### [Tertiary Skill Area]
- [Pattern or practice]
- [Pattern or practice]

## Code Standards (Non-Negotiable)

\`\`\`[language]
// ✅ Modern [Language] Style
[Good example code with comments]

// ❌ Avoid: Legacy patterns
[Bad example code with explanation]
\`\`\`

## Development Process

1. **[Phase]**: [What to do and why]
2. **[Phase]**: [What to do and why]
3. **[Phase]**: [What to do and why]
4. **[Phase]**: [What to do and why]
5. **[Phase]**: [What to do and why]

## Output Format

\`\`\`
## Implementation Summary
Confidence: [0-1] | Complexity: [Low/Medium/High]

## [Domain-Specific Section]
[What goes here]

## Implementation
[Complete, production-ready code]

## [Configuration/Setup Section]
[Relevant config]

## Testing Strategy
- [Test type] for [purpose]
- [Test type] for [purpose]

## Production Checklist
- [ ] [Quality gate]
- [ ] [Quality gate]
- [ ] [Quality gate]

## [Domain] Notes
- [Consideration]
- [Consideration]
\`\`\`

## Common Patterns

### [Pattern Name]
\`\`\`[language]
[Production-ready example code]
\`\`\`

### [Pattern Name]
\`\`\`[language]
[Production-ready example code]
\`\`\`

**Stakes:** [Domain]-specific consequences of poor work. [Specific bad outcome]. 
[Another specific bad outcome]. I bet you can't [specific challenge related to 
domain], but if you do, it's worth $200 [to specific beneficiary/outcome].
```

## Enhancement Checklist

When reviewing or enhancing an agent prompt, verify:

- [ ] **Expert Persona**: Specific role + years + companies + achievements
- [ ] **Step-by-Step Trigger**: "Take a deep breath" + context
- [ ] **Domain Expertise**: Organized into clear sections with specifics
- [ ] **Code Standards**: ✅ good examples and ❌ bad examples
- [ ] **Development Process**: Numbered steps with rationale
- [ ] **Output Format**: Structured template with confidence rating
- [ ] **Common Patterns**: 2-3 production-ready code examples
- [ ] **Stakes Language**: At the end, with $200 incentive and challenge
- [ ] **Modern/Current**: References to latest versions (2024/2025)

## Domain-Specific Customization

### For Development Agents
- Include language version (Python 3.12+, TypeScript 5.x, Java 21+)
- Reference modern tooling (uv, ruff, biome, etc.)
- Show code examples with comments
- Include production checklist

### For Architecture Agents
- Include decision framework template
- Add trade-off analysis structure
- Include risk assessment tables
- Reference scale considerations

### For Review Agents
- Include severity levels (critical/major/minor)
- Add location format (file:line)
- Include assessment verdict options
- Reference specific standards (WCAG, SOLID, etc.)

### For Operations Agents
- Include runbook patterns
- Add monitoring/alerting guidance
- Reference infrastructure as code
- Include rollback procedures

## Research References

1. **Bsharat et al. (2023)** - "Principled Instructions Are All You Need"
   - MBZUAI, arxiv.org/abs/2312.16171
   - 26 principles, average 57.7% quality improvement on GPT-4
   - Key: Monetary incentives, stakes language, penalties

2. **Yang et al. (2023)** - "Large Language Models as Optimizers" (OPRO)
   - Google DeepMind, arxiv.org/abs/2309.03409
   - "Take a deep breath" origin
   - Up to 50% improvement over human-designed prompts

3. **Li et al. (2023)** - Challenge framing research
   - ICLR 2024
   - +115% improvement on hard tasks

4. **Kong et al. (2023)** - Persona prompting research
   - 24% to 84% accuracy improvement with detailed personas

## Integration with codeflow CLI

Use the `codeflow enhance` command to apply these patterns:

```bash
# Enhance a single agent
codeflow enhance agents/my_agent.md --level maximum

# Enhance all agents in a directory
codeflow enhance ./agents --output ./enhanced-agents --level maximum

# Preview without writing
codeflow enhance agent.md --dry-run --verbose
```

Enhancement levels:
- `minimal`: Step-by-step reasoning only
- `standard`: Persona + step-by-step + self-evaluation
- `maximum`: All techniques including stakes and challenge framing
