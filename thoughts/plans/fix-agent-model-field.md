# Fix Agent Model Field ProviderModelNotFoundError Implementation Plan

## Overview

Fix the `ProviderModelNotFoundError` occurring when invoking agents by correcting the model field from `opencode/grok-code-fast` to `opencode/grok-code` across all agent formats. This affects 14 agents and requires updates to base, claude, and opencode formats for consistency.

## Current State Analysis

### Key Discoveries:

- **14 agents affected**: full-stack-developer, code-reviewer, performance-engineer, api-builder, database-expert, analytics-engineer, system-architect, development-migrations-specialist, accessibility-pro, quality-testing-performance-tester, programmatic-seo-engineer, deployment-wizard, infrastructure-builder, monitoring-expert
- **Multiple formats impacted**: base (`codeflow-agents/`), claude (`claude-agents/`), opencode (`opencode-agents/`), plus backup and test directories
- **Root cause**: Model field references `opencode/grok-code-fast` which doesn't exist; correct model is `opencode/grok-code`
- **Existing patterns**: Bulk update scripts exist in `scripts/` directory that can be used as templates

### Affected Files by Format:

- **Base format**: 14 files in `codeflow-agents/` (source of truth)
- **Claude format**: 14 files in `claude-agents/`
- **OpenCode format**: 14 files in `opencode-agents/` and `.opencode/agent/`
- **Backup/Test**: Additional copies in backup and test directories

## Desired End State

All agent files reference the correct model `opencode/grok-code`, agent invocations work without `ProviderModelNotFoundError`, and all formats are synchronized.

### Verification Criteria:

- All 14 affected agents can be invoked successfully
- `codeflow validate` passes without model-related errors
- `codeflow convert-all` completes successfully
- No agents reference `opencode/grok-code-fast`

## What We're NOT Doing

- Not modifying agents that already use correct model
- Not changing other agent fields (permissions, tools, descriptions)
- Not updating deprecated agents unless actively used
- Not modifying the model registry itself (only agent definitions)

## Implementation Approach

Use existing bulk update patterns from `scripts/` directory to create a targeted script that updates model fields across all formats, then validate and convert to ensure consistency.

## Phase 1: Create Bulk Update Script

### Overview

Create a script to update model fields from `opencode/grok-code-fast` to `opencode/grok-code` across all agent formats.

### Changes Required:

#### 1. Create `scripts/fix-agent-model-field.js`

**File**: `scripts/fix-agent-model-field.js`
**Changes**: New script based on existing bulk update patterns

```javascript
#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { existsSync } from 'node:fs';

const OLD_MODEL = 'opencode/grok-code-fast';
const NEW_MODEL = 'opencode/grok-code';

async function fixModelField(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n');

    // Check if file starts with frontmatter
    if (lines[0] !== '---') {
      console.log(`Skipping ${filePath} - no frontmatter`);
      return false;
    }

    // Find end of frontmatter
    let frontmatterEndIndex = -1;
    for (let i = 1; i < lines.length; i++) {
      if (lines[i] === '---') {
        frontmatterEndIndex = i;
        break;
      }
    }

    if (frontmatterEndIndex === -1) {
      console.log(`Skipping ${filePath} - malformed frontmatter`);
      return false;
    }

    // Check if model field exists and needs updating
    let modified = false;
    for (let i = 1; i < frontmatterEndIndex; i++) {
      const line = lines[i].trim();
      if (line === `model: ${OLD_MODEL}`) {
        lines[i] = `model: ${NEW_MODEL}`;
        modified = true;
        console.log(`✅ Updated model in ${path.basename(filePath)}`);
        break;
      }
    }

    if (modified) {
      const updatedContent = lines.join('\n');
      await fs.writeFile(filePath, updatedContent, 'utf-8');
      return true;
    }

    return false;
  } catch (error) {
    console.error(`❌ Failed to update ${filePath}: ${error.message}`);
    return false;
  }
}

async function processDirectory(dirPath) {
  if (!existsSync(dirPath)) {
    console.log(`Directory not found: ${dirPath}`);
    return 0;
  }

  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  let updatedCount = 0;

  for (const entry of entries) {
    if (entry.isDirectory()) {
      // Recursively process subdirectories
      const subUpdated = await processDirectory(path.join(dirPath, entry.name));
      updatedCount += subUpdated;
    } else if (entry.isFile() && entry.name.endsWith('.md') && !entry.name.startsWith('README')) {
      // Process agent files
      const updated = await fixModelField(path.join(dirPath, entry.name));
      if (updated) updatedCount++;
    }
  }

  return updatedCount;
}

async function main() {
  const codeflowRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
  const agentDirectories = [
    path.join(codeflowRoot, 'codeflow-agents'),
    path.join(codeflowRoot, 'claude-agents'),
    path.join(codeflowRoot, 'opencode-agents'),
    path.join(codeflowRoot, '.opencode', 'agent'),
    path.join(codeflowRoot, 'backup', 'duplicates'),
    path.join(codeflowRoot, 'test-setup', '.opencode', 'agent'),
    path.join(codeflowRoot, 'deprecated', 'claude-agents'),
    path.join(codeflowRoot, 'deprecated', 'opencode-agents'),
  ];

  console.log('🔧 Fixing agent model field from grok-code-fast to grok-code...');
  console.log(`📝 Changing model: ${OLD_MODEL} → ${NEW_MODEL}\n`);

  let totalUpdated = 0;

  for (const dir of agentDirectories) {
    console.log(`📁 Processing directory: ${dir}`);
    const updated = await processDirectory(dir);
    console.log(`   Updated ${updated} files in this directory\n`);
    totalUpdated += updated;
  }

  console.log(`✅ Complete! Updated model field in ${totalUpdated} agent files.`);

  if (totalUpdated > 0) {
    console.log('\n📋 Next steps:');
    console.log('1. Run: codeflow validate');
    console.log('2. Run: codeflow convert-all');
    console.log('3. Test agent invocation: codeflow pull . && test affected agents');
  }
}

main().catch(console.error);
```

### Success Criteria:

#### Automated Verification:

- [ ] Script runs without errors
- [ ] Script reports correct number of files updated (56 total across all formats)
- [ ] No files are corrupted during update

#### Manual Verification:

- [ ] Check sample files to confirm model field was updated correctly
- [ ] Verify script handles malformed frontmatter gracefully

---

## Phase 2: Update Base Agent Format

### Overview

Update the source of truth in `codeflow-agents/` directory first.

### Changes Required:

#### 1. Run Script on Base Agents

**Command**: `node scripts/fix-agent-model-field.js`
**Target**: `codeflow-agents/` directory
**Expected**: Updates 14 base agent files

### Success Criteria:

#### Automated Verification:

- [ ] All 14 base agent files have correct model field
- [ ] `codeflow validate` passes for base agents

#### Manual Verification:

- [ ] Spot check 2-3 base agent files for correct model field

---

## Phase 3: Convert and Validate

### Overview

Run conversion and validation to propagate changes to all formats.

### Changes Required:

#### 1. Validate Base Agents

**Command**: `codeflow validate`
**Expected**: No model-related validation errors

#### 2. Convert All Formats

**Command**: `codeflow convert-all`
**Expected**: All formats updated with correct model field

#### 3. Validate All Formats

**Command**: `codeflow validate`
**Expected**: All formats pass validation

### Success Criteria:

#### Automated Verification:

- [ ] `codeflow validate` passes without errors
- [ ] `codeflow convert-all` completes successfully
- [ ] No model field references `opencode/grok-code-fast`

#### Manual Verification:

- [ ] Check converted files in claude-agents/ and opencode-agents/
- [ ] Verify model field consistency across formats

---

## Phase 4: Update Manifest

### Overview

Ensure `AGENT_MANIFEST.json` reflects the correct model usage.

### Changes Required:

#### 1. Check Manifest

**File**: `AGENT_MANIFEST.json`
**Action**: Verify no agents reference incorrect model in manifest

#### 2. Update if Needed

**File**: `AGENT_MANIFEST.json`
**Changes**: Update `last_updated` timestamp if any changes made

### Success Criteria:

#### Automated Verification:

- [ ] Manifest validation passes
- [ ] No agents in manifest reference incorrect model

#### Manual Verification:

- [ ] Review manifest for affected agents

---

## Phase 5: Test and Verify

### Overview

Test agent invocation to confirm the error is resolved.

### Changes Required:

#### 1. Pull Agents to Project

**Command**: `codeflow pull .`
**Expected**: Updated agents available in project

#### 2. Test Affected Agents

**Command**: Test invocation of full-stack-developer and code-reviewer agents
**Expected**: No `ProviderModelNotFoundError`

### Success Criteria:

#### Automated Verification:

- [ ] Agent invocation commands complete without errors
- [ ] No `ProviderModelNotFoundError` in logs

#### Manual Verification:

- [ ] Test 2-3 affected agents manually
- [ ] Verify agents respond correctly to prompts
- [ ] Check that other agents still work (regression test)

## Testing Strategy

### Unit Tests:

- Test the bulk update script with mock agent files
- Verify script handles edge cases (malformed frontmatter, missing model field)
- Test script on single file before running on all files

### Integration Tests:

- Run `codeflow validate` after each phase
- Test agent invocation after Phase 5
- Verify conversion works correctly

### Manual Testing Steps:

1. Create backup of affected directories before running script
2. Run script on test directory first
3. Verify model field changes in sample files
4. Run full validation and conversion
5. Test agent invocation with corrected model

## Performance Considerations

- Script processes ~56 files across multiple directories
- Each file read/write operation is small (< 10KB)
- Total execution time should be < 5 seconds
- No performance impact on agent runtime after fix

## Migration Notes

- This is a non-breaking change - only corrects invalid model reference
- No data migration needed
- Agents will work immediately after model field correction
- No rollback needed if issues occur (can re-run script)

## References

- Original research: `thoughts/research/YYYY-MM-DD_provider-model-error-research.md`
- Affected agents list: From codebase-locator analysis
- Bulk update patterns: `scripts/update-agent-directories.js`, `scripts/fix-opencode-naming.js`
- Agent manifest: `AGENT_MANIFEST.json`
