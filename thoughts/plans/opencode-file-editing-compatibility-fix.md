# OpenCode File Editing Compatibility Fix - Implementation Plan

## Overview

Fix codeflow v0.7.0's setup process to create file and directory structures that allow OpenCode's primary and subagents to successfully edit files. The current setup creates permissions or ownership that prevent OpenCode agents from modifying files in the `.opencode/` directory structure.

## Current State Analysis

### What Exists Now:
- Codeflow v0.7.0 with `setup` command that creates `.opencode/` directory structure
- Setup process uses `fs.copy()` and `ensureDir()` with default system permissions
- Files copied with `{ overwrite: true }` preserve source permissions and metadata
- Mixed file creation methods (`fs.copy()` vs `fs.writeFile()`) create inconsistent attributes

### What's Missing:
- OpenCode-compatible file permissions and ownership
- Explicit permission setting for external tool access
- Validation that created files are actually editable by OpenCode
- Error handling for permission-related setup failures

### Key Discoveries:
- Setup creates directories with default 755 permissions (`src/cli/setup.ts:23-27`)
- Files inherit permissions from source during `fs.copy()` operations (`src/cli/setup.ts:60`)
- No explicit permission or ownership validation after file creation
- No test coverage for file permission scenarios

## Desired End State

After this plan is complete:
- OpenCode's primary and subagents can successfully edit any file in codeflow-created directories
- Codeflow setup process explicitly sets OpenCode-compatible permissions
- Users receive clear feedback if permission issues prevent proper setup
- Existing broken setups can be repaired with a fix command

## What We're NOT Doing

- Modifying OpenCode tool behavior or requirements
- Changing the overall directory structure (`.opencode/agent/`, `.opencode/command/`)
- Adding new agent or command formats beyond existing support
- Implementing complex file locking or concurrent access control

## Implementation Approach

**Strategy**: Replace codeflow's current file operations with OpenCode-aware versions that explicitly set permissions, ownership, and attributes needed for external tool compatibility.

**Key Principles**:
- Explicit permission setting rather than inheritance
- Validation that created files are actually writable
- Graceful handling of permission failures
- Backward compatibility with existing projects

## Phase 1: Permission Analysis & Detection

### Overview
Analyze what permissions OpenCode needs and add detection capabilities to identify permission issues.

### Changes Required:

#### 1. Permission Research Module
**File**: `src/utils/opencodeCompatibility.ts`
**Changes**: Create new utility module for OpenCode compatibility functions

```typescript
import { promises as fs } from 'node:fs';
import { join } from 'node:path';

export interface PermissionCheck {
  path: string;
  readable: boolean;
  writable: boolean;
  executable: boolean;
  owner: string;
  group: string;
  permissions: string;
}

export async function checkOpenCodeCompatibility(projectPath: string): Promise<{
  compatible: boolean;
  issues: string[];
  details: PermissionCheck[];
}> {
  const openCodePath = join(projectPath, '.opencode');
  const agentPath = join(openCodePath, 'agent');
  const commandPath = join(openCodePath, 'command');
  
  const issues: string[] = [];
  const details: PermissionCheck[] = [];
  
  for (const path of [openCodePath, agentPath, commandPath]) {
    const check = await checkPathPermissions(path);
    details.push(check);
    
    if (!check.writable) {
      issues.push(`Directory not writable by current user: ${path}`);
    }
  }
  
  return {
    compatible: issues.length === 0,
    issues,
    details
  };
}

async function checkPathPermissions(path: string): Promise<PermissionCheck> {
  try {
    const stats = await fs.stat(path);
    const mode = stats.mode;
    
    // Check actual access permissions
    const checks = await Promise.allSettled([
      fs.access(path, fs.constants.R_OK),
      fs.access(path, fs.constants.W_OK),
      fs.access(path, fs.constants.X_OK),
    ]);
    
    return {
      path,
      readable: checks[0].status === 'fulfilled',
      writable: checks[1].status === 'fulfilled', 
      executable: checks[2].status === 'fulfilled',
      owner: stats.uid.toString(),
      group: stats.gid.toString(),
      permissions: (mode & parseInt('777', 8)).toString(8),
    };
  } catch (error) {
    return {
      path,
      readable: false,
      writable: false,
      executable: false,
      owner: 'unknown',
      group: 'unknown',
      permissions: 'unknown',
    };
  }
}
```

#### 2. Diagnostic Command
**File**: `src/cli/index.ts`
**Changes**: Add new `diagnose` command to check OpenCode compatibility

```typescript
// Add to existing CLI commands
.command('diagnose [projectPath]')
.description('Check OpenCode compatibility of codeflow setup')
.action(async (projectPath: string = process.cwd()) => {
  const { checkOpenCodeCompatibility } = await import('./utils/opencodeCompatibility.js');
  
  console.log(`🔍 Checking OpenCode compatibility in: ${projectPath}`);
  
  const result = await checkOpenCodeCompatibility(projectPath);
  
  if (result.compatible) {
    console.log('✅ OpenCode compatibility: GOOD');
  } else {
    console.log('❌ OpenCode compatibility: ISSUES FOUND');
    for (const issue of result.issues) {
      console.log(`  - ${issue}`);
    }
  }
  
  console.log('\n📊 Permission Details:');
  for (const detail of result.details) {
    console.log(`  ${detail.path}: ${detail.permissions} (R:${detail.readable ? '✓' : '✗'} W:${detail.writable ? '✓' : '✗'} X:${detail.executable ? '✓' : '✗'})`);
  }
})
```

### Success Criteria:

#### Automated Verification:
- [ ] TypeScript compilation passes: `bun run typecheck`
- [ ] New utility module exports expected functions
- [ ] CLI command loads without errors: `codeflow diagnose --help`

#### Manual Verification:
- [ ] Diagnose command correctly identifies permission issues in test directories
- [ ] Permission details show accurate read/write/execute status
- [ ] Command provides helpful feedback for different permission scenarios

---

## Phase 2: OpenCode-Compatible File Operations

### Overview
Replace current file operations with versions that set explicit permissions compatible with OpenCode.

### Changes Required:

#### 1. Enhanced File Operations Module
**File**: `src/utils/fileOperations.ts`
**Changes**: Create OpenCode-compatible file operation functions

```typescript
import { promises as fs } from 'node:fs';
import { dirname } from 'node:path';

export interface CreateOptions {
  permissions?: string; // e.g., '755', '644'
  ensureWritable?: boolean;
  validateAfterCreate?: boolean;
}

export async function createDirectoryForOpenCode(
  dirPath: string, 
  options: CreateOptions = {}
): Promise<void> {
  const {
    permissions = '755',
    ensureWritable = true,
    validateAfterCreate = true,
  } = options;
  
  // Create directory with explicit permissions
  await fs.mkdir(dirPath, { 
    recursive: true, 
    mode: parseInt(permissions, 8) 
  });
  
  // Explicitly set permissions (mkdir mode can be affected by umask)
  await fs.chmod(dirPath, parseInt(permissions, 8));
  
  if (ensureWritable) {
    // Ensure current user can write (add write permission for user)
    const stats = await fs.stat(dirPath);
    const currentMode = stats.mode;
    const userWritableMode = currentMode | 0o200; // Add user write bit
    await fs.chmod(dirPath, userWritableMode);
  }
  
  if (validateAfterCreate) {
    // Verify directory is actually writable
    try {
      await fs.access(dirPath, fs.constants.W_OK);
    } catch (error) {
      throw new Error(`Created directory is not writable: ${dirPath}`);
    }
  }
}

export async function copyFileForOpenCode(
  sourcePath: string,
  targetPath: string,
  options: CreateOptions = {}
): Promise<void> {
  const {
    permissions = '644',
    ensureWritable = true,
    validateAfterCreate = true,
  } = options;
  
  // Ensure target directory exists
  await createDirectoryForOpenCode(dirname(targetPath), { permissions: '755' });
  
  // Copy file content (not metadata)
  const content = await fs.readFile(sourcePath, 'utf8');
  await fs.writeFile(targetPath, content, 'utf8');
  
  // Set explicit permissions
  await fs.chmod(targetPath, parseInt(permissions, 8));
  
  if (ensureWritable) {
    // Ensure current user can write
    const stats = await fs.stat(targetPath);
    const currentMode = stats.mode;
    const userWritableMode = currentMode | 0o200; // Add user write bit
    await fs.chmod(targetPath, userWritableMode);
  }
  
  if (validateAfterCreate) {
    // Verify file is actually writable
    try {
      await fs.access(targetPath, fs.constants.W_OK);
    } catch (error) {
      throw new Error(`Created file is not writable: ${targetPath}`);
    }
  }
}
```

#### 2. Updated Setup Command
**File**: `src/cli/setup.ts`
**Changes**: Replace existing file operations with OpenCode-compatible versions

```typescript
import { createDirectoryForOpenCode, copyFileForOpenCode } from '../utils/fileOperations.js';

// Replace existing directory creation (around line 23-27)
async function createProjectStructure(projectPath: string): Promise<void> {
  // Create directories with OpenCode-compatible permissions
  await createDirectoryForOpenCode(path.join(projectPath, '.opencode'), {
    permissions: '755',
    ensureWritable: true,
    validateAfterCreate: true,
  });
  
  await createDirectoryForOpenCode(path.join(projectPath, '.opencode', 'agent'), {
    permissions: '755',
    ensureWritable: true,
    validateAfterCreate: true,
  });
  
  await createDirectoryForOpenCode(path.join(projectPath, '.opencode', 'command'), {
    permissions: '755', 
    ensureWritable: true,
    validateAfterCreate: true,
  });
  
  await createDirectoryForOpenCode(path.join(projectPath, '.claude'), {
    permissions: '755',
    ensureWritable: true,
    validateAfterCreate: true,
  });
  
  await createDirectoryForOpenCode(path.join(projectPath, '.claude', 'commands'), {
    permissions: '755',
    ensureWritable: true,
    validateAfterCreate: true,
  });
}

// Replace existing file copying (around line 51-85)
async function copyAgentFiles(projectPath: string): Promise<void> {
  const agentSourceDir = path.join(__dirname, '../../agent');
  const agentTargetDir = path.join(projectPath, '.opencode', 'agent');
  
  const agentFiles = await fs.readdir(agentSourceDir);
  
  for (const file of agentFiles) {
    if (file.endsWith('.md')) {
      const sourcePath = path.join(agentSourceDir, file);
      const targetPath = path.join(agentTargetDir, file);
      
      await copyFileForOpenCode(sourcePath, targetPath, {
        permissions: '644',
        ensureWritable: true,
        validateAfterCreate: true,
      });
    }
  }
}
```

### Success Criteria:

#### Automated Verification:
- [ ] TypeScript compilation passes: `bun run typecheck`
- [ ] Setup command completes without errors: `codeflow setup ./test-project`
- [ ] All created files have correct permissions: `ls -la test-project/.opencode/agent/`
- [ ] Files are writable by current user: `test -w test-project/.opencode/agent/*.md`

#### Manual Verification:
- [ ] OpenCode can successfully edit files in codeflow-created directories
- [ ] Permission errors no longer occur when OpenCode agents try to modify files
- [ ] Directory structure maintains expected layout and functionality
- [ ] Setup process provides clear feedback on any permission issues

---

## Phase 3: Repair Command for Existing Setups

### Overview
Add command to repair existing codeflow setups that have permission issues preventing OpenCode from editing files.

### Changes Required:

#### 1. Repair Functionality
**File**: `src/cli/repair.ts`
**Changes**: Create new repair command implementation

```typescript
import { join } from 'node:path';
import { promises as fs } from 'node:fs';
import { checkOpenCodeCompatibility } from '../utils/opencodeCompatibility.js';
import { createDirectoryForOpenCode, copyFileForOpenCode } from '../utils/fileOperations.js';

export async function repairCommand(projectPath: string = process.cwd()): Promise<void> {
  console.log(`🔧 Repairing OpenCode compatibility in: ${projectPath}`);
  
  // Check current state
  const compatibility = await checkOpenCodeCompatibility(projectPath);
  
  if (compatibility.compatible) {
    console.log('✅ No repair needed - OpenCode compatibility is already good');
    return;
  }
  
  console.log('🚧 Issues found, attempting repair...');
  
  // Fix directory permissions
  const directories = [
    join(projectPath, '.opencode'),
    join(projectPath, '.opencode', 'agent'),
    join(projectPath, '.opencode', 'command'),
    join(projectPath, '.claude'),
    join(projectPath, '.claude', 'commands'),
  ];
  
  for (const dir of directories) {
    try {
      if (await pathExists(dir)) {
        console.log(`  🔧 Fixing permissions for: ${dir}`);
        await fs.chmod(dir, 0o755);
        
        // Ensure user write access
        const stats = await fs.stat(dir);
        const userWritableMode = stats.mode | 0o200;
        await fs.chmod(dir, userWritableMode);
      }
    } catch (error) {
      console.error(`  ❌ Failed to fix directory ${dir}: ${error.message}`);
    }
  }
  
  // Fix file permissions
  const fileDirs = [
    join(projectPath, '.opencode', 'agent'),
    join(projectPath, '.opencode', 'command'),
    join(projectPath, '.claude', 'commands'),
  ];
  
  for (const dir of fileDirs) {
    try {
      if (await pathExists(dir)) {
        const files = await fs.readdir(dir);
        
        for (const file of files) {
          if (file.endsWith('.md')) {
            const filePath = join(dir, file);
            console.log(`  🔧 Fixing permissions for: ${filePath}`);
            await fs.chmod(filePath, 0o644);
            
            // Ensure user write access
            const stats = await fs.stat(filePath);
            const userWritableMode = stats.mode | 0o200;
            await fs.chmod(filePath, userWritableMode);
          }
        }
      }
    } catch (error) {
      console.error(`  ❌ Failed to fix files in ${dir}: ${error.message}`);
    }
  }
  
  // Verify repair was successful
  const postRepair = await checkOpenCodeCompatibility(projectPath);
  
  if (postRepair.compatible) {
    console.log('✅ Repair successful - OpenCode should now work correctly');
  } else {
    console.log('❌ Repair incomplete - some issues remain:');
    for (const issue of postRepair.issues) {
      console.log(`  - ${issue}`);
    }
  }
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}
```

#### 2. Add Repair Command to CLI
**File**: `src/cli/index.ts`
**Changes**: Add repair command to CLI interface

```typescript
// Add to existing CLI commands
.command('repair [projectPath]')
.description('Repair OpenCode compatibility issues in existing setup')
.action(async (projectPath: string = process.cwd()) => {
  const { repairCommand } = await import('./repair.js');
  await repairCommand(projectPath);
})
```

### Success Criteria:

#### Automated Verification:
- [ ] TypeScript compilation passes: `bun run typecheck`
- [ ] Repair command loads without errors: `codeflow repair --help`
- [ ] Command correctly identifies and fixes permission issues

#### Manual Verification:
- [ ] Repair command successfully fixes existing broken setups
- [ ] OpenCode can edit files after repair command runs
- [ ] Repair provides clear feedback about what was fixed
- [ ] Command safely handles already-correct setups

---

## Phase 4: Enhanced Error Handling & User Feedback

### Overview
Improve setup and repair processes with better error handling and user guidance for permission-related issues.

### Changes Required:

#### 1. Enhanced Setup Error Handling
**File**: `src/cli/setup.ts`
**Changes**: Add comprehensive error handling for permission issues

```typescript
// Add error handling wrapper for setup process
export async function setupCommand(projectPath: string = process.cwd()): Promise<void> {
  try {
    console.log(`🚀 Setting up codeflow in: ${projectPath}`);
    
    // Pre-flight checks
    await validateSetupRequirements(projectPath);
    
    // Main setup process with error recovery
    await performSetup(projectPath);
    
    // Post-setup validation
    await validateSetupSuccess(projectPath);
    
    console.log('✅ Setup complete - OpenCode compatibility verified');
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    
    // Provide helpful guidance based on error type
    if (error.message.includes('permission') || error.message.includes('EACCES')) {
      console.log('\n💡 Permission issue detected. Try:');
      console.log('  1. Run with appropriate permissions');
      console.log('  2. Check directory ownership');
      console.log('  3. Use `codeflow repair` to fix existing setup');
    }
    
    throw error;
  }
}

async function validateSetupRequirements(projectPath: string): Promise<void> {
  // Check if project path is writable
  try {
    await fs.access(projectPath, fs.constants.W_OK);
  } catch {
    throw new Error(`Project directory is not writable: ${projectPath}`);
  }
  
  // Check for conflicting existing setup
  const opencodePath = join(projectPath, '.opencode');
  if (await pathExists(opencodePath)) {
    const compatibility = await checkOpenCodeCompatibility(projectPath);
    if (!compatibility.compatible) {
      console.log('⚠️  Existing setup has OpenCode compatibility issues');
      console.log('   Consider running `codeflow repair` first');
    }
  }
}

async function validateSetupSuccess(projectPath: string): Promise<void> {
  const compatibility = await checkOpenCodeCompatibility(projectPath);
  
  if (!compatibility.compatible) {
    console.log('\n⚠️  Setup completed but OpenCode compatibility issues detected:');
    for (const issue of compatibility.issues) {
      console.log(`  - ${issue}`);
    }
    console.log('\n💡 Run `codeflow repair` to fix these issues');
  }
}
```

### Success Criteria:

#### Automated Verification:
- [ ] TypeScript compilation passes: `bun run typecheck`
- [ ] Setup command handles permission errors gracefully
- [ ] Error messages are informative and actionable

#### Manual Verification:
- [ ] Users receive clear guidance when permission errors occur
- [ ] Setup process validates OpenCode compatibility after completion
- [ ] Error recovery suggestions are helpful and accurate

---

## Testing Strategy

### Unit Tests:
- Permission checking utilities (`opencodeCompatibility.ts`)
- File operation functions (`fileOperations.ts`)
- Setup validation logic
- Error handling paths

### Integration Tests:
- Complete setup process with permission validation
- Repair command on broken setups
- Cross-platform permission handling (macOS/Linux/Windows)

### Manual Testing Steps:
1. **Test normal setup**: Run `codeflow setup` in fresh directory, verify OpenCode can edit files
2. **Test permission issues**: Create directory with restricted permissions, verify setup handles gracefully
3. **Test repair functionality**: Create broken setup, run repair, verify OpenCode compatibility restored
4. **Test diagnostics**: Run diagnose command on various setups, verify accurate reporting
5. **Test with actual OpenCode**: Verify OpenCode agents can successfully edit files after setup/repair

## Performance Considerations

- Permission checks add minimal overhead to setup process
- File-by-file permission setting may be slower than bulk operations, but ensures compatibility
- Validation steps provide early feedback vs. silent failures

## Migration Notes

**For existing projects**: Users should run `codeflow repair` to fix any existing permission issues before expecting OpenCode compatibility.

**Backward compatibility**: New setup process maintains same directory structure and file layout, only changes permissions and metadata handling.

## References

- Original research: `thoughts/research/2025-09-01_opencode-v070-folder-changes-issue.md`
- Current codeflow setup: `src/cli/setup.ts`
- CLI architecture: `src/cli/index.ts`
- Package configuration: `package.json`