# Import Candidates from External Repositories



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


Analysis of valuable agents/commands from external repositories to import into codeflow.

## Source Repositories

1. **darrenhinde/opencode-agents** - Security-conscious OpenCode patterns
2. **davepoon/claude-code-subagents-collection** - Large Claude Code agent library (180+ agents)

---

## High Priority Imports

### From darrenhinde/opencode-agents

#### 1. **workflow-orchestrator** (Agent)
**Why**: Intelligent routing agent that analyzes requests and directs to appropriate workflows
- Routes simple tasks (<30 min) to quick workflows
- Routes complex tasks (>30 min) to planning workflows
- Conditional context loading based on request type
- Read-only safety (no bash, no edit)

**Status**: ⭐ HIGH VALUE - We don't have a routing/orchestration agent

#### 2. **task-manager** (Agent)
**Why**: Breaks down complex features into atomic, verifiable subtasks
- Two-phase approval workflow (plan → approve → execute)
- Structured task file creation with templates
- Dependency mapping
- Quality gates

**Status**: ⭐ HIGH VALUE - Better than our current task breakdown approach

#### 3. **image-specialist** (Agent)
**Why**: Handles image processing tasks
**Status**: 🔵 MEDIUM VALUE - Nice to have for multimedia projects

#### 4. **optimize** (Command)
**Why**: Code optimization with flexible $ARGUMENTS pattern
- If $ARGUMENTS: Focus on specified files
- If no arguments: Analyze current context (IDE, git status, git diff)
- Comprehensive fallback logic

**Status**: ⭐ HIGH VALUE - We have /optimize but theirs has better fallback handling

#### 5. **prompt-enhancer** (Command)
**Why**: Executable prompt architect for optimizing prompts
- XML-based optimization
- Target file validation
- Research-backed improvements

**Status**: 🔵 MEDIUM VALUE - Useful for AI-focused workflows

#### 6. **clean** (Command)
**Why**: Repository cleanup utilities
**Status**: 🟢 LOW VALUE - We have similar in /clean-branches

### From davepoon/claude-code-subagents-collection

#### Language Specialists (Add Missing Ones)

**HIGH PRIORITY** (we don't have):
1. ✅ **laravel-vue-developer** - Full-stack Laravel + Vue.js **(IMPORTED)**
2. **drupal-developer** - Drupal CMS specialist
3. **directus-developer** - Headless CMS specialist
4. ✅ **rails-expert** - Ruby on Rails specialist **(IMPORTED)**
5. **game-developer** - Game development (Unity, Unreal)

**SKIP** (we already have):
- python-pro ✅ (we have python-pro)
- golang-pro ✅ (we have golang-pro)
- rust-pro ✅ (we have rust-pro)
- typescript-expert ✅ (we have typescript-pro)

#### Specialized Domains (Unique)

**HIGH PRIORITY**:
1. **crypto-trader** - Cryptocurrency trading strategies
2. **defi-strategist** - DeFi protocol strategies
3. **crypto-analyst** - Crypto market analysis
4. **arbitrage-bot** - Cross-exchange arbitrage
5. **crypto-risk-manager** - Crypto portfolio risk management
6. **docusaurus-expert** - Docusaurus documentation specialist
7. **podcast-manager** - Podcast production and management
8. **legal-advisor** ✅ (we already have)

**MEDIUM PRIORITY**:
9. **academic-researcher** - Academic research synthesis
10. **market-research-analyst** - Market research specialist
11. **business-analyst** ✅ (we already have)

#### Commands (High Value)

**HIGH PRIORITY**:
1. ✅ **add-changelog** - Automated changelog generation **(IMPORTED)**
2. **add-mutation-testing** - Mutation testing setup
3. **add-property-based-testing** - Property-based testing
4. **architecture-review** - Architecture review workflow
5. **architecture-scenario-explorer** - Explore architectural scenarios
6. **business-scenario-explorer** - Business scenario modeling
7. ✅ **bug-fix** - Structured bug fix workflow **(IMPORTED)**
8. **bulk-import-issues** - Bulk GitHub issue import
9. **ci-setup** - CI/CD setup automation
10. **clean-branches** ✅ (we already have)
11. **code-permutation-tester** - Test code permutations
12. **code-to-task** - Convert code to tasks
13. **constraint-modeler** - Model system constraints
14. **containerize-application** - Dockerize application
15. **create-architecture-documentation** - Generate architecture docs
16. **create-database-migrations** ✅ (we have /migrate)
17. **create-jtbd** - Jobs To Be Done framework
18. **create-onboarding-guide** - Onboarding documentation
19. **create-prd** ✅ (we have /project-docs)
20. **cross-reference-manager** - Manage cross-references
21. **debug-error** ✅ (we have /debug)
22. **decision-quality-analyzer** - Analyze decision quality
23. **decision-tree-explorer** - Decision tree exploration
24. **dependency-audit** - Dependency security audit
25. **dependency-mapper** - Map dependencies
26. **design-database-schema** - Database schema design
27. **design-rest-api** - REST API design
28. **digital-twin-creator** - Create digital twins
29. **directory-deep-dive** - Deep directory analysis
30. **e2e-setup** - E2E testing setup
31. **estimate-assistant** - Estimation helper
32. **explain-code** - Code explanation
33. **explain-issue-fix** - Explain issue fixes
34. **fix-github-issue** - GitHub issue fixing workflow
35. **future-scenario-generator** - Generate future scenarios
36. **generate-linear-worklog** - Linear worklog generation
37. **hotfix-deploy** - Hotfix deployment workflow
38. **implement-caching-strategy** - Caching implementation
39. **implement-graphql-api** - GraphQL API implementation
40. **init-project** - Initialize new project
41. **issue-triage** - Issue triage workflow
42. **linear-task-to-issue** - Linear → GitHub sync
43. **load-llms-txt** - Load llms.txt context
44. **market-response-modeler** - Model market responses
45. **memory-spring-cleaning** - Clean up context memory
46. **mermaid** - Mermaid diagram generation
47. **migrate-to-typescript** - TypeScript migration
48. **migration-assistant** - General migration helper
49. **milestone-tracker** - Track milestones
50. **modernize-deps** - Modernize dependencies
51. **optimize-build** - Build optimization
52. **optimize-bundle-size** - Bundle size optimization
53. **optimize-database-performance** - Database optimization
54. **performance-audit** - Performance auditing

---

## Import Strategy

### Phase 1: Critical Agents (Do First)
1. ✅ Import workflow-orchestrator from darrenhinde
2. ✅ Import task-manager from darrenhinde
3. Import 5 language specialists (Laravel/Vue, Drupal, Directus, Rails, Game Dev)
4. Import crypto trading suite (5 agents)

### Phase 2: High-Value Commands (Next)
1. Import architectural commands (architecture-review, scenario-explorer, constraint-modeler)
2. Import testing commands (mutation-testing, property-based-testing, code-permutation)
3. Import quality commands (decision-quality-analyzer, dependency-audit)
4. Import workflow commands (bug-fix, issue-triage, hotfix-deploy)

### Phase 3: Specialized Commands (Later)
1. Import Linear integration commands
2. Import scenario modeling commands
3. Import documentation commands
4. Import optimization commands

---

## Import Checklist

For each imported agent/command:
- [ ] Fetch original content
- [ ] Apply deny-first permission template
- [ ] Update description to match our style
- [ ] Add to appropriate category directory
- [ ] Validate YAML frontmatter
- [ ] Test conversion to Claude Code and OpenCode formats
- [ ] Add to AGENT_REGISTRY.md or command list

---

## Next Steps

1. Create import script to fetch from GitHub
2. Apply permission templates automatically
3. Convert to our base format
4. Validate and test
5. Document in registry

---

**Last Updated**: 2025-10-29
