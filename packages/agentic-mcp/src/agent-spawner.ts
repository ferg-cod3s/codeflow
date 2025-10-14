#!/usr/bin/env node

import type { Agent } from './agent-registry.js';

/**
 * Agent Spawning Infrastructure for NPM MCP Server
 *
 * Privacy-safe agent execution that provides structured prompts and configuration
 * without exposing sensitive information or executing actual model calls.
 */

export interface AgentExecutionResult {
  agentId: string;
  name: string;
  model: string;
  temperature: number;
  task: string;
  status: 'ready' | 'error';
  prompt: string;
  tools: string[];
  executionContext: AgentExecutionContext;
  error?: string;
}

export interface AgentExecutionContext {
  agentId: string;
  name: string;
  description: string;
  model: string;
  temperature: number;
  tools: Record<string, boolean>;
  mode: string;
  task: string;
  context: string;
  timestamp: string;
}

/**
 * Execute a single agent task with proper configuration
 */
export async function spawnAgentTask(
  agentId: string,
  taskDescription: string,
  registry: Map<string, Agent>,
  options: Record<string, any> = {}
): Promise<AgentExecutionResult> {
  const agent = registry.get(agentId);
  if (!agent) {
    return {
      agentId,
      name: 'Unknown Agent',
      model: 'unknown',
      temperature: 0.3,
      task: taskDescription,
      status: 'error',
      prompt: '',
      tools: [],
      executionContext: {} as AgentExecutionContext,
      error: `Agent ${agentId} not found in registry`,
    };
  }

  // Build agent execution context
  const executionContext: AgentExecutionContext = {
    agentId,
    name: agent.name,
    description: agent.description,
    model: agent.model || 'model-not-specified',
    temperature: agent.temperature !== undefined ? agent.temperature : 0.3,
    tools: agent.tools || {},
    mode: agent.mode || 'subagent',
    task: taskDescription,
    context: agent.context,
    timestamp: new Date().toISOString(),
    ...options,
  };

  const result: AgentExecutionResult = {
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
 */
export async function executeParallelAgents(
  agentIds: string[],
  tasks: string[],
  registry: Map<string, Agent>,
  options: Record<string, any> = {}
): Promise<AgentExecutionResult[]> {
  if (agentIds.length !== tasks.length) {
    throw new Error('Agent IDs and tasks arrays must have the same length');
  }

  const promises = agentIds.map((agentId, index) =>
    spawnAgentTask(agentId, tasks[index], registry, options)
  );

  try {
    const results = await Promise.all(promises);
    return results;
  } catch (error: any) {
    console.error('Error executing parallel agents:', error);
    throw error;
  }
}

/**
 * Execute agents in sequence
 */
export async function executeSequentialAgents(
  agentSpecs: Array<{ agentId: string; task: string }>,
  registry: Map<string, Agent>,
  options: Record<string, any> = {}
): Promise<AgentExecutionResult[]> {
  const results: AgentExecutionResult[] = [];

  for (const { agentId, task } of agentSpecs) {
    try {
      const result = await spawnAgentTask(agentId, task, registry, options);
      results.push(result);
    } catch (error: any) {
      console.error(`Error executing agent ${agentId}:`, error);
      results.push({
        agentId,
        name: 'Error',
        model: 'unknown',
        temperature: 0.3,
        task,
        status: 'error',
        prompt: '',
        tools: [],
        executionContext: {} as AgentExecutionContext,
        error: error.message,
      });
    }
  }

  return results;
}

/**
 * Build the complete prompt for an agent
 */
export function buildAgentPrompt(agent: Agent, task: string): string {
  const sections: string[] = [];

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
      'You are operating as a specialized subagent. Focus on your specific expertise and provide targeted, actionable output.'
    );
  } else if (agent.mode === 'primary') {
    sections.push('## Instructions');
    sections.push('You are operating as a primary agent with coordination responsibilities.');
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
 * Create a workflow orchestrator interface
 */
export interface WorkflowOrchestrator {
  executeResearchWorkflow(domain: string, query: string): Promise<WorkflowResult>;
  executePlanningWorkflow(requirements: string, context: string): Promise<WorkflowResult>;
}

export interface WorkflowResult {
  workflow: string;
  domain?: string;
  query?: string;
  requirements?: string;
  results: AgentExecutionResult[];
  timestamp: string;
}

export function createWorkflowOrchestrator(registry: Map<string, Agent>): WorkflowOrchestrator {
  return {
    async executeResearchWorkflow(domain: string, query: string): Promise<WorkflowResult> {
      const agents: string[] = [];

      // Select appropriate agents based on domain
      if (domain === 'codebase' || domain === 'code') {
        agents.push('codebase-locator', 'codebase-analyzer');
      }

      if (domain === 'web' || domain === 'research') {
        agents.push('web-search-researcher');
      }

      const tasks = agents.map((_agentId) => `Research and analyze: ${query}`);
      const results = await executeParallelAgents(agents, tasks, registry);

      return {
        workflow: 'research',
        domain,
        query,
        results,
        timestamp: new Date().toISOString(),
      };
    },

    async executePlanningWorkflow(requirements: string, context: string): Promise<WorkflowResult> {
      // Use generic planning agents for NPM version
      const agents = ['codebase-analyzer'];
      const tasks = [`Create implementation plan for: ${requirements}\n\nContext: ${context}`];

      const results = await executeParallelAgents(agents, tasks, registry);

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
 */
export interface AgentValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  suggestions?: string[];
  agent?: {
    id: string;
    name: string;
    model: string;
    temperature: number;
    hasContext: boolean;
    toolCount: number;
  };
}

export function validateAgentExecution(
  agentId: string,
  registry: Map<string, Agent>
): AgentValidationResult {
  const agent = registry.get(agentId);

  if (!agent) {
    return {
      valid: false,
      errors: [`Agent ${agentId} not found in registry`],
      warnings: [],
      suggestions: Array.from(registry.keys())
        .filter((id) => id.includes(agentId.split('-')[0]))
        .slice(0, 3),
    };
  }

  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required fields
  if (!agent.description) {
    errors.push('Agent missing description');
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
    valid: errors.length === 0,
    errors,
    warnings,
    agent: {
      id: agentId,
      name: agent.name,
      model: agent.model || 'model-not-specified',
      temperature: agent.temperature || 0.3,
      hasContext: !!agent.context,
      toolCount: Object.keys(agent.tools || {}).length,
    },
  };
}

/**
 * Enhanced workflow orchestrator with multi-phase support
 */
export function createEnhancedWorkflowOrchestrator(
  registry: Map<string, Agent>
): EnhancedWorkflowOrchestrator {
  return {
    async executeResearchWorkflow(options: any): Promise<any> {
      // Dynamic import to avoid circular dependencies
      const { executeResearchWorkflow: executeResearch } = await import('./research-workflow.js');
      const { validateWorkflowQuality } = await import('./quality-validator.js');

      const result = await executeResearch(options, registry);

      // Validate workflow quality
      const validation = validateWorkflowQuality(result.workflow, result.workflow.context);

      return {
        ...result,
        validation,
      };
    },

    async executeCustomWorkflow(phases: any[], context: any): Promise<any> {
      const { executeMultiPhaseWorkflow } = await import('./workflow-orchestrator.js');
      return await executeMultiPhaseWorkflow(phases, context, registry);
    },

    async executePlanningWorkflow(requirements: string, context: string): Promise<WorkflowResult> {
      // Use existing implementation
      const agents = ['codebase-analyzer'];
      const tasks = [`Create implementation plan for: ${requirements}\n\nContext: ${context}`];
      const results = await executeParallelAgents(agents, tasks, registry);

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
 * Enhanced workflow orchestrator interface
 */
export interface EnhancedWorkflowOrchestrator extends WorkflowOrchestrator {
  executeCustomWorkflow(phases: any[], context: any): Promise<any>;
}
