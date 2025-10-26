---
title: Codeflow - API Documentation
type: api
version: 1.0.0
date: 2025-09-24
status: draft
---

## 1. Overview

The Codeflow CLI serves as the primary API for managing AI agents, commands, and automation workflows. Each CLI command functions as an API endpoint with defined parameters, options, and return values. This documentation provides a comprehensive reference for developers integrating with or extending Codeflow.

## 2. API Architecture

### 2.1. Interface Type

- **Type**: Command Line Interface (CLI)
- **Protocol**: Local process execution
- **Authentication**: None required (local system access)
- **Rate Limiting**: None (local execution)

### 2.2. Data Formats

- **Input**: Command-line arguments and options
- **Output**: Structured text (human-readable)
- **Errors**: Standard error streams with exit codes
- **Future**: JSON output support planned

### 2.3. Versioning

- **Version Format**: Semantic versioning (e.g., 0.10.8)
- **Compatibility**: Backward compatible within major versions
- **Deprecation**: Announced in changelog, removed in next major version

## 3. Core Endpoints

### 3.1. Setup Endpoint

**Endpoint:** `codeflow setup`

**Purpose:** Initialize Codeflow directory structure and copy agents/commands to a project.

**HTTP Equivalent:** `POST /projects/{project-path}/setup`

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `project-path` | string | No | Path to target project directory |

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--help` | boolean | false | Show help information |

#### Request Example

```bash
codeflow setup ./my-project
```

#### Response

**Success (Exit Code: 0):**
```
Setting up Codeflow in ./my-project...
✓ Created .opencode/ directory
✓ Copied 25 agents
✓ Copied 8 commands
✓ Setup complete
```

**Error (Exit Code: 1):**
```
Error: Permission denied
Please check directory permissions and try again.
```

#### Error Codes

- `0`: Success
- `1`: General error
- `2`: Invalid arguments

### 3.2. Status Endpoint

**Endpoint:** `codeflow status`

**Purpose:** Check synchronization status of agents and commands in a project.

**HTTP Equivalent:** `GET /projects/{project-path}/status`

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `project-path` | string | No | Path to target project directory |

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--help` | boolean | false | Show help information |

#### Request Example

```bash
codeflow status ./my-project
```

#### Response

**Success (Exit Code: 0):**
```
Codeflow Status for ./my-project:
✅ Up-to-date: 28 files
⚠️  Outdated: 3 files
❌ Missing: 2 files

Run 'codeflow sync' to update outdated files.
```

#### Response Schema

```json
{
  "project_path": "./my-project",
  "status": {
    "up_to_date": 28,
    "outdated": 3,
    "missing": 2
  },
  "suggestions": ["Run 'codeflow sync' to update"]
}
```

### 3.3. Sync Endpoint

**Endpoint:** `codeflow sync`

**Purpose:** Synchronize project agents and commands with global configuration.

**HTTP Equivalent:** `POST /projects/{project-path}/sync`

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `project-path` | string | No | Path to target project directory |

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--help` | boolean | false | Show help information |
| `--force` | boolean | false | Force overwrite without confirmation |

#### Request Example

```bash
codeflow sync ./my-project
```

#### Response

**Success (Exit Code: 0):**
```
Synchronizing ./my-project...
✓ Updated 3 files
✓ Added 2 files
✓ Synchronization complete
```

### 3.4. Convert Endpoint

**Endpoint:** `codeflow convert`

**Purpose:** Convert agent definitions between different platform formats.

**HTTP Equivalent:** `POST /agents/convert`

#### Parameters

None (options-based)

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--from` | string | auto | Source format (claude, opencode, base) |
| `--to` | string | auto | Target format (claude, opencode, base) |
| `--help` | boolean | false | Show help information |

#### Request Example

```bash
codeflow convert --from claude --to opencode
```

#### Response

**Success (Exit Code: 0):**
```
Converting agents from claude to opencode format...
✓ Converted 25 agents
✓ Validation passed
✓ Conversion complete
```

### 3.5. Watch Endpoint

**Endpoint:** `codeflow watch start`

**Purpose:** Start automatic file watching and synchronization.

**HTTP Equivalent:** `POST /watch/start`

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `project-path` | string | No | Path to monitor |

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--help` | boolean | false | Show help information |

#### Request Example

```bash
codeflow watch start ./my-project
```

#### Response

**Success (Exit Code: 0):**
```
Starting file watcher for ./my-project...
✓ Watcher active
Monitoring for changes...
```

### 3.6. Commands Endpoint

**Endpoint:** `codeflow commands`

**Purpose:** List all available slash commands and their descriptions.

**HTTP Equivalent:** `GET /commands`

#### Parameters

None

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--help` | boolean | false | Show help information |

#### Request Example

```bash
codeflow commands
```

#### Response

**Success (Exit Code: 0):**
```
Available Commands:

Research & Analysis:
  /research - Comprehensive codebase analysis
  /analyze - Deep code analysis and insights

Planning & Design:
  /plan - Create detailed implementation plans
  /design - System and architecture design

Implementation:
  /execute - Implement planned features
  /code - Generate and modify code

Quality Assurance:
  /test - Generate comprehensive test suites
  /review - Code review and validation

Documentation:
  /document - Create user guides and API docs
  /readme - Generate README files

Operations:
  /commit - Create structured git commits
  /deploy - Deployment and release management
```

## 4. Error Handling

### 4.1. Exit Codes

| Code | Meaning | Retryable | Description |
|------|---------|-----------|-------------|
| `0` | Success | No | Command completed successfully |
| `1` | General Error | Yes | Unexpected error occurred |
| `2` | Invalid Usage | No | Invalid arguments or options |
| `127` | Command Not Found | No | CLI command not found |

### 4.2. Error Response Format

**Standard Error Output:**
```
Error: [Error Type]
[Descriptive message]
[Suggestion for resolution]
```

**Example:**
```
Error: Permission denied
Unable to write to directory /protected/path
Please check permissions or specify a different path.
```

### 4.3. Common Error Scenarios

#### Permission Errors
```
Error: Permission denied
Path: /protected/project
Solution: Check directory permissions or run with appropriate privileges
```

#### Invalid Arguments
```
Error: Invalid project path
Path: nonexistent/directory
Solution: Verify the project path exists and is accessible
```

#### Network Errors
```
Error: Network connection failed
Unable to download updates
Solution: Check internet connection and try again
```

## 5. Authentication & Authorization

### 5.1. Authentication

- **Type**: None required
- **Rationale**: Local CLI tool with system-level access control
- **Security**: Relies on operating system user permissions

### 5.2. Authorization

- **Model**: File system permissions
- **Scopes**: Read/write access to project directories
- **Validation**: Checked at command execution time

## 6. Usage Examples

### 6.1. Project Setup

```bash
# Initialize new project
codeflow setup ~/projects/my-app

# Setup with specific path
codeflow setup --project-path /workspace/codeflow-project
```

### 6.2. Status Checking

```bash
# Check current project status
codeflow status .

# Check specific project
codeflow status ~/projects/legacy-app
```

### 6.3. Synchronization

```bash
# Sync current directory
codeflow sync

# Force sync without prompts
codeflow sync --force ~/projects/my-app
```

### 6.4. Format Conversion

```bash
# Convert from Claude to OpenCode
codeflow convert --from claude --to opencode

# Auto-detect formats
codeflow convert
```

### 6.5. File Watching

```bash
# Start watching current project
codeflow watch start

# Watch specific project
codeflow watch start ~/projects/my-app
```

### 6.6. Command Discovery

```bash
# List all available commands
codeflow commands
```

## 7. SDK & Integration

### 7.1. Programmatic Usage

```bash
# Use in scripts
#!/bin/bash
codeflow setup "$PROJECT_PATH" || exit 1
codeflow sync "$PROJECT_PATH"

# Check exit codes
if codeflow status "$PROJECT_PATH" > /dev/null 2>&1; then
    echo "Project is up to date"
else
    echo "Project needs synchronization"
fi
```

### 7.2. CI/CD Integration

```yaml
# GitHub Actions example
- name: Setup Codeflow
  run: codeflow setup .

- name: Sync Agents
  run: codeflow sync .

- name: Check Status
  run: codeflow status .
```

### 7.3. IDE Integration

```json
// VS Code tasks.json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Codeflow Setup",
      "type": "shell",
      "command": "codeflow",
      "args": ["setup", "."],
      "group": "build"
    }
  ]
}
```

## 8. Performance Characteristics

### 8.1. Response Times

- **Setup**: < 30 seconds for typical projects
- **Status**: < 5 seconds
- **Sync**: < 10 seconds for small changes
- **Convert**: < 15 seconds for full conversion

### 8.2. Resource Usage

- **Memory**: < 100MB for most operations
- **CPU**: Minimal usage, single-threaded
- **Disk**: Read/write access to project directories

### 8.3. Scalability Limits

- **Project Size**: Tested with projects up to 10,000 files
- **Agent Count**: Supports 100+ agents
- **Concurrent Operations**: Single operation per user

## 9. Versioning & Compatibility

### 9.1. Version Checking

```bash
codeflow --version
# Output: 0.10.8
```

### 9.2. Compatibility Matrix

| CLI Version | Agent Format | Command Format | Compatibility |
|-------------|--------------|----------------|----------------|
| 0.10.x | Base v1 | YAML v1 | Full |
| 0.9.x | Legacy | Legacy | Deprecated |

### 9.3. Migration Guide

#### Upgrading from 0.9.x

1. Backup existing configurations
2. Run `codeflow setup` to migrate to new format
3. Update any custom scripts to use new command syntax
4. Test workflows in development environment

## 10. Testing & Validation

### 10.1. Command Testing

```bash
# Test command availability
codeflow --help

# Test specific command
codeflow setup --help

# Validate exit codes
codeflow invalid-command
echo $?  # Should be 127
```

### 10.2. Integration Testing

```bash
# Test full workflow
codeflow setup test-project
codeflow status test-project
codeflow sync test-project
codeflow commands
```

### 10.3. Error Testing

```bash
# Test invalid arguments
codeflow setup /nonexistent/path

# Test permission errors
codeflow setup /root/protected
```

## 11. Security Considerations

### 11.1. Input Validation

- All file paths validated before use
- Command arguments sanitized
- Unknown options rejected

### 11.2. File System Security

- Operations respect file system permissions
- No elevation of privileges
- Safe handling of symbolic links

### 11.3. Data Protection

- No sensitive data stored in plain text
- Configuration files use appropriate permissions
- Temporary files cleaned up properly

## 12. Future Enhancements

### 12.1. Planned Features

- **JSON Output**: `--json` flag for machine-readable responses
- **REST API**: HTTP interface for remote access
- **WebSocket Support**: Real-time notifications
- **Plugin System**: Extensible command architecture

### 12.2. Backward Compatibility

- All changes will maintain backward compatibility
- Deprecation warnings for removed features
- Migration tools for major version upgrades

---

**Document Control**

- **Version**: 1.0.0
- **Last Updated**: 2025-09-24
- **Next Review**: 2025-12-24
- **Approved By**: [TBD]
