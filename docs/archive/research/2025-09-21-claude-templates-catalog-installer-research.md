# Catalog + Installer Research for @agentic-codeflow/cli

Date: 2025-09-21
Author: @ferg-cod3s
Status: Cancelled - Catalog system removed as over-engineered

## Objective

Research and design a portable "catalog + installer" system for Codeflow that enables browsing, searching, and installing agents, commands, settings, hooks, MCPs, and templates. This system should integrate with Codeflow's existing conversion and validation pipeline while supporting external component ingestion from repositories like davila7/claude-code-templates.

## Quick Comparison: Codeflow Today vs davila7/claude-code-templates

### Codeflow Current State

**Strengths:**

- **Canonical-first architecture**: Single source of truth in `codeflow-agents/` using BaseAgent format
- **Multi-platform conversion**: Automatic conversion to Claude Code (`.claude`) and OpenCode (`.opencode`) formats
- **Validation pipeline**: Comprehensive schema validation and round-trip conversion testing
- **Agent manifest**: Structured catalog in `AGENT_MANIFEST.json` with 29+ core agents
- **CLI integration**: Commands like `codeflow setup`, `codeflow pull`, `codeflow sync`

**Limitations:**

- No browsable catalog interface for discovery
- Limited search capabilities
- No external component ingestion
- No version management or dependency resolution
- Manual installation workflow

### davila7/claude-code-templates

**Strengths:**

- **Rich template ecosystem**: 100+ pre-built Claude Code templates
- **Diverse categories**: Writing, coding, analysis, business, creative templates
- **Ready-to-use format**: Native Claude Code YAML format
- **Community contributions**: Active development and contributions

**Limitations:**

- Platform-specific (Claude Code only)
- No validation pipeline
- No conversion capabilities
- Manual installation process
- No dependency management

## Target Shape

### Catalog System

#### Registry Index Structure

```json
{
  "version": "1.0.0",
  "updated": "2025-09-21T15:30:00Z",
  "sources": {
    "core": {
      "name": "Codeflow Core",
      "description": "Official Codeflow agents and commands",
      "url": "https://github.com/ferg-cod3s/codeflow",
      "type": "git"
    },
    "claude-templates": {
      "name": "Claude Code Templates",
      "description": "Community Claude Code templates",
      "url": "https://github.com/davila7/claude-code-templates",
      "type": "git",
      "adapter": "claude-code-templates"
    }
  },
  "items": [
    {
      "id": "codeflow-core/codebase-locator",
      "kind": "agent",
      "name": "codebase-locator",
      "version": "1.0.0",
      "description": "Locates files, directories, and components relevant to a feature",
      "tags": ["development", "research", "locator"],
      "license": "MIT",
      "source": "core",
      "dependencies": [],
      "install_targets": ["claude-code", "opencode"],
      "conversion_rules": {
        "base_path": "codeflow-agents/development/codebase-locator.md",
        "supports_all_formats": true
      },
      "provenance": {
        "repo": "ferg-cod3s/codeflow",
        "path": "codeflow-agents/development/codebase-locator.md",
        "sha": "c95908e",
        "license": "MIT",
        "attribution": "CodeFlow Team"
      }
    },
    {
      "id": "claude-templates/blog-writer",
      "kind": "template",
      "name": "Blog Writer",
      "version": "1.0.0",
      "description": "Professional blog writing assistant",
      "tags": ["writing", "content", "blog"],
      "license": "Apache-2.0",
      "source": "claude-templates",
      "dependencies": [],
      "install_targets": ["claude-code"],
      "conversion_rules": {
        "base_path": "imported/davila7/writing/blog-writer.yaml",
        "supports_formats": ["claude-code"],
        "lossy_fields": ["x-claude.model", "x-claude.temperature"]
      },
      "provenance": {
        "repo": "davila7/claude-code-templates",
        "path": "writing/blog-writer.yaml",
        "sha": "<imported-commit-sha>",
        "license": "Apache-2.0",
        "attribution": "davila7"
      }
    }
  ]
}
```

#### Catalog Types

- **Agents**: AI agents for specific domains (development, operations, analysis)
- **Commands**: Slash commands for complex workflows
- **Templates**: Pre-configured prompts and workflows
- **Settings**: Platform-specific configuration
- **Hooks**: Lifecycle hooks for automation
- **MCPs**: Model Context Protocols for external integrations

### Installer CLI

#### Core Commands

```bash
# Discovery and browsing
codeflow catalog list [--type agent|command|template] [--source core|claude-templates]
codeflow catalog search "code review" [--tags development,quality]
codeflow catalog info codeflow-core/codebase-locator

# Installation and management
codeflow catalog install agent codeflow-core/codebase-locator [--target claude-code,opencode]
codeflow catalog install template claude-templates/blog-writer [--target claude-code]
codeflow catalog update [item-id]
codeflow catalog remove [item-id]

# Health and maintenance
codeflow catalog health-check
codeflow catalog sync [--dry-run]
```

#### Integration with Codeflow Conversion

- **Validation**: All installed components pass through existing `AgentValidator`
- **Conversion**: Use `FormatConverter` to generate platform-specific formats
- **Deployment**: Leverage existing `setup`/`pull` commands for project installation

#### Optional Utilities

- **Health-check**: Validate installed components and dependencies
- **Analytics**: Opt-in usage tracking and performance metrics
- **Sandbox run**: Test components in isolated environment
- **Global agent shims**: Symlink management for global installations

## External Catalog Ingestion

### Source Provider for davila7 Repository

#### Adapter Implementation

```typescript
interface SourceAdapter {
  name: string;
  version: string;
  scan(repoUrl: string): Promise<CatalogItem[]>;
  import(item: CatalogItem, targetPath: string): Promise<ImportResult>;
  validate(item: CatalogItem): ValidationResult;
}

class ClaudeCodeTemplatesAdapter implements SourceAdapter {
  name = 'claude-code-templates';
  version = '1.0.0';

  async scan(repoUrl: string): Promise<CatalogItem[]> {
    // Clone/fetch repository
    // Parse directory structure
    // Extract YAML frontmatter from templates
    // Generate CatalogItem entries
  }

  async import(item: CatalogItem, targetPath: string): Promise<ImportResult> {
    // Download source file
    // Convert to base format where possible
    // Handle platform-specific fields in x-claude.* extensions
    // Generate provenance metadata
  }
}
```

#### Import Pipeline Orchestration

```bash
codeflow catalog import davila7/claude-code-templates \
  --adapter claude-code-templates \
  --dry-run \
  --filter "writing/*,coding/*" \
  --exclude "experimental/*"
```

### CLI Command

```bash
# Import external catalog
codeflow catalog import <repo-url> [options]
  --adapter <adapter-name>        # Source adapter to use
  --filter <glob-patterns>        # Include only matching paths
  --exclude <glob-patterns>       # Exclude matching paths
  --dry-run                       # Preview imports without changes
  --target-source <source-name>   # Custom source name in catalog
```

### Mapping Strategy

#### Agent Mapping

```yaml
# Original Claude Code template
name: 'Code Reviewer'
description: 'Expert code reviewer focusing on best practices'
model: claude-3-5-sonnet-20241022
temperature: 0.1
```

#### Converted to BaseAgent Format

```yaml
---
name: code-reviewer-imported
description: "Expert code reviewer focusing on best practices"
mode: assistant
model: claude-3-5-sonnet-20241022
temperature: 0.1
x-claude:
  original_name: "Code Reviewer"
  import_source: "davila7/claude-code-templates"
  import_path: "coding/code-reviewer.yaml"
tools: []
---

# Code Reviewer (Imported)

Expert code reviewer focusing on best practices and security.

## Process
1. Analyze code for bugs, security issues, and performance problems
2. Check adherence to coding standards and best practices
3. Suggest improvements and optimizations
4. Provide constructive feedback with examples
```

#### Handling Lossy/Non-mappable Fields

- **x-claude.\*** extensions preserve Claude-specific metadata
- **Platform-only targets**: Items that cannot be converted remain single-platform
- **Conversion notes**: Document limitations in item metadata

#### Command and Template Mapping

- **Commands**: Convert YAML frontmatter to Codeflow command format
- **Templates**: Extract prompt templates and convert to reusable components
- **Settings**: Map Claude-specific settings to platform equivalents where possible

### Provenance and Attribution

#### Required Fields

```json
{
  "provenance": {
    "repo": "davila7/claude-code-templates",
    "path": "writing/blog-writer.yaml",
    "sha": "a1b2c3d4e5f6789",
    "license": "Apache-2.0",
    "attribution": "davila7",
    "import_date": "2025-09-21T15:30:00Z",
    "codeflow_version": "0.10.5"
  }
}
```

#### Third-party Notices

- Auto-generate `THIRD_PARTY_NOTICES.md` during import
- Include license text and attribution for all imported components
- Track license compatibility with Codeflow MIT license

### De-duplication and QA

#### Conflict Resolution

- **Name conflicts**: Append source suffix (`code-reviewer-claude-templates`)
- **Functionality overlap**: Present choices during installation
- **Quality assessment**: Validate all imports through existing pipeline

## Examples

### Base Agent YAML Frontmatter (Converted from Claude Template)

```yaml
---
name: technical-writer-imported
description: "Professional technical documentation specialist"
mode: assistant
model: claude-3-5-sonnet-20241022
temperature: 0.2
x-claude:
  original_name: "Technical Writer"
  import_source: "davila7/claude-code-templates"
  import_path: "writing/technical-writer.yaml"
  original_model: "claude-3-5-sonnet-20241022"
tools: []
category: content
tags: ["writing", "documentation", "technical"]
---

# Technical Writer (Imported)

Professional technical documentation specialist focused on clear, accurate documentation.

## Capabilities
- API documentation
- User guides and tutorials
- Technical specifications
- Process documentation

## Process
1. Analyze technical requirements and audience
2. Structure information logically
3. Write clear, concise documentation
4. Include examples and code snippets where appropriate
5. Review for accuracy and completeness
```

### Catalog Index JSON Example

```json
{
  "version": "1.0.0",
  "updated": "2025-09-21T15:30:00Z",
  "stats": {
    "total_items": 157,
    "agents": 45,
    "commands": 8,
    "templates": 104
  },
  "items": [
    {
      "id": "codeflow-core/research-orchestrator",
      "kind": "command",
      "name": "/research",
      "description": "Comprehensive codebase and documentation analysis",
      "tags": ["workflow", "research", "analysis"],
      "install_targets": ["claude-code", "opencode"],
      "dependencies": ["codebase-locator", "research-locator", "web-search-researcher"]
    },
    {
      "id": "claude-templates/product-manager",
      "kind": "template",
      "name": "Product Manager",
      "description": "Strategic product management assistant",
      "tags": ["product", "strategy", "management"],
      "install_targets": ["claude-code"],
      "x-platform-specific": true
    }
  ]
}
```

### CLI UX Examples

```bash
# Browse available components
$ codeflow catalog list --type agent
┌─────────────────────────┬──────────────────────────────┬─────────────┬──────────────┐
│ ID                      │ Description                  │ Tags        │ Targets      │
├─────────────────────────┼──────────────────────────────┼─────────────┼──────────────┤
│ codeflow-core/          │ Locates files and           │ development │ claude-code, │
│ codebase-locator        │ components                   │ research    │ opencode     │
│ claude-templates/       │ Expert code reviewer         │ coding,     │ claude-code  │
│ code-reviewer           │                              │ quality     │              │
└─────────────────────────┴──────────────────────────────┴─────────────┴──────────────┘

# Search for specific functionality
$ codeflow catalog search "blog writing"
Found 3 matches:
  claude-templates/blog-writer          Professional blog writing assistant
  claude-templates/content-strategist   Content strategy and planning
  claude-templates/seo-optimizer        SEO-optimized content creation

# Install with automatic conversion
$ codeflow catalog install agent claude-templates/blog-writer --target claude-code
✅ Downloaded claude-templates/blog-writer
✅ Converted to base format
✅ Validated schema
✅ Installed to ~/.claude/agents/blog-writer-imported.md
✅ Added to project via codeflow pull

# Check installation health
$ codeflow catalog health-check
✅ 12 agents installed and valid
✅ 4 commands installed and valid
⚠️  2 components have updates available
❌ 1 component failed validation (outdated schema)
```

## Risks and Mitigations

### Technical Risks

- **Import quality**: Automated conversion may introduce errors
  - _Mitigation_: Comprehensive validation pipeline and manual review process
- **License conflicts**: Incompatible licenses in external repositories
  - _Mitigation_: License scanning and compatibility checking before import
- **Maintenance overhead**: External catalogs may become stale
  - _Mitigation_: Automated health checks and update notifications

### Operational Risks

- **Storage bloat**: Large catalogs consuming disk space
  - _Mitigation_: Lazy loading and optional component caching
- **Network dependencies**: Internet required for catalog operations
  - _Mitigation_: Offline mode using cached catalog index
- **Version conflicts**: Different versions of same component
  - _Mitigation_: Semantic versioning and dependency resolution

## Open Questions

1. **Versioning strategy**: How should we handle component versioning and updates?
2. **Conflict resolution**: What happens when multiple sources provide similar components?
3. **Quality gates**: What validation criteria should imported components meet?
4. **Update frequency**: How often should external catalogs be synchronized?
5. **Offline support**: Should the catalog work without internet connectivity?
6. **Custom adapters**: How can users create adapters for their own repositories?

## References

- [davila7/claude-code-templates](https://github.com/davila7/claude-code-templates) - External template repository
- [CodeFlow Agent Registry](../AGENT_REGISTRY.md) - Current agent catalog
- [CodeFlow Architecture](../ARCHITECTURE_OVERVIEW.md) - System architecture
- [BaseAgent Format](../../codeflow-agents/) - Canonical agent format

## Acceptance Criteria

This research document is complete when it includes:

- [x] **Objective statement** clearly defining the catalog + installer goals
- [x] **Comparison analysis** between current Codeflow and davila7/claude-code-templates
- [x] **Target architecture** with detailed registry index structure and catalog types
- [x] **CLI design** with core commands and integration points
- [x] **External ingestion pipeline** including adapters and import orchestration
- [x] **Mapping strategy** for converting external components to base format
- [x] **Provenance handling** with attribution and licensing requirements
- [x] **Concrete examples** including YAML frontmatter, JSON catalog, and CLI usage
- [x] **Risk assessment** with technical and operational considerations
- [x] **Open questions** for implementation planning phase
- [x] **References** to related documentation and external sources
