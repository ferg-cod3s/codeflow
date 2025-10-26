# Command Prompt Optimization Implementation Plan

## Overview

This plan defines a structured, measurable optimization initiative for the 7 CodeFlow workflow command prompts:
`commit.md`, `document.md`, `execute.md`, `plan.md`, `research.md`, `review.md`, `test.md`.

Goals:

- Increase clarity, consistency, and reliability of command behavior
- Reduce unnecessary token usage (prompt bloat) while preserving rigor
- Standardize success criteria, interaction patterns, and error handling
- Improve tool usage efficiency and ordering (especially locator → analyzer discipline)
- Introduce structured, parse-friendly output segments to enable downstream automation
- Add explicit failure-mode guidance and edge case handling across commands
- **Implement intelligent prompt/context caching mechanisms for optimal performance**

The optimization is organized into phases to minimize regression risk and enable before/after performance measurement.

## Current State Analysis

### Strengths (Cross-Command)

- Clear high-level intent per command
- Some commands (plan, research) already enforce disciplined ordering of sub-agent usage
- Includes strong templates (plan, research, review reports, documentation variants)
- Encourages skeptical, iterative collaboration (plan, research)
- Explicit mismatch handling pattern present in `execute.md`

### Weaknesses & Gaps by Command

1. commit.md

- No guidance on multi-line body formatting (e.g., wrapped summary + rationale + scope)
- No validation checklist (commitlint / conventional style referencing)
- Missing handling of: large diffs, binary files, partial staging, generated files, secrets scan
- Lacks explicit failure/retry handling (pre-commit hooks, conflicts)
- No structured output section for proposed plan vs executed commits

2. document.md

- Audience selection logic is implicit; does not support multi-audience fusion cleanly
- Lacks guidance for extracting accurate code/API signatures automatically
- Missing verification loop (e.g., re-run examples or lint code snippets)
- No doc status taxonomy (draft, complete, needs-review)
- No error handling for missing plan / missing files / stale plan vs code divergence

3. execute.md

- Does not enumerate required pre-flight verification (clean working tree? dependency install?)
- No explicit tooling boundaries (when to spawn locators vs rely on plan context)
- Missing rollback / revert strategy if partial failure occurs
- No structured progress reporting format (phase checkpoints with status codes)
- Lacks environmental / test isolation reminders

4. plan.md

- Very long; risk of cognitive overload and token inefficiency
- Repetition (read files fully instructions repeated) could be modularized
- Missing explicit risk register, dependency mapping, rollback strategies section
- Success criteria examples partially mismatch repo conventions (uses `turbo` vs `bun` in this codebase)
- Lacks explicit plan versioning & change tracking metadata

5. research.md

- Typographical issues ("provider", "appropirate") reduce perceived quality
- Numbering inconsistencies (metadata step numbering gap)
- No explicit guard for absent ticket file or ambiguous scope
- Lacks a cap or heuristic on task spawning to prevent explosion
- Missing structured output markers to separate summary vs detailed evidence for downstream reuse

6. review.md

- Refers to `/implement_plan` but command file is `execute.md` (naming inconsistency)
- Missing diff scoping guidance (choose correct commit range)
- No explicit test coverage delta analysis step
- Lack of severity taxonomy (info / warning / required fix)
- No structured automated vs manual validation output schema beyond template

7. test.md

- Missing deterministic test guidance (random seeds, isolation)
- No coverage threshold or fallback guidance if coverage tools absent
- Lacks mocking / fixture strategy recommendations
- Missing handling for flaky or async timing-sensitive tests
- No structured classification of test types (unit/integration/e2e/property/regression)

### Cross-Cutting Issues

- Inconsistent terminology: "implement", "execute", "validate" not always mapped 1:1
- Success criteria formats vary; not all commands separate automated vs manual consistently
- Limited explicit error/failure patterns (only execute has mismatch block pattern)
- No centralized style guide for command prompts (tone, imperative voice, structure headings)
- Some commands encourage full file reads even when unnecessary, increasing token costs
- Lack of parse-friendly output tags for automation (e.g., <commit-plan>, <validation-report>)
- Inconsistent environmental commands (`turbo`, `bun`, generic) produce friction
- No performance baseline metrics for improvements (conversation turns, corrective iterations)

## Desired End State

1. Standardized Command Prompt Framework (structure, headings, mandatory sections)
2. Each command includes:
   - Frontmatter: description, version, last_updated, command_schema_version, success_signals, failure_modes
   - Consistent sections: Purpose, Inputs, Preconditions, Process Phases, Error Handling, Structured Output Specification, Success Criteria, Edge Cases, Anti-Patterns
3. Reduced average prompt size (target: -15–25% tokens) through modular optional expansions
4. Improved execution reliability (fewer corrective user interventions; target -30%)
5. Formal structured output blocks enabling downstream automation (JSON-ish or fenced blocks with tags)
6. Unambiguous tool usage guidance and concurrency limits per command
7. Clear success criteria aligned with repository conventions (use `bun` commands where applicable)
8. Comprehensive test harness to simulate command usage and assert required section presence and formatting

### Quantitative Success Metrics

- Prompt Consistency Score (automated linter): ≥ 95% (all mandatory sections present)
- Reduction in clarification turns per command run (baseline vs post): -30%
- Reduction in incorrect task ordering (locator/analyzer misuse): -40%
- Mean time (turns) to approved plan (plan command): -20%
- Missing success criteria occurrences: 0 in new plans
- Lint script pass rate for command schema: 100%
- **Cache Hit Rate**: ≥ 70% for repeated operations (file analysis, pattern matching)
- **Token Savings from Caching**: -25-35% reduction in repeated context processing\*\*

## Intelligent Caching Strategy

### Caching Architecture

1. **Multi-Level Caching System**:
   - **Prompt Template Cache**: Frequently used prompt structures and templates
   - **Context Cache**: File contents, analysis results, and metadata
   - **Pattern Cache**: Regex patterns, file structure mappings, and search results
   - **Agent State Cache**: Intermediate results and decision trees

2. **Cache Types by Agent**:
   - **Locator Agents**: File system structure and metadata cache
   - **Analyzer Agents**: Code analysis results and pattern recognition cache
   - **Generator Agents**: Template and output structure cache
   - **Validator Agents**: Rule sets and validation result cache

3. **Cache Invalidation Strategy**:
   - **Time-based**: Automatic expiration (configurable, default 1 hour)
   - **Content-based**: Invalidation on file modification detection
   - **Manual**: Explicit cache clearing for debugging/testing
   - **Selective**: Granular invalidation for specific cache segments

### Cache Integration Points

1. **Command-Level Caching**:
   - Cache command execution results and intermediate states
   - Share context between related command invocations
   - Maintain workflow state across command sequences

2. **Agent-Level Caching**:
   - Each agent maintains its own specialized cache
   - Cache is automatically populated during agent execution
   - Cache is queried before expensive operations (file reads, analysis)

3. **Cross-Agent Cache Sharing**:
   - Locator results shared with analyzer agents
   - Analysis results shared with generator agents
   - Validation results shared across similar operations

### Cache Performance Optimizations

1. **Smart Cache Keys**:
   - Content-based hashing for file contents
   - Query-based hashing for search patterns
   - Context-aware keys for analysis results

2. **Compression and Storage**:
   - Automatic compression for large cache entries
   - Efficient storage format (JSON/binary as appropriate)
   - Memory-efficient data structures

3. **Cache Monitoring and Metrics**:
   - Hit/miss ratios tracked per agent and operation
   - Performance impact measurements
   - Cache size and memory usage monitoring

## What We Are NOT Doing

- Not changing the fundamental workflow sequence (research → plan → execute → test → review → document → commit)
- Not introducing new core commands
- Not altering tool permission models
- Not implementing live telemetry collection (only script-based simulated metrics)

## Implementation Approach

Layered, low-risk rollout with baseline capture, framework introduction, refactor, verification, and continuous improvement.

## Phase Overview

1. Phase 0: Baseline Audit & Metrics Capture
2. Phase 1: Framework & Style Guide Definition
3. Phase 2: Command Refactoring (Foundational Consistency + Structure)
4. Phase 3: Advanced Enhancements (Context Optimization, Error Patterns, Structured Output)
5. Phase 4: Validation, Testing Harness, A/B Evaluation
6. Phase 5: Documentation, Adoption, Continuous Evolution

---

## Phase 0: Baseline Audit & Metrics Capture

### Objectives

Establish quantitative and qualitative baselines before modifying prompts.

### Tasks

1. Create script `scripts/analyze-command-prompts.mjs`:
   - Extract: token counts, heading set, presence of required conceptual sections
   - Detect inconsistent terminology (regex: implement|execute, turbo|bun)
2. Define synthetic scenario set for each command (7 JSON fixtures under `tests/fixtures/commands/`)
3. Run dry AI simulation (or placeholder) to manually log:
   - Clarification turns needed (qualitative baseline documented in `research/research/YYYY-MM-DD_command_prompt_baseline.md`)
4. Record metrics table in baseline research doc.

### Deliverables

- Baseline research document
- Analyzer script & fixtures

### Success Criteria

- [x] Baseline document created
- [x] Script outputs JSON with metrics
- [x] All 7 commands analyzed

---

## Phase 1: Framework & Style Guide Definition

### Objectives

Create the canonical Command Prompt Style Guide + Schema.

### Tasks

1. Author `docs/COMMAND_PROMPT_STYLE_GUIDE.md`:
   - Mandatory sections list
   - Tone (imperative, concise, action-first)
   - Output block conventions: fenced blocks tagged, e.g., ```command-output:commit-plan
   - **Caching guidelines and cache integration patterns**
2. Define schema in JSON: `config/command-schema.json` (fields: purpose, inputs, preconditions, process, structured_outputs[], error_patterns[], success_criteria[], anti_patterns[], cache_strategy[])
3. Add validation script: `scripts/validate-command-prompts.mjs`
4. Introduce unified glossary mapping (implement = execute) used for lint warnings
5. Add decision on environment commands: standardize on `bun run typecheck`, `bun test` (with fallback alias notes) and param placeholders.
6. **Create caching framework**: `src/cache/` directory with cache manager, cache strategies, and agent-specific cache implementations
7. **Design cache integration patterns**: Define how each command type should leverage caching (locators, analyzers, generators, validators)

### Deliverables

- Style guide
- Schema JSON
- Validation script

### Success Criteria

- [ ] Schema validates all current commands (with warnings logged)
- [ ] Style guide approved (PR review)
- [ ] Validation script integrated into CI (pipeline addition)

---

## Phase 2: Command Refactoring (Core Consistency)

### Objectives

Refactor each command to conform to schema—focus on structure and clarity, minimal semantic change.

### Refactor Pattern (Applied to Each Command)

1. Add extended frontmatter fields:
   - version: 2.0.0-internal
   - last_updated: YYYY-MM-DD
   - command_schema_version: 1.0
   - success_signals: [... short list]
   - failure_modes: [...]
   - **cache_strategy**: [agent-specific caching approach]
2. Insert standardized sections in canonical order.
3. Normalize terminology (execute vs implement) and environment commands.
4. Introduce explicit Inputs + Preconditions lists.
5. Add Anti-Patterns & Edge Cases section.
6. **Integrate caching mechanisms**: Add cache-aware instructions and cache invalidation triggers

### Command-Specific Adjustments

- commit.md: Add structured preview block (<commit_plan>), guidance for multi-line commit body, hook handling, secret detection warning.
- document.md: Add doc status workflow, multi-audience merge procedure, snippet verification routine.
- execute.md: Pre-flight checklist (clean working tree, dependency install), progress reporting format `<execution_progress>`.
- plan.md: Modularize long template; move large template to an optional expandable section invoked only after structure approval; add Risk & Dependencies section.
- research.md: Fix typos, enforce task concurrency limits (e.g., max parallel tasks per agent type = 4), add Absent Ticket handling path.
- review.md: Align naming with execute; add severity taxonomy (INFO | WARN | REQUIRED_FIX), coverage delta hook.
- test.md: Add deterministic testing guidelines, coverage threshold conditional logic, flaky test triage flow.

### Deliverables

- Updated 7 command markdown files (base + ensure propagation strategy to `.claude/commands/` and `.opencode/command/` pipeline)

### Success Criteria

- [ ] Validation script passes with no errors
- [ ] Average token count reduced ≥ 15% (except where structural additions offset) OR justified
- [ ] All commands include structured output definitions

---

## Phase 3: Advanced Enhancements

### Objectives

Optimize for reliability, context efficiency, and automation synergy.

### Enhancements

1. Structured Output Blocks (Examples):
   - commit: ```commit-plan
   - review: ```validation-report
   - research: `research-summary / `detailed-findings
   - plan: `plan-outline first, then `plan-final
2. Adaptive Detail Mode:
   - Add guidance: if context length > threshold (e.g., 70% model limit) → use compressed variant enumerating only headings + references.
3. Error Pattern Library:
   - Standard error block: ```error-context with keys (command, phase, expected, found, mitigation, requires_user_input: bool)
4. Edge Case Catalog (central doc) referenced by each command.
5. Tool Efficiency Directives:
   - Research / Plan: Hard rule: AN: run locators first; if > 30 candidate files, cluster & prune before analyzers.
6. Token Budget Guidelines:
   - Provide per-command recommended maximum output tokens (soft): commit (500), plan (initial outline 600 / final 2500), research summary (800).
7. **Advanced Caching Integration**:
   - Cache-aware prompt generation with cache hit/miss optimization
   - Intelligent cache invalidation based on file modification timestamps
   - Cross-agent cache sharing for related operations
   - Performance monitoring with cache hit rate tracking

### Deliverables

- Updated prompts with adaptive + structured blocks
- Edge case & error pattern library: `docs/COMMAND_ERROR_PATTERNS.md`

### Success Criteria

- [ ] Structured blocks present & machine-detectable (regex test)
- [ ] Adaptive mode description included in all high-volume commands (plan, research, review)
- [ ] Analyzer script shows ≤ 1 spelling/grammar issue per command (target 0)

---

## Phase 4: Validation, Testing Harness, A/B Evaluation

### Objectives

Prove improvements produce measurable reliability gains.

### Tasks

1. Expand analyzer script to compute delta metrics (baseline vs refactored)
2. Add test harness `tests/command-prompt-simulation.test.ts`:
   - Static parsing: ensure required headings
   - Structured block presence
   - Forbidden patterns ("turbo test" unless feature-gated) detection
3. Manual Simulation Protocol:
   - For each command, run 2 representative scenarios pre/post; log clarifications required, mis-ordered actions
4. Create metrics summary doc `research/research/YYYY-MM-DD_command_prompt_optimization_results.md`
5. Adjust prompts if any metric regression > 5% vs baseline.
6. **Cache Performance Testing**:
   - Test cache hit rates for repeated operations
   - Validate cache invalidation on file modifications
   - Measure performance improvement with caching enabled
   - Test cross-agent cache sharing functionality

### Deliverables

- Test harness file(s)
- Metrics comparison research doc
- **Cache performance analysis report**
- **Cache integration test suite**

### Success Criteria

- [ ] All tests green in CI
- [ ] Clarification turns reduction target met
- [ ] No regression in plan completeness quality (qualitative checklist)
- [ ] Cache hit rate ≥ 70% for repeated operations
- [ ] Cache performance tests pass
- [ ] No cache-related regressions in functionality

---

## Phase 5: Documentation, Adoption & Continuous Evolution

### Objectives

Institutionalize new standards and set up feedback loop.

### Tasks

1. Add section to `README.md` summarizing command optimization framework
2. Add maintenance schedule (quarterly review) to Style Guide
3. Create `scripts/check-command-drift.mjs` to flag schema drift (e.g., missing new fields)
4. Add CHANGELOG entries for each command version bump
5. Establish feedback capture template for future refinements.
6. **Document caching architecture and usage patterns**
7. **Create cache monitoring and maintenance scripts**
8. **Add cache performance dashboard to CI/CD pipeline**

### Deliverables

- Updated README & CHANGELOG
- Drift script
- **Caching documentation and best practices guide**
- **Cache monitoring dashboard**
- **Cache maintenance automation scripts**

### Success Criteria

- [ ] Drift script finds 0 issues after initial run
- [ ] Documentation PR merged
- [ ] Versioning reflected across all 7 commands
- [ ] Cache documentation published and accessible
- [ ] Cache monitoring dashboard operational
- [ ] Cache maintenance scripts tested and functional

---

## Success Criteria (Global Rollup)

### Automated Verification

- 100% pass: schema validation, style guide linter, structured block detector
- Analyzer script delta metrics recorded; all improvement targets met or exceeded
- CI pipeline includes new validation steps (prompt schema + drift)
- **Cache performance tests integrated into CI pipeline**
- **Cache hit rate monitoring active and reporting**

### Manual Verification

- Stakeholder review approves clarity & consistency
- Sample end-to-end workflow (research → plan → execute → test → review → document → commit) executes with ≤ baseline clarifications -30%
- Plans produced after optimization show no missing success criteria sections
- **Cache functionality verified through repeated workflow executions**
- **Cache invalidation tested with file modifications**
- **Cross-agent cache sharing validated**

## Risk & Mitigation

| Risk                                           | Impact | Mitigation                                                               |
| ---------------------------------------------- | ------ | ------------------------------------------------------------------------ |
| Over-refactoring reduces helpful context       | Medium | Preserve essential rationale; use optional expansion blocks              |
| Automation scripts mis-parse new sections      | Medium | Write tests with representative prompt slices                            |
| Token reduction harms completeness             | High   | Monitor qualitative completeness checklist; rollback incremental changes |
| Structured output misused by downstream agents | Low    | Provide explicit interpretation guidelines in Style Guide                |
| Environmental command mismatch across repos    | Medium | Add fallback note and detection snippet                                  |
| **Cache invalidation failures**                | High   | Implement robust cache key generation and content-based invalidation     |
| **Cache memory leaks**                         | Medium | Add cache size limits and automatic cleanup mechanisms                   |
| **Stale cache data affecting decisions**       | High   | Implement time-based and content-based cache invalidation strategies     |
| **Cache performance overhead**                 | Medium | Profile cache operations and optimize for common use cases               |

## Edge Case Catalog (Initial Targets)

- Missing ticket file (research/plan): produce `error-context` block requesting path.
- Empty diff (commit/review): respond with no-op rationale.
- Failing tests before test generation (test): pivot to stabilization mode.
- Diverged plan vs code (execute/review): trigger plan re-alignment flow.
- Documentation with multiple overlapping audiences: merge shared core section, then audience-specific appendices.

## Testing Strategy

### Unit-Level (Static Prompt Validation)

- Schema validation script tests each command for mandatory sections
- Regex tests for structured output blocks presence

### Integration (Simulated Workflow)

- Feed synthetic scenario JSON into harness to validate sequential command interplay

### Regression

- Compare baseline vs post metrics automatically; fail CI if regression threshold breached.

## Performance Considerations

- Token savings targeted via modularization (plan & research largest reduction potential)
- Structured blocks improve downstream parsing efficiency (less re-tokenization / fewer clarifying turns)
- Additional scripts add negligible runtime (< 300ms total) to CI.
- **Cache performance benefits**: 25-35% reduction in repeated context processing through intelligent caching
- **Memory efficiency**: Cache compression and size limits prevent memory bloat
- **Network optimization**: Reduced API calls through cached results

## Migration Notes

- All refactors staged behind branch; release as command schema version 1.0
- Provide fallback legacy copies for one release cycle if critical consumers rely on old format
- Update conversion scripts (if any) only after refactored base stabilized.
- **Cache migration**: Implement gradual cache population to avoid cold start performance impact
- **Cache versioning**: Include cache format versioning to handle schema changes gracefully
- **Backward compatibility**: Ensure cache can be invalidated and rebuilt if needed

## Rollback Strategy

- Keep pre-optimization copies in `command/_legacy/` for one minor version
- Single revert commit can restore old prompts if severe regression emerges
- **Cache rollback**: Implement cache clearing mechanism for complete cache reset
- **Cache versioning**: Maintain cache snapshots for point-in-time rollback capability
- **Gradual degradation**: Allow fallback to non-cached behavior if cache issues arise

## References

- Existing Command Files: `/command/*.md`
- Baseline Plans for Style Reference: `research/plans/agent-ecosystem-uats-compliance-implementation.md`, `research/plans/fix-command-setup-strategy.md`
- Repository Tooling Conventions: `CLAUDE.md`, `README.md`
- **Caching Architecture**: `src/cache/` (to be created)
- **Cache Performance Analysis**: `research/research/YYYY-MM-DD_cache_performance_analysis.md` (deliverable)
- **Cache Best Practices**: `docs/CACHE_BEST_PRACTICES.md` (deliverable)

## Next Action (Immediate)

Begin Phase 1: Complete framework & style guide definition, including comprehensive caching architecture design and integration patterns.

---

Prepared: command prompt optimization initiative – ready for execution phases.
