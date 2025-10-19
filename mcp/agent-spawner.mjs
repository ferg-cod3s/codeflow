/**
 * Agent Spawning Infrastructure for MCP Server
 *
 * Executes agents with proper isolation and configuration within MCP tool execution context.
 * Provides the ability to spawn agents with specific models, tools, and temperatures.
 */

/**
 * Utility: Normalize an agent id to kebab-case (lowercase, hyphens)
 * Also trims extra whitespace and collapses multiple separators.
 *
 * Examples:
 *  - "development_migrations_specialist" -> "development-migrations-specialist"
 *  - "Quality Testing Performance Tester" -> "quality-testing-performance-tester"
 */
function toKebabCase(id) {
  if (!id) return '';
  return String(id)
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase()
    .trim();
}

/**
 * Resolve an agent id against the registry with legacy underscore compatibility
 * Tries: exact, kebab-case, common legacy underscore → kebab mappings.
 */
function resolveAgentId(requestedId, registry) {
  if (!requestedId) return { id: requestedId, resolved: false };
  if (registry.has(requestedId)) return { id: requestedId, resolved: true };

  const kebab = toKebabCase(requestedId);
  if (registry.has(kebab)) return { id: kebab, resolved: true };

  // Known legacy underscore names → kebab-case
  const legacyMap = new Map([
    ['development_migrations_specialist', 'development-migrations-specialist'],
    ['quality-testing_performance_tester', 'quality-testing-performance-tester'],
    ['operations_incident_commander', 'operations-incident-commander'],
    ['programmatic_seo_engineer', 'programmatic-seo-engineer'],
    ['content_localization_coordinator', 'content-localization-coordinator'],
  ]);
  const mapped = legacyMap.get(requestedId);
  if (mapped && registry.has(mapped)) return { id: mapped, resolved: true };

  // As a last attempt, check for any registry key that equals kebab ignoring duplicate hyphens
  const normalized = kebab.replace(/-+/g, '-');
  for (const key of registry.keys()) {
    if (toKebabCase(key) === normalized) {
      return { id: key, resolved: true };
    }
  }

  return { id: requestedId, resolved: false };
}

/**
 * Check if a path is within allowed directories for an agent
 *
 * @param {string} path - The path to check
 * @param {Array<string>} allowedDirectories - Array of allowed directory paths
 * @returns {boolean} - Whether the path is allowed
 */
function isPathAllowed(path, allowedDirectories) {
  if (!allowedDirectories || allowedDirectories.length === 0) {
    return false; // No directories allowed
  }

  const normalizedPath = path.replace(/\\/g, '/'); // Normalize path separators

  return allowedDirectories.some((allowedDir) => {
    const normalizedAllowed = allowedDir.replace(/\\/g, '/');
    // Check if the path starts with the allowed directory
    return normalizedPath.startsWith(normalizedAllowed);
  });
}

/**
 * Standardized output schema that all subagents must return.
 * The orchestrator will integrate results across phases using this shape.
 */
const STANDARD_OUTPUT_SCHEMA = {
  type: 'object',
  required: ['findings', 'evidence', 'recommendations'],
  properties: {
    findings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          description: { type: 'string' },
          location: { type: ['string', 'null'] },
          severity: { type: ['string', 'null'] },
          tags: { type: 'array', items: { type: 'string' } },
        },
        required: ['title', 'description'],
      },
    },
    evidence: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          type: { type: 'string' },
          path: { type: ['string', 'null'] },
          snippet: { type: ['string', 'null'] },
          url: { type: ['string', 'null'] },
          note: { type: ['string', 'null'] },
        },
        required: ['type'],
      },
    },
    recommendations: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          action: { type: 'string' },
          rationale: { type: 'string' },
          priority: { type: ['string', 'number'] },
          owner: { type: ['string', 'null'] },
          links: { type: 'array', items: { type: 'string' } },
        },
        required: ['action', 'rationale'],
      },
    },
  },
};

/**
 * Build a structured brief that is passed to the subagent
 */
function buildBrief({ agentId, objective, inputs = {}, constraints = {}, success = {} }) {
  return {
    agent: toKebabCase(agentId),
    objective, // short imperative objective sentence
    inputs: {
      // contextual inputs
      paths: Array.isArray(inputs.paths) ? inputs.paths : inputs.paths ? [inputs.paths] : [],
      context: inputs.context || '',
      fields: inputs.fields || {},
    },
    constraints: {
      permissions: constraints.permissions || {},
      allowed_directories: constraints.allowed_directories || [],
      timebox_minutes: constraints.timebox_minutes || null,
      require_read_only: constraints.require_read_only || false,
    },
    success_criteria: {
      output_schema: success.output_schema || STANDARD_OUTPUT_SCHEMA,
      checklist: Array.isArray(success.checklist) ? success.checklist : [],
    },
    return_schema: STANDARD_OUTPUT_SCHEMA,
  };
}

/**
 * Compose a prompt section from a brief for consistent platform behavior
 */
function briefToPromptSection(brief) {
  const lines = [];
  lines.push('## Structured Brief');
  lines.push('Objective: ' + (brief.objective || ''));
  lines.push('');
  lines.push('### Inputs');
  if (brief.inputs?.paths?.length) {
    lines.push('- Paths:');
    for (const p of brief.inputs.paths) lines.push(`  - ${p}`);
  }
  if (brief.inputs?.context) {
    lines.push('- Context: |');
    brief.inputs.context.split('\n').forEach((l) => lines.push('  ' + l));
  }
  if (brief.inputs?.fields && Object.keys(brief.inputs.fields).length) {
    lines.push('- Fields:');
    for (const [k, v] of Object.entries(brief.inputs.fields)) {
      lines.push(`  - ${k}: ${typeof v === 'string' ? v : JSON.stringify(v)}`);
    }
  }
  lines.push('');
  lines.push('### Constraints');
  if (brief.constraints?.allowed_directories?.length) {
    lines.push('- Allowed Directories:');
    for (const d of brief.constraints.allowed_directories) lines.push(`  - ${d}`);
  }
  if (brief.constraints?.permissions) {
    lines.push('- Permissions: ' + JSON.stringify(brief.constraints.permissions));
  }
  if (brief.constraints?.timebox_minutes) {
    lines.push('- Timebox (minutes): ' + brief.constraints.timebox_minutes);
  }
  if (brief.constraints?.require_read_only) {
    lines.push('- Mode: READ-ONLY enforced');
  }
  lines.push('');
  lines.push('### Success Criteria');
  if (Array.isArray(brief.success_criteria?.checklist) && brief.success_criteria.checklist.length) {
    lines.push('- Checklist:');
    for (const item of brief.success_criteria.checklist) lines.push(`  - [ ] ${item}`);
  }
  lines.push('- Output Schema (JSON):');
  lines.push('```json');
  lines.push(
    JSON.stringify(brief.success_criteria?.output_schema || STANDARD_OUTPUT_SCHEMA, null, 2)
  );
  lines.push('```');
  lines.push('');
  lines.push('### Output Requirements');
  lines.push('- Return your result strictly in this JSON object shape:');
  lines.push('```json');
  lines.push(JSON.stringify({ findings: [], evidence: [], recommendations: [] }, null, 2));
  lines.push('```');
  lines.push(
    '- If your platform forces plain text, prefix one line with "REPORT_JSON:" then include ONLY the JSON object on the next line.'
  );
  return lines.join('\n');
}

/**
 * Build the complete prompt for an agent including context, task, and optional brief
 *
 * @param {Object} agent - The agent definition
 * @param {string} task - The specific task to execute
 * @param {Object} brief - Optional structured brief
 * @returns {string} - Complete agent prompt
 */
function buildAgentPrompt(agent, task, brief) {
  const sections = [];

  // Agent identity and role
  sections.push(`# ${agent.name}`);
  sections.push(`${agent.description}`);
  sections.push('');

  // Agent context (the main body content)
  if (agent.context) {
    sections.push(agent.context);
    sections.push('');
  }

  // Specific task instructions
  if (task) {
    sections.push('## Current Task');
    sections.push(task);
    sections.push('');
  }

  // Include brief if provided
  if (brief) {
    sections.push(briefToPromptSection(brief));
    sections.push('');
  }

  // Mode-specific instructions
  if (agent.mode === 'subagent') {
    sections.push('## Instructions');
    sections.push(
      'You are operating as a specialized subagent. Focus on your specific expertise and provide targeted, actionable output. Coordinate with other agents as needed but stay within your domain of expertise.'
    );
  } else if (agent.mode === 'primary') {
    sections.push('## Instructions');
    sections.push(
      'You are operating as a primary agent with broader coordination responsibilities. You may need to orchestrate multiple subagents or handle complex multi-domain tasks.'
    );
  }

  // Tool availability
  if (agent.tools && Object.keys(agent.tools).length > 0) {
    sections.push('## Available Tools');
    const enabledTools = Object.entries(agent.tools)
      .filter(([, enabled]) => enabled)
      .map(([tool]) => `- ${tool}`)
      .join('\n');
    if (enabledTools) {
      sections.push(enabledTools);
    }
  }

  return sections.join('\n');
}

/**
 * Execute a single agent task with proper configuration and validation
 *
 * @param {string} agentId - The ID of the agent to spawn (any format; will normalize)
 * @param {string} taskDescription - The task for the agent to execute
 * @param {Map} registry - The agent registry
 * @param {Object} options - Additional execution options: { brief?, requiresWrite?, requiresBash?, requestedPaths? }
 * @returns {Promise<Object>} - Agent execution result
 */
async function spawnAgentTask(agentId, taskDescription, registry, options = {}) {
  // Normalize and resolve agent id
  const { id: resolvedId, resolved } = resolveAgentId(agentId, registry);
  if (!resolved) {
    throw new Error(`Agent ${agentId} not found in registry (normalized: ${toKebabCase(agentId)})`);
  }
  const agent = registry.get(resolvedId);

  // Validate agent permissions before spawning (based on explicit options or brief)
  const brief = options.brief;
  const requestedPaths = options.requestedPaths || brief?.inputs?.paths || [];
  const requiresWrite =
    options.requiresWrite || (brief?.constraints?.permissions?.edit === true ? true : false);
  const requiresBash =
    options.requiresBash || (brief?.constraints?.permissions?.bash === true ? true : false);

  const validation = validateAgentExecution(resolvedId, registry, {
    requestedPaths,
    requiresWrite,
    requiresBash,
  });

  if (!validation.valid) {
    const errs = validation.errors || [];
    const msg = errs.map((e) => (typeof e === 'string' ? e : e.message)).join('; ');
    throw new Error(`Agent ${resolvedId} failed validation: ${msg || 'unknown error'}`);
  }

  // Get allowed directories from agent configuration
  const allowedDirectories = agent.allowedDirectories || [];

  // Build agent execution context with security restrictions
  const executionContext = {
    agentId: resolvedId,
    name: agent.name,
    description: agent.description,
    model: agent.model || 'model-not-specified',
    temperature: agent.temperature !== undefined ? agent.temperature : 0.3,
    tools: agent.tools || {},
    mode: agent.mode || 'subagent',
    task: taskDescription,
    context: agent.context,
    allowedDirectories,
    isPathAllowed: (path) => isPathAllowed(path, allowedDirectories),
    timestamp: new Date().toISOString(),
    brief: brief || null,
    expectedOutputSchema: STANDARD_OUTPUT_SCHEMA,
    ...options,
  };

  // Structured prompt including brief
  const prompt = buildAgentPrompt(agent, taskDescription, brief);

  // Return a structured response that can be used by commands/orchestrator
  const result = {
    agentId: resolvedId,
    name: agent.name,
    model: executionContext.model,
    temperature: executionContext.temperature,
    task: taskDescription,
    status: 'ready',
    prompt,
    tools: Object.keys(agent.tools || {}),
    executionContext,
  };

  return result;
}

/**
 * Execute multiple agents in parallel (simple string tasks)
 *
 * @param {Array<string>} agentIds
 * @param {Array<string>} tasks
 * @param {Map} registry
 * @param {Object} options - Applied to all spawns
 */
async function executeParallelAgents(agentIds, tasks, registry, options = {}) {
  if (agentIds.length !== tasks.length) {
    throw new Error('Agent IDs and tasks arrays must have the same length');
  }

  const promises = agentIds.map((agentId, index) =>
    spawnAgentTask(agentId, tasks[index], registry, options)
  );

  try {
    const results = await Promise.all(promises);
    return results;
  } catch (error) {
    console.error('Error executing parallel agents:', error);
    throw error;
  }
}

/**
 * Execute multiple agents in parallel with per-agent briefs
 * agentSpecs: Array<{ agentId, brief, task? }>
 */
async function executeParallelAgentsWithBriefs(agentSpecs, registry) {
  const promises = agentSpecs.map((spec) =>
    spawnAgentTask(
      spec.agentId,
      spec.task || 'Execute the structured brief below and return the required JSON report.',
      registry,
      { brief: spec.brief }
    )
  );
  return Promise.all(promises);
}

/**
 * Execute agents in sequence
 * @param {Array<Object>} agentSpecs - Array of {agentId, task} objects
 */
async function executeSequentialAgents(agentSpecs, registry, options = {}) {
  const results = [];

  for (const { agentId, task } of agentSpecs) {
    try {
      const result = await spawnAgentTask(agentId, task, registry, options);
      results.push(result);
    } catch (error) {
      console.error(`Error executing agent ${agentId}:`, error);
      results.push({
        agentId,
        status: 'error',
        error: error.message,
        task,
      });
    }
  }

  return results;
}

/**
 * Create a workflow orchestrator that can manage complex multi-agent workflows
 * Implements phase-gated orchestration: locators → pattern-finders → analyzers
 */
function createWorkflowOrchestrator(registry) {
  return {
    /**
     * Execute a research workflow with phase-gated orchestration
     * locators (parallel) → pattern-finders → analyzers
     */
    async executeResearchWorkflow(domain, query, options = {}) {
      // Determine locator agents based on domain
      const locators = [];
      const patternFinders = [];
      const analyzers = [];

      if (domain === 'codebase' || domain === 'code') {
        locators.push('codebase-locator');
        patternFinders.push('codebase-pattern-finder');
        analyzers.push('codebase-analyzer');
      }

      if (domain === 'documentation' || domain === 'thoughts') {
        locators.push('research-locator');
        analyzers.push('research-analyzer');
      }

      if (domain === 'web' || domain === 'research') {
        // Web search is effectively both locator+analyzer for external info
        analyzers.push('web-search-researcher');
      }

      const integration = { findings: [], evidence: [], recommendations: [], context: {} };

      // Phase 1: Locators in parallel
      const locatorBriefs = locators.map((agentId) =>
        buildBrief({
          agentId,
          objective: `Locate all assets relevant to: ${query}`,
          inputs: { context: options.context || '' },
          constraints: {
            permissions: { read: true },
            allowed_directories: options.allowedDirectories || [],
            require_read_only: true,
          },
          success: {
            checklist: [
              'List paths and resources discovered',
              'Include minimal evidence snippets or references',
            ],
          },
        })
      );

      const locatorResults = locators.length
        ? await executeParallelAgentsWithBriefs(
            locators.map((agentId, i) => ({ agentId, brief: locatorBriefs[i] })),
            registry
          )
        : [];

      // Integrate locator outputs (stub integration as actual model execution is external)
      integration.context.locatorCount = locatorResults.length;
      integration.context.query = query;

      // Phase 2: Pattern finders
      const patternResults = patternFinders.length
        ? await executeParallelAgentsWithBriefs(
            patternFinders.map((agentId) => ({
              agentId,
              brief: buildBrief({
                agentId,
                objective: `Find similar implementations and reusable patterns for: ${query}`,
                inputs: {
                  context: `Use locator outputs as context. Locator results count: ${locatorResults.length}`,
                },
                constraints: {
                  permissions: { read: true },
                  allowed_directories: options.allowedDirectories || [],
                  require_read_only: true,
                },
                success: {
                  checklist: [
                    'Map patterns to discovered components',
                    'Provide examples with evidence',
                  ],
                },
              }),
            })),
            registry
          )
        : [];

      integration.context.patternFinderCount = patternResults.length;

      // Phase 3: Analyzers
      const analyzerResults = analyzers.length
        ? await executeParallelAgentsWithBriefs(
            analyzers.map((agentId) => ({
              agentId,
              brief: buildBrief({
                agentId,
                objective: `Analyze components deeply relative to: ${query}`,
                inputs: {
                  context: `Use locator and pattern-finder outputs. Locator: ${locatorResults.length}, Patterns: ${patternResults.length}`,
                },
                constraints: {
                  permissions: { read: true },
                  allowed_directories: options.allowedDirectories || [],
                  require_read_only: true,
                },
                success: { checklist: ['Explain how it works', 'Identify risks and edge cases'] },
              }),
            })),
            registry
          )
        : [];

      return {
        workflow: 'research',
        domain,
        query,
        results: [...locatorResults, ...patternResults, ...analyzerResults],
        integration,
        timestamp: new Date().toISOString(),
      };
    },

    /**
     * Execute a planning workflow without orchestrator self-spawn.
     * Selects appropriate specialists and provides structured briefs.
     */
    async executePlanningWorkflow(requirements, context) {
      // Core planning agents (no self-spawn of orchestrator)
      const planningAgents = ['system-architect'];

      // Add domain-specific agents based on requirements
      const lower = (requirements || '').toLowerCase();
      if (/(database|migration|schema|sql)/.test(lower)) {
        planningAgents.push('development-migrations-specialist');
      }
      if (/(performance|optimiz|latency|throughput|load)/.test(lower)) {
        planningAgents.push('quality-testing-performance-tester');
      }
      if (/(security|auth|vulnerab|risk)/.test(lower)) {
        planningAgents.push('security-scanner');
      }

      // Phase-gated context gathering before planning
      const researchPhase = await this.executeResearchWorkflow('codebase', requirements, {
        context,
      });

      // Build structured briefs for planning agents
      const briefs = planningAgents.map((agentId) =>
        buildBrief({
          agentId,
          objective: `Create a detailed, actionable implementation plan for: ${requirements}`,
          inputs: {
            context: `Project context:\n${context || ''}\n\nResearch Summary: ${researchPhase.results.length} phase results integrated.`,
          },
          constraints: {
            permissions: { read: true },
            allowed_directories: [],
            require_read_only: true,
          },
          success: {
            checklist: [
              'List phases with clear deliverables',
              'Map risks to mitigations',
              'Define validation and rollback steps',
            ],
          },
        })
      );

      const results = await executeParallelAgentsWithBriefs(
        planningAgents.map((agentId, i) => ({ agentId, brief: briefs[i] })),
        registry
      );

      return {
        workflow: 'planning',
        requirements,
        results,
        research: researchPhase,
        timestamp: new Date().toISOString(),
      };
    },
  };
}

/**
 * Validate agent execution prerequisites
 *
 * @param {string} agentId - The agent ID to validate (will be resolved/normalized by caller)
 * @param {Map} registry - The agent registry
 * @param {Object} executionOptions - Execution options including inputs and paths
 * @returns {Object} - Validation result with structured errors
 */
function validateAgentExecution(agentId, registry, executionOptions = {}) {
  const agent = registry.get(agentId);

  if (!agent) {
    return {
      valid: false,
      severity: 'error',
      error: {
        type: 'agent_not_found',
        message: `Agent ${agentId} not found in registry`,
        remediation: 'Check agent ID spelling or ensure agent is properly registered',
        suggestions: Array.from(registry.keys())
          .filter((id) => id.includes(toKebabCase(agentId).split('-')[0]))
          .slice(0, 3),
      },
    };
  }

  const issues = [];
  const warnings = [];

  // Check required fields
  if (!agent.description) {
    issues.push({
      type: 'missing_field',
      field: 'description',
      message: 'Agent missing description',
      severity: 'error',
      remediation: 'Add description field to agent frontmatter',
    });
  }

  if (!agent.context || agent.context.trim().length === 0) {
    warnings.push({
      type: 'empty_context',
      message: 'Agent context is empty - may produce generic responses',
      severity: 'warning',
      remediation: 'Add context content to agent markdown file',
    });
  }

  // Check model configuration
  if (!agent.model) {
    warnings.push({
      type: 'missing_model',
      message: 'No model specified',
      severity: 'warning',
      remediation: 'Specify model in agent frontmatter',
    });
  }

  if (agent.temperature !== undefined && (agent.temperature < 0 || agent.temperature > 2)) {
    issues.push({
      type: 'invalid_temperature',
      field: 'temperature',
      message: `Temperature ${agent.temperature} outside normal range (0-2)`,
      severity: 'error',
      remediation: 'Set temperature between 0 and 2',
    });
  }

  // Validate tools permissions
  if (agent.tools && typeof agent.tools === 'object') {
    if (agent.tools.filesystem) {
      const fs = agent.tools.filesystem;

      // Check if write is enabled but no allowed directories
      if (
        fs.write === true &&
        (!agent.allowedDirectories || agent.allowedDirectories.length === 0)
      ) {
        issues.push({
          type: 'permission_violation',
          field: 'allowed_directories',
          message: 'Filesystem write enabled but no allowed directories specified',
          severity: 'error',
          remediation: 'Add allowed_directories array to agent frontmatter',
        });
      }

      // Validate allowed directories format
      if (agent.allowedDirectories) {
        agent.allowedDirectories.forEach((dir, index) => {
          if (typeof dir !== 'string') {
            issues.push({
              type: 'invalid_directory',
              field: `allowed_directories[${index}]`,
              message: `Invalid directory type: expected string, got ${typeof dir}`,
              severity: 'error',
              remediation: 'Use string paths in allowed_directories array',
            });
          }
        });
      }
    }
  }

  // Validate execution options against agent constraints
  if (executionOptions) {
    // Check file access permissions
    if (executionOptions.requestedPaths) {
      for (const p of executionOptions.requestedPaths) {
        if (!isPathAllowed(p, agent.allowedDirectories || [])) {
          issues.push({
            type: 'path_out_of_scope',
            field: 'requestedPaths',
            message: `Requested path '${p}' not in allowed directories`,
            severity: 'error',
            remediation: `Add '${p}' to allowed_directories or use a path within: ${
              agent.allowedDirectories?.join(', ') || 'none'
            }`,
          });
        }
      }
    }

    // Check if operation requires permissions agent doesn't have
    if (executionOptions.requiresWrite && agent.tools?.filesystem?.write !== true) {
      issues.push({
        type: 'insufficient_permissions',
        field: 'filesystem.write',
        message:
          'Operation requires write permissions but agent does not have filesystem.write enabled',
        severity: 'error',
        remediation: 'Enable filesystem.write in agent tools configuration',
      });
    }

    if (executionOptions.requiresBash && agent.tools?.bash !== true) {
      issues.push({
        type: 'insufficient_permissions',
        field: 'bash',
        message: 'Operation requires bash permissions but agent does not have bash enabled',
        severity: 'error',
        remediation: 'Enable bash in agent tools configuration',
      });
    }
  }

  return {
    valid: issues.length === 0,
    errors: issues,
    warnings,
    agent: {
      id: agentId,
      name: agent.name,
      model: agent.model,
      temperature: agent.temperature || 0.3,
      hasContext: !!agent.context,
      toolCount: Object.keys(agent.tools || {}).length,
      permissionSummary: agent.permissionSummary || 'none',
    },
  };
}

export {
  toKebabCase,
  resolveAgentId,
  spawnAgentTask,
  executeParallelAgents,
  executeParallelAgentsWithBriefs,
  executeSequentialAgents,
  buildAgentPrompt,
  createWorkflowOrchestrator,
  validateAgentExecution,
};
