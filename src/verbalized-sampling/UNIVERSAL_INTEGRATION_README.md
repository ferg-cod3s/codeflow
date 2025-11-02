# Universal Verbalized Sampling Integration System



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


A comprehensive system for integrating verbalized sampling across CodeFlow agents, commands, and skills with support for OpenCode, Claude Code, and Cursor platforms.

## 🎯 Overview

The Universal VS Integration System provides:

- **Cross-Platform Support**: OpenCode, Claude Code, and Cursor platforms
- **Component Integration**: Agents, commands, and skills
- **Automated Injection**: Template-based VS integration
- **Global Repository Sync**: Bidirectional synchronization with global repos
- **Validation Framework**: Comprehensive testing and quality assurance
- **CLI Tools**: Command-line interface for all operations

## 🏗️ Architecture

### Core Components

1. **Universal Integration** (`universal-integration.ts`)
   - Main integration orchestrator
   - Platform-agnostic VS injection
   - Template rendering and formatting

2. **Injection Patterns** (`injection-patterns.ts`)
   - Standardized injection templates
   - Component-specific patterns (agents, commands, skills)
   - Platform adaptations

3. **Platform Adapters** (`platform-adapters.ts`)
   - Platform-specific conventions
   - File structure validation
   - Content formatting

4. **Global Repository Sync** (`global-repo-sync.ts`)
   - Bidirectional synchronization
   - Conflict resolution
   - Automated copying

5. **Validation Framework** (`validation-framework.ts`)
   - Comprehensive validation
   - Quality scoring
   - Test execution

6. **CLI Tool** (`cli.ts`)
   - Command-line interface
   - All operations accessible via CLI

## 🚀 Quick Start

### Installation

```bash
# Build the VS integration system
bun build src/verbalized-sampling/cli.ts --target bun --outfile vs-cli

# Make it executable
chmod +x vs-cli
```

### Initialize VS Integration

```bash
# Initialize in current directory
./vs-cli init

# Initialize for specific platform
./vs-cli init --platform cursor
```

### Validate Existing Components

```bash
# Validate all components
./vs-cli validate .

# Validate specific directory
./vs-cli validate base-agents/

# Validate with strict mode
./vs-cli validate . --strict

# Save report to file
./vs-cli validate . --output validation-report.json
```

### Test VS Generation

```bash
# Test with a research problem
./vs-cli test "How does user authentication work in this system?"

# Test with planning problem
./vs-cli test "Plan implementation of user profile management" --type planning

# Test with development problem
./vs-cli test "Implement OAuth2 authentication" --type development
```

## 📋 Available Commands

### validate

Validate VS integration in files or directories.

```bash
vs-cli validate <path> [options]
```

Options:

- `--platform <opencode|claude|cursor>`: Specify platform
- `--type <agent|command|skill>`: Specify component type
- `--strict`: Enable strict validation mode
- `--output <file>`: Save report to file
- `--no-warnings`: Disable warnings
- `--no-suggestions`: Disable suggestions

### info

Show VS integration information and statistics.

```bash
vs-cli info [options]
```

Options:

- `--platform <platform>`: Filter by platform
- `--type <type>`: Filter by component type

### init

Initialize VS integration in current directory.

```bash
vs-cli init [options]
```

Options:

- `--platform <platform>`: Primary platform (default: opencode)

### test

Test VS generation with sample problem.

```bash
vs-cli test <problem> [options]
```

Options:

- `--type <research|planning|development>`: Agent type (default: research)
- `--count <number>`: Number of strategies to generate
- `--format <json|markdown|terminal>`: Output format (default: terminal)

## 🎨 Injection Patterns

### Agent Patterns

1. **frontmatter-section**: Inject VS as a section after YAML frontmatter
2. **yaml-integration**: Add VS configuration to YAML frontmatter
3. **code-comment**: Inject VS as code comments

### Command Patterns

1. **usage-section**: Add VS to usage examples section
2. **prepend-approach**: Prepend VS analysis to command description

### Skill Patterns

1. **implementation-strategy**: Add VS strategy to implementation section
2. **metadata-integration**: Integrate VS into skill metadata

## 🏢 Platform Support

### OpenCode

- **Structure**: Flat structure with JSONC configuration
- **File Extensions**: `.md`, `.jsonc`, `.ts`, `.js`
- **Default Pattern**: `frontmatter-section`
- **Special Features**: Auto-generates JSONC configuration blocks

### Claude Code

- **Structure**: Command-based structure
- **File Extensions**: `.md`, `.mcp`
- **Default Pattern**: `prepend-approach`
- **Special Features**: Simplified markdown format

### Cursor

- **Structure**: `.cursor` directory structure
- **File Extensions**: `.md`, `.cursorrules`
- **Default Pattern**: `frontmatter-section`
- **Special Features**: Generates `.cursorrules` files

## 🔄 Global Repository Synchronization

### Export to Global Repository

```typescript
import {
  exportToGlobalRepo,
  GlobalRepoConfig,
} from './src/verbalized-sampling/global-repo-sync.js';

const config: GlobalRepoConfig = {
  name: 'My Global VS Repository',
  localPath: '/path/to/global/repo',
  autoSync: true,
  components: ['agents', 'commands', 'skills'],
  platforms: ['opencode', 'claude', 'cursor'],
};

const result = await exportToGlobalRepo(config);
console.log(`Exported ${result.filesUpdated} files`);
```

### Import from Global Repository

```typescript
import { importFromGlobalRepo } from './src/verbalized-sampling/global-repo-sync.js';

const result = await importFromGlobalRepo(config);
console.log(`Imported ${result.filesUpdated} files`);
```

### Bidirectional Sync

```typescript
import { syncWithGlobalRepo } from './src/verbalized-sampling/global-repo-sync.js';

const result = await syncWithGlobalRepo(config);
console.log(`Synced ${result.filesUpdated} files`);
```

## ✅ Validation Framework

### File Validation

```typescript
import { validateVSFile } from './src/verbalized-sampling/validation-framework.js';

const result = await validateVSFile('base-agents/research-agent.md');
console.log(`Valid: ${result.valid}, Score: ${result.score}/100`);
```

### Directory Validation

```typescript
import { validateVSDirectory } from './src/verbalized-sampling/validation-framework.js';

const report = await validateVSDirectory('base-agents/');
console.log(`Average score: ${report.averageScore}/100`);
```

### Quality Scoring

The validation framework calculates quality scores based on:

- **Errors** (-20 points each): Missing required elements, invalid structure
- **Warnings** (-5 points each): Missing optional elements, style issues
- **VS Integration** (+10 points): Presence of verbalized sampling
- **Platform Compliance**: Adherence to platform conventions

## 🔧 API Usage

### Universal Integration

```typescript
import { UniversalVSIntegration } from './src/verbalized-sampling/universal-integration.js';

const integration = new UniversalVSIntegration({
  enabled: true,
  autoInject: true,
  confidenceThreshold: 0.7,
  strategyCount: 3,
  outputFormat: 'markdown',
});

// Generate VS integration
const vsResult = await integration.generateVSIntegration(
  'How does authentication work?',
  'research'
);

// Inject into component
const result = await integration.injectIntoAgent(
  'path/to/agent.md',
  platformConfig,
  'How does authentication work?',
  'research'
);
```

### Platform Adapters

```typescript
import { Adapters } from './src/verbalized-sampling/platform-adapters.js';

// Get adapter for platform
const adapter = Adapters.getAdapter('opencode');

// Validate file structure
const validation = await Adapters.validateFileStructure(
  'opencode',
  'base-agents/research-agent.md'
);

// Generate platform-specific integration
const integration = await Adapters.generateIntegration(
  'opencode',
  'agents',
  vsResult,
  'research-agent'
);
```

### Injection Patterns

```typescript
import { InjectionPatterns } from './src/verbalized-sampling/injection-patterns.js';

// Get pattern for component type
const pattern = InjectionPatterns.getPlatformPattern(
  'agent',
  'opencode',
  'frontmatter-section'
);

// Render template with data
const content = InjectionPatterns.renderTemplate(pattern, {
  selectedStrategy: 'Code-Path Analysis',
  confidencePercentage: '85.2%',
  strategies: [...],
});
```

## 📁 Directory Structure

```
src/verbalized-sampling/
├── index.ts                    # Main VS interface
├── strategy-generator.ts        # Strategy generation logic
├── confidence-calculator.ts     # Confidence scoring
├── output-formatter.ts         # Multi-format output
├── universal-integration.ts    # Universal integration system
├── injection-patterns.ts       # Injection pattern templates
├── platform-adapters.ts       # Platform-specific adapters
├── global-repo-sync.ts        # Global repository sync
├── validation-framework.ts     # Validation and testing
├── cli.ts                     # Command-line interface
└── README.md                  # This file
```

## 🧪 Testing

### Run Validation Tests

```bash
# Validate entire codebase
./vs-cli validate . --strict

# Test specific component types
./vs-cli validate base-agents/ --type agent
./vs-cli validate commands-simplified/ --type command
./vs-cli validate base-skills/ --type skill
```

### Test VS Generation

```bash
# Research agent test
./vs-cli test "Analyze the authentication flow" --type research

# Planning agent test
./vs-cli test "Plan user profile feature" --type planning

# Development agent test
./vs-cli test "Implement OAuth2" --type development
```

## 🔧 Configuration

### VS Configuration File

Create a `vs-config.json` file in your project root:

```json
{
  "verbalized_sampling": {
    "enabled": true,
    "platform": "opencode",
    "auto_inject": true,
    "confidence_threshold": 0.7,
    "strategy_count": 3,
    "output_format": "markdown"
  }
}
```

### Platform-Specific Configuration

#### OpenCode (`opencode.jsonc`)

```jsonc
{
  "model": "anthropic/claude-sonnet-4",
  "agent": {
    "build": { "mode": "primary" },
    "plan": { "mode": "primary" },
  },
}
```

#### Cursor (`.cursorrules`)

```
# Cursor Rules for Verbalized Sampling Integration

## VS Integration Guidelines
- All agents should include verbalized sampling analysis
- Use frontmatter-section pattern for consistency
- Validate VS integration before committing
```

## 🚨 Troubleshooting

### Common Issues

1. **Validation Fails**
   - Check file extensions match platform requirements
   - Ensure YAML front matter is properly formatted
   - Verify VS integration includes required elements

2. **Injection Fails**
   - Confirm platform and component type are correct
   - Check file permissions
   - Verify template variables are resolved

3. **Sync Fails**
   - Ensure global repository path is accessible
   - Check git repository status
   - Resolve conflicts manually if needed

### Debug Mode

Enable debug output by setting environment variable:

```bash
DEBUG=vs:* ./vs-cli validate . --strict
```

### Log Files

Check for log files in:

- `./vs-validation.log` - Validation results
- `./vs-sync.log` - Synchronization operations
- `./vs-injection.log` - Injection operations

## 🤝 Contributing

### Adding New Platforms

1. Create platform adapter in `platform-adapters.ts`
2. Define platform-specific patterns in `injection-patterns.ts`
3. Add platform validation rules in `validation-framework.ts`
4. Update CLI help and documentation

### Adding New Patterns

1. Define pattern in `injection-patterns.ts`
2. Create template with proper variables
3. Add platform adaptations
4. Update validation rules

### Testing Changes

1. Run full validation suite: `./vs-cli validate . --strict`
2. Test all platforms: `./vs-cli validate . --platform opencode --platform claude --platform cursor`
3. Test VS generation: `./vs-cli test "Sample problem"`
4. Update documentation

## 📄 License

This Universal VS Integration System is part of the CodeFlow project and follows the same licensing terms.

## 🔗 Related Documentation

- [CodeFlow Agents Documentation](../AGENTS.md)
- [Verbalized Sampling Infrastructure](./README.md)
- [Platform Best Practices](../docs/)
- [Development Standards](../.cursorrules)
