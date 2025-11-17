# Skills Integration Best Practices

**Date:** 2025-11-17
**Purpose:** Comprehensive guide to integrating skills with commands, agents, MCP tools, and plugins

---

## Executive Summary

This document provides definitive guidance on how skills integrate with the broader CodeFlow ecosystem including commands, agents, MCP servers, and external tools. Skills serve as **persistent context providers** that inject specialized workflow knowledge without triggering responses, enabling sophisticated multi-component orchestration.

### Key Principles

1. **Skills provide context, don't execute actions** - They guide, not do
2. **`noReply: true` is mandatory** - Enables persistent message insertion
3. **MCP integration is automatic** - Skills register as `skills_*` tools
4. **Skills complement, don't duplicate** - Work with agents/commands, don't replace them
5. **Platform agnostic** - One definition works across Claude Code, OpenCode, Cursor, MCP

---

## 1. Understanding Skills Architecture

### 1.1 What Skills Are (and Aren't)

**Skills ARE:**
- ✅ Persistent context providers via `noReply: true`
- ✅ Workflow guidance and best practices repositories
- ✅ MCP-integrated tools (auto-registered as `skills_*`)
- ✅ Reusable knowledge modules for agents and commands
- ✅ External tool workflow documentation (Git, Docker, K8s, etc.)

**Skills ARE NOT:**
- ❌ Agents that execute tasks
- ❌ Commands that orchestrate workflows
- ❌ Response generators (hence `noReply: true`)
- ❌ Standalone executables
- ❌ Replacements for agent capabilities

### 1.2 Skills in the Ecosystem

```
┌─────────────────────────────────────────────────────────────┐
│                     User Request                             │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
        ┌─────────────────────────────┐
        │   Command Invocation         │
        │   (e.g., /debug, /deploy)   │
        └──────────┬──────────────────┘
                   │
                   ├──► Load Skills (persistent context)
                   │    ├─ git-workflow-management
                   │    ├─ docker-container-management
                   │    └─ kubernetes-deployment-automation
                   │
                   ├──► Invoke Agents (execution)
                   │    ├─ debugger
                   │    ├─ performance-engineer
                   │    └─ test-generator
                   │
                   └──► Use MCP Tools (external actions)
                        ├─ sentry_search_issues
                        ├─ playwright_browser_navigate
                        └─ skills_sentry-incident-response
```

**Flow:**
1. User invokes a command (e.g., `/deploy production`)
2. Command loads relevant skills for context (e.g., `kubernetes-deployment-automation`)
3. Skills inject workflow guidance via `noReply: true` (persistent in conversation)
4. Command orchestrates agents (e.g., `deployment-wizard`, `monitoring-expert`)
5. Agents execute tasks using skill context + MCP tools
6. MCP tools perform external actions (API calls, browser automation, etc.)

### 1.3 Platform Integration Model

**Claude Code:**
- Skills location: `.claude/skills/`
- Auto-loaded from directory structure
- Available as context throughout conversation

**OpenCode:**
- Skills location: `.opencode/skills/`
- MCP server integration (registered as `skills_*` tools)
- No separate "skills format" - uses MCP architecture

**Cursor:**
- Skills location: `.cursor/skills/`
- IDE-integrated skill loading
- Context injection for editor suggestions

**MCP Clients (Universal):**
- Skills registered with `skills_` prefix
- Example: `skills_sentry-incident-response`, `skills_docker-container-management`
- Callable like any other MCP tool

---

## 2. Skills + Commands Integration

### 2.1 How Commands Use Skills

Commands **don't call skills explicitly**. Instead, skills provide persistent context that informs command execution.

#### Pattern 1: Implicit Context Loading

**Recommended Approach:**

```yaml
# Command: deploy.md
---
description: Deploy application with comprehensive validation
agent: deployment-wizard
---

Deploy to $ENVIRONMENT using version $VERSION.

This deployment will leverage kubernetes deployment best practices
and container management workflows for production reliability.

[Command template continues...]
```

**Behind the scenes:**
1. Command mentions "kubernetes deployment" and "container management"
2. System (or user) loads relevant skills:
   - `skills_kubernetes-deployment-automation`
   - `skills_docker-container-management`
3. Skills inject context via `noReply: true`
4. Agents executing the command have full workflow guidance available

#### Pattern 2: Explicit Skill Recommendation

**In Command Documentation:**

```markdown
## Recommended Skills

This command works best with the following skills loaded:

- **kubernetes-deployment-automation**: For deployment strategies and best practices
- **git-workflow-management**: For release tagging and version control
- **monitoring-observability-setup**: For post-deployment verification

To load these skills:
1. Ensure skills are in `.claude/skills/` or `.opencode/skills/`
2. Reference them in conversation: "Use kubernetes deployment skill"
3. Skills will provide context throughout the deployment process
```

### 2.2 Command + Skill Synergy Examples

#### Example 1: Deployment Command

**Command:** `/deploy production`

**Skills Loaded:**
1. `kubernetes-deployment-automation` - Deployment strategies (canary, blue-green)
2. `docker-container-management` - Container best practices
3. `git-workflow-management` - Release tagging
4. `monitoring-observability-setup` - Health checks and metrics

**Workflow:**
```
User: /deploy production

System loads skills → Context injected (noReply)

Command execution:
├─ Phase 1: Pre-deployment validation
│  └─ Agents use kubernetes skill context for validation checks
├─ Phase 2: Container build
│  └─ Agents use docker skill context for multi-stage builds
├─ Phase 3: Version tagging
│  └─ Agents use git skill context for semantic versioning
├─ Phase 4: Deploy to k8s
│  └─ Agents use kubernetes skill context for canary strategy
└─ Phase 5: Post-deployment monitoring
   └─ Agents use monitoring skill context for health checks
```

#### Example 2: Debugging Command

**Command:** `/debug "Memory leak in batch processor"`

**Skills Loaded:**
1. `docker-container-management` - Container debugging
2. `performance-testing-workflow` - Profiling techniques
3. `git-workflow-management` - Branch management for fixes

**Workflow:**
```
User: /debug "Memory leak"

Skills provide context:
- Docker skill: How to inspect container memory usage
- Performance skill: Profiling and benchmarking techniques
- Git skill: Hotfix branch workflow

Command orchestrates agents:
├─ debugger: Reproduces issue (uses docker skill context)
├─ performance-engineer: Profiles memory (uses performance skill)
├─ full-stack-developer: Implements fix (uses git skill for branching)
└─ test-generator: Creates regression tests
```

### 2.3 Anti-Patterns to Avoid

❌ **Don't: Explicitly call skills like commands**
```yaml
# WRONG - Skills don't execute
Execute skill: kubernetes-deployment
```

❌ **Don't: Make commands depend on specific skill presence**
```yaml
# WRONG - Command should work without skills
if (skill_kubernetes_loaded) {
  deploy();
}
```

✅ **Do: Design commands to work standalone, better with skills**
```yaml
# CORRECT - Command works alone, enhanced by skills
Deploy to $ENVIRONMENT.

# If kubernetes-deployment skill is loaded:
#   - Uses canary deployment strategy
#   - Implements proper health checks
# Otherwise:
#   - Uses basic rolling deployment
```

---

## 3. Skills + Agents Integration

### 3.1 How Agents Use Skills

Agents **don't invoke skills**. Skills provide persistent context that agents leverage during task execution.

#### Pattern 1: Workflow Guidance

**Skill Context:**
```markdown
# kubernetes-deployment-automation skill

## Canary Deployment Strategy

1. Deploy to 10% of pods
2. Monitor metrics for 5 minutes
3. If healthy, scale to 50%
4. Monitor for 10 minutes
5. If healthy, complete rollout
```

**Agent Execution:**
```
deployment-wizard agent:
- Reads skill context (already in conversation via noReply)
- Implements canary strategy from skill guidance
- Uses specific percentages and timings from skill
- Follows monitoring procedures outlined in skill
```

#### Pattern 2: Best Practices Reference

**Skill Context:**
```markdown
# docker-container-management skill

## Multi-Stage Build Best Practices

- Use alpine base images for production
- Separate builder and runtime stages
- Copy only necessary artifacts
- Run as non-root user
```

**Agent Execution:**
```
full-stack-developer agent:
- Building Dockerfile for new service
- References docker skill context for best practices
- Implements multi-stage build pattern
- Uses alpine images and non-root user per skill guidance
```

### 3.2 Agent + Skill Collaboration Examples

#### Example 1: Security Audit

**Scenario:** Security audit of authentication system

**Skills:**
- `security-audit-workflow` (when implemented)
- `git-workflow-management`

**Agents:**
- `security-auditor` - Primary auditing
- `code-reviewer` - Code quality
- `backend-security-coder` - Security fixes

**Flow:**
```
1. security-audit-workflow skill provides:
   ├─ OWASP Top 10 checklist
   ├─ Authentication best practices
   ├─ Common vulnerability patterns
   └─ Remediation workflows

2. security-auditor agent:
   ├─ Uses skill checklist for systematic audit
   ├─ References vulnerability patterns from skill
   └─ Follows remediation workflow from skill

3. backend-security-coder agent:
   ├─ Implements fixes based on skill best practices
   └─ Uses git skill for hotfix branch workflow
```

#### Example 2: Database Migration

**Scenario:** Zero-downtime database migration

**Skills:**
- `database-migration-workflow` (when implemented)
- `kubernetes-deployment-automation`
- `git-workflow-management`

**Agents:**
- `development-migrations-specialist` - Migration scripts
- `database-expert` - Schema design
- `deployment-wizard` - Rollout orchestration

**Flow:**
```
1. database-migration-workflow skill provides:
   ├─ Zero-downtime migration strategy
   ├─ Backward compatibility requirements
   ├─ Rollback procedures
   └─ Testing checklist

2. development-migrations-specialist agent:
   ├─ Creates migration following skill strategy
   ├─ Ensures backward compatibility per skill
   └─ Implements rollback per skill guidance

3. deployment-wizard agent:
   ├─ Uses kubernetes skill for rolling deployment
   ├─ Uses db migration skill for safe rollout timing
   └─ Uses git skill for version tagging
```

### 3.3 Skills as Agent "Knowledge Base"

**Concept:** Skills serve as persistent knowledge that agents can reference

**Benefits:**
1. **Consistency:** All agents follow same workflows when skill is loaded
2. **Expertise:** Junior agents gain expert-level guidance from skills
3. **Standards:** Skills enforce organizational standards and practices
4. **Reusability:** One skill benefits multiple agents

**Example:**

```markdown
# tdd-workflow-automation skill (when implemented)

## Red-Green-Refactor Cycle

### Phase 1: Red (Write Failing Test)
1. Write minimal test for new functionality
2. Test should fail (no implementation yet)
3. Verify test failure is for correct reason

### Phase 2: Green (Make Test Pass)
1. Write simplest code to make test pass
2. Don't optimize prematurely
3. Verify test passes

### Phase 3: Refactor (Improve Code)
1. Clean up implementation
2. Remove duplication
3. Improve naming and structure
4. Ensure tests still pass
```

**Multiple agents benefit:**
- `test-generator`: Uses cycle for systematic test creation
- `full-stack-developer`: Uses cycle for TDD implementation
- `code-reviewer`: Uses cycle to validate TDD adherence
- `tdd-orchestrator`: Uses cycle to coordinate TDD workflow

---

## 4. Skills + MCP Tools Integration

### 4.1 Skills as MCP Tools

**Automatic Registration:**

Skills are automatically registered as MCP tools with `skills_` prefix:

```yaml
# Skill file: base-skills/mcp/sentry/sentry-incident-response.md
---
name: sentry-incident-response
description: Incident response workflow using Sentry
noReply: true
allowed-tools:
  - sentry_search_issues
  - sentry_get_issue_details
  - sentry_find_teams
---
```

**MCP Registration:**
```
MCP Server: codeflow
Available tools:
├─ skills_sentry-incident-response ← Auto-registered skill
├─ skills_docker-container-management
├─ skills_kubernetes-deployment-automation
└─ ... (other skills)
```

### 4.2 MCP-Integrated Skills Pattern

**Structure:**

```yaml
---
name: playwright-web-automation
description: Browser automation using Playwright
noReply: true
allowed-tools:  ← Specifies required MCP tools
  - playwright_browser_navigate
  - playwright_browser_click
  - playwright_browser_fill
  - playwright_browser_snapshot
metadata:
  category: mcp/playwright
  mcp_server: playwright  ← Indicates MCP dependency
  version: '1.0.0'
---

# Playwright Web Automation Skill

## MCP Tools Used

This skill integrates with Playwright MCP server tools:

- **playwright_browser_navigate**: Navigate to URLs
- **playwright_browser_click**: Click elements
- **playwright_browser_fill**: Fill form fields
- **playwright_browser_snapshot**: Capture page state

## Workflow Patterns

### Pattern 1: Form Automation
1. Navigate to page (`playwright_browser_navigate`)
2. Fill form fields (`playwright_browser_fill`)
3. Submit form (`playwright_browser_click`)
4. Verify success (`playwright_browser_snapshot`)

[Detailed workflow guidance...]
```

### 4.3 Skills Orchestrating MCP Tools

**Skills provide guidance on HOW to use MCP tools:**

```markdown
# sentry-incident-response skill

## Incident Detection Workflow

### Step 1: Search for Recent Issues
Use `sentry_search_issues` with filters:
- Time range: Last 1 hour
- Status: Unresolved
- Sort by: Event count (descending)

### Step 2: Analyze Top Issue
Use `sentry_get_issue_details` for highest volume issue:
- Review stack trace
- Check affected users
- Analyze error patterns

### Step 3: Coordinate Team Response
Use `sentry_find_teams` to identify:
- Owning team based on project
- On-call rotation
- Escalation path

[Detailed procedures...]
```

**Agents then execute:**
```
sentry-incident-commander agent:
1. Loads sentry-incident-response skill (context via noReply)
2. Follows workflow from skill
3. Calls MCP tools in sequence specified by skill:
   - sentry_search_issues(timeRange: "1h", status: "unresolved")
   - sentry_get_issue_details(issueId: top_issue)
   - sentry_find_teams(project: issue_project)
4. Coordinates response using skill guidance
```

### 4.4 MCP Tool + Skill Synergy Examples

#### Example 1: Browser Testing

**MCP Tools:** Playwright server
**Skill:** `playwright-web-automation`
**Agent:** `test-automator`

```
Workflow:
1. Skill provides E2E testing patterns
2. Agent implements tests following skill patterns
3. Agent uses Playwright MCP tools for execution:
   - playwright_browser_navigate(url)
   - playwright_browser_click(selector)
   - playwright_browser_snapshot() → verify state
```

#### Example 2: Incident Management

**MCP Tools:** Sentry server
**Skill:** `sentry-incident-response`
**Agent:** `sentry-incident-commander`

```
Workflow:
1. Skill provides incident response procedures
2. Agent follows procedures from skill
3. Agent uses Sentry MCP tools for data:
   - sentry_search_issues() → find incidents
   - sentry_get_issue_details() → analyze
   - sentry_find_teams() → coordinate
```

---

## 5. Skills + Plugins Integration

### 5.1 Understanding Plugins vs Skills

**Plugins:**
- Extend IDE/editor functionality
- Provide UI enhancements, code completion, etc.
- Execute code transformations
- Language-specific features

**Skills:**
- Provide workflow guidance and context
- MCP-integrated for cross-platform use
- Domain and tool agnostic
- Persistent conversation context

### 5.2 Skills Supporting Plugin Workflows

**Pattern:** Skills provide guidance for plugin-generated code

```markdown
# api-development-workflow skill (when implemented)

## RESTful API Design Standards

### Endpoint Naming
- Use nouns, not verbs: `/users` not `/getUsers`
- Use plural for collections: `/products`
- Use nesting for relationships: `/users/:id/orders`

### HTTP Methods
- GET: Retrieve resources
- POST: Create resources
- PUT: Update entire resource
- PATCH: Partial update
- DELETE: Remove resource

### Response Codes
- 200: Success
- 201: Created
- 400: Bad request
- 404: Not found
- 500: Server error

[Detailed standards...]
```

**Plugin Usage:**
```
IDE Plugin: "Generate REST API endpoint"

1. Plugin generates boilerplate code
2. Skill context provides:
   - Naming conventions to follow
   - HTTP method selection guidance
   - Response code standards
3. Generated code follows skill standards automatically
```

### 5.3 Cross-Platform Skill Usage

**One Skill, Multiple Platforms:**

```
Skill: docker-container-management.md
├─ .claude/skills/ → Claude Code integration
├─ .opencode/skills/ → OpenCode MCP integration
├─ .cursor/skills/ → Cursor IDE integration
└─ MCP Server → Universal tool registration

Same skill file, different platform behaviors:
- Claude Code: Context injection in chat
- OpenCode: MCP tool with noReply persistence
- Cursor: IDE suggestion context
- MCP clients: Callable as skills_docker-container-management
```

---

## 6. Best Practices Summary

### 6.1 Skill Design Principles

#### ✅ DO:

1. **Use `noReply: true` Always**
   ```yaml
   ---
   name: skill-name
   noReply: true  ← REQUIRED
   ---
   ```

2. **Provide Comprehensive Workflows**
   - Multi-phase procedures
   - Step-by-step guidance
   - Best practices and anti-patterns
   - Common troubleshooting scenarios

3. **Specify MCP Tool Requirements**
   ```yaml
   ---
   allowed-tools:
     - tool_name_1
     - tool_name_2
   metadata:
     mcp_server: server-name
   ---
   ```

4. **Design for Reusability**
   - Multiple agents should benefit
   - Multiple commands should benefit
   - Platform-agnostic guidance

5. **Document Integration Points**
   ```markdown
   ## Integration with CodeFlow Agents

   This skill works with:
   - **agent-name-1**: How they collaborate
   - **agent-name-2**: How they collaborate
   ```

6. **Include Practical Examples**
   - Code snippets
   - Command examples
   - Real-world scenarios

#### ❌ DON'T:

1. **Don't Execute Actions**
   - Skills provide context, don't execute
   - Agents execute, skills guide

2. **Don't Duplicate Agent Capabilities**
   - Skills complement agents, don't replace them

3. **Don't Omit `noReply: true`**
   - Skills MUST use `noReply: true` for context injection

4. **Don't Make Skills Too Narrow**
   - Bad: `kubernetes-pod-restart-workflow`
   - Good: `kubernetes-deployment-automation`

5. **Don't Couple to Specific Commands**
   - Skills should be command-agnostic
   - Multiple commands should benefit

### 6.2 Integration Patterns

#### Pattern 1: Command → Skills → Agents

```
User request
    ↓
Command invocation
    ↓
Load relevant skills (context injection)
    ↓
Command orchestrates agents
    ↓
Agents execute using skill context
```

#### Pattern 2: MCP Skills for Tool Workflows

```
Skill defines workflow for MCP tools
    ↓
Agent loads skill context
    ↓
Agent follows workflow from skill
    ↓
Agent calls MCP tools in sequence
    ↓
MCP tools execute external actions
```

#### Pattern 3: Multi-Skill Composition

```
Complex task requiring multiple domains
    ↓
Load multiple complementary skills:
├─ Domain skill (e.g., kubernetes)
├─ Tool skill (e.g., docker)
└─ Process skill (e.g., git-workflow)
    ↓
Agents benefit from all skill contexts
```

### 6.3 Naming Conventions

**Skill Files:**
- Use hyphen-case: `kubernetes-deployment-automation.md`
- Describe domain and purpose: `{domain}-{purpose}-{type}`
- Examples:
  - `git-workflow-management`
  - `database-migration-workflow`
  - `security-audit-workflow`

**MCP Registration:**
- Auto-prefixed with `skills_`
- Hyphen-case preserved
- Examples:
  - `skills_git-workflow-management`
  - `skills_kubernetes-deployment-automation`

**Directory Structure:**
```
base-skills/
├── development/
│   ├── git-workflow-management.md
│   ├── docker-container-management.md
│   └── api-development-workflow.md
├── operations/
│   ├── kubernetes-deployment-automation.md
│   └── monitoring-observability-setup.md
└── mcp/
    ├── sentry/
    │   └── sentry-incident-response.md
    ├── playwright/
    │   └── playwright-web-automation.md
    └── github/
        └── github-workflow-management.md
```

---

## 7. Advanced Integration Patterns

### 7.1 Skill Composition

**Scenario:** Complex deployment requiring multiple domains

```markdown
User: Deploy microservices to production

System loads skill composition:
├─ kubernetes-deployment-automation (deployment strategy)
├─ docker-container-management (container best practices)
├─ git-workflow-management (release tagging)
├─ monitoring-observability-setup (health checks)
└─ database-migration-workflow (zero-downtime migrations)

Command: /deploy production

Agents orchestrated:
├─ deployment-wizard
│   └─ Uses ALL 5 skills for comprehensive deployment
├─ database-expert
│   └─ Primarily uses database-migration skill
├─ monitoring-expert
│   └─ Primarily uses monitoring-observability skill
└─ release-manager
    └─ Primarily uses git-workflow skill

Result: Sophisticated deployment leveraging 5 skill contexts
```

### 7.2 Conditional Skill Loading

**Pattern:** Load skills based on task requirements

```markdown
User: Debug performance issue

System analyzes task:
- Issue type: Performance
- Environment: Containerized
- Language: Node.js

Recommended skills:
├─ performance-testing-workflow (profiling techniques)
├─ docker-container-management (container debugging)
└─ nodejs-performance-optimization (when implemented)

User confirms or system auto-loads
↓
Agents have relevant context for performance debugging
```

### 7.3 Skill Version Management

**Pattern:** Skills evolve, maintain compatibility

```yaml
# kubernetes-deployment-automation.md v2.0
---
name: kubernetes-deployment-automation
version: 2.0.0
deprecated_features:
  - kubectl apply -f (use Helm instead)
new_features:
  - ArgoCD GitOps integration
  - Service mesh (Istio) support
backward_compatible: true
---

## Migration Guide from v1.0

If you're upgrading from v1.0:
1. Replace kubectl apply with Helm charts
2. Consider ArgoCD for GitOps
3. Evaluate service mesh for traffic management

[Rest of skill...]
```

---

## 8. Platform-Specific Considerations

### 8.1 Claude Code Integration

**Skill Loading:**
- Automatic from `.claude/skills/`
- User can explicitly request: "Use kubernetes deployment skill"
- Skills persist throughout conversation

**Best Practices:**
- Organize by domain in subdirectories
- Use clear, descriptive filenames
- Include comprehensive examples

### 8.2 OpenCode MCP Integration

**Skill Registration:**
- Auto-registered as `skills_*` MCP tools
- Callable like any MCP tool
- `noReply: true` respected for context injection

**Configuration:**
```json
{
  "mcp_servers": {
    "codeflow": {
      "command": "npx",
      "args": ["@codeflow/mcp-server"],
      "skills": {
        "auto_register": true,
        "prefix": "skills_"
      }
    }
  }
}
```

### 8.3 Cursor IDE Integration

**Skill Usage:**
- Skills in `.cursor/skills/`
- Provide context for code completion
- Inform IDE suggestions and refactorings

**Example:**
```
User writes: "Create REST API endpoint"

Cursor:
1. Loads api-development-workflow skill (if available)
2. Suggests code following skill standards:
   - Proper HTTP method
   - Standard endpoint naming
   - Correct status codes
```

### 8.4 Generic MCP Client Integration

**Universal Pattern:**
```
Any MCP client:
├─ Connects to codeflow MCP server
├─ Discovers skills_* tools
├─ Can invoke for context injection
└─ Skills work identically across all clients
```

---

## 9. Measuring Skill Effectiveness

### 9.1 Success Metrics

**Quantitative:**
1. **Skill Utilization Rate**
   - How often skills are loaded
   - Which skills are most/least used

2. **Agent Task Success Rate**
   - With vs without skill context
   - Impact on first-time success

3. **Workflow Adherence**
   - How often agents follow skill patterns
   - Deviation from skill best practices

4. **Multi-Domain Task Performance**
   - Tasks using multiple skills
   - Coordination quality

**Qualitative:**
1. **User Satisfaction**
   - Perceived helpfulness
   - Clarity of guidance

2. **Agent Feedback**
   - Do agents reference skill context?
   - How often do agents cite skills?

3. **Workflow Consistency**
   - Standardization across teams
   - Best practice adoption

### 9.2 Optimization Strategies

**Based on Metrics:**

1. **Low utilization skill:**
   - Improve discoverability
   - Better naming/description
   - Add to command recommendations

2. **High utilization, low effectiveness:**
   - Enhance content quality
   - Add more examples
   - Include troubleshooting

3. **Frequent multi-skill usage:**
   - Consider skill composition
   - Create integrated mega-skill
   - Document common combinations

---

## 10. Future Integration Patterns

### 10.1 AI-Powered Skill Selection

**Concept:** Intelligent skill recommendation

```
User: "Deploy to production with monitoring"

AI analyzes request:
- Keywords: deploy, production, monitoring
- Context: Production environment
- Task complexity: High

Recommended skill composition:
├─ kubernetes-deployment-automation (primary)
├─ monitoring-observability-setup (explicitly requested)
├─ git-workflow-management (implicit - releases)
└─ security-audit-workflow (implicit - production)

Auto-load all 4 skills for comprehensive guidance
```

### 10.2 Skill Learning and Evolution

**Concept:** Skills improve based on usage

```
Skill: database-migration-workflow

Usage data:
├─ Frequent issue: Rollback timing unclear
├─ Common deviation: Skipping backward compatibility
└─ Success pattern: Multi-phase rollout

Skill evolution:
├─ Enhanced rollback procedures section
├─ Mandatory backward compatibility checklist
└─ Multi-phase rollout as primary recommendation
```

### 10.3 Cross-Organization Skill Sharing

**Concept:** Skill marketplace

```
Public skills repository:
├─ Community-contributed skills
├─ Verified enterprise skills
├─ Domain-specific skill bundles
└─ Industry-standard workflows

Organizations can:
├─ Import public skills
├─ Customize for internal use
├─ Contribute back improvements
└─ Share privately within organization
```

---

## 11. Troubleshooting Integration Issues

### 11.1 Common Issues

#### Issue 1: Skill Not Providing Context

**Symptom:** Agents don't reference skill guidance

**Causes:**
1. Missing `noReply: true`
2. Skill not properly loaded
3. Skill content not relevant to task

**Solutions:**
```yaml
# Verify noReply is set
---
name: skill-name
noReply: true  ← Must be present and true
---

# Check skill is in correct directory
.claude/skills/domain/skill-name.md
.opencode/skills/domain/skill-name.md

# Verify skill content matches task domain
```

#### Issue 2: MCP Tool Not Found

**Symptom:** Skills reference MCP tools that aren't available

**Causes:**
1. MCP server not configured
2. Tool name mismatch
3. MCP server not running

**Solutions:**
```yaml
# Verify allowed-tools match actual MCP server tools
---
allowed-tools:
  - actual_tool_name  ← Must match exactly
metadata:
  mcp_server: server-name  ← Must be configured
---

# Check MCP server configuration
mcp_servers:
  server-name:
    command: npx
    args: [@server/package]
```

#### Issue 3: Skill Overload

**Symptom:** Too many skills loaded, confusing agents

**Causes:**
1. Loading all skills by default
2. Skills overlap significantly
3. Contradictory guidance

**Solutions:**
1. **Selective Loading:**
   - Only load skills relevant to current task
   - Remove skills when switching contexts

2. **Skill Consolidation:**
   - Merge overlapping skills
   - Create hierarchical skill structure

3. **Skill Prioritization:**
   - Mark primary vs supplementary skills
   - Clear precedence rules

---

## 12. Quick Reference

### 12.1 Skill Template

```yaml
---
name: skill-name
description: Brief description of skill purpose
noReply: true  # REQUIRED
allowed-tools:  # Optional - for MCP integration
  - tool_name_1
  - tool_name_2
metadata:
  category: domain/subdomain
  mcp_server: server-name  # If MCP-integrated
  version: '1.0.0'
  author: 'Team/Individual'
  tags: [tag1, tag2]
---

# Skill Title

## When to Use This Skill

Use this skill when you need to:
- Use case 1
- Use case 2

## Core Capabilities

### Capability 1
- Feature 1
- Feature 2

### Capability 2
- Feature 1
- Feature 2

## Workflow Phases

### Phase 1: Phase Name
1. Step 1
2. Step 2

**Example:**
```bash
# Code example
```

### Phase 2: Phase Name
...

## MCP Tools Used (if applicable)

- **tool_name_1**: Description and usage
- **tool_name_2**: Description and usage

## Integration with Agents

This skill works with:
- **agent-name-1**: How they collaborate
- **agent-name-2**: How they collaborate

## Best Practices

1. Practice 1
2. Practice 2

## Common Issues

### Issue 1
**Solution:** ...

## References

- Link to official docs
- Link to related skills
```

### 12.2 Integration Checklist

**For Skill Authors:**
- [ ] `noReply: true` is set
- [ ] Clear, descriptive name (hyphen-case)
- [ ] Comprehensive workflow documentation
- [ ] Practical code examples
- [ ] MCP tools specified (if applicable)
- [ ] Agent integration points documented
- [ ] Best practices and anti-patterns included
- [ ] Troubleshooting section present
- [ ] Version and metadata complete

**For Command Authors:**
- [ ] Identify relevant skills
- [ ] Document recommended skills
- [ ] Design to work with/without skills
- [ ] Test with skill combinations
- [ ] Document skill synergies

**For Agent Authors:**
- [ ] Understand which skills complement agent
- [ ] Document skill dependencies
- [ ] Reference skills in agent description
- [ ] Test agent with relevant skills loaded

---

## 13. Conclusion

Skills are **persistent context providers** that enable sophisticated multi-component orchestration across commands, agents, MCP tools, and platforms. By following the integration patterns and best practices in this guide, you can create a cohesive ecosystem where:

- **Commands** orchestrate workflows
- **Skills** provide expert guidance
- **Agents** execute tasks
- **MCP tools** perform external actions
- **Everything works together** seamlessly

### Key Takeaways

1. **Skills don't execute, they guide** - Use `noReply: true` for context
2. **Integration is implicit, not explicit** - Skills provide background knowledge
3. **MCP is the universal layer** - Same skill works everywhere via MCP
4. **Composition is powerful** - Multiple skills multiply effectiveness
5. **Design for reusability** - One skill benefits many agents/commands

### Next Steps

1. **Create high-priority skills** (see SKILLS_RESEARCH.md)
2. **Enhance existing commands** to reference skills
3. **Document agent-skill relationships** in agent definitions
4. **Build MCP-integrated skills** for tool workflows
5. **Measure and iterate** based on usage patterns

---

**Document Version:** 1.0
**Last Updated:** 2025-11-17
**Related Documents:**
- SKILLS_RESEARCH.md - Comprehensive skills analysis and roadmap
- COMMANDS_OPENCODE_COMPLIANCE.md - Command format compliance
- AGENTS.md - Complete agent inventory
