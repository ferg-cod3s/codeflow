---
title: Setup Agents - Developer Notes
audience: developer
version: v0.4.0
feature: setup-agents
---

## Architecture Overview

The setup agents system uses a **Strategy Pattern** with **single source + on-demand conversion** to provide modular, scalable agent setup.

### Core Components

```typescript
// Strategy interface for different setup types
export interface AgentSetupStrategy {
  shouldHandle(setupDir: string): boolean;
  setup(sourcePath: string, targetDir: string, projectType: ProjectType): Promise<AgentSetupResult>;
}

// Configuration-driven format mapping
export const FORMAT_MAPPINGS = {
  '.claude/agents': 'claude-code',
  '.opencode/agent': 'opencode',
} as const;
```

### Data Flow

```
codeflow-agents/ (base format)
    ↓ parseAgentsFromDirectory()
Agent[] (parsed)
    ↓ FormatConverter.convertBatch()
Agent[] (converted)
    ↓ serializeAgent()
.md files (target format)
    ↓ copy to project
.claude/agents/ or .opencode/agent/
```

## Key Design Decisions

### Single Source + Conversion

- **Why**: Prevents storage bloat, maintains single source of truth
- **Trade-off**: Conversion overhead (~9ms for 29 agents)
- **Benefit**: Easy to add new formats without duplicating files

### Strategy Pattern

- **Why**: Modular setup logic, easy to extend
- **Benefit**: New setup types require only implementing AgentSetupStrategy
- **Example**: Adding Cursor support needs only new strategy class

### Configuration-Driven Mapping

- **Why**: Format determination in data, not code
- **Benefit**: Adding new formats requires only updating FORMAT_MAPPINGS
- **Future**: Easy to support `.windsurf/agents`, `.cursor/agents`, etc.

## Extension Points

### Adding New AI Client Formats

1. **Update FORMAT_MAPPINGS**:

```typescript
export const FORMAT_MAPPINGS = {
  '.claude/agents': 'claude-code',
  '.opencode/agent': 'opencode',
  '.cursor/agents': 'cursor', // Add new format
} as const;
```

2. **Ensure FormatConverter supports it**:

```typescript
// FormatConverter must have conversion methods
convert(agent: Agent, 'cursor'): Agent
```

3. **Update PROJECT_TYPES**:

```typescript
{
  name: 'cursor',
  setupDirs: ['.cursor/commands', '.cursor/agents'],
  // ...
}
```

### Adding New Setup Types

1. **Implement AgentSetupStrategy**:

```typescript
export class CustomSetupStrategy implements AgentSetupStrategy {
  shouldHandle(setupDir: string): boolean {
    return setupDir.includes('custom');
  }

  async setup(sourcePath: string, targetDir: string): Promise<AgentSetupResult> {
    // Custom setup logic
  }
}
```

2. **Register in copyCommands**:

```typescript
const strategies: AgentSetupStrategy[] = [
  new CommandSetupStrategy(),
  new AgentSetupStrategy(),
  new CustomSetupStrategy(), // Add new strategy
];
```

### Performance Optimizations

The system includes built-in performance features:

- **Batch Processing**: `processAgentsInBatches()` for large sets
- **Streaming**: `streamAgentConversion()` for memory efficiency
- **Progress Reporting**: Optional progress updates for large operations

## Error Handling

### Structured Error Results

```typescript
interface AgentSetupResult {
  success: boolean;
  count: number;
  errors: string[]; // Blocking errors
  warnings: string[]; // Non-blocking issues
}
```

### Error Categories

- **Source Errors**: Missing source directories/files
- **Conversion Errors**: Parsing/serialization failures
- **Target Errors**: File system permission issues
- **Validation Errors**: Format compatibility issues

## Testing Strategy

### Unit Tests

- **Strategy Classes**: Test each strategy independently
- **Format Mapping**: Test getTargetFormat() with various inputs
- **Error Handling**: Test various failure scenarios

### Integration Tests

- **End-to-End Setup**: Test complete setup workflows
- **Format Conversion**: Verify agents are correctly converted
- **Performance**: Test with various agent counts

### Key Test Files

- `tests/setup-agents.test.ts` - Unit tests for strategies
- `tests/integration/setup-integration.test.ts` - E2E tests

## Performance Characteristics

- **29 agents**: ~9ms total (~0.31ms per agent)
- **100 agents**: ~31ms total
- **1000 agents**: ~0.3s total
- **Memory**: Efficient streaming prevents memory bloat
- **Scalability**: Linear performance scaling

## Migration Notes

### From Old Setup

- **Before**: Only commands copied, agents missing
- **After**: Both commands and agents copied with conversion
- **Compatibility**: Existing projects work unchanged
- **Upgrade**: Run `codeflow setup . --force` to get agents

### Breaking Changes

- None. This is purely additive functionality.
- Existing setup behavior preserved for backward compatibility.

## Future Considerations

### Selective Agent Deployment

```typescript
// Future: Allow projects to choose which agents to deploy
interface AgentFilter {
  includePatterns?: string[];
  excludePatterns?: string[];
  categories?: string[];
  maxCount?: number;
}
```

### Agent Version Management

```typescript
// Future: Support different agent versions
interface AgentVersion {
  version: string;
  compatibility: string[];
  deprecated?: boolean;
}
```

## Dependencies

- **FormatConverter**: Handles agent format conversion
- **AgentParser**: Parses and serializes agent files
- **File System**: Node.js fs/promises for file operations
- **Path Utils**: Node.js path for cross-platform paths
