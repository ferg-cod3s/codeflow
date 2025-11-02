# OpenCode Agent Permissions Setup



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


This document describes the implementation of proper permissions for OpenCode agents during sync-global and setup operations.

## Overview

The Codeflow system now automatically sets appropriate OS-level file permissions and OpenCode runtime permissions when agents are created or synced. This ensures:

1. **OS Security**: Files have appropriate read/write permissions
2. **OpenCode Integration**: Agents have proper runtime permission configurations
3. **Inheritance**: Primary/subagent permission differentiation
4. **Repository Overrides**: Project-specific permission customization

## Implementation

### Files Modified

- `src/security/opencode-permissions.ts` - New permission configuration system
- `src/security/validation.ts` - Added permission setting functions
- `src/cli/sync.ts` - Updated to apply OpenCode permissions during sync-global
- `src/cli/setup.ts` - Updated to apply OpenCode permissions during setup
- `src/cli/convert.ts` - Updated to apply permissions after agent conversion
- `src/cli/sync-formats.ts` - Updated to apply permissions after format synchronization
- `src/cli/pull.ts` - Updated to apply permissions after pulling agents to projects

### Key Features

#### 1. Permission Configuration

```typescript
interface OpenCodePermissionConfig {
  osPermissions: {
    directories: number; // e.g., 0o755
    agentFiles: number; // e.g., 0o644
    commandFiles: number; // e.g., 0o755
  };
  runtimePermissions: {
    primary: {
      edit: 'allow' | 'ask' | 'deny';
      bash: 'allow' | 'ask' | 'deny';
      webfetch: 'allow' | 'ask' | 'deny';
    };
    subagent: {
      edit: 'ask' | 'deny';
      bash: 'ask' | 'deny';
      webfetch: 'allow';
    };
  };
  defaultAllowedDirectories: string[];
}
```

#### 2. Automatic Permission Application

- **sync-global**: Applies permissions to all synced OpenCode agents
- **setup**: Applies permissions to agents created in OpenCode projects
- **convert**: Applies permissions to converted OpenCode agents
- **sync-formats**: Applies permissions to synchronized agent formats
- **pull**: Applies permissions to pulled agents in project directories
- **Inheritance**: Primary agents get broader permissions than subagents

#### 3. OpenCode Integration

When syncing OpenCode agents, the system automatically:

1. Sets OS file permissions using `chmod`
2. Updates agent frontmatter with `allowed_directories`
3. Adds `permission` fields for runtime control

## Usage

### For Developers

The permission system works automatically. No manual configuration is needed for basic usage.

### For Advanced Configuration

Create `.opencode/permissions.json` in your repository:

```json
{
  "osPermissions": {
    "directories": "0o750",
    "agentFiles": "0o640",
    "commandFiles": "0o750"
  },
  "runtimePermissions": {
    "primary": {
      "edit": "allow",
      "bash": "ask",
      "webfetch": "allow"
    },
    "subagent": {
      "edit": "ask",
      "bash": "deny",
      "webfetch": "allow"
    }
  },
  "defaultAllowedDirectories": [
    "/path/to/project",
    "/path/to/project/src",
    "/path/to/project/tests"
  ]
}
```

## Security Benefits

1. **Defense in Depth**: Both OS-level and runtime permission controls
2. **Principle of Least Privilege**: Subagents have restricted permissions
3. **Audit Trail**: Permission changes are logged
4. **Repository Isolation**: Each project can have custom permission policies

## Testing

Run the permission system tests:

```bash
bun test tests/integration/opencode-permissions.test.ts
```

## Troubleshooting

### Permission Denied Errors

If you see permission errors:

1. Check that the process has write access to target directories
2. Verify that `.opencode/permissions.json` doesn't have overly restrictive settings
3. Ensure the user running Codeflow has appropriate OS permissions

### OpenCode Runtime Issues

If OpenCode agents don't work as expected:

1. Check that `allowed_directories` includes the correct paths
2. Verify `permission` fields are set correctly in agent frontmatter
3. Ensure OpenCode is configured to use the updated agents

## Future Enhancements

- **Permission Validation**: Add validation to ensure permission consistency
- **Permission Migration**: Tools to migrate existing agents to new permission system
- **Advanced Policies**: Support for more granular permission controls
- **Audit Reports**: Generate reports on permission usage and changes
