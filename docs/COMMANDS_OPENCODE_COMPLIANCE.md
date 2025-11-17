# Commands OpenCode Format Compliance Analysis

**Date:** 2025-11-17
**Purpose:** Analyze CodeFlow commands for OpenCode format compliance and provide recommendations

---

## Executive Summary

This document analyzes all 60 CodeFlow commands against the OpenCode format specification to ensure proper conversion and compatibility. Key findings indicate significant discrepancies between our rich command metadata and OpenCode's simpler format, requiring careful conversion strategy.

### Key Findings

- **60 commands** currently using custom extended format
- **OpenCode format** is significantly simpler than our current format
- **Conversion challenges**: Extensive metadata, generic `$ARGUMENTS` placeholder
- **Recommendation**: Preserve extended format in body, simplify frontmatter for OpenCode

---

## 1. OpenCode Command Format Specification

Based on research from https://opencode.ai and the opencode-ai/opencode GitHub repository:

### 1.1 OpenCode Standard Format

```markdown
---
description: Brief command description (REQUIRED)
agent: agent-name (optional - which agent to invoke)
model: model-name (optional - override default model)
---

Command template with $NAMED_PLACEHOLDERS for arguments.

Use $ARGUMENTS to capture all remaining arguments.
```

### 1.2 Key Specifications

**Frontmatter Fields:**
- `description` (REQUIRED): Brief command description
- `agent` (optional): Specific agent to execute the command
- `model` (optional): Override the default model
- No `name` field - filename determines command name

**Argument Placeholders:**
- Format: `$NAME` where NAME is uppercase letters, numbers, underscores
- Must start with a letter
- `$ARGUMENTS` can capture all remaining arguments
- Named placeholders prompt user for values when command is invoked

**Template Body:**
- The entire body is the command template
- Placeholders are replaced with user-provided values
- Can include any instructional text

### 1.3 What OpenCode Does NOT Support

OpenCode's simple format does not include:
- ❌ `inputs` array with type specifications
- ❌ `outputs` array with structured formats
- ❌ `cache_strategy` configuration
- ❌ `success_signals` array
- ❌ `failure_modes` array
- ❌ `validation_rules` array
- ❌ `version`, `last_updated`, `command_schema_version` fields
- ❌ `mode: command` field
- ❌ `subtask` flag (replaced by simple `agent` field)

---

## 2. Current CodeFlow Command Format

### 2.1 CodeFlow Extended Format

```yaml
---
name: command-name
mode: command
description: Command description
subtask: true|false
version: 2.0.0
last_updated: 2025-09-13
command_schema_version: 1.0
inputs:
  - name: param1
    type: string
    required: true
    description: Parameter description
  - name: param2
    type: array
    required: false
    description: Optional parameter
outputs:
  - name: output_name
    type: structured
    format: JSON with details
    description: Output description
cache_strategy:
  type: agent_specific
  ttl: 900
  invalidation: manual
  scope: command
success_signals:
  - 'Success indicator 1'
  - 'Success indicator 2'
failure_modes:
  - 'Failure scenario 1'
  - 'Failure scenario 2'
validation_rules:
  - rule: rule_name
    severity: error
    message: Validation message
    condition: condition
---

# Command Title

**Input**: $ARGUMENTS

[Comprehensive command documentation with phases, guidelines, examples]

{{param1}}
{{param2}}
```

### 2.2 CodeFlow Format Features

**Rich Metadata:**
- Detailed input/output specifications
- Caching strategies
- Success/failure indicators
- Validation rules
- Version tracking

**Template Placeholders:**
- `$ARGUMENTS` - Generic catch-all
- `{{param_name}}` - Specific parameter references at end of body

**Comprehensive Documentation:**
- Purpose and preconditions
- Multi-phase workflow descriptions
- Error handling specifications
- Structured output formats (JSON schemas)
- Best practices and anti-patterns
- Subagent orchestration guidance

---

## 3. Gap Analysis: CodeFlow vs OpenCode

### 3.1 Format Incompatibilities

| Feature | CodeFlow Format | OpenCode Format | Compatibility |
|---------|----------------|-----------------|---------------|
| **Frontmatter** |
| Command name | `name: command-name` | Filename only | ⚠️ Conversion needed |
| Description | `description:` | `description:` | ✅ Compatible |
| Mode field | `mode: command` | Not used | ⚠️ Remove on conversion |
| Agent assignment | `subtask: true` + implicit | `agent: agent-name` | ⚠️ Conversion needed |
| Model override | Not commonly used | `model: model-name` | ✅ Compatible |
| **Metadata** |
| Input specs | Detailed `inputs:` array | Not supported | ❌ Lost on conversion |
| Output specs | Detailed `outputs:` array | Not supported | ❌ Lost on conversion |
| Cache strategy | `cache_strategy:` object | Not supported | ❌ Lost on conversion |
| Success signals | `success_signals:` array | Not supported | ❌ Lost on conversion |
| Failure modes | `failure_modes:` array | Not supported | ❌ Lost on conversion |
| Validation rules | `validation_rules:` array | Not supported | ❌ Lost on conversion |
| Versioning | `version:`, `last_updated:` | Not supported | ❌ Lost on conversion |
| **Arguments** |
| Generic capture | `$ARGUMENTS` | `$ARGUMENTS` | ✅ Compatible |
| Named placeholders | `{{param}}` at end | `$PARAM` inline | ⚠️ Conversion needed |
| Type specifications | In frontmatter `inputs` | Not supported | ❌ Lost on conversion |
| **Template** |
| Body content | Full documentation | Simple template | ✅ Compatible (large) |

### 3.2 Critical Issues

#### Issue 1: Rich Metadata Loss
**Problem:** CodeFlow commands contain extensive metadata (inputs, outputs, caching, validation) that has no equivalent in OpenCode format.

**Impact:**
- Loss of type information for command arguments
- Loss of structured output specifications
- Loss of caching strategies and optimization hints
- Loss of validation rules and success/failure criteria

**Risk Level:** HIGH

#### Issue 2: Generic $ARGUMENTS vs Named Placeholders
**Problem:** Most CodeFlow commands use generic `$ARGUMENTS` instead of specific named placeholders like `$ENVIRONMENT`, `$TARGET_PATH`, etc.

**Impact:**
- Users won't be prompted for specific argument names
- Less clarity on what arguments are expected
- Harder to provide argument-specific validation

**Risk Level:** MEDIUM

**Example - Current:**
```markdown
**Input**: $ARGUMENTS
```

**Example - OpenCode Best Practice:**
```markdown
Deploy to $ENVIRONMENT environment with version $VERSION.

Target: $TARGET_PATH
Rollback on failure: $ROLLBACK_ON_FAILURE
```

#### Issue 3: Placeholder Format Mismatch
**Problem:** CodeFlow uses `{{param}}` format at end of template, OpenCode uses `$PARAM` format inline.

**Impact:**
- Placeholders won't be recognized by OpenCode
- Need to convert all `{{param}}` to `$PARAM` format
- Need to integrate placeholders into body text naturally

**Risk Level:** MEDIUM

#### Issue 4: Agent Assignment Ambiguity
**Problem:** CodeFlow uses `subtask: true` to indicate subagent invocation, OpenCode uses explicit `agent: agent-name`.

**Impact:**
- Unclear which agent should execute the command
- May require manual agent assignment during conversion
- Some commands designed to orchestrate multiple agents (not single agent invocation)

**Risk Level:** MEDIUM

---

## 4. Command Conversion Strategy

### 4.1 Recommended Approach: Dual-Format Support

**Option A: Preserve Extended Format** (RECOMMENDED)
- Keep rich CodeFlow metadata in command body as documentation
- Generate simplified OpenCode frontmatter for compatibility
- Maintain two formats: internal (rich) and exported (OpenCode)

**Benefits:**
- Preserves all metadata and documentation
- OpenCode compatibility achieved
- Internal tools can still use rich format

**Drawbacks:**
- Maintains two versions
- Conversion step required for OpenCode export

**Option B: Simplify to Pure OpenCode**
- Remove all extended metadata
- Convert to pure OpenCode format
- Lose detailed specifications

**Benefits:**
- Single format, simpler maintenance
- Direct OpenCode compatibility

**Drawbacks:**
- **Significant loss of valuable metadata**
- Loss of type information, validation rules, caching strategies
- Reduced command documentation quality

### 4.2 Proposed Conversion Algorithm

```typescript
function convertToOpenCode(command: CodeFlowCommand): OpenCodeCommand {
  return {
    // Frontmatter
    frontmatter: {
      description: command.description,
      agent: deriveAgentFromCommand(command),      // Convert subtask + context
      model: command.model || undefined,           // Optional
      // Omit: name (use filename), mode, version, inputs, outputs, etc.
    },

    // Body
    template: `${command.body}

---

## Command Metadata (CodeFlow Extended Format)

${preserveMetadataAsDocumentation(command)}
    `
  };
}

function deriveAgentFromCommand(command: CodeFlowCommand): string | undefined {
  // If command explicitly orchestrates multiple agents -> omit agent field
  if (command.body.includes('Phase 1:') && command.body.includes('Parallel')) {
    return undefined;  // Multi-agent orchestration command
  }

  // If command has primary agent mentioned -> use it
  const agentMatch = command.name.match(/^(\w+)$/);
  if (agentMatch && isValidAgent(agentMatch[1])) {
    return agentMatch[1];
  }

  // Otherwise, let OpenCode determine based on context
  return undefined;
}
```

### 4.3 Named Placeholder Migration

**Current Pattern:**
```markdown
**Input**: $ARGUMENTS

...

{{environment}}
{{version}}
```

**Recommended OpenCode Pattern:**
```markdown
Deploy application to **$ENVIRONMENT** environment using version **$VERSION**.

Rollback on failure: $ROLLBACK_ON_FAILURE (default: true)

...
```

**Migration Rules:**
1. Replace `$ARGUMENTS` with specific `$NAMED` placeholders from `inputs:` array
2. Integrate placeholders naturally into instructional text
3. Remove `{{param}}` placeholders at end
4. Capitalize placeholder names: `environment` → `$ENVIRONMENT`
5. Document expected values in surrounding text

### 4.4 Metadata Preservation Strategy

**Approach:** Embed extended metadata in command body as structured comments

```markdown
---
description: Execute deployment workflow with validation and verification
agent: deployment-wizard
---

Deploy application to $ENVIRONMENT using version $VERSION.

## Command Execution

[Main command template content]

---

<!-- CodeFlow Extended Metadata -->
## Extended Command Specification

### Inputs
- **environment** (string, required): Target deployment environment (staging|production|development)
- **version** (string, optional): Version to deploy (defaults to current HEAD)
- **rollback_on_failure** (boolean, optional): Automatically rollback on failure (default: true)

### Outputs
- **deployment_status** (JSON): Comprehensive deployment results and verification status

### Caching Strategy
- Type: agent_specific
- TTL: 600 seconds
- Invalidation: manual

### Success Signals
- Pre-deployment validation passed
- Deployment executed successfully
- Post-deployment verification completed

### Failure Modes
- Pre-deployment validation failed
- Deployment execution failed
- Rollback required and executed
```

---

## 5. Command-by-Command Analysis

### 5.1 Command Categories

**60 Commands Analyzed:**

#### High-Complexity Commands (Multi-Agent Orchestration)
Commands that coordinate multiple specialized agents across phases:

1. `research.md` - Orchestrates: codebase-locator, research-analyzer, pattern-finder
2. `debug.md` - Orchestrates: debugger, performance-engineer, test-generator
3. `code_review.md` - Orchestrates: code-reviewer, security-scanner, performance-engineer
4. `test.md` - Orchestrates: test-generator, quality-testing-performance-tester
5. `deploy.md` - Orchestrates: deployment-wizard, infrastructure-builder, monitoring-expert
6. `refactor.md` - Orchestrates: code-reviewer, legacy-modernizer, performance-engineer

**OpenCode Conversion:** These should **NOT** specify a single `agent:` field, as they orchestrate multiple agents.

#### Single-Agent Commands
Commands that invoke a specific specialized agent:

7-60. Various agent-specific commands (e.g., `python_pro.md`, `javascript_pro.md`, etc.)

**OpenCode Conversion:** These should specify explicit `agent: agent-name` in frontmatter.

### 5.2 Placeholder Usage Analysis

**Commands using $ARGUMENTS:**
- Estimated: 50+ of 60 commands (83%)
- Issue: Generic placeholder doesn't prompt for specific arguments
- Recommendation: Convert to named placeholders

**Commands needing placeholder conversion:**
- `test.md`: `$ARGUMENTS` → `$SCOPE`, `$FILES`, `$PLAN`
- `deploy.md`: `$ARGUMENTS` → `$ENVIRONMENT`, `$VERSION`, `$ROLLBACK_ON_FAILURE`
- `refactor.md`: `$ARGUMENTS` → `$TARGET_PATH`, `$SCOPE`, `$FOCUS_AREAS`
- `debug.md`: `$ARGUMENTS` → `$ISSUE`, `$REPRODUCTION_STEPS`, `$ENVIRONMENT`
- `research.md`: `$ARGUMENTS` → `$QUERY`, `$TICKET`, `$SCOPE`, `$DEPTH`

### 5.3 Metadata Richness Analysis

**Commands with extensive metadata** (inputs, outputs, caching, validation):
- `test.md`: 22 lines of metadata, comprehensive JSON output schema
- `deploy.md`: 25 lines of metadata, detailed deployment status schema
- `debug.md`: 20 lines of metadata, debugging results schema
- `code_review.md`: 18 lines of metadata, review findings schema

**Metadata preservation priority:** HIGH - this is valuable documentation

---

## 6. Implementation Recommendations

### 6.1 Phase 1: Enhance Command Converter (Week 1)

**Update `src/converters/command-converter.ts`:**

```typescript
private async convertSingleCommand(content: string, filename: string): Promise<string> {
  const { frontmatter, body } = parseMarkdownFrontmatter(content);

  // Step 1: Derive agent name if appropriate
  const agent = this.deriveAgentName(frontmatter, body);

  // Step 2: Create simplified OpenCode frontmatter
  const openCodeFrontmatter = {
    description: frontmatter.description,
    ...(agent && { agent }),
    ...(frontmatter.model && { model: frontmatter.model })
  };

  // Step 3: Convert placeholders in body
  let convertedBody = this.convertPlaceholders(body, frontmatter.inputs || []);

  // Step 4: Preserve extended metadata as documentation
  convertedBody += '\n\n---\n\n';
  convertedBody += this.generateExtendedMetadata(frontmatter);

  return stringifyMarkdownFrontmatter(openCodeFrontmatter, convertedBody);
}

private convertPlaceholders(body: string, inputs: any[]): string {
  // Replace generic $ARGUMENTS with specific named placeholders
  if (body.includes('$ARGUMENTS') && inputs.length > 0) {
    const namedPlaceholders = inputs
      .filter(input => input.required)
      .map(input => `$${input.name.toUpperCase()}`)
      .join(', ');

    body = body.replace(/\$ARGUMENTS/g, namedPlaceholders);
  }

  // Convert {{param}} to $PARAM format
  body = body.replace(/\{\{(\w+)\}\}/g, (_, name) => `$${name.toUpperCase()}`);

  return body;
}

private deriveAgentName(frontmatter: any, body: string): string | undefined {
  // Multi-agent orchestration commands shouldn't specify single agent
  if (body.includes('Phase 1:') && body.includes('Phase 2:')) {
    return undefined;
  }

  // Single-agent commands should specify agent explicitly
  // Implementation: look for agent names in frontmatter or infer from command name
  return frontmatter.agent || undefined;
}

private generateExtendedMetadata(frontmatter: any): string {
  // Generate markdown documentation from extended frontmatter
  let metadata = '## Extended Command Specification (CodeFlow Format)\n\n';

  if (frontmatter.inputs) {
    metadata += '### Inputs\n';
    frontmatter.inputs.forEach(input => {
      const required = input.required ? 'required' : 'optional';
      metadata += `- **${input.name}** (${input.type}, ${required}): ${input.description}\n`;
    });
    metadata += '\n';
  }

  if (frontmatter.outputs) {
    metadata += '### Outputs\n';
    frontmatter.outputs.forEach(output => {
      metadata += `- **${output.name}** (${output.format}): ${output.description}\n`;
    });
    metadata += '\n';
  }

  if (frontmatter.cache_strategy) {
    metadata += '### Caching Strategy\n';
    metadata += `- Type: ${frontmatter.cache_strategy.type}\n`;
    metadata += `- TTL: ${frontmatter.cache_strategy.ttl} seconds\n`;
    metadata += '\n';
  }

  return metadata;
}
```

### 6.2 Phase 2: Command Validation Tool (Week 1-2)

**Create `src/validators/command-validator.ts`:**

```typescript
export interface CommandValidationResult {
  file: string;
  isOpenCodeCompliant: boolean;
  warnings: string[];
  errors: string[];
  recommendations: string[];
}

export class CommandValidator {
  async validateCommand(filePath: string): Promise<CommandValidationResult> {
    const content = await readFile(filePath);
    const { frontmatter, body } = parseMarkdownFrontmatter(content);

    const result: CommandValidationResult = {
      file: filePath,
      isOpenCodeCompliant: true,
      warnings: [],
      errors: [],
      recommendations: []
    };

    // Check required fields
    if (!frontmatter.description) {
      result.errors.push('Missing required field: description');
      result.isOpenCodeCompliant = false;
    }

    // Check for unsupported OpenCode fields
    const unsupportedFields = ['name', 'mode', 'inputs', 'outputs',
                                'cache_strategy', 'success_signals', 'failure_modes'];
    unsupportedFields.forEach(field => {
      if (frontmatter[field]) {
        result.warnings.push(`Field '${field}' not supported in OpenCode format (will be preserved in body)`);
      }
    });

    // Check placeholder usage
    if (body.includes('$ARGUMENTS')) {
      result.recommendations.push('Consider replacing $ARGUMENTS with specific named placeholders like $PARAM_NAME');
    }

    if (body.includes('{{')) {
      result.warnings.push('Found {{param}} style placeholders - should use $PARAM format for OpenCode');
    }

    // Check agent assignment for multi-agent commands
    if (body.includes('Phase 1:') && body.includes('Parallel') && frontmatter.agent) {
      result.warnings.push('Multi-agent orchestration command should not specify single agent field');
    }

    return result;
  }
}
```

### 6.3 Phase 3: Batch Command Migration (Week 2)

**Create migration script `scripts/migrate-commands-to-opencode.ts`:**

```typescript
import { CommandConverter } from '../src/converters/command-converter';
import { CommandValidator } from '../src/validators/command-validator';

async function migrateCommands() {
  const converter = new CommandConverter();
  const validator = new CommandValidator();

  const commandFiles = await readAllFiles('**/*.md', 'commands/');

  console.log(`Migrating ${commandFiles.length} commands to OpenCode format...\n`);

  const results = {
    converted: 0,
    failed: 0,
    warnings: 0,
    errors: []
  };

  for (const file of commandFiles) {
    try {
      // Validate before conversion
      const validation = await validator.validateCommand(`commands/${file}`);

      if (validation.errors.length > 0) {
        console.error(`❌ ${file}: Validation errors`);
        validation.errors.forEach(err => console.error(`   - ${err}`));
        results.failed++;
        results.errors.push({ file, errors: validation.errors });
        continue;
      }

      if (validation.warnings.length > 0) {
        console.warn(`⚠️  ${file}: ${validation.warnings.length} warnings`);
        results.warnings += validation.warnings.length;
      }

      // Convert
      const inputPath = `commands/${file}`;
      const outputPath = `converted-commands/${file}`;
      const content = await readFile(inputPath);
      const converted = await converter.convertSingleCommand(content, file);
      await writeFile(outputPath, converted);

      console.log(`✅ ${file}: Converted successfully`);
      results.converted++;

    } catch (error) {
      console.error(`❌ ${file}: ${error}`);
      results.failed++;
      results.errors.push({ file, error: String(error) });
    }
  }

  // Summary
  console.log(`\n=== Migration Summary ===`);
  console.log(`Converted: ${results.converted}`);
  console.log(`Failed: ${results.failed}`);
  console.log(`Warnings: ${results.warnings}`);

  if (results.errors.length > 0) {
    console.log(`\nErrors:`);
    results.errors.forEach(({ file, errors, error }) => {
      console.log(`  ${file}:`);
      if (errors) errors.forEach(e => console.log(`    - ${e}`));
      if (error) console.log(`    - ${error}`);
    });
  }
}
```

### 6.4 Phase 4: Documentation Update (Week 2)

**Update CLAUDE.md with OpenCode conversion guidance:**

```markdown
## Command Conversion

### Converting Commands to OpenCode Format

CodeFlow commands use an extended format with rich metadata. When converting to OpenCode:

1. **Frontmatter Simplification**
   - Keep only: `description`, `agent`, `model`
   - Remove: `name`, `mode`, `inputs`, `outputs`, `cache_strategy`, etc.

2. **Placeholder Conversion**
   - Replace `$ARGUMENTS` with specific `$NAMED_PLACEHOLDERS`
   - Convert `{{param}}` to `$PARAM` format
   - Integrate placeholders naturally into template text

3. **Metadata Preservation**
   - Extended metadata is preserved in command body as documentation
   - Maintains full specification for internal use

4. **Agent Assignment**
   - Multi-agent orchestration commands: omit `agent:` field
   - Single-agent commands: specify `agent: agent-name`

### Conversion Example

**Before (CodeFlow Extended):**
```yaml
---
name: deploy
description: Execute deployment workflow
inputs:
  - name: environment
    type: string
    required: true
---

**Input**: $ARGUMENTS

Deploy to environment...

{{environment}}
```

**After (OpenCode Compatible):**
```yaml
---
description: Execute deployment workflow
agent: deployment-wizard
---

Deploy to $ENVIRONMENT environment.

---

## Extended Specification
### Inputs
- environment (string, required): Target environment
```
```

---

## 7. Testing and Validation Plan

### 7.1 Unit Tests for Converter

```typescript
describe('CommandConverter', () => {
  it('should convert simple command to OpenCode format', async () => {
    const input = `---
name: test-command
description: Test command
mode: command
inputs:
  - name: target
    type: string
    required: true
---
Test template with $ARGUMENTS
{{target}}`;

    const expected = `---
description: Test command
---
Test template with $TARGET

---
## Extended Specification
### Inputs
- **target** (string, required): ...`;

    const result = await converter.convertSingleCommand(input, 'test-command.md');
    expect(result).toContain('description: Test command');
    expect(result).toContain('$TARGET');
    expect(result).not.toContain('{{target}}');
  });

  it('should not specify agent for multi-agent commands', async () => {
    const input = `---
name: research
description: Research workflow
---
### Phase 1: Discovery
...
### Phase 2: Analysis`;

    const result = await converter.convertSingleCommand(input, 'research.md');
    const { frontmatter } = parseMarkdownFrontmatter(result);
    expect(frontmatter.agent).toBeUndefined();
  });
});
```

### 7.2 Integration Tests

1. **Convert all 60 commands** using migration script
2. **Validate converted commands** using OpenCode CLI (if available)
3. **Compare outputs** - ensure no functionality lost
4. **Test command execution** in OpenCode environment

### 7.3 Validation Checklist

For each converted command:
- [ ] `description` field present in frontmatter
- [ ] No unsupported fields in frontmatter (name, mode, inputs, etc.)
- [ ] `$ARGUMENTS` replaced with named placeholders (or kept if appropriate)
- [ ] `{{param}}` placeholders converted to `$PARAM` format
- [ ] Extended metadata preserved in body documentation
- [ ] Agent assignment appropriate (present for single-agent, omitted for multi-agent)
- [ ] Command executes successfully in OpenCode environment

---

## 8. Risk Assessment and Mitigation

### 8.1 Risks

| Risk | Severity | Probability | Mitigation |
|------|----------|-------------|------------|
| Metadata loss | HIGH | HIGH | Preserve in body as documentation |
| Placeholder conversion errors | MEDIUM | MEDIUM | Extensive testing, manual review |
| Agent assignment issues | MEDIUM | MEDIUM | Clear rules, validation checks |
| OpenCode incompatibility | HIGH | LOW | Follow spec exactly, test with OpenCode CLI |
| Regression in functionality | HIGH | LOW | Comprehensive testing before deployment |

### 8.2 Rollback Plan

If OpenCode conversion causes issues:
1. Revert to original CodeFlow format
2. Maintain dual formats (internal/external)
3. Use conversion only for export, not internal use

---

## 9. Conclusion and Next Steps

### 9.1 Summary

- **60 commands** require conversion to OpenCode format
- **Significant format differences** between CodeFlow extended format and OpenCode standard
- **Recommended approach**: Preserve extended metadata in body, simplify frontmatter
- **Key conversion tasks**: Placeholder conversion, agent assignment, metadata preservation

### 9.2 Immediate Actions

**Week 1:**
1. Enhance `CommandConverter` with new conversion logic
2. Create `CommandValidator` for validation checks
3. Test converter on sample commands (5-10 commands)

**Week 2:**
4. Run migration script on all 60 commands
5. Validate converted commands
6. Update documentation (CLAUDE.md, README.md)
7. Commit converted commands to repository

**Week 3:**
8. Test commands in OpenCode environment (if available)
9. Gather feedback and iterate
10. Document lessons learned

### 9.3 Success Metrics

- [ ] All 60 commands converted successfully
- [ ] 100% OpenCode format compliance
- [ ] Zero metadata loss (preserved in body)
- [ ] All commands executable in OpenCode environment
- [ ] Documentation updated and clear

---

## 10. Appendix

### 10.1 OpenCode Command Format Reference

```markdown
---
description: Brief command description
agent: optional-agent-name
model: optional-model-override
---

Command template with $NAMED_PLACEHOLDERS integrated naturally into text.

Use $ARGUMENTS to capture remaining arguments if needed.
```

### 10.2 CodeFlow Command Format Reference

See existing commands in `commands/` directory for examples of extended format.

### 10.3 Conversion Quick Reference

| CodeFlow | OpenCode | Action |
|----------|----------|--------|
| `name: cmd` | Filename: `cmd.md` | Use filename |
| `description:` | `description:` | Keep as-is |
| `mode: command` | (omit) | Remove field |
| `subtask: true` | `agent: name` | Convert or omit |
| `inputs:` array | (omit from frontmatter) | Move to body |
| `$ARGUMENTS` | `$NAMED_PARAMS` | Convert to named |
| `{{param}}` | `$PARAM` | Convert format |

---

**Document Version:** 1.0
**Last Updated:** 2025-11-17
**Next Review:** After Phase 1 completion
