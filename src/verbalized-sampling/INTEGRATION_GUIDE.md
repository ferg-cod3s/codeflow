# Verbalized Sampling Integration Guide



<!-- VERBALIZED SAMPLING INTEGRATION -->
<!-- ================================ -->

**Selected Strategy**: Code-Path Analysis
**Confidence**: 71.0%

**Available Strategies**:
1. **Code-Path Analysis** (Confidence: 71.0%)
   - Plan: Identify entry points and main execution flows, Trace key decision branches and conditional logic...
2. **Pattern Discovery** (Confidence: 71.0%)
   - Plan: Scan codebase for repeated code structures, Identify naming conventions and architectural patterns...
3. **Architecture Mapping** (Confidence: 71.0%)
   - Plan: Identify major components and modules, Map data flow and dependencies between components...


This guide demonstrates how to integrate verbalized sampling into your CodeFlow agents, commands, and skills for improved decision-making and problem-solving.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Agent Integration](#agent-integration)
3. [Command Integration](#command-integration)
4. [Skill Integration](#skill-integration)
5. [Platform-Specific Setup](#platform-specific-setup)
6. [Validation and Testing](#validation-and-testing)
7. [Global Repository Management](#global-repository-management)
8. [Advanced Configuration](#advanced-configuration)
9. [Troubleshooting](#troubleshooting)

## Quick Start

### 1. Initialize VS Integration

```bash
# Initialize in your project
./vs-cli init

# Or specify platform
./vs-cli init --platform cursor
```

### 2. Test VS Generation

```bash
# Test with a research problem
./vs-cli test "How does user authentication work?"

# Test planning
./vs-cli test "Plan user profile feature" --type planning

# Test development
./vs-cli test "Implement OAuth2" --type development
```

### 3. Validate Integration

```bash
# Validate current directory
./vs-cli validate .

# Validate specific files
./vs-cli validate base-agents/

# Strict validation
./vs-cli validate . --strict --output report.json
```

## Agent Integration

### Basic Agent Structure

```markdown
---
name: my-agent
description: Agent description with VS integration
mode: subagent
temperature: 0.1
category: research
tags:
  - analysis
  - research
---

# My Agent

Agent description and capabilities.

<!-- VERBALIZED SAMPLING INTEGRATION -->
<!-- ================================ -->

**Selected Strategy**: [Strategy Name]
**Confidence**: [XX.X]%

**Available Strategies**:

1. **[Strategy 1]** (Confidence: [XX.X]%)
   - Plan: [Brief description]
2. **[Strategy 2]** (Confidence: [XX.X]%)
   - Plan: [Brief description]

<!-- Generated at: [ISO Date] -->

## Capabilities

[Agent capabilities and usage]
```

### Automated Integration

```bash
# Inject VS into an existing agent
./vs-cli inject base-agents/my-agent.md "Analyze system performance" --type research

# Inject with specific platform
./vs-cli inject base-agents/my-agent.md "Plan feature implementation" --platform opencode --type planning
```

### Manual Integration

```typescript
import { injectVSIntoComponent } from './src/verbalized-sampling/universal-integration.js';

const result = await injectVSIntoComponent(
  'base-agents/my-agent.md',
  'opencode',
  'Analyze user authentication flow',
  'research'
);

console.log(`Injected ${result.vsIntegration.strategiesCount} strategies`);
```

## Command Integration

### Command Structure

```markdown
# analyze-system

Analyze system components and their interactions.

### Verbalized Sampling Integration

This command uses verbalized sampling to determine the optimal analysis approach:

**Selected Strategy**: Multi-Phase Analysis
**Confidence**: 91.3%

**Strategy Options**:

- **Multi-Phase Analysis**: Initial scan → Deep analysis → Pattern extraction → Documentation (91.3%)
- **Targeted Search**: Query formulation → Result filtering → Context analysis → Summary (83.7%)

The command will automatically select the best strategy based on your context.

## Usage

\`\`\`bash
analyze-system [options] <target>
\`\`\`

## Options

- `--depth <level>`: Analysis depth (1-5)
- `--format <type>`: Output format (json, markdown, text)
- `--include-external`: Include external dependencies
```

### Integration Pattern

Commands use the `usage-section` pattern to integrate VS information into their documentation.

## Skill Integration

### Skill Structure

```markdown
---
name: data-analysis-skill
description: Advanced data analysis with VS-guided methodology
---

# Data Analysis Skill

## Verbalized Sampling Strategy

This skill uses verbalized sampling to determine the optimal data analysis approach:

### Selected Strategy: Context-Aware Analysis

**Confidence**: 88.6%

### Alternative Strategies

#### Pattern-Based Approach

**Confidence**: 81.2%
Pattern matching → Classification → Documentation → Recommendations

#### Statistical Analysis

**Confidence**: 75.8%
Data validation → Statistical tests → Correlation analysis → Insights

### Execution Plan

1. **Data Assessment**: Evaluate data quality and structure
2. **Context Gathering**: Understand business requirements and constraints
3. **Strategy Selection**: Choose optimal analysis methodology
4. **Implementation**: Execute analysis with selected approach
5. **Validation**: Verify results and document findings

## Implementation

[Skill implementation details]
```

### Metadata Integration

Skills can also integrate VS information in their YAML frontmatter:

```yaml
---
name: data-analysis-skill
description: Advanced data analysis with VS-guided methodology
verbalized_sampling:
  enabled: true
  selected_strategy: 'Context-Aware Analysis'
  confidence: 0.886
  strategies:
    - name: 'Context-Aware Analysis'
      confidence: 0.886
      type: 'research'
      execution_steps: 5
    - name: 'Pattern-Based Approach'
      confidence: 0.812
      type: 'research'
      execution_steps: 4
last_updated: '2025-01-15T10:30:00.000Z'
---
```

## Platform-Specific Setup

### OpenCode Integration

```bash
# Initialize for OpenCode
./vs-cli init --platform opencode

# Directory structure created:
# ├── base-agents/          # Agents with VS integration
# ├── commands-simplified/  # Commands with VS integration
# ├── base-skills/         # Skills with VS integration
# └── opencode.jsonc       # Platform configuration
```

**OpenCode Features:**

- JSONC configuration blocks in agent files
- Flat directory structure
- Frontmatter-based VS integration

### Claude Code Integration

```bash
# Initialize for Claude
./vs-cli init --platform claude

# Directory structure:
# ├── agents/               # Claude agents
# ├── commands-simplified/  # Commands with VS
# └── skills/              # Skills with VS
```

**Claude Features:**

- Simplified markdown format
- Prepend-based VS integration
- Command-focused structure

### Cursor Integration

```bash
# Initialize for Cursor
./vs-cli init --platform cursor

# Directory structure:
# └── .cursor/
#     ├── agents/           # Cursor agents
#     ├── commands/         # Commands with VS
#     └── skills/           # Skills with VS
# .cursorrules             # Cursor rules file
```

**Cursor Features:**

- `.cursor` directory structure
- YAML frontmatter integration
- `.cursorrules` configuration

## Validation and Testing

### Comprehensive Validation

```bash
# Full project validation
./vs-cli validate . --strict --output validation-report.json

# Platform-specific validation
./vs-cli validate . --platform opencode

# Component-specific validation
./vs-cli validate base-agents/ --type agent
```

### Validation Report Structure

```json
{
  "timestamp": "2025-01-15T10:30:00.000Z",
  "totalFiles": 25,
  "validFiles": 23,
  "invalidFiles": 2,
  "averageScore": 87.5,
  "results": [
    {
      "filePath": "base-agents/research-agent.md",
      "platform": "opencode",
      "componentType": "agent",
      "valid": true,
      "score": 95,
      "errors": [],
      "warnings": ["Consider adding more detailed strategy descriptions"],
      "suggestions": ["Add execution time estimates for strategies"]
    }
  ],
  "summary": {
    "byPlatform": {
      "opencode": { "total": 15, "valid": 14, "avgScore": 89.2 },
      "claude": { "total": 8, "valid": 7, "avgScore": 84.1 },
      "cursor": { "total": 2, "valid": 2, "avgScore": 92.3 }
    },
    "byComponentType": {
      "agent": { "total": 15, "valid": 14, "avgScore": 88.5 },
      "command": { "total": 8, "valid": 7, "avgScore": 85.2 },
      "skill": { "total": 2, "valid": 2, "avgScore": 90.1 }
    },
    "commonErrors": [{ "error": "Missing VS integration", "count": 2 }],
    "commonWarnings": [{ "warning": "Low confidence score", "count": 3 }]
  }
}
```

### Quality Scoring

The validation system assigns quality scores based on:

- **VS Integration Presence** (20 points): Has verbalized sampling section
- **Strategy Completeness** (25 points): All required strategy elements present
- **Confidence Scoring** (20 points): Appropriate confidence ranges
- **Platform Compliance** (15 points): Follows platform conventions
- **Documentation Quality** (10 points): Clear, well-formatted content
- **Error-Free** (10 points): No validation errors

### Automated Testing

```typescript
import { runVSValidation } from './src/verbalized-sampling/validation-framework.js';

// Validate entire project
const report = await runVSValidation('.', {
  strictMode: true,
  includeWarnings: true,
  testVSGeneration: true,
  testIntegration: true,
  testPlatformCompliance: true,
  minQualityScore: 80,
});

console.log(`Quality Score: ${report.averageScore}/100`);
```

## Global Repository Management

### Export to Global Repository

```bash
# Export all components
./vs-cli export /path/to/global/repo

# Export specific components
./vs-cli export /path/to/global/repo --components agents,commands

# Export specific platforms
./vs-cli export /path/to/global/repo --platforms opencode,cursor
```

### Import from Global Repository

```bash
# Import updates
./vs-cli import /path/to/global/repo

# Force overwrite local changes
./vs-cli import /path/to/global/repo --force
```

### Bidirectional Synchronization

```bash
# Sync with conflict resolution
./vs-cli sync /path/to/global/repo --resolve local

# Available resolution strategies:
# - local: Keep local version
# - remote: Use remote version
# - merge: Attempt automatic merge
# - skip: Skip conflicting files
```

### Global Repository Structure

```
global-vs-repo/
├── verbalized-sampling/
│   ├── core/                    # Core VS implementation
│   ├── platforms/               # Platform-specific files
│   │   ├── opencode/
│   │   ├── claude/
│   │   └── cursor/
│   ├── templates/               # Integration templates
│   │   ├── agents/
│   │   ├── commands/
│   │   └── skills/
│   ├── examples/                # Usage examples
│   ├── metadata/                # Sync metadata
│   └── README.md               # Global repo documentation
```

## Advanced Configuration

### Custom Configuration

Create a `vs-config.json` file in your project root:

```json
{
  "verbalized_sampling": {
    "enabled": true,
    "platform": "opencode",
    "auto_inject": true,
    "confidence_threshold": 0.7,
    "strategy_count": 3,
    "output_format": "markdown",
    "custom_weights": {
      "contextual_fit": 0.4,
      "success_probability": 0.3,
      "efficiency": 0.2,
      "user_preference": 0.1
    }
  }
}
```

### Custom Strategy Patterns

```typescript
import { VSInjectionPatterns } from './src/verbalized-sampling/injection-patterns.js';

// Add custom pattern
VSInjectionPatterns.createCustomPattern('agent', {
  name: 'custom-integration',
  description: 'Custom integration pattern for specialized agents',
  placement: 'after-heading',
  format: 'markdown',
  template: `## AI Strategy Analysis

**Selected Approach**: {{selectedStrategy}}
**Confidence Level**: {{confidencePercentage}}%

### Strategy Breakdown
{{#each strategies}}
- **{{name}}**: {{description}} ({{confidencePercentage}}%)
{{/each}}

*Generated using verbalized sampling methodology*
`,
  variables: ['selectedStrategy', 'confidencePercentage', 'strategies'],
});
```

### Platform-Specific Adapters

```typescript
import { PlatformAdapters } from './src/verbalized-sampling/platform-adapters.js';

// Add custom platform
PlatformAdapters.adapters.set('custom-platform', {
  name: 'custom-platform',
  description: 'Custom platform with specialized requirements',
  fileExtensions: ['.custom'],
  defaultPaths: {
    agents: 'custom-agents',
    commands: 'custom-commands',
    skills: 'custom-skills',
  },
  conventions: {
    commentStyle: 'md',
    frontMatter: false,
    indentation: 'tabs',
    indentSize: 1,
  },
  integration: {
    preferredPattern: 'custom-integration',
    autoInject: true,
    validation: true,
  },
});
```

## Troubleshooting

### Common Issues

#### VS Integration Not Found

**Problem**: Validation reports missing VS integration
**Solution**:

```bash
# Inject VS integration
./vs-cli inject path/to/component.md "Problem description" --type research

# Or manually add the integration section
```

#### Low Confidence Scores

**Problem**: Generated strategies have low confidence
**Solution**:

- Provide more context in the problem description
- Check for existing patterns in the system
- Consider manual strategy selection for complex problems

#### Platform Compliance Errors

**Problem**: Files don't follow platform conventions
**Solution**:

```bash
# Check platform requirements
./vs-cli info --platform opencode

# Reformat content
./vs-cli inject file.md "problem" --platform opencode --force
```

#### Sync Conflicts

**Problem**: Bidirectional sync reports conflicts
**Solution**:

```bash
# Choose resolution strategy
./vs-cli sync /repo/path --resolve merge

# Or resolve manually and re-sync
```

### Debug Mode

Enable detailed logging:

```bash
DEBUG=vs:* ./vs-cli validate .
```

### Performance Optimization

For large codebases:

```typescript
// Use streaming validation
const report = await runVSValidation('.', {
  testVSGeneration: false, // Skip VS generation tests
  testIntegration: true, // Keep integration validation
  testPlatformCompliance: false, // Skip platform checks
});
```

### Reset and Recovery

If VS integration becomes corrupted:

```bash
# Remove VS integration
rm -rf src/verbalized-sampling/

# Reinitialize
git checkout HEAD -- src/verbalized-sampling/
./vs-cli init
```

## Best Practices

### Agent Development

1. Always include VS integration in new agents
2. Use descriptive problem statements for better strategy selection
3. Validate agents before committing
4. Document strategy selection rationale

### Command Development

1. Integrate VS in usage sections
2. Provide clear strategy descriptions
3. Test commands with different problem types
4. Include strategy selection examples

### Skill Development

1. Use metadata integration for programmatic access
2. Include execution plans in VS integration
3. Validate skills across different contexts
4. Document strategy performance characteristics

### Repository Management

1. Regular sync with global repositories
2. Resolve conflicts promptly
3. Backup before major changes
4. Use descriptive commit messages for VS changes

## Integration Examples

### Research Agent

```markdown
<!-- VERBALIZED SAMPLING INTEGRATION -->
<!-- ================================ -->

**Selected Strategy**: Code-Path Analysis
**Confidence**: 87.3%

**Available Strategies**:

1. **Code-Path Analysis** (Confidence: 87.3%)
   - Plan: Trace execution flows, identify key components, map dependencies
2. **Pattern Discovery** (Confidence: 82.1%)
   - Plan: Search for recurring patterns, analyze implementations, document findings
```

### Planning Command

```markdown
### Verbalized Sampling Integration

This command uses verbalized sampling to determine the optimal planning approach:

**Selected Strategy**: Sequential Planning
**Confidence**: 92.1%

**Strategy Options**:

- **Sequential Planning**: Requirements → Design → Implementation → Testing (92.1%)
- **Feature-Driven Planning**: Core features → Extensions → Optimization (85.7%)
```

### Development Skill

```yaml
verbalized_sampling:
  enabled: true
  selected_strategy: 'API-First Development'
  confidence: 0.894
  strategies:
    - name: 'API-First Development'
      confidence: 0.894
      type: 'development'
      execution_steps: 6
    - name: 'Component-First'
      confidence: 0.821
      type: 'development'
      execution_steps: 5
```

This comprehensive integration guide provides everything needed to successfully implement verbalized sampling across your CodeFlow ecosystem.
