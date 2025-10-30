# Agent Permission Templates

This document defines deny-first permission templates for different agent types.

## Template Categories

### 1. Read-Only Analysts (No Modification)

**Use for**: codebase-analyzer, codebase-locator, research-analyzer, research-locator, codebase-pattern-finder

**Permissions:**
```yaml
tools:
  read: true      # Required if grep is enabled (grep reads file contents)
  grep: true
  glob: true
  list: true
  edit: false
  write: false
  bash: false
  patch: false
  webfetch: false # or true for research agents
permission:
  bash: deny
  edit: deny
  write: deny
  patch: deny
  read: allow      # Must be allow if using grep
  grep: allow
  glob: allow
  list: allow
  webfetch: deny   # or allow for research agents
```

**Rationale**: These agents analyze and locate code but never modify it. Deny all write operations and bash execution. Note: `grep` requires `read: allow` to function.

---

### 2. Active Developers (With File Modification)

**Use for**: full-stack-developer, developer, backend-architect, frontend-developer, api-builder

**Permissions:**
```yaml
tools:
  read: true
  write: true
  edit: true
  bash: true
  grep: true
  glob: true
  list: true
  patch: true
permission:
  read: allow
  write: allow
  edit: allow
  bash: allow
  grep: allow
  glob: allow
  list: allow
  patch: allow
  # Deny-first: Sensitive files
  edit:
    "**/*.env*": deny
    "**/*.secret": deny
    "**/*.key": deny
    "**/*.pem": deny
    "**/*.crt": deny
    "**/.git/**": deny
    "**/node_modules/**": deny
    "**/.env": deny
    "**/.env.local": deny
    "**/.env.production": deny
  write:
    "**/*.env*": deny
    "**/*.secret": deny
    "**/*.key": deny
    "**/*.pem": deny
    "**/*.crt": deny
    "**/.git/**": deny
    "**/node_modules/**": deny
    "**/.env": deny
    "**/.env.local": deny
    "**/.env.production": deny
  bash:
    "rm -rf /*": deny
    "rm -rf .*": deny
    ":(){ :|:& };:": deny  # Fork bomb
```

**Rationale**: Active developers need write access but must be blocked from modifying:
- Environment files and secrets
- Git internal files
- Dependency directories
- Certificate/key files
- Dangerous bash commands

---

### 3. Security Auditors (Read-Only + Analysis)

**Use for**: security-scanner, security-auditor, code-reviewer, compliance-expert

**Permissions:**
```yaml
tools:
  read: true
  grep: true
  glob: true
  list: true
  bash: false  # No execution needed
  edit: false
  write: false
  patch: false
permission:
  bash: deny
  edit: deny
  write: deny
  patch: deny
  read: allow
  grep: allow
  glob: allow
  list: allow
```

**Rationale**: Security auditors need to read ALL files (including .env*) to check for exposed secrets, but must not modify anything or execute commands.

---

### 4. Deployment/Infrastructure Agents (Limited Bash)

**Use for**: deployment-engineer, devops-troubleshooter, cloud-architect

**Permissions:**
```yaml
tools:
  read: true
  write: true
  edit: true
  bash: true
  grep: true
  glob: true
  list: true
permission:
  read: allow
  write: allow
  edit: allow
  bash: allow
  grep: allow
  glob: allow
  list: allow
  # Deny-first: Sensitive files
  edit:
    "**/*.env*": deny
    "**/*.secret": deny
    "**/*.key": deny
    "**/.git/**": deny
  write:
    "**/*.env*": deny
    "**/*.secret": deny
    "**/*.key": deny
    "**/.git/**": deny
  # Allow specific bash, deny dangerous
  bash:
    "rm -rf /*": deny
    "rm -rf .*": deny
    "dd if=/dev/zero of=/dev/*": deny
    "mkfs.*": deny
    ":(){ :|:& };:": deny
```

**Rationale**: Infrastructure agents need bash for deployments but must be restricted from:
- Modifying secrets
- Destructive filesystem operations
- Fork bombs and similar attacks

---

### 5. Test/Quality Agents (Write Tests Only)

**Use for**: test-automator, test-generator, quality-testing-performance-tester

**Permissions:**
```yaml
tools:
  read: true
  write: true
  edit: true
  bash: true  # For running tests
  grep: true
  glob: true
  list: true
permission:
  read: allow
  bash: allow  # Allow test execution
  grep: allow
  glob: allow
  list: allow
  # Restrict writes to test directories
  write: allow
  edit: allow
  write:
    "**/*.env*": deny
    "**/*.secret": deny
    "**/.git/**": deny
    "**/node_modules/**": deny
    # Allow test directories
    "**/tests/**": allow
    "**/test/**": allow
    "**/__tests__/**": allow
    "**/*.test.*": allow
    "**/*.spec.*": allow
  edit:
    "**/*.env*": deny
    "**/*.secret": deny
    "**/.git/**": deny
    "**/node_modules/**": deny
    # Allow test directories
    "**/tests/**": allow
    "**/test/**": allow
    "**/__tests__/**": allow
    "**/*.test.*": allow
    "**/*.spec.*": allow
```

**Rationale**: Test agents should primarily write/edit test files, not production code.

---

## Application Strategy

### Phase 1: Core Agents (Completed)
- ✅ codebase-analyzer (read-only analyst)
- ✅ codebase-locator (read-only locator)
- ✅ full-stack-developer (active developer)

### Phase 2: Development Agents (In Progress)
- [ ] developer
- [ ] backend-architect
- [ ] frontend-developer
- [ ] api-builder
- [ ] database-expert

### Phase 3: Security & Quality Agents
- [ ] security-scanner
- [ ] security-auditor
- [ ] code-reviewer
- [ ] test-automator

### Phase 4: Infrastructure Agents
- [ ] deployment-engineer
- [ ] devops-troubleshooter
- [ ] cloud-architect
- [ ] kubernetes-architect

### Phase 5: Specialized Agents
- [ ] All remaining agents in base-agents/

---

## Validation Checklist

For each agent, verify:
- ✅ Permission template matches agent role
- ✅ Sensitive files denied in edit/write
- ✅ Dangerous bash commands denied
- ✅ Tools match permission grants
- ✅ Read-only agents have bash/edit/write denied
- ✅ Active agents have sensitive file denials

---

## Converter Compatibility

The permission format must be compatible with both:
- **OpenCode**: Uses `permission` with glob patterns
- **Claude Code**: Uses `tools` as comma-separated string

Converter handles transformation automatically.

---

**Last Updated**: 2025-10-29
