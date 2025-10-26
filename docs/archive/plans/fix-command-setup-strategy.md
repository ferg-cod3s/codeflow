# Fix Command Setup Strategy Implementation Plan

## Overview

Fix the critical bug in `CommandSetupStrategy` where commands aren't being copied during `codeflow setup` for Claude Code projects. The strategy incorrectly looks for commands in `{sourcePath}/command` but should use format-specific source paths based on the target directory.

## Current State Analysis

### What Exists Now:
- `CommandSetupStrategy` class in `src/cli/setup.ts:60-105` with hardcoded source path
- Project type detection works correctly (`src/cli/setup.ts:164-207`)
- Target directory creation succeeds
- Command files exist in correct source locations:
  - `.claude/commands/` (7 files)
  - `.opencode/command/` (7 files)
  - `command/` (7 files - base format)

### What's Missing:
- Dynamic source path resolution based on target format
- Proper error handling for missing source directories
- Test coverage for command copying edge cases

### Key Constraints Discovered:
- Strategy pattern must be preserved (`src/cli/setup.ts:371-374`)
- Both Claude Code and OpenCode formats must be supported
- Base format in `/command/` serves as fallback source
- File copying must handle .md files only (`src/cli/setup.ts:90`)

## Desired End State

After this plan is complete:
- `codeflow setup` successfully copies commands to Claude Code projects (`.claude/commands/`)
- `codeflow setup` successfully copies commands to OpenCode projects (`.opencode/command/`)
- Commands are copied from the appropriate source format for each target
- Error messages are clear when source directories are missing
- Test coverage includes command copying scenarios

### How to Verify:
1. Run `codeflow setup .` on a Claude Code project - commands appear in `.claude/commands/`
2. Run `codeflow setup .` on an OpenCode project - commands appear in `.opencode/command/`
3. Run `bun test` - all tests pass including new command setup tests
4. Setup fails gracefully with clear error messages when source commands are missing

## What We're NOT Doing

- Not changing the strategy pattern architecture
- Not modifying project type detection logic
- Not converting between command formats (keeping direct copying approach)
- Not changing the agent setup logic (only command setup)
- Not modifying the base command files in `/command/`

## Implementation Approach

Replace the hardcoded source path in `CommandSetupStrategy` with dynamic path resolution that chooses the correct source directory based on the target format. Add comprehensive error handling and test coverage to prevent regressions.

## Phase 1: Fix Command Source Path Resolution

### Overview
Update `CommandSetupStrategy.setup()` to dynamically determine the correct source directory based on target format.

### Changes Required:

#### 1. CommandSetupStrategy Class
**File**: `src/cli/setup.ts`
**Changes**: Replace hardcoded source path with format-aware logic

```typescript
// Replace lines 78-84 in CommandSetupStrategy.setup()
async setup(
  sourcePath: string,
  targetDir: string,
  projectType: ProjectType,
  permissionConfig?: any
): Promise<AgentSetupResult> {
  const result: AgentSetupResult = {
    success: false,
    count: 0,
    errors: [],
    warnings: [],
  };

  try {
    // Determine source directory based on target format
    let sourceDir: string;
    
    if (targetDir.includes('.claude/commands')) {
      sourceDir = join(sourcePath, '.claude', 'commands');
    } else if (targetDir.includes('.opencode/command')) {
      sourceDir = join(sourcePath, '.opencode', 'command');
    } else {
      // Fallback to base format
      sourceDir = join(sourcePath, 'command');
    }

    if (!existsSync(sourceDir)) {
      // Try fallback to base format if specific format not found
      const fallbackDir = join(sourcePath, 'command');
      if (existsSync(fallbackDir)) {
        sourceDir = fallbackDir;
        result.warnings.push(`Using fallback command source: ${fallbackDir}`);
      } else {
        result.errors.push(`No command source found. Tried: ${sourceDir}, ${fallbackDir}`);
        return result;
      }
    }

    // Continue with existing file copying logic...
    const files = await readdir(sourceDir, { withFileTypes: true });
    for (const file of files) {
      if (file.isFile() && file.name.endsWith('.md')) {
        const sourcefile = join(sourceDir, file.name);
        const targetFile = join(targetDir, file.name);
        await copyFile(sourcefile, targetFile);
        result.count++;
      }
    }

    result.success = true;
  } catch (error: any) {
    result.errors.push(`Command setup failed: ${error.message}`);
  }

  return result;
}
```

### Success Criteria:

#### Automated Verification:
- [x] All existing tests pass: `bun test`
- [x] TypeScript compilation succeeds: `bun run typecheck`
- [x] Command files exist after setup: `ls .claude/commands/` shows 7 .md files
- [x] Command files exist after setup: `ls .opencode/command/` shows 7 .md files

#### Manual Verification:
- [x] `codeflow setup .` works on Claude Code project and copies commands
- [x] `codeflow setup .` works on OpenCode project and copies commands
- [ ] `codeflow setup .` works on general project and copies both formats
- [ ] Error messages are clear when command sources are missing
- [ ] Fallback logic works when specific format is missing but base exists

---

## Phase 2: Add Comprehensive Test Coverage

### Overview
Add unit and integration tests to prevent regressions and validate all command setup scenarios.

### Changes Required:

#### 1. Command Setup Strategy Unit Tests
**File**: `tests/setup/command-setup-strategy.test.ts`
**Changes**: Create new test file

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { mkdtemp, writeFile, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { CommandSetupStrategy } from '../../src/cli/setup.ts';

describe('CommandSetupStrategy', () => {
  let tempDir: string;
  let strategy: CommandSetupStrategy;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(import.meta.dir, 'tmp-'));
    strategy = new CommandSetupStrategy();
    
    // Create mock source directories and files
    await mkdir(join(tempDir, '.claude', 'commands'), { recursive: true });
    await mkdir(join(tempDir, '.opencode', 'command'), { recursive: true });
    await mkdir(join(tempDir, 'command'), { recursive: true });
    
    // Mock command files
    const mockCommand = '---\nname: test\n---\n# Test Command';
    await writeFile(join(tempDir, '.claude', 'commands', 'test.md'), mockCommand);
    await writeFile(join(tempDir, '.opencode', 'command', 'test.md'), mockCommand);
    await writeFile(join(tempDir, 'command', 'test.md'), mockCommand);
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it('should handle Claude Code target directory', async () => {
    const targetDir = join(tempDir, 'target', '.claude', 'commands');
    await mkdir(targetDir, { recursive: true });
    
    const result = await strategy.setup(tempDir, targetDir, {} as any);
    
    expect(result.success).toBe(true);
    expect(result.count).toBe(1);
    expect(result.errors).toHaveLength(0);
  });

  it('should handle OpenCode target directory', async () => {
    const targetDir = join(tempDir, 'target', '.opencode', 'command');
    await mkdir(targetDir, { recursive: true });
    
    const result = await strategy.setup(tempDir, targetDir, {} as any);
    
    expect(result.success).toBe(true);
    expect(result.count).toBe(1);
    expect(result.errors).toHaveLength(0);
  });

  it('should fallback to base format when specific format missing', async () => {
    // Remove specific format
    await rm(join(tempDir, '.claude'), { recursive: true, force: true });
    
    const targetDir = join(tempDir, 'target', '.claude', 'commands');
    await mkdir(targetDir, { recursive: true });
    
    const result = await strategy.setup(tempDir, targetDir, {} as any);
    
    expect(result.success).toBe(true);
    expect(result.count).toBe(1);
    expect(result.warnings).toContain(expect.stringContaining('Using fallback command source'));
  });

  it('should error when no command sources exist', async () => {
    // Remove all command sources
    await rm(join(tempDir, '.claude'), { recursive: true, force: true });
    await rm(join(tempDir, '.opencode'), { recursive: true, force: true });
    await rm(join(tempDir, 'command'), { recursive: true, force: true });
    
    const targetDir = join(tempDir, 'target', '.claude', 'commands');
    await mkdir(targetDir, { recursive: true });
    
    const result = await strategy.setup(tempDir, targetDir, {} as any);
    
    expect(result.success).toBe(false);
    expect(result.count).toBe(0);
    expect(result.errors).toContain(expect.stringContaining('No command source found'));
  });
});
```

#### 2. Setup Integration Tests Enhancement
**File**: `tests/setup/setup-integration.test.ts`
**Changes**: Add command setup validation

```typescript
// Add to existing test suite
describe('Command Setup Integration', () => {
  it('should copy commands during Claude Code setup', async () => {
    const projectDir = await setupTestProject('claude-code');
    
    // Run setup
    await setup(projectDir, { type: 'claude-code' });
    
    // Verify commands were copied
    const commandFiles = await readdir(join(projectDir, '.claude', 'commands'));
    expect(commandFiles.filter(f => f.endsWith('.md'))).toHaveLength(7);
    
    // Verify specific commands exist
    expect(commandFiles).toContain('research.md');
    expect(commandFiles).toContain('plan.md');
    expect(commandFiles).toContain('execute.md');
  });

  it('should copy commands during OpenCode setup', async () => {
    const projectDir = await setupTestProject('opencode');
    
    // Run setup
    await setup(projectDir, { type: 'opencode' });
    
    // Verify commands were copied
    const commandFiles = await readdir(join(projectDir, '.opencode', 'command'));
    expect(commandFiles.filter(f => f.endsWith('.md'))).toHaveLength(7);
  });
});
```

### Success Criteria:

#### Automated Verification:
- [x] New unit tests pass: `bun test tests/setup/command-setup-strategy.test.ts`
- [x] Integration tests pass: `bun test tests/integration/setup-integration.test.ts`
- [x] All existing tests continue to pass: `bun test`
- [x] Test coverage includes all edge cases (missing sources, fallback logic)

#### Manual Verification:
- [x] Tests run in isolation without side effects
- [x] Test output clearly shows which scenarios are being validated
- [x] Tests fail appropriately when bugs are introduced
- [x] Test setup and teardown work correctly with temp directories

---

## Phase 3: Improve Error Handling and User Experience

### Overview
Enhance error messages and logging to provide better feedback when command setup fails.

### Changes Required:

#### 1. Enhanced Error Messages
**File**: `src/cli/setup.ts`
**Changes**: Improve error reporting in copyCommands function

```typescript
// Update copyCommands function around line 388-396
if (strategy) {
  const result = await strategy.setup(sourcePath, targetDir, projectType, permissionConfig);

  if (result.success) {
    fileCount += result.count;
    console.log(`  ✓ Processed ${result.count} files for ${setupDir}`);
  } else {
    console.log(`  ❌ Failed to process ${setupDir}:`);
    result.errors.forEach((error) => console.log(`    • ${error}`));
    
    // Provide helpful guidance
    if (setupDir.includes('command')) {
      console.log(`    💡 Tip: Ensure command files exist in the source directory`);
      console.log(`    💡 Expected locations: .claude/commands/ or .opencode/command/`);
    }
  }

  if (result.warnings.length > 0) {
    result.warnings.forEach((warning) => console.log(`    ⚠️  ${warning}`));
  }
} else {
  console.log(`  ⚠️  No strategy found for ${setupDir}`);
}
```

#### 2. Add Debug Logging Option
**File**: `src/cli/index.ts`
**Changes**: Add --debug flag to setup command

```typescript
// Add to parseArgs options around line 83
debug: {
  type: 'boolean',
  default: false,
},

// Pass debug flag to setup function around line 292
await setup(setupPath, { 
  force: values.force, 
  type: values.type,
  debug: values.debug 
});
```

**File**: `src/cli/setup.ts`  
**Changes**: Add debug logging to setup function

```typescript
// Update setup function signature and add debug logging
export async function setup(
  projectPath: string | undefined,
  options: { force?: boolean; type?: string; debug?: boolean } = {}
) {
  // Add debug logging throughout the function
  if (options.debug) {
    console.log(`🔍 Debug: Project path: ${resolvedPath}`);
    console.log(`🔍 Debug: Project type: ${projectType.name}`);
    console.log(`🔍 Debug: Setup directories: ${projectType.setupDirs.join(', ')}`);
    console.log(`🔍 Debug: Codeflow source: ${codeflowDir}`);
  }
}
```

### Success Criteria:

#### Automated Verification:
- [ ] TypeScript compilation succeeds: `bun run typecheck`
- [ ] CLI help shows debug option: `codeflow setup --help`
- [ ] Debug logging works: `codeflow setup . --debug` shows detailed output
- [ ] Error messages are informative when commands fail to copy

#### Manual Verification:
- [ ] Error messages guide users to resolve missing command sources
- [ ] Debug output helps troubleshoot setup issues without being verbose by default
- [ ] Success messages clearly indicate what was accomplished
- [ ] Warning messages don't prevent successful setup

---

## Testing Strategy

### Unit Tests:
- `CommandSetupStrategy` class with all source path scenarios
- Error handling edge cases (missing directories, permission issues)
- Fallback logic when specific formats are missing
- File copying validation (only .md files, proper paths)

### Integration Tests:
- End-to-end `codeflow setup` for Claude Code projects
- End-to-end `codeflow setup` for OpenCode projects
- Mixed project type setup scenarios
- Command availability after setup completion

### Manual Testing Steps:
1. Create fresh project directory: `mkdir test-project && cd test-project`
2. Run Claude Code setup: `codeflow setup . --type claude-code`
3. Verify commands copied: `ls .claude/commands/` should show 7 .md files
4. Test command functionality: Use `/research` in Claude Code
5. Repeat for OpenCode: `codeflow setup . --type opencode --force`
6. Test error scenarios: Remove source commands and run setup
7. Test debug output: `codeflow setup . --debug --force`

## Performance Considerations

- File copying operations are minimal (7 small .md files)
- No performance impact expected from dynamic source path resolution
- Error checking adds negligible overhead
- Test suite should complete in under 10 seconds

## Migration Notes

- No breaking changes to existing API
- Existing projects with commands already set up are unaffected
- New error messages are more informative than previous version
- Debug flag is optional and backwards compatible

## References

- Original research: `research/research/2025-09-05_codeflow-setup-command-copy-issue.md`
- Bug location: `src/cli/setup.ts:80` - hardcoded source path in CommandSetupStrategy
- Strategy pattern: `src/cli/setup.ts:371-404` - copyCommands function
- Project types: `src/cli/setup.ts:164-207` - PROJECT_TYPES array