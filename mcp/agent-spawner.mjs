/**
 * Agent Spawning Infrastructure for MCP Server
 *
 * Executes agents with proper isolation and configuration within MCP tool execution context.
 * Provides the ability to spawn agents with specific models, tools, and temperatures.
 */

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
 * Execute a single agent task with proper configuration
 *
 * @param {string} agentId - The ID of the agent to spawn
 * @param {string} taskDescription - The task for the agent to execute
 * @param {Map} registry - The agent registry
 * @param {Object} options - Additional execution options
 * @returns {Promise<Object>} - Agent execution result
 */
async function spawnAgentTask(agentId, taskDescription, registry, options = {}) {
  const agent = registry.get(agentId);
  if (!agent) {
    throw new Error(`Agent ${agentId} not found in registry`);
  }

  // Get allowed directories from agent configuration (now extracted in registry)
  const allowedDirectories = agent.allowedDirectories || [];

  // Build agent execution context with security restrictions
  const executionContext = {
    agentId,
    name: agent.name,
    description: agent.description,
    model: agent.model || 'claude-3-5-sonnet-20241022',
    temperature: agent.temperature !== undefined ? agent.temperature : 0.3,
    tools: agent.tools || {},
    mode: agent.mode || 'subagent',
    task: taskDescription,
    context: agent.context,
    allowedDirectories,
    isPathAllowed: (path) => isPathAllowed(path, allowedDirectories),
    timestamp: new Date().toISOString(),
    ...options,
  };

  // For now, return a structured response that can be used by commands
  // In a full implementation, this would interface with the model API
  const result = {
    agentId,
    name: agent.name,
    model: executionContext.model,
    temperature: executionContext.temperature,
    task: taskDescription,
    status: 'ready',
    prompt: buildAgentPrompt(agent, taskDescription),
    tools: Object.keys(agent.tools || {}),
    executionContext,
  };

  return result;
}

/**
 * Execute multiple agents in parallel
 *
 * @param {Array<string>} agentIds - Array of agent IDs to spawn
 * @param {Array<string>} tasks - Array of tasks (must match agentIds length)
 * @param {Map} registry - The agent registry
 * @param {Object} options - Additional execution options
 * @returns {Promise<Array<Object>>} - Array of agent execution results
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
 * Execute agents in sequence (useful when later agents depend on earlier results)
 *
 * @param {Array<Object>} agentSpecs - Array of {agentId, task} objects
 * @param {Map} registry - The agent registry
 * @param {Object} options - Additional execution options
 * @returns {Promise<Array<Object>>} - Array of agent execution results
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
 * Build the complete prompt for an agent including context and task
 *
 * @param {Object} agent - The agent definition
 * @param {string} task - The specific task to execute
 * @returns {string} - Complete agent prompt
 */
function buildAgentPrompt(agent, task) {
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
  sections.push('## Current Task');
  sections.push(task);
  sections.push('');

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
      .filter(([_, enabled]) => enabled)
      .map(([tool, _]) => `- ${tool}`)
      .join('\n');
    if (enabledTools) {
      sections.push(enabledTools);
    }
  }

  return sections.join('\n');
}

/**
 * Create a workflow orchestrator that can manage complex multi-agent workflows
 *
 * @param {Map} registry - The agent registry
 * @returns {Object} - Workflow orchestrator interface
 */
function createWorkflowOrchestrator(registry) {
  return {
    /**
     * Execute a research workflow with locator -> analyzer pattern
     */
    async executeResearchWorkflow(domain, query) {
      const agents = [];

      // Select appropriate agents based on domain
      if (domain === 'codebase' || domain === 'code') {
        agents.push('codebase-locator');
        agents.push('codebase-analyzer');
        agents.push('codebase-pattern-finder');
      }

      if (domain === 'documentation' || domain === 'thoughts') {
        agents.push('thoughts-locator');
        agents.push('thoughts-analyzer');
      }

      if (domain === 'web' || domain === 'research') {
        agents.push('web-search-researcher');
      }

      // Execute all agents if found
      if (agents.length > 0) {
        const tasks = agents.map((agentId) => `Research and analyze: ${query}`);
        const results = await executeParallelAgents(agents, tasks, registry);

        return {
          workflow: 'research',
          domain,
          query,
          results,
          timestamp: new Date().toISOString(),
        };
      }

      return {
        workflow: 'research',
        domain,
        query,
        results: [],
        timestamp: new Date().toISOString(),
      };
    },

    /**
     * Execute a planning workflow with research -> analysis -> planning pattern
     */
    async executePlanningWorkflow(requirements, context) {
      const planningAgents = ['smart-subagent-orchestrator'];

      // Add domain-specific agents based on requirements
      if (requirements.includes('database') || requirements.includes('migration')) {
        planningAgents.push('development_migrations_specialist');
      }

      if (requirements.includes('performance') || requirements.includes('optimization')) {
        planningAgents.push('quality-testing_performance_tester');
      }

      if (requirements.includes('security')) {
        planningAgents.push('security-scanner');
      }

      const tasks = planningAgents.map(
        (agentId) =>
          `Create a detailed implementation plan for: ${requirements}\n\nContext: ${context}`
      );

      const results = await executeParallelAgents(planningAgents, tasks, registry);

      return {
        workflow: 'planning',
        requirements,
        results,
        timestamp: new Date().toISOString(),
      };
    },
  };
}

/**
 * Validate agent execution prerequisites
 *
 * @param {string} agentId - The agent ID to validate
 * @param {Map} registry - The agent registry
 * @returns {Object} - Validation result
 */
function validateAgentExecution(agentId, registry) {
  const agent = registry.get(agentId);

  if (!agent) {
    return {
      valid: false,
      error: `Agent ${agentId} not found in registry`,
      suggestions: Array.from(registry.keys())
        .filter((id) => id.includes(agentId.split('-')[0]))
        .slice(0, 3),
    };
  }

  const issues = [];
  const warnings = [];

  // Check required fields
  if (!agent.description) {
    issues.push('Agent missing description');
  }

  if (!agent.context || agent.context.trim().length === 0) {
    warnings.push('Agent context is empty - may produce generic responses');
  }

  // Check model configuration
  if (!agent.model) {
    warnings.push('No model specified, using default');
  }

  if (agent.temperature !== undefined && (agent.temperature < 0 || agent.temperature > 2)) {
    warnings.push('Temperature outside normal range (0-2)');
  }

  return {
    valid: issues.length === 0,
    errors: issues,
    warnings,
    agent: {
      id: agentId,
      name: agent.name,
      model: agent.model || 'claude-3-5-sonnet-20241022',
      temperature: agent.temperature || 0.3,
      hasContext: !!agent.context,
      toolCount: Object.keys(agent.tools || {}).length,
    },
  };
}

export {
  spawnAgentTask,
  executeParallelAgents,
  executeSequentialAgents,
  buildAgentPrompt,
  createWorkflowOrchestrator,
  validateAgentExecution,
};
