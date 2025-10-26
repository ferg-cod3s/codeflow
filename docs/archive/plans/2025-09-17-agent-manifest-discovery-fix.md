---
date: 2025-09-17T14:00:00Z
researcher: Assistant
git_commit: $(git rev-parse HEAD)
branch: main
repository: codeflow
topic: 'AGENT_MANIFEST.json Discovery and Copying Fix Implementation Plan'
tags: [implementation, manifest, setup, sync, discovery, copying, cli]
status: completed
last_updated: 2025-09-17 (completed)
last_updated_by: Assistant
---

## Ticket Synopsis

Fix the issue where AGENT_MANIFEST.json is not found when running setup or sync commands from project directories. The problem occurs because the manifest file exists in the codeflow repository root but is expected in the current working directory.

## Summary

The AGENT_MANIFEST.json file is required for sync operations but is only present in the codeflow repository root. When users run setup/sync commands from their project directories, the system cannot find the manifest file. This implementation plan creates automatic manifest discovery and copying functionality to resolve this issue.

## Detailed Analysis

### Current Issues

#### 1. Manifest Location Mismatch
- **Problem**: AGENT_MANIFEST.json exists in codeflow repo root but is expected in process.cwd()
- **Impact**: "Global sync requires AGENT_MANIFEST.json. Run setup first." error
- **Affected Files**: src/cli/sync.ts, src/sync/canonical-syncer.ts, src/conversion/validator.ts

#### 2. Setup Command Incomplete
- **Problem**: setup command creates directories but doesn't copy manifest file
- **Impact**: Users must manually copy AGENT_MANIFEST.json after setup
- **Evidence**: src/cli/setup.ts only creates directories, no manifest copying

#### 3. No Discovery Logic
- **Problem**: No automatic discovery of manifest file from codeflow repository
- **Impact**: Commands fail when run from project directories
- **Evidence**: findCodeflowRoot() exists but isn't used for manifest discovery

## Implementation Plan

### Phase 1: Create Manifest Discovery Utilities
**Duration**: 45 minutes
**Effort**: Medium
**Success Criteria**:
- [ ] Create src/utils/manifest-discovery.ts with findAgentManifest() function
- [ ] Implement upward directory search from process.cwd()
- [ ] Add support for legacy manifest locations
- [ ] Include comprehensive error handling and user-friendly messages

**Implementation Details**:
1. Create manifest-discovery.ts utility module
2. Implement findAgentManifest() function with upward search
3. Add support for .codeflow/AGENT_MANIFEST.json legacy location
4. Add clear error messages for missing manifest scenarios

### Phase 2: Create Manifest Copying Utilities
**Duration**: 30 minutes
**Effort**: Low
**Success Criteria**:
- [ ] Create copyAgentManifest() function in manifest-discovery.ts
- [ ] Implement atomic file copying with error handling
- [ ] Add idempotency checks (don't copy if destination exists and is current)
- [ ] Include file permission preservation

**Implementation Details**:
1. Add copyAgentManifest() function to manifest-discovery.ts
2. Implement atomic copyFileSync with error handling
3. Add destination existence and freshness checks
4. Preserve file permissions during copy

### Phase 3: Update Setup Command
**Duration**: 45 minutes
**Effort**: Medium
**Success Criteria**:
- [ ] Modify src/cli/setup.ts to copy AGENT_MANIFEST.json
- [ ] Use findAgentManifest() to locate source manifest
- [ ] Copy manifest to project root during setup
- [ ] Add error handling for manifest discovery failures

**Implementation Details**:
1. Import manifest discovery utilities in setup.ts
2. Add manifest copying logic to setup() function
3. Handle both global and project setup scenarios
4. Add user-friendly error messages for missing manifest

### Phase 4: Update Sync Command
**Duration**: 60 minutes
**Effort**: Medium
**Success Criteria**:
- [ ] Modify src/cli/sync.ts to use manifest discovery
- [ ] Update canonical-syncer.ts to use discovery utilities
- [ ] Remove hardcoded process.cwd() manifest paths
- [ ] Maintain backward compatibility with existing manifest locations

**Implementation Details**:
1. Update sync.ts to use findAgentManifest() instead of direct path
2. Modify canonical-syncer.ts loadManifest() method
3. Add fallback logic for legacy manifest locations
4. Update error messages to be more helpful

### Phase 5: Update Other Manifest References
**Duration**: 30 minutes
**Effort**: Low
**Success Criteria**:
- [ ] Update src/conversion/validator.ts manifest discovery
- [ ] Update src/cli/validate.ts error messages
- [ ] Update src/sync/file-watcher.ts manifest handling
- [ ] Ensure all manifest references use discovery utilities

**Implementation Details**:
1. Replace hardcoded manifest paths in validator.ts
2. Update error messages in validate.ts
3. Modify file-watcher.ts manifest error handling
4. Test all updated components

### Phase 6: Testing and Verification
**Duration**: 60 minutes
**Effort**: Medium
**Success Criteria**:
- [ ] Create comprehensive tests for manifest discovery
- [ ] Test setup command with manifest copying
- [ ] Test sync command with automatic discovery
- [ ] Verify backward compatibility with existing setups
- [ ] Test error scenarios and user messages

**Implementation Details**:
1. Add unit tests for manifest-discovery.ts
2. Add integration tests for setup and sync commands
3. Test from various directory levels
4. Verify legacy location support
5. Test error handling and user feedback

## Success Criteria

### Automated Verification
- [ ] All phases complete without critical errors
- [ ] Manifest discovery works from any directory level
- [ ] Setup command copies manifest automatically
- [ ] Sync command finds manifest automatically
- [ ] Backward compatibility maintained
- [ ] All tests pass

### Manual Verification
- [ ] Users can run setup/sync from project directories
- [ ] Clear error messages when manifest is missing
- [ ] No breaking changes to existing workflows
- [ ] Performance impact is minimal
- [ ] Documentation updated

## Risk Assessment

### High Risk
- **Breaking existing workflows**: Low risk - backward compatibility maintained
- **Performance impact**: Low risk - discovery is fast, copying is rare

### Medium Risk
- **Complex directory structures**: Medium risk - upward search handles most cases
- **Permission issues**: Medium risk - proper error handling included

### Low Risk
- **File system operations**: Low risk - atomic operations with rollback
- **Cross-platform compatibility**: Low risk - Node.js fs APIs are cross-platform

## Dependencies

### Required
- Node.js fs/promises API (already available)
- Existing findCodeflowRoot() function (already exists)
- AGENT_MANIFEST.json file (already exists)

### Optional
- Enhanced error reporting (can be added later)
- Progress indicators (can be added later)

## Rollback Plan

### Phase Rollback
1. **Phase 1-2**: Delete manifest-discovery.ts file
2. **Phase 3**: Revert setup.ts changes
3. **Phase 4**: Revert sync.ts and canonical-syncer.ts changes
4. **Phase 5**: Revert other file changes
5. **Phase 6**: Remove test files

### Emergency Rollback
- Restore from git backup
- Manual manifest copying as temporary workaround
- Clear any cached discovery results

## Testing Strategy

### Unit Tests
- Manifest discovery from various directory levels
- Copying with different file states
- Error handling for missing files
- Legacy location support

### Integration Tests
- End-to-end setup command execution
- End-to-end sync command execution
- Cross-platform directory structures
- Error scenario handling

### Manual Tests
- Real user workflows from project directories
- Error message clarity and helpfulness
- Performance impact assessment
- Backward compatibility verification

## Documentation Updates

### Code Documentation
- Add JSDoc comments to all new functions
- Update existing function documentation
- Add inline comments for complex logic

### User Documentation
- Update setup command documentation
- Update sync command documentation
- Add troubleshooting section for manifest issues
- Update error message references

## Implementation Timeline

### Phase 1: 45 min - Manifest Discovery Utilities
### Phase 2: 30 min - Manifest Copying Utilities  
### Phase 3: 45 min - Update Setup Command
### Phase 4: 60 min - Update Sync Command
### Phase 5: 30 min - Update Other References
### Phase 6: 60 min - Testing and Verification

**Total Estimated Time**: 5 hours
**Total Estimated Effort**: Medium

## Open Questions

1. Should manifest copying be optional or always happen during setup?
2. What should happen if multiple manifest files are found in the directory tree?
3. Should we add progress indicators for long-running operations?
4. How should we handle manifest file conflicts during copying?
