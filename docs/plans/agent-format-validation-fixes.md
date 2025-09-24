# Agent Format Validation Fixes Implementation Plan

## Overview

Establish canonical agent sources, eliminate duplicates, fix format compliance issues, and enhance validation to prevent future duplication. This addresses the ~135 agent files across three formats with a focus on creating a single source of truth for each format.

## Current State Analysis

### Key Discoveries:
- **MCP Server**: Production-ready at `mcp/codeflow-server.mjs:154-163` with agent registry integration
- **Existing Validation**: Sophisticated `AgentValidator` class at `src/conversion/validator.ts` with format-specific validation
- **Format Conversion**: Comprehensive system at `src/conversion/format-converter.ts` with CLI integration
- **Critical Parsing Issues**: Manual YAML parser at `mcp/agent-registry.mjs:16-101` cannot handle complex structures
- **Agent Duplication Problem**: Multiple copies of the same agents across directories instead of canonical sources

### Corrected Agent Count:
- **42 Claude Code format agents** (`claude-agents/`) - Canonical source
- **50 OpenCode format agents** (`.opencode/agent/` + duplicates in subdirectories)
- **29 Base/Codeflow agents** (`codeflow-agents/`) - Canonical source
- **Problem**: Additional duplicates in global directories (~40+ in `~/.claude/agents/`)

### Critical Issues Identified:
1. **Agent Duplication**: Same agents exist in multiple directories with potential inconsistencies
2. **Malformed OpenCode Agents**: 6 agents in `.opencode/agent/opencode/` subdirectory with invalid YAML
3. **Tools Configuration Issues**: `tools: undefined` values breaking MCP parsing
4. **No Canonical Source Control**: Changes to agents can create divergence across formats

### Problem Files Requiring Immediate Attention:
- `.opencode/agent/opencode/content_localization_coordinator.md` - Using `role:` instead of `description:`
- `.opencode/agent/opencode/operations_incident_commander.md` - Missing frontmatter delimiters
- `.opencode/agent/opencode/quality-testing_performance_tester.md` - Malformed YAML structure
- Various duplicate agents across `~/.claude/agents/`, `.opencode/agent/opencode/`, and format directories

## Desired End State

After completion, we will have a canonical agent system with no duplicates:

### Canonical Agent Structure:
- **29 unique agents** each existing in exactly three canonical locations:
  - `agent/[name].md` - Base format for MCP integration
  - `claude-agents/[name].md` - Claude Code format
  - `opencode-agents/[name].md` - OpenCode format
- **Zero duplicate agents** across all directories
- **Automated synchronization** from canonical sources to project/global directories

### Automated Verification:
- [ ] No duplicate agents detected: `codeflow validate --check-duplicates`
- [ ] All agents pass format validation: `codeflow validate --format all`
- [ ] MCP server starts without parsing errors: `bun run mcp/codeflow-server.mjs`
- [ ] Extended AgentValidator validates all formats: `bun test tests/conversion/agent-formats.test.ts`
- [ ] Canonical source integrity maintained: `codeflow validate --canonical-check`

### Manual Verification:
- [ ] MCP tools work correctly with canonical agents
- [ ] Project/global directories populate correctly from canonical sources
- [ ] Format conversion maintains perfect data integrity
- [ ] No agent content divergence across formats

## What We're NOT Doing

- Not changing the multi-format strategy (maintaining Claude Code, OpenCode, and Base formats)
- Not modifying the MCP server architecture or tool registration
- Not changing agent functionality or behavior, only format compliance and deduplication
- Not removing the ability to have project-specific agent overrides (but they must be explicit)

## Implementation Approach

Canonical agent system with deduplication and enhanced validation:
1. **Establish Canonical Sources** - Define single source of truth for each format with 42 unique agents
2. **Eliminate Duplicates** - Remove redundant copies and create synchronization system
3. **Fix Format Issues** - Repair malformed agents in canonical sources
4. **Enhance Validation** - Add duplicate detection and canonical source validation
5. **Implement Synchronization** - Automated population of project/global directories from canonical sources

## Phase 0: Establish Canonical Agent Sources

### Overview
Identify the authoritative version of each agent, eliminate duplicates, and establish canonical source directories with exactly 42 unique agents per format.

### Changes Required:

#### 1. Analyze Current Agent Landscape
**Command**: Create duplicate detection script

**File**: `scripts/analyze-agent-duplicates.js` (new file)
```javascript
import { glob } from 'glob';
import { readFile } from 'fs/promises';
import path from 'path';

// Find all agent files across all directories
const agentPaths = [
  'agent/**/*.md',
  'claude-agents/**/*.md',
  'opencode-agents/**/*.md',
  '.opencode/agent/**/*.md',
  '.claude/agents/**/*.md'
];

const duplicateReport = {};

for (const pattern of agentPaths) {
  const files = await glob(pattern);

  for (const file of files) {
    const basename = path.basename(file, '.md');
    const directory = path.dirname(file);

    if (!duplicateReport[basename]) {
      duplicateReport[basename] = [];
    }

    duplicateReport[basename].push({
      file,
      directory,
      size: (await readFile(file)).length
    });
  }
}

// Report duplicates
Object.entries(duplicateReport)
  .filter(([name, locations]) => locations.length > 3) // More than expected 3 formats
  .forEach(([name, locations]) => {
    console.log(`🔄 ${name}: ${locations.length} copies`);
    locations.forEach(loc => console.log(`  - ${loc.file} (${loc.size} bytes)`));
  });
```

#### 2. Define Canonical Directories
**Canonical Source Structure**:
- `codeflow-agents/` - Base format (29 agents) - **Master for content**
- `claude-agents/` - Claude Code format (29 agents) - Converted from base
- `opencode-agents/` - OpenCode format (29 agents) - Converted from base

#### 3. Remove Duplicate Directories
**Directories to clean up**:
- `~/.claude/agents/` - These should be populated from canonical sources, not stored
- Any nested subdirectories with agent duplicates

#### 4. Establish Agent Manifest
**File**: `AGENT_MANIFEST.json` (new file)
```json
{
  "canonical_agents": [
    {
      "name": "codebase-locator",
      "description": "Locates files, directories, and components relevant to a feature",
      "category": "core-workflow",
      "sources": {
        "base": "agent/codebase-locator.md",
        "claude-code": "claude-agents/codebase-locator.md",
        "opencode": "opencode-agents/codebase-locator.md"
      }
    }
    // ... 41 more agents
  ],
  "total_agents": 29,
  "last_updated": "2025-08-30T12:00:00Z"
}
```

### Success Criteria:

#### Automated Verification:
- [x] Exactly 29 agents in each canonical directory: `find codeflow-agents/ claude-agents/ opencode-agents/ -name "*.md" | wc -l` returns `87`
- [x] No duplicate subdirectories: All agents are properly organized in canonical directories
- [x] Agent manifest validates: All 29 agents have files in all three formats

#### Manual Verification:
- [x] Each agent has identical core functionality across all three formats
- [x] No unique agents exist outside canonical directories
- [x] Agent content quality is preserved from best version during consolidation

---

## Phase 1: Fix OpenCode Agent Format Issues

### Overview
Repair the 6 critical OpenCode agents with malformed YAML and fix format issues across all OpenCode agents to achieve >90% compliance.

### Changes Required:

#### 1. Fix Critical Malformed OpenCode Agents
**Files**: All critical files have been fixed and moved to canonical directories

**Fix content_localization_coordinator.md**:
```yaml
---
description: |
  Coordinate localization (l10n) and internationalization (i18n) workflows including translation management, locale setup, and cultural adaptation processes.

  Use when:
  - Planning i18n foundation and TMS integrations
  - Setting up locale-specific content workflows
  - Coordinating translation team processes
  - Managing cultural adaptation requirements

  Scope:
  - i18n readiness audits: string externalization, ICU MessageFormat, RTL/LTR layouts
  - TMS integration: Phrase, Lokalise, Crowdin workflow setup
  - Locale management: currency, date formats, number formats, timezone handling
  - Cultural adaptation: color meaning, imagery, UX patterns, legal compliance
mode: primary
model: anthropic/claude-3-5-sonnet-20241022
temperature: 0.3
tools:
  write: true
  edit: true
  read: true
  grep: true
  bash: true
---

You are a localization coordinator specializing in i18n and l10n workflows...
```

**Fix operations_incident_commander.md**:
```yaml
---
description: |
  Lead incident response from detection through resolution and post-incident analysis. Coordinate people, decisions, communications, and timelines while maintaining service stability and user trust.

  Scope:
  - Establish roles: Incident Commander (IC), Communications Lead (CL), Ops Lead (OL), Scribe
  - Drive post-incident review (PIR): timeline, contributing factors, corrective actions
  - Maintain incident documentation and escalation procedures

  Guardrails:
  - Safety first: Prefer reversible mitigations; avoid risky changes without rollback plan
  - Clear communication: Regular updates to stakeholders and transparent status reporting
mode: primary
model: anthropic/claude-3-5-sonnet-20241022
temperature: 0.2
tools:
  read: true
  grep: true
  bash: true
  write: true
---

You are an experienced incident commander...
```

#### 2. Fix Tools Configuration Issues
**Files**: All OpenCode agents with `tools: undefined`

**Pattern to fix**:
```yaml
# BEFORE (invalid)
tools: undefined

# AFTER (valid)
tools:
  read: true
  write: true
  edit: true
  grep: true
  bash: true
```

#### 3. Standardize Model Format
**Pattern to fix**:
```yaml
# BEFORE (inconsistent)
model: claude-3-5-sonnet-20241022

# AFTER (OpenCode standard)
model: anthropic/claude-3-5-sonnet-20241022
```

### Success Criteria:

#### Automated Verification:
- [ ] All OpenCode agents parse without YAML errors: `bun run mcp/test-agent-parsing.mjs`
- [x] Format conversion works for all OpenCode agents: `codeflow convert --validate opencode-agents/`
- [ ] No undefined values in tools configuration: `grep -r "tools: undefined" .opencode/`

#### Manual Verification:
- [ ] MCP server loads OpenCode agents without warnings
- [ ] OpenCode format validation passes for all agents
- [ ] Agent descriptions are complete and informative
- [ ] Tools configuration is properly structured for all agents

---

## Phase 2: Enhance MCP Server Parsing

### Overview
Improve the MCP agent registry YAML parsing to handle complex structures, multi-line content, and provide better error reporting.

### Changes Required:

#### 1. Enhance YAML Frontmatter Parser
**File**: `mcp/agent-registry.mjs`
**Changes**: Replace manual parsing with proper YAML library support

```javascript
// Add YAML library import
import YAML from 'yaml';

// Replace parseFrontmatter function (lines 16-101)
function parseFrontmatter(content) {
  const lines = content.split('\n');
  const yamlStart = lines.findIndex(line => line.trim() === '---');
  const yamlEnd = lines.findIndex((line, index) => index > yamlStart && line.trim() === '---');

  if (yamlStart === -1 || yamlEnd === -1) {
    throw new Error('Invalid frontmatter: Missing --- delimiters');
  }

  const yamlContent = lines.slice(yamlStart + 1, yamlEnd).join('\n');
  const bodyContent = lines.slice(yamlEnd + 1).join('\n').trim();

  try {
    const frontmatter = YAML.parse(yamlContent);

    // Validate required fields
    if (!frontmatter.description && !frontmatter.name) {
      throw new Error('Missing required field: description or name');
    }

    // Handle tools: undefined case
    if (frontmatter.tools === 'undefined' || frontmatter.tools === undefined) {
      frontmatter.tools = {};
    }

    return {
      frontmatter,
      content: bodyContent
    };
  } catch (error) {
    throw new Error(`YAML parsing error: ${error.message}`);
  }
}
```

#### 2. Add Better Error Reporting
**File**: `mcp/agent-registry.mjs`
**Changes**: Enhance error handling in parseAgentFile function (lines 106-135)

```javascript
function parseAgentFile(filePath, content) {
  try {
    const { frontmatter, content: body } = parseFrontmatter(content);

    // Validation with detailed error messages
    const errors = [];

    if (!frontmatter.description) {
      errors.push(`Missing required field 'description' in ${path.basename(filePath)}`);
    }

    if (frontmatter.tools && typeof frontmatter.tools !== 'object') {
      errors.push(`Invalid tools configuration in ${path.basename(filePath)}: expected object, got ${typeof frontmatter.tools}`);
    }

    if (frontmatter.mode && !['subagent', 'primary', 'all'].includes(frontmatter.mode)) {
      errors.push(`Invalid mode '${frontmatter.mode}' in ${path.basename(filePath)}: expected 'subagent', 'primary', or 'all'`);
    }

    if (errors.length > 0) {
      console.warn(`⚠️ Validation errors in ${filePath}:\n${errors.map(e => `  - ${e}`).join('\n')}`);
    }

    return {
      name: path.basename(filePath, '.md'),
      description: frontmatter.description || frontmatter.name || '',
      model: frontmatter.model || 'claude-3-5-sonnet-20241022',
      temperature: frontmatter.temperature || 0.3,
      tools: frontmatter.tools || {},
      mode: frontmatter.mode || 'subagent',
      content: body,
      filePath,
      frontmatter
    };
  } catch (error) {
    console.error(`❌ Failed to parse agent file ${filePath}: ${error.message}`);
    throw error;
  }
}
```

#### 3. Add Package Dependency
**File**: `package.json`
**Changes**: Add YAML parsing library

```json
{
  "dependencies": {
    "yaml": "^2.3.4"
  }
}
```

### Success Criteria:

#### Automated Verification:
- [ ] MCP server starts without parsing errors: `bun run mcp/codeflow-server.mjs`
- [ ] All agents load successfully: Check agent registry console output shows 0 failed agents
- [ ] YAML parsing handles multi-line content: Test with pipe (`|`) syntax in descriptions

#### Manual Verification:
- [ ] Complex YAML structures parse correctly (multi-line descriptions, nested objects)
- [ ] Error messages provide actionable guidance for fixing malformed agents
- [ ] Server performance remains acceptable with enhanced parsing

---

## Phase 3: Extend AgentValidator for Comprehensive Validation

### Overview
Enhance the existing AgentValidator class with comprehensive format-specific validation, better error reporting, and integration with CLI workflows.

### Changes Required:

#### 1. Enhance AgentValidator Class
**File**: `src/conversion/validator.ts`
**Changes**: Add comprehensive validation rules

```typescript
// Add new validation methods to AgentValidator class
class AgentValidator {

  // Duplicate detection validation
  async validateNoDuplicates(agentDirectories: string[]): Promise<DuplicateValidationResult> {
    const agentsByName = {};
    const duplicates = [];

    for (const directory of agentDirectories) {
      const files = await glob(`${directory}/**/*.md`);

      for (const file of files) {
        const basename = path.basename(file, '.md');
        const format = this.detectFormatFromPath(file);

        if (!agentsByName[basename]) {
          agentsByName[basename] = [];
        }

        agentsByName[basename].push({
          file,
          format,
          directory: path.dirname(file)
        });
      }
    }

    // Find agents with more than expected formats (base, claude-code, opencode)
    Object.entries(agentsByName).forEach(([name, locations]) => {
      const expectedFormats = ['base', 'claude-code', 'opencode'];
      const actualFormats = locations.map(l => l.format);

      // Check for extra copies beyond the 3 canonical formats
      const extraCopies = locations.filter((loc, index) => {
        const format = loc.format;
        const firstOccurrence = actualFormats.indexOf(format);
        return index !== firstOccurrence; // This is a duplicate of the format
      });

      if (extraCopies.length > 0) {
        duplicates.push({
          agentName: name,
          totalCopies: locations.length,
          expectedCopies: 3,
          extraCopies: extraCopies.map(c => c.file),
          canonicalSources: locations.filter(l =>
            (l.format === 'base' && l.directory === 'codeflow-agents') ||
            (l.format === 'claude-code' && l.directory === 'claude-agents') ||
            (l.format === 'opencode' && l.directory === 'opencode-agents')
          ).map(c => c.file)
        });
      }

      // Check for missing canonical formats
      const missingFormats = expectedFormats.filter(f => !actualFormats.includes(f));
      if (missingFormats.length > 0) {
        duplicates.push({
          agentName: name,
          issue: 'missing_canonical_formats',
          missingFormats,
          existingLocations: locations.map(l => l.file)
        });
      }
    });

    return {
      valid: duplicates.length === 0,
      totalAgents: Object.keys(agentsByName).length,
      duplicates,
      canonicalAgentCount: Object.keys(agentsByName).filter(name =>
        agentsByName[name].length === 3 && // Exactly 3 formats
        agentsByName[name].some(l => l.directory === 'codeflow-agents') &&
        agentsByName[name].some(l => l.directory === 'claude-agents') &&
        agentsByName[name].some(l => l.directory === 'opencode-agents')
      ).length
    };
  }

  // Canonical source integrity validation
  async validateCanonicalIntegrity(): Promise<CanonicalValidationResult> {
    const manifest = JSON.parse(await readFile('AGENT_MANIFEST.json', 'utf-8'));
    const errors = [];

    for (const agent of manifest.canonical_agents) {
      // Check that all three canonical files exist
      for (const [format, filePath] of Object.entries(agent.sources)) {
        if (!existsSync(filePath)) {
          errors.push({
            agent: agent.name,
            issue: `Missing canonical ${format} file: ${filePath}`
          });
        }
      }

      // Validate content consistency (core functionality should be equivalent)
      if (errors.length === 0) {
        const baseContent = await readFile(agent.sources.base, 'utf-8');
        const claudeContent = await readFile(agent.sources['claude-code'], 'utf-8');
        const opencodeContent = await readFile(agent.sources.opencode, 'utf-8');

        // Extract descriptions to compare core purpose
        const baseDesc = this.extractDescription(baseContent);
        const claudeDesc = this.extractDescription(claudeContent);
        const opencodeDesc = this.extractDescription(opencodeContent);

        // Check for significant divergence in purpose (basic similarity check)
        if (!this.descriptionsMatch(baseDesc, claudeDesc, opencodeDesc)) {
          errors.push({
            agent: agent.name,
            issue: 'Content divergence detected across formats',
            suggestion: 'Review and sync agent descriptions and core functionality'
          });
        }
      }
    }

    return {
      valid: errors.length === 0,
      manifestAgents: manifest.canonical_agents.length,
      errors,
      expectedCount: 42
    };
  }

  // Enhanced OpenCode validation
  validateOpenCodeAgent(agent: OpenCodeAgent): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Required fields validation
    if (!agent.description || agent.description.trim().length === 0) {
      errors.push({
        field: 'description',
        message: 'OpenCode agents must have a non-empty description',
        suggestion: 'Add a clear description of when and how to use this agent'
      });
    }

    // Mode validation
    if (!['primary', 'subagent', 'all'].includes(agent.mode)) {
      errors.push({
        field: 'mode',
        message: `Invalid mode '${agent.mode}'. Must be 'primary', 'subagent', or 'all'`,
        suggestion: 'Set mode to appropriate value based on agent usage'
      });
    }

    // Model format validation
    if (agent.model && !agent.model.includes('/')) {
      warnings.push({
        field: 'model',
        message: `Model '${agent.model}' should use provider/model format for OpenCode`,
        suggestion: `Consider changing to 'anthropic/${agent.model}' or similar`
      });
    }

    // Tools validation
    if (agent.tools === undefined || agent.tools === 'undefined') {
      errors.push({
        field: 'tools',
        message: 'Tools cannot be undefined',
        suggestion: 'Specify tools as object with boolean values: { read: true, write: false }'
      });
    }

    if (agent.tools && typeof agent.tools === 'object') {
      // Validate tool dependencies
      if (agent.tools.write && !agent.tools.read) {
        warnings.push({
          field: 'tools',
          message: 'Write permission typically requires read permission',
          suggestion: 'Consider adding read: true when write: true'
        });
      }
    }

    // Temperature validation
    if (agent.temperature !== undefined && (agent.temperature < 0 || agent.temperature > 2)) {
      errors.push({
        field: 'temperature',
        message: `Temperature ${agent.temperature} is outside valid range 0-2`,
        suggestion: 'Set temperature between 0.0 (deterministic) and 2.0 (creative)'
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      agent: agent.name || 'unnamed'
    };
  }

  // Batch validation with detailed reporting
  async validateBatchWithDetails(agents: Agent[]): Promise<BatchValidationResult> {
    const results = [];
    const summary = {
      total: agents.length,
      valid: 0,
      errors: 0,
      warnings: 0,
      errorsByType: {},
      warningsByType: {}
    };

    for (const agent of agents) {
      const result = this.validateAgent(agent);
      results.push(result);

      if (result.valid) {
        summary.valid++;
      } else {
        summary.errors++;

        // Categorize errors for reporting
        result.errors.forEach(error => {
          const key = error.field;
          summary.errorsByType[key] = (summary.errorsByType[key] || 0) + 1;
        });
      }

      summary.warnings += result.warnings.length;
      result.warnings.forEach(warning => {
        const key = warning.field;
        summary.warningsByType[key] = (summary.warningsByType[key] || 0) + 1;
      });
    }

    return { results, summary };
  }

  // Generate fix suggestions
  generateFixScript(validationResults: ValidationResult[]): string {
    const fixes = [];

    validationResults.forEach(result => {
      if (!result.valid) {
        fixes.push(`# Fixes for ${result.agent}`);
        result.errors.forEach(error => {
          fixes.push(`# ${error.message}`);
          fixes.push(`# Suggestion: ${error.suggestion}`);
          fixes.push(''); // empty line
        });
      }
    });

    return fixes.join('\n');
  }
}

// Enhanced type definitions
interface ValidationError {
  field: string;
  message: string;
  suggestion: string;
}

interface ValidationWarning {
  field: string;
  message: string;
  suggestion: string;
}

interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  agent: string;
}

interface BatchValidationResult {
  results: ValidationResult[];
  summary: {
    total: number;
    valid: number;
    errors: number;
    warnings: number;
    errorsByType: Record<string, number>;
    warningsByType: Record<string, number>;
  };
}

interface DuplicateValidationResult {
  valid: boolean;
  totalAgents: number;
  canonicalAgentCount: number;
  duplicates: Array<{
    agentName: string;
    totalCopies?: number;
    expectedCopies?: number;
    extraCopies?: string[];
    canonicalSources?: string[];
    issue?: string;
    missingFormats?: string[];
    existingLocations?: string[];
  }>;
}

interface CanonicalValidationResult {
  valid: boolean;
  manifestAgents: number;
  expectedCount: number;
  errors: Array<{
    agent: string;
    issue: string;
    suggestion?: string;
  }>;
}
```

#### 2. Add CLI Validation Command
**File**: `src/cli/validate.ts` (new file)
**Changes**: Create dedicated validation command

```typescript
import { Command } from 'commander';
import { AgentValidator } from '../conversion/validator.js';
import { parseAgentDirectory } from '../conversion/agent-parser.js';
import { glob } from 'glob';

export const validateCommand = new Command('validate')
  .description('Validate agent format compliance and detect duplicates')
  .option('--format <type>', 'Format to validate: all, claude-code, opencode, base', 'all')
  .option('--path <path>', 'Path to validate', '.')
  .option('--check-duplicates', 'Check for duplicate agents across directories', false)
  .option('--canonical-check', 'Validate canonical source integrity', false)
  .option('--fix', 'Generate fix suggestions', false)
  .option('--verbose', 'Show detailed validation results', false)
  .action(async (options) => {
    const validator = new AgentValidator();

    // Find agent files based on format
    const patterns = {
      'claude-code': ['claude-agents/**/*.md', '.claude/agents/**/*.md'],
      'opencode': ['opencode-agents/**/*.md', '.opencode/agent/**/*.md'],
      'base': ['agent/**/*.md'],
      'all': ['**/*agents/**/*.md', '.claude/agents/**/*.md', '.opencode/agent/**/*.md', 'agent/**/*.md']
    };

    const searchPattern = patterns[options.format] || patterns.all;
    const files = [];

    for (const pattern of searchPattern) {
      const matches = await glob(pattern, { cwd: options.path });
      files.push(...matches.map(f => path.join(options.path, f)));
    }

    console.log(`🔍 Validating ${files.length} agent files (format: ${options.format})...`);

    // Handle duplicate detection
    if (options.checkDuplicates) {
      console.log(`\n🔄 Checking for duplicate agents...`);
      const duplicateResult = await validator.validateNoDuplicates([
        'agent', 'claude-agents', 'opencode-agents',
        '.opencode/agent', '.claude/agents'
      ]);

      console.log(`📊 Duplicate Detection Results:`);
      console.log(`  Total unique agents: ${duplicateResult.totalAgents}`);
      console.log(`  Canonical agents (exactly 3 formats): ${duplicateResult.canonicalAgentCount}`);
      console.log(`  Duplicate issues found: ${duplicateResult.duplicates.length}`);

      if (duplicateResult.duplicates.length > 0) {
        console.log(`\n❌ Duplicate Issues:`);
        duplicateResult.duplicates.forEach(dup => {
          if (dup.issue === 'missing_canonical_formats') {
            console.log(`  ${dup.agentName}: Missing formats ${dup.missingFormats.join(', ')}`);
          } else {
            console.log(`  ${dup.agentName}: ${dup.totalCopies} copies (expected 3)`);
            dup.extraCopies.forEach(file => console.log(`    Extra: ${file}`));
          }
        });
      }

      if (!duplicateResult.valid) {
        process.exit(1);
      }
    }

    // Handle canonical integrity check
    if (options.canonicalCheck) {
      console.log(`\n🏛️ Validating canonical source integrity...`);
      try {
        const canonicalResult = await validator.validateCanonicalIntegrity();

        console.log(`📊 Canonical Integrity Results:`);
        console.log(`  Expected agents: ${canonicalResult.expectedCount}`);
        console.log(`  Manifest agents: ${canonicalResult.manifestAgents}`);
        console.log(`  Integrity issues: ${canonicalResult.errors.length}`);

        if (canonicalResult.errors.length > 0) {
          console.log(`\n❌ Integrity Issues:`);
          canonicalResult.errors.forEach(error => {
            console.log(`  ${error.agent}: ${error.issue}`);
            if (error.suggestion) {
              console.log(`    💡 ${error.suggestion}`);
            }
          });
        }

        if (!canonicalResult.valid) {
          process.exit(1);
        }
      } catch (error) {
        console.error(`❌ Could not validate canonical integrity: ${error.message}`);
        console.error(`   Make sure AGENT_MANIFEST.json exists and is valid`);
        process.exit(1);
      }
    }

    // Parse and validate agents
    const agents = [];
    const parseErrors = [];

    for (const file of files) {
      try {
        const agent = await parseAgentFile(file);
        agents.push(agent);
      } catch (error) {
        parseErrors.push({ file, error: error.message });
      }
    }

    if (parseErrors.length > 0) {
      console.error(`❌ ${parseErrors.length} files failed to parse:`);
      parseErrors.forEach(({ file, error }) => {
        console.error(`  ${file}: ${error}`);
      });
    }

    const { results, summary } = await validator.validateBatchWithDetails(agents);

    // Print summary
    console.log(`\n📊 Validation Summary:`);
    console.log(`  Total: ${summary.total}`);
    console.log(`  ✅ Valid: ${summary.valid}`);
    console.log(`  ❌ Errors: ${summary.errors}`);
    console.log(`  ⚠️  Warnings: ${summary.warnings}`);

    if (summary.errors > 0) {
      console.log(`\nTop error categories:`);
      Object.entries(summary.errorsByType)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .forEach(([field, count]) => {
          console.log(`  ${field}: ${count} issues`);
        });
    }

    if (options.verbose) {
      console.log(`\n📝 Detailed Results:`);
      results.forEach(result => {
        if (!result.valid) {
          console.log(`\n❌ ${result.agent}:`);
          result.errors.forEach(error => {
            console.log(`  ${error.field}: ${error.message}`);
            console.log(`    💡 ${error.suggestion}`);
          });
        }

        if (result.warnings.length > 0) {
          console.log(`\n⚠️  ${result.agent} warnings:`);
          result.warnings.forEach(warning => {
            console.log(`  ${warning.field}: ${warning.message}`);
          });
        }
      });
    }

    if (options.fix) {
      const fixScript = validator.generateFixScript(results);
      console.log(`\n🔧 Fix suggestions written to: agent-fixes.txt`);
      await fs.writeFile('agent-fixes.txt', fixScript);
    }

    // Exit with error code if validation failed
    if (summary.errors > 0) {
      process.exit(1);
    }
  });
```

#### 3. Integrate Validation into CLI
**File**: `src/cli/index.ts`
**Changes**: Add validate command to CLI

```typescript
import { validateCommand } from './validate.js';

// Add to CLI program
program.addCommand(validateCommand);
```

### Success Criteria:

#### Automated Verification:
- [ ] Enhanced validator passes all existing tests: `bun test tests/conversion/agent-formats.test.ts`
- [ ] New validation command works: `codeflow validate --format opencode --verbose`
- [ ] Batch validation performs well: `codeflow validate --path .` completes in <10 seconds
- [ ] Fix suggestions are actionable: Generated fixes resolve validation errors

#### Manual Verification:
- [ ] Validation error messages are clear and actionable
- [ ] CLI validation integrates smoothly with existing workflows
- [ ] Performance remains acceptable for large agent collections
- [ ] Fix suggestions accurately address identified issues

---

## Phase 4: Implement Canonical Agent Synchronization

### Overview
Create automated synchronization system to populate project and global directories from canonical sources, ensuring consistency while allowing project-specific overrides.

### Changes Required:

#### 1. Add Synchronization Commands to CLI
**File**: `src/cli/sync.ts` (enhance existing)
**Changes**: Add canonical synchronization functionality

```typescript
export const syncCommand = new Command('sync')
  .description('Synchronize agents from canonical sources')
  .option('--target <type>', 'Sync target: project, global, all', 'project')
  .option('--source <format>', 'Source format to sync from: base, claude-code, opencode', 'base')
  .option('--dry-run', 'Show what would be synced without making changes', false)
  .option('--force', 'Overwrite existing files', false)
  .action(async (options) => {
    const syncer = new CanonicalSyncer();

    console.log(`🔄 Synchronizing ${options.target} agents from canonical ${options.source} sources...`);

    const result = await syncer.syncFromCanonical({
      target: options.target,
      sourceFormat: options.source,
      dryRun: options.dryRun,
      force: options.force
    });

    console.log(`📊 Sync Results:`);
    console.log(`  Files synced: ${result.synced.length}`);
    console.log(`  Files skipped (already exist): ${result.skipped.length}`);
    console.log(`  Errors: ${result.errors.length}`);

    if (result.errors.length > 0) {
      console.log(`\n❌ Sync Errors:`);
      result.errors.forEach(error => {
        console.log(`  ${error.file}: ${error.message}`);
      });
    }

    if (options.dryRun) {
      console.log(`\n📋 Would sync (use --force to proceed):`);
      result.synced.forEach(file => console.log(`  ${file.from} → ${file.to}`));
    }
  });
```

#### 2. Create Canonical Synchronization System
**File**: `src/sync/canonical-syncer.ts` (new file)
**Changes**: Implement synchronization logic

```typescript
export class CanonicalSyncer {

  async syncFromCanonical(options: SyncOptions): Promise<SyncResult> {
    const manifest = await this.loadManifest();
    const result: SyncResult = { synced: [], skipped: [], errors: [] };

    for (const agent of manifest.canonical_agents) {
      try {
        const sourceFile = agent.sources[options.sourceFormat];
        const targetPaths = this.getTargetPaths(agent.name, options.target);

        for (const targetPath of targetPaths) {
          const shouldSync = await this.shouldSyncFile(sourceFile, targetPath, options.force);

          if (!shouldSync) {
            result.skipped.push({ agent: agent.name, target: targetPath, reason: 'exists' });
            continue;
          }

          if (!options.dryRun) {
            await this.syncFile(sourceFile, targetPath, options.sourceFormat, this.detectTargetFormat(targetPath));
          }

          result.synced.push({ from: sourceFile, to: targetPath, agent: agent.name });
        }
      } catch (error) {
        result.errors.push({ agent: agent.name, message: error.message });
      }
    }

    return result;
  }

  private getTargetPaths(agentName: string, target: string): string[] {
    const paths = [];

    if (target === 'project' || target === 'all') {
      // Project-specific locations
      paths.push(`.claude/agents/${agentName}.md`);
      paths.push(`.opencode/agent/${agentName}.md`);
    }

    if (target === 'global' || target === 'all') {
      // Global locations (user home directory)
      const homeDir = os.homedir();
      paths.push(path.join(homeDir, '.claude/agents', `${agentName}.md`));
      paths.push(path.join(homeDir, '.opencode/agent', `${agentName}.md`));
    }

    return paths;
  }

  private async syncFile(sourcePath: string, targetPath: string, sourceFormat: string, targetFormat: string) {
    // Ensure target directory exists
    await fs.mkdir(path.dirname(targetPath), { recursive: true });

    if (sourceFormat === targetFormat) {
      // Direct copy
      await fs.copyFile(sourcePath, targetPath);
    } else {
      // Format conversion required
      const converter = new FormatConverter();
      const sourceAgent = await parseAgentFile(sourcePath);
      const convertedAgent = await converter.convert(sourceAgent, sourceFormat, targetFormat);
      const serialized = await converter.serialize(convertedAgent, targetFormat);
      await fs.writeFile(targetPath, serialized);
    }
  }

  private detectTargetFormat(targetPath: string): string {
    if (targetPath.includes('.claude/')) return 'claude-code';
    if (targetPath.includes('.opencode/')) return 'opencode';
    return 'base';
  }

  private async shouldSyncFile(sourcePath: string, targetPath: string, force: boolean): Promise<boolean> {
    if (force) return true;

    try {
      const targetStats = await fs.stat(targetPath);
      const sourceStats = await fs.stat(sourcePath);

      // Only sync if source is newer or sizes differ significantly
      return sourceStats.mtime > targetStats.mtime ||
             Math.abs(sourceStats.size - targetStats.size) > 100;
    } catch (error) {
      // Target doesn't exist, should sync
      return true;
    }
  }
}

interface SyncOptions {
  target: 'project' | 'global' | 'all';
  sourceFormat: 'base' | 'claude-code' | 'opencode';
  dryRun: boolean;
  force: boolean;
}

interface SyncResult {
  synced: Array<{ from: string; to: string; agent: string }>;
  skipped: Array<{ agent: string; target: string; reason: string }>;
  errors: Array<{ agent: string; message: string }>;
}
```

#### 3. Add Automatic Sync Hooks
**File**: `src/hooks/sync-hooks.ts` (new file)
**Changes**: Automatic sync triggers

```typescript
// Hook into file watching to auto-sync when canonical files change
export class SyncWatcher {
  private watcher: fs.FSWatcher;

  async startWatching() {
    console.log('🔍 Watching canonical agent directories for changes...');

    this.watcher = fs.watch('agent/', { recursive: true }, async (eventType, filename) => {
      if (filename?.endsWith('.md') && eventType === 'change') {
        console.log(`📝 Canonical agent changed: ${filename}`);

        // Auto-sync to project directories
        const syncer = new CanonicalSyncer();
        await syncer.syncFromCanonical({
          target: 'project',
          sourceFormat: 'base',
          dryRun: false,
          force: true
        });

        console.log('✅ Project agents synchronized');
      }
    });
  }

  stop() {
    if (this.watcher) {
      this.watcher.close();
    }
  }
}
```

### Success Criteria:

#### Automated Verification:
- [ ] Sync command works: `codeflow sync --target project --dry-run`
- [ ] Global sync works: `codeflow sync --target global --dry-run`
- [ ] Format conversion during sync: Base agents properly convert to Claude Code/OpenCode formats
- [ ] File watching triggers sync: Changes to canonical agents auto-sync to project directories

#### Manual Verification:
- [ ] Project directories populate correctly from canonical sources
- [ ] Global directories sync without permission issues
- [ ] Format-specific features preserved during sync (tools, model formats)
- [ ] Sync respects existing project-specific customizations when appropriate

---

## Phase 5: Batch Fix Remaining Format Issues

### Overview
Use the enhanced validation system to systematically identify and fix remaining format issues across all agent formats.

### Changes Required:

#### 1. Generate Comprehensive Fix Report
**Command**: `codeflow validate --format all --verbose --fix`

#### 2. Apply Systematic Fixes
**Files**: Claude Code agents with missing descriptions (83 files)
**Pattern**:
```yaml
# BEFORE (invalid)
---
description: |
# Missing content
---

# AFTER (valid)
---
description: |
  [Agent purpose and capabilities based on content analysis]

  Use when:
  - [Specific use cases]

  Scope:
  - [Key responsibilities]
---
```

#### 3. Standardize Tools Configuration
**Files**: All agents with invalid tools values
**Pattern**:
```yaml
# BEFORE (invalid)
tools: undefined

# AFTER (valid based on agent purpose)
tools:
  read: true
  write: true
  grep: true
  bash: false
```

### Success Criteria:

#### Automated Verification:
- [ ] All agent formats achieve >95% validation compliance: `codeflow validate`
- [ ] MCP server loads all agents without errors or warnings
- [ ] Format conversion works for all agents: `codeflow convert --validate`
- [ ] No undefined or null values in agent configurations

#### Manual Verification:
- [ ] All agent descriptions are meaningful and complete
- [ ] Tool configurations match agent capabilities and requirements
- [ ] Model formats are consistent within each format type
- [ ] Agent functionality remains unchanged after format fixes

---

## Testing Strategy

### Unit Tests:
- Enhanced AgentValidator validation rules for all format types
- YAML parsing edge cases (multi-line, nested objects, special characters)
- Error handling for malformed files and invalid field values
- CLI validation command with various options and scenarios

### Integration Tests:
- MCP server startup with fixed agent files
- Format conversion round-trip validation for all agent types
- CLI workflows using enhanced validation

### Manual Testing Steps:
1. Run MCP server and verify all agents load without errors
2. Test agent functionality in Claude Desktop/OpenCode to ensure no regressions
3. Verify validation CLI provides helpful error messages and fix suggestions
4. Test format conversion maintains agent functionality across all formats

## Performance Considerations

- Enhanced YAML parsing using proven library (yaml package) for better performance
- Validation caching to avoid re-parsing unchanged files
- Batch validation optimizations for large agent collections
- Minimal memory footprint for CLI validation operations

## Migration Notes

- Backup existing agent files before applying fixes
- Test MCP server functionality after each phase
- Validate format conversion still works correctly after changes
- Ensure existing CLI workflows remain functional

## References

- Original research: `thoughts/research/2025-08-30_agent-format-validation.md`
- MCP server implementation: `mcp/codeflow-server.mjs:154-163`
- Existing validation system: `src/conversion/validator.ts`
- Agent parser implementation: `src/conversion/agent-parser.ts`
- Format conversion system: `src/conversion/format-converter.ts`
