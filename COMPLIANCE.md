# Agent, Command, and Skill Format Compliance

This document outlines the compliance requirements for agents, commands, and skills following Claude Code v2.x.x, OpenCode, and Anthropic's Agent Skills Specification v1.0.

## Claude Code v2.x.x Specification

### Agent Format

**Required Fields:**

- `name` (string): Unique identifier in kebab-case
- `description` (string): Clear description of agent's purpose

**Optional Fields:**

- `tools` (string): Comma-separated list of tools (e.g., "read, write, bash")
- `model` (string): One of `inherit`, `sonnet`, `opus`, `haiku`

**Invalid Fields (will be stripped during conversion):**

- `mode` - Not supported in Claude Code v2.x.x
- `temperature` - Not supported in Claude Code v2.x.x
- `capabilities` - Not supported
- `permission` - Use `tools` instead
- `tags` - Not supported
- `category` - Not supported
- Any custom fields

**Example:**

```yaml
---
name: code-reviewer
description: Expert code review specialist that analyzes code quality and suggests improvements.
tools: read, grep, glob, bash
model: sonnet
---
```

### Command Format

**Optional Fields:**

- `description` (string): Brief description of the command
- `allowed-tools` (string): Comma-separated list of allowed tools
- `argument-hint` (string): Hint for users about expected arguments
- `model` (string): One of `inherit`, `sonnet`, `opus`, `haiku`
- `disable-model-invocation` (boolean): Disable automatic model invocation

**Invalid Fields (will be stripped during conversion):**

- `schema` - Not supported
- `inputs` - Not supported
- `outputs` - Not supported
- `cache_strategy` - Not supported
- `success_signals` - Not supported
- `failure_modes` - Not supported
- `agent` - OpenCode only
- `temperature` - OpenCode only
- `mode` - OpenCode only

**Example:**

```yaml
---
description: Research a ticket or provide a prompt for ad-hoc research
allowed-tools: read, grep, glob, bash
argument-hint: 'Path to ticket file or research question'
model: sonnet
---
```

## OpenCode Specification

### Agent Format

**Required Fields:**

- `name` (string): Unique identifier in kebab-case
- `description` (string): Clear description of agent's purpose
- `mode` (string): One of `primary`, `subagent`, `all`

**Optional Fields:**

- `model` (string): Provider/model format (e.g., `anthropic/claude-sonnet-4`)
- `temperature` (number): 0-2 range for output randomness
- `tools` (object): Boolean map of tool names `{edit: true, bash: false}`
- `permission` (object): Permission map `{edit: "allow", bash: "deny", webfetch: "allow"}`
- `tags` (array): Array of string tags
- `category` (string): Agent category
- `allowed_directories` (array): Allowed directory paths

**Note:** Either `tools` OR `permission` must be defined.

**Permission Values:**

- `allow` - Permission granted
- `ask` - Ask user for permission
- `deny` - Permission denied

**Required Permissions (if using permission):**

- `edit` - File editing permission
- `bash` - Bash command execution
- `webfetch` - Web fetching permission

**Example:**

```yaml
---
name: code-reviewer
description: Expert code review specialist that analyzes code quality and suggests improvements.
mode: subagent
model: anthropic/claude-sonnet-4
temperature: 0.1
permission:
  edit: deny
  bash: deny
  webfetch: allow
tags:
  - code-quality
  - review
category: development
---
```

### Command Format

OpenCode commands support additional fields beyond Claude Code:

**Additional Fields:**

- `agent` (string): Agent to invoke for this command
- `mode` (string): Must be `command`
- `temperature` (number): 0-2 range
- All Claude Code command fields are also supported

**Example:**

```yaml
---
name: research
description: Research a ticket or provide a prompt for ad-hoc research
mode: command
agent: codebase-locator
model: anthropic/claude-sonnet-4
temperature: 0.1
---
```

## Converter Behavior

### Base to Claude Code

The converter will:

1. ✅ Extract `name` and `description`
2. ✅ Convert `tools` object to comma-separated string
3. ✅ Convert `permission` object to `tools` string (allow → included)
4. ✅ Convert model to Claude Code format (`inherit`|`sonnet`|`opus`|`haiku`)
5. ❌ Strip `mode`, `temperature`, `capabilities`, `permission`, `tags`, `category`
6. ❌ Strip all custom fields

### Base to OpenCode

The converter will:

1. ✅ Preserve `name`, `description`, `mode`
2. ✅ Convert model to OpenCode format (`provider/model`)
3. ✅ Convert `tools` object to `permission` object
4. ✅ Preserve `temperature`, `tags`, `category`, `allowed_directories`
5. ✅ Default `mode` to `primary` if missing
6. ✅ Validate `permission` has required fields (`edit`, `bash`, `webfetch`)

### Claude Code to OpenCode

The converter will:

1. ✅ Parse `tools` string to object
2. ✅ Set `mode` to `subagent` by default
3. ✅ Convert model format if needed

### OpenCode to Claude Code

The converter will:

1. ✅ Convert `permission` to `tools` string
2. ✅ Convert model to Claude Code format
3. ❌ Strip `mode`, `temperature`, and all OpenCode-specific fields

## Validation Rules

### Claude Code Validation

**Errors:**

- Invalid fields present (not in allowed list)
- Missing required fields (`name`, `description`)
- Invalid model value (not `inherit`, `sonnet`, `opus`, `haiku`)
- Invalid `tools` format (not a comma-separated string)

**Warnings:**

- Name not in kebab-case format
- Description too short (<10 chars) or too long (>500 chars)
- Empty tools string

### OpenCode Validation

**Errors:**

- Missing required fields (`name`, `description`, `mode`)
- Invalid mode value (not `primary`, `subagent`, `all`)
- Invalid permission values (not `allow`, `ask`, `deny`)
- Missing required permissions (`edit`, `bash`, `webfetch`)
- Temperature out of range (not 0-2)
- Neither `tools` nor `permission` defined

**Warnings:**

- Non-standard fields present
- Name not in kebab-case format
- Description too short or too long
- Model not in `provider/model` format
- Neither `tools` nor `permission` specified

## Migration Guide

### Updating Base Agents

**Remove these fields:**

```yaml
# Remove from base agents - these will be added during conversion
mode: primary
temperature: 0.1
capabilities: ...
permission: ...
tags: ...
category: ...
```

**Keep only:**

```yaml
name: agent-name
description: |
  Clear description of what this agent does
```

**Tools will be converted automatically** from either:

- Base `tools` object
- Base `permission` object

### Updating Commands

**Remove these fields:**

```yaml
# Remove from all commands
schema:
  inputs: ...
  outputs: ...
cache_strategy: ...
success_signals: ...
failure_modes: ...
agent: ... # OpenCode only
model: ... # Will be format-specific
temperature: ... # OpenCode only
```

**Use Claude Code v2.x.x fields:**

```yaml
description: Brief command description
allowed-tools: read, write, bash
argument-hint: 'Describe expected arguments'
model: sonnet
```

### Testing Conversions

Use the CLI to test conversions:

```bash
# Convert agents from base to Claude Code
codeflow convert codeflow-agents/ .claude/agents/ --format claude-code

# Convert agents from base to OpenCode
codeflow convert codeflow-agents/ .opencode/agent/ --format opencode

# Validate agents
codeflow status
```

## Best Practices

### Agent Design

1. **Keep descriptions concise** (10-500 characters)
2. **Use kebab-case names** (lowercase, hyphens only)
3. **Specify minimal tools** needed for the agent's function
4. **Don't add format-specific fields to base** agents

### Command Design

1. **Add helpful `argument-hint`** to guide users
2. **Limit `allowed-tools`** to necessary tools only
3. **Use `description`** for command help text
4. **Let model default to `inherit`** unless specific model needed

### Format Selection

**Use Claude Code when:**

- Deploying to Claude Desktop or claude.ai/code
- Want simplest possible format
- Model selection done at application level

**Use OpenCode when:**

- Need fine-grained permission control
- Want to specify model per agent
- Need temperature control
- Using opencode.ai platform

## Troubleshooting

### Common Issues

**Issue:** "Invalid fields for Claude Code v2.x.x"

- **Solution:** Remove unsupported fields like `mode`, `temperature`, `capabilities`

**Issue:** "Missing required OpenCode permissions"

- **Solution:** Add all three required permissions: `edit`, `bash`, `webfetch`

**Issue:** "Invalid model"

- **Solution:** Use `inherit`|`sonnet`|`opus`|`haiku` for Claude Code or `provider/model` for OpenCode

**Issue:** "Tools must be a comma-separated string"

- **Solution:** Convert `tools: {read: true}` to `tools: "read"` for Claude Code format

### Debugging

Enable verbose output to see conversion details:

```bash
# Check what changes will be made
codeflow status --verbose

# See validation errors
codeflow convert source/ target/ --format claude-code --verbose
```

## References

- **Claude Code Documentation:** https://docs.claude.com/en/docs/claude-code/
- **Claude Code Agents:** https://docs.claude.com/en/docs/claude-code/sub-agents
- **Claude Code Commands:** https://docs.claude.com/en/docs/claude-code/slash-commands
- **OpenCode Documentation:** https://opencode.ai/docs
- **OpenCode Agents:** https://opencode.ai/docs/agents
- **OpenCode Commands:** https://opencode.ai/docs/commands

## Anthropic Context Management Best Practices

This section documents compliance with Anthropic's context management patterns from [context-management](https://www.anthropic.com/news/context-management) and [claude-cookbooks](https://github.com/anthropics/claude-cookbooks).

### 1. Prompt Caching & Context Compression

**Pattern**: Reduce redundant processing through structured caching and progressive refinement.

**Current Implementation**:

- ✅ `/research` command implements intelligent caching with hit/miss tracking
- ✅ AGENT_OUTPUT_V1 structured formats enable consistent parsing
- ✅ Sequential coordination (locators → analyzers) prevents re-processing

**Applied to Both Platforms**:

- Claude Code: Native caching via command structure
- OpenCode: Cache strategy via command metadata

**Recommendations**:

- [ ] Extend caching to `/plan` and `/execute` commands
- [ ] Add cache invalidation docs to CLAUDE.md
- [ ] Implement cache metrics for optimization

### 2. Information Retrieval Patterns

**Pattern**: Use specialized agents for focused retrieval before analysis.

**Current Implementation**:

- ✅ `codebase-locator`: File discovery WITHOUT content reading
- ✅ `research-locator`: Documentation discovery without deep analysis
- ✅ Strict tool permissions prevent scope creep
- ✅ Clear escalation paths to analyzer agents

**Platform Differences**:

- **Claude Code**: Uses `tools: grep, glob, list` string
- **OpenCode**: Uses explicit permission object with deny defaults

```yaml
# Claude Code
tools: grep, glob, list

# OpenCode
permission:
  grep: allow
  glob: allow
  list: allow
  read: deny
  edit: deny
  bash: deny
  webfetch: deny
```

**Recommendations**:

- ✅ Already follows "locate then analyze" best practice
- [ ] Add retry logic with refined patterns for failed discovery
- [ ] Consider adding pattern suggestion when zero matches found

### 3. Structured Output Formats

**Pattern**: Use JSON schemas for deterministic, parseable agent outputs.

**Current Implementation**:

- ✅ AGENT_OUTPUT_V1 schema across all analyzer agents
- ✅ Mandatory field validation in agent prompts
- ✅ Evidence-backed claims with `evidence_lines` references
- ✅ Confidence scoring for uncertainty handling

**Example Schema** (from `codebase-locator`):

```json
{
  "schema": "AGENT_OUTPUT_V1",
  "agent": "codebase-locator",
  "version": "1.0",
  "request": {
    "raw_query": "string",
    "normalized_terms": ["string"],
    "generated_patterns": ["string"]
  },
  "results": {
    "implementation": [],
    "tests": [],
    "config": [],
    "docs": [],
    "types": []
  },
  "summary": {
    "confidence": {
      "implementation": 0.8,
      "tests": 0.2
    }
  }
}
```

**Recommendations**:

- [ ] Add TypeScript type definitions for AGENT_OUTPUT_V1
- [ ] Implement JSON Schema validation in agent output processing
- [ ] Add schema version migration support

### 4. Context Window Optimization

**Pattern**: Minimize context usage through targeted retrieval and compression.

**Current Implementation**:

- ✅ Agents limited to specific tools (prevents context bloat)
- ✅ Pattern expansion capped at ≤40 patterns
- ✅ Excerpt length limits (max 220 chars in `research-analyzer`)
- ✅ Parallel execution reduces sequential context accumulation

**Platform-Specific Optimizations**:

**Claude Code**:

```yaml
# Minimal format reduces parsing overhead
tools: read, grep, list
model: sonnet
```

**OpenCode**:

```yaml
# Explicit controls for resource management
temperature: 0.1
allowed_directories: [/project/path]
permission:
  read: allow
  # deny by default reduces tool overhead
```

**Recommendations**:

- [ ] Add token budget tracking per agent invocation
- [ ] Add context size metrics to command output
- [ ] Implement automatic excerpt truncation validation

### 5. Role Separation & Escalation

**Pattern**: Clear boundaries between agent responsibilities with explicit handoffs.

**Current Implementation**:

- ✅ Strict role definitions in agent descriptions
- ✅ "What NOT To Do" sections prevent scope creep
- ✅ Explicit escalation triggers and conditions
- ✅ Handoff recommendations in structured output

**Example Escalation** (from `research-analyzer`):

```markdown
# Escalation Triggers:

- Missing path(s) or only topic provided → research-locator
- Cross-document synthesis requested → orchestrator
- Implementation verification needed → codebase-analyzer
- > 2 documents requested → batch mode with orchestrator
```

**Recommendations**:

- ✅ Exemplary implementation of role separation
- [ ] Add automated escalation based on confidence scores (<0.5 → escalate)
- [ ] Create agent dependency graph visualization

### 6. Evidence-Backed Claims

**Pattern**: All assertions must reference verifiable sources with line numbers.

**Current Implementation**:

- ✅ `evidence_lines` mandatory in all analyzer outputs
- ✅ `raw_evidence` array with text excerpts
- ✅ Zero unverifiable claims requirement
- ✅ File:line format in research documents

**Format**: `path/to/file.ext:line` or `path/to/file.ext:start-end`

**Example**:

```json
{
  "key_decisions": [
    {
      "topic": "Redis rate limiting",
      "decision": "Use 100 requests per 1000ms",
      "evidence_lines": "45-53",
      "raw_evidence": "decided to use Redis..."
    }
  ]
}
```

**Recommendations**:

- [ ] Add validation to reject outputs without proper evidence
- [ ] Add source snippet preview in research documents
- [ ] Implement evidence link verification in CI

### 7. Deterministic Classification

**Pattern**: Consistent categorization for reproducibility.

**Current Implementation**:

- ✅ Rule-based regex heuristics for file categorization
- ✅ Deterministic ordering (sort by evidence line)
- ✅ Consistent vocabulary across agents
- ✅ Same input → same output requirement

**Classification Rules** (from `codebase-locator`):

```javascript
tests: /(test|spec)\./;
config: /(rc|config|\.config\.|\.env)/;
docs: /README|\.md/;
types: /(\.d\.ts|types?)/;
entrypoints: /(index|main|server|cli)\.(t|j)s/;
```

**Recommendations**:

- [ ] Add regression tests for classification consistency
- [ ] Version classification rules for tracking changes
- [ ] Add classification rule documentation

### 8. Progressive Refinement

**Pattern**: Start broad, then narrow with targeted queries.

**Current Implementation** (from `codebase-locator` workflow):

```
1. Broad Scan (Phase 1)
   - Use glob for structural patterns
   - grep for primary terms (limit if >500 matches)

2. Focused Refinement (Phase 2)
   - Add second-order patterns (service, handler, controller)
   - Refine with disambiguating suffixes

3. Classification & Dedup
   - Apply category heuristics
   - Remove duplicates
```

**Recommendations**:

- ✅ Already implements progressive refinement
- [ ] Add phase timing metrics for optimization
- [ ] Consider adaptive refinement based on initial results

## Cross-Platform Pattern Application

### Patterns Applicable to Both Platforms

1. **Structured Output Schemas** ✅
   - AGENT_OUTPUT_V1 JSON works everywhere
   - Evidence with line references
   - Confidence scoring

2. **Role Separation** ✅
   - Locator/Analyzer split
   - Tool permission boundaries
   - Escalation paths

3. **Context Optimization** ✅
   - Pattern limits (≤40)
   - Excerpt caps (≤220 chars)
   - Parallel execution

4. **Documentation Standards** ✅
   - File:line references
   - YAML frontmatter
   - Temporal context

### Platform-Specific Optimizations

**Claude Code Strengths**:

- Simpler format (less parsing overhead)
- Native integration with Claude Code features
- Model selection at application level

**OpenCode Strengths**:

- Explicit permission model (security)
- Per-agent model selection (cost optimization)
- Temperature control (output consistency)
- Directory sandboxing (safety)

### Conversion Considerations

When converting agents between platforms, preserve these context management patterns:

**Always Preserve**:

- Structured output format (AGENT_OUTPUT_V1)
- Evidence requirements
- Role boundaries and escalation paths
- Pattern limits and constraints

**Platform-Specific Adaptations**:

- Claude Code: Convert `permission` → `tools` string
- OpenCode: Convert `tools` → explicit `permission` object
- Temperature: Claude Code inherits, OpenCode sets explicitly
- Model: Convert format (`sonnet` ↔ `anthropic/claude-sonnet-4`)

## Implementation Roadmap

### Phase 1: Documentation & Validation ✅

- [x] Document current compliance with Anthropic patterns
- [ ] Add TypeScript type definitions for AGENT_OUTPUT_V1
- [ ] Create agent capability matrix reference
- [ ] Add claude-cookbooks examples to CLAUDE.md

### Phase 2: Enhancement (Short-term)

- [ ] Implement caching for `/plan` and `/execute`
- [ ] Add JSON Schema validation for agent outputs
- [ ] Create regression tests for deterministic classification
- [ ] Add token budget tracking per agent

### Phase 3: Advanced Features (Medium-term)

- [ ] Automated escalation based on confidence scores
- [ ] Agent dependency graph visualization
- [ ] Cache hit/miss metrics and optimization
- [ ] Parameter validation for OpenCode commands

## Compliance Assessment

**Overall**: ✅ Strong Compliance

### Strengths

1. **Context Efficiency**:
   - Locators prevent unnecessary content reading
   - Pattern limits cap context size
   - Parallel execution minimizes sequential overhead

2. **Determinism & Reproducibility**:
   - Rule-based classification
   - Structured output schemas
   - Consistent categorization

3. **Evidence & Verification**:
   - Mandatory line references
   - Raw evidence excerpts
   - Zero unverifiable claims policy

4. **Role Clarity**:
   - Clear agent boundaries
   - Explicit escalation paths
   - "What NOT To Do" sections

### Areas for Enhancement

1. **Caching**: Expand beyond `/research` to other commands
2. **Validation**: Add automated schema validation
3. **Metrics**: Implement context size and performance tracking
4. **Testing**: Add regression tests for deterministic behavior

### Conclusion

The codeflow system demonstrates excellent alignment with Anthropic's context management best practices. The design philosophy of **"fresh analysis over caching"** combined with **strategic caching** represents a balanced approach for context efficiency while maintaining accuracy.

Both Claude Code and OpenCode implementations leverage platform-specific features while preserving core context management patterns, enabling seamless cross-platform compatibility.

## Skills Format (Anthropic Agent Skills Specification v1.0)

CodeFlow is the first platform to natively support Anthropic's Agent Skills Specification v1.0, enabling persistent message insertion and specialized tool integration.

### Required Fields

- `name` (string): Unique identifier in hyphen-case format (lowercase letters, numbers, hyphens only)
- `description` (string): Clear description of skill's purpose (minimum 20 characters)
- `noReply` (boolean): Must be `true` for skills (required for message insertion persistence)

### Optional Fields

- `category` (string): Skill category for organization
- `tags` (array): List of tags for discovery and categorization

### Skill Requirements

**Message Insertion Persistence**: Skills require `noReply: true` to enable persistent message insertion in the conversation context, allowing skills to contribute information without generating responses.

**Naming Convention**: Skills must use hyphen-case (e.g., `docker-container-management`, not `dockerContainerManagement`).

**Frontmatter Structure**: Skills must have proper YAML frontmatter with all required fields present.

### Example

```yaml
---
name: sentry-incident-response
description: Comprehensive incident management and response workflow for Sentry error tracking and monitoring
noReply: true
category: mcp
tags:
  - incident-response
  - error-tracking
  - monitoring
---
```

### MCP Integration

Skills are automatically registered with `skills_` prefix in MCP servers:

- `skills_sentry-incident-response` → Sentry incident management
- `skills_docker-container-management` → Container operations
- `skills_context7-documentation-research` → Documentation lookup

### OpenCode MCP Alignment

**OpenCode Integration Model**: OpenCode uses **MCP servers** for external tool integration rather than a separate "skills" format. Our implementation correctly aligns with this approach:

- **MCP-Compatible**: Skills are registered as MCP tools with `skills_` prefix
- **Server Registration**: Skills appear in MCP server tool listings alongside standard tools
- **Unified Architecture**: Single skill definition works across Claude Code, OpenCode, Cursor, and MCP clients
- **No Separate Format**: OpenCode doesn't maintain a distinct skills format - MCP is the integration layer

**Configuration Pattern**:

```yaml
# OpenCode MCP server configuration
mcp_servers:
  codeflow:
    command: 'npx'
    args: ['@codeflow/mcp-server']
    # Skills automatically available as:
    # - skills_sentry-incident-response
    # - skills_docker-container-management
    # - skills_context7-documentation-research
```

### Platform Support

**Claude Code**: Skills in `.claude/skills/` with YAML frontmatter
**OpenCode**: Skills in `.opencode/skills/` with YAML frontmatter  
**Cursor**: Skills in `.cursor/skills/` with YAML frontmatter
**MCP Clients**: Skills available as `skills_*` prefixed tools

## Version History

- **2025-11-02**: Added OpenCode MCP alignment clarification for skills integration
- **2025-11-02**: Added Anthropic Agent Skills Specification v1.0 compliance
- **2025-10-01**: Added Anthropic context management compliance documentation
- **2025-10-01**: Initial compliance documentation for Claude Code v2.x.x and OpenCode specifications
- Updated validation engine with strict field checking
- Updated format converter with proper field stripping
- Added model format conversion between platforms
