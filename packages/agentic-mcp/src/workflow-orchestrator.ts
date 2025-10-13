#!/usr/bin/env node

import type { Agent } from './agent-registry.js';
import type { AgentExecutionResult } from './agent-spawner.js';
import { spawnAgentTask, executeParallelAgents, executeSequentialAgents } from './agent-spawner.js';
import { suggestAgents } from './agent-registry.js';

/**
 * Multi-Phase Workflow Orchestration Engine
 * 
 * Implements complex workflows with phase dependencies, conditional execution,
 * and dynamic agent selection based on findings.
 */

export interface WorkflowPhase {
  name: string;
  type: 'parallel' | 'sequential' | 'optional' | 'conditional';
  agents: AgentSpec[];
  depends_on?: string[];
  condition?: (context: WorkflowContext) => boolean;
  timeout?: string;
}

export interface AgentSpec {
  name: string;
  purpose: string;
  depends_on?: string[];
  timeout?: string;
}

export interface WorkflowContext {
  query: string;
  domain?: string;
  requirements?: string;
  results: Map<string, AgentExecutionResult[]>;
  metadata: Record<string, any>;
  findings: WorkflowFindings;
}

export interface WorkflowFindings {
  domains: string[];
  criticalIssues: string[];
  recommendations: string[];
  needsDeepAnalysis: boolean;
  confidence: 'high' | 'medium' | 'low';
}

export interface MultiPhaseWorkflowResult {
  workflow: string;
  phases: PhaseResult[];
  context: WorkflowContext;
  summary: WorkflowSummary;
  timestamp: string;
}

export interface PhaseResult {
  phaseName: string;
  type: string;
  status: 'completed' | 'skipped' | 'failed';
  results: AgentExecutionResult[];
  duration?: number;
  skippedReason?: string;
}

export interface WorkflowSummary {
  totalAgents: number;
  successfulAgents: number;
  failedAgents: number;
  totalDuration: number;
  qualityScore: number;
  confidence: 'high' | 'medium' | 'low';
  insights: string[];
  nextSteps: string[];
}

/**
 * Execute a multi-phase workflow with dependency resolution
 */
export async function executeMultiPhaseWorkflow(
  phases: WorkflowPhase[],
  context: WorkflowContext,
  registry: Map<string, Agent>
): Promise<MultiPhaseWorkflowResult> {
  const startTime = Date.now();
  const phaseResults: PhaseResult[] = [];
  
  console.log(`🚀 Starting multi-phase workflow: ${phases.length} phases`);
  
  for (const phase of phases) {
    console.log(`\n📍 Phase: ${phase.name} (${phase.type})`);
    
    const phaseStartTime = Date.now();
    
    // Check if phase should be executed
    if (phase.type === 'conditional' && phase.condition && !phase.condition(context)) {
      console.log(`⏭️  Skipping conditional phase: ${phase.name}`);
      phaseResults.push({
        phaseName: phase.name,
        type: phase.type,
        status: 'skipped',
        results: [],
        skippedReason: 'Condition not met',
      });
      continue;
    }
    
    // Check dependencies
    if (phase.depends_on && phase.depends_on.length > 0) {
      const depsResolved = checkDependencies(phase.depends_on, context.results);
      if (!depsResolved) {
        console.log(`⚠️  Dependencies not resolved for phase: ${phase.name}`);
        phaseResults.push({
          phaseName: phase.name,
          type: phase.type,
          status: 'failed',
          results: [],
        });
        continue;
      }
    }
    
    try {
      let results: AgentExecutionResult[] = [];
      
      // Execute agents based on phase type
      switch (phase.type) {
        case 'parallel':
          results = await executePhaseParallel(phase, context, registry);
          break;
        case 'sequential':
          results = await executePhaseSequential(phase, context, registry);
          break;
        case 'optional':
        case 'conditional':
          results = await executePhaseParallel(phase, context, registry);
          break;
      }
      
      // Store results in context
      for (const agent of phase.agents) {
        const agentResults = results.filter(r => r.agentId === agent.name);
        if (!context.results.has(agent.name)) {
          context.results.set(agent.name, []);
        }
        context.results.get(agent.name)!.push(...agentResults);
      }
      
      const phaseDuration = Date.now() - phaseStartTime;
      
      phaseResults.push({
        phaseName: phase.name,
        type: phase.type,
        status: 'completed',
        results,
        duration: phaseDuration,
      });
      
      console.log(`✅ Phase completed: ${phase.name} (${phaseDuration}ms)`);
      
      // Update workflow findings after each phase
      updateWorkflowFindings(context, results);
      
    } catch (error: any) {
      console.error(`❌ Phase failed: ${phase.name}`, error);
      phaseResults.push({
        phaseName: phase.name,
        type: phase.type,
        status: 'failed',
        results: [],
      });
    }
  }
  
  const totalDuration = Date.now() - startTime;
  
  // Generate workflow summary
  const summary = generateWorkflowSummary(phaseResults, context, totalDuration);
  
  console.log(`\n🎉 Workflow completed in ${totalDuration}ms`);
  console.log(`📊 Quality Score: ${summary.qualityScore}/100`);
  
  return {
    workflow: 'multi-phase',
    phases: phaseResults,
    context,
    summary,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Execute phase agents in parallel
 */
async function executePhaseParallel(
  phase: WorkflowPhase,
  context: WorkflowContext,
  registry: Map<string, Agent>
): Promise<AgentExecutionResult[]> {
  const agentIds = phase.agents.map(a => a.name);
  const tasks = phase.agents.map(a => buildAgentTask(a, context));
  
  return await executeParallelAgents(agentIds, tasks, registry);
}

/**
 * Execute phase agents sequentially
 */
async function executePhaseSequential(
  phase: WorkflowPhase,
  context: WorkflowContext,
  registry: Map<string, Agent>
): Promise<AgentExecutionResult[]> {
  const agentSpecs = phase.agents.map(a => ({
    agentId: a.name,
    task: buildAgentTask(a, context),
  }));
  
  return await executeSequentialAgents(agentSpecs, registry);
}

/**
 * Build task description for an agent based on context
 */
function buildAgentTask(agent: AgentSpec, context: WorkflowContext): string {
  const parts: string[] = [];
  
  parts.push(`**Purpose**: ${agent.purpose}`);
  parts.push(`**Research Query**: ${context.query}`);
  
  if (context.domain) {
    parts.push(`**Domain**: ${context.domain}`);
  }
  
  if (context.requirements) {
    parts.push(`**Requirements**: ${context.requirements}`);
  }
  
  // Add context from previous agents if dependencies exist
  if (agent.depends_on && agent.depends_on.length > 0) {
    parts.push(`\n**Previous Findings**:`);
    for (const depAgentId of agent.depends_on) {
      const depResults = context.results.get(depAgentId);
      if (depResults && depResults.length > 0) {
        const latestResult = depResults[depResults.length - 1];
        parts.push(`- ${depAgentId}: ${summarizeAgentResult(latestResult)}`);
      }
    }
  }
  
  return parts.join('\n');
}

/**
 * Summarize agent result for context passing
 */
function summarizeAgentResult(result: AgentExecutionResult): string {
  if (result.status === 'error') {
    return `Error: ${result.error}`;
  }
  return `${result.name} completed successfully`;
}

/**
 * Check if dependencies are resolved
 */
function checkDependencies(
  dependencies: string[],
  results: Map<string, AgentExecutionResult[]>
): boolean {
  for (const dep of dependencies) {
    const depResults = results.get(dep);
    if (!depResults || depResults.length === 0) {
      return false;
    }
    // Check if last execution was successful
    const lastResult = depResults[depResults.length - 1];
    if (lastResult.status === 'error') {
      return false;
    }
  }
  return true;
}

/**
 * Update workflow findings based on agent results
 */
function updateWorkflowFindings(
  context: WorkflowContext,
  results: AgentExecutionResult[]
): void {
  // Analyze results and update findings
  for (const result of results) {
    // Extract domain signals from agent results
    if (result.agentId.includes('security')) {
      if (!context.findings.domains.includes('security')) {
        context.findings.domains.push('security');
      }
    }
    if (result.agentId.includes('performance')) {
      if (!context.findings.domains.includes('performance')) {
        context.findings.domains.push('performance');
      }
    }
    if (result.agentId.includes('database')) {
      if (!context.findings.domains.includes('database')) {
        context.findings.domains.push('database');
      }
    }
  }
}

/**
 * Generate workflow summary with quality metrics
 */
function generateWorkflowSummary(
  phases: PhaseResult[],
  context: WorkflowContext,
  totalDuration: number
): WorkflowSummary {
  let totalAgents = 0;
  let successfulAgents = 0;
  let failedAgents = 0;
  
  for (const phase of phases) {
    totalAgents += phase.results.length;
    successfulAgents += phase.results.filter(r => r.status === 'ready').length;
    failedAgents += phase.results.filter(r => r.status === 'error').length;
  }
  
  // Calculate quality score (0-100)
  const completionRate = totalAgents > 0 ? (successfulAgents / totalAgents) : 0;
  const phaseCompletionRate = phases.filter(p => p.status === 'completed').length / phases.length;
  const qualityScore = Math.round((completionRate * 0.7 + phaseCompletionRate * 0.3) * 100);
  
  // Determine confidence based on results
  let confidence: 'high' | 'medium' | 'low' = 'medium';
  if (qualityScore >= 80) confidence = 'high';
  if (qualityScore < 50) confidence = 'low';
  
  // Generate insights
  const insights: string[] = [];
  if (context.findings.domains.length > 0) {
    insights.push(`Identified ${context.findings.domains.length} domain(s): ${context.findings.domains.join(', ')}`);
  }
  if (successfulAgents > 0) {
    insights.push(`Successfully executed ${successfulAgents} agent(s)`);
  }
  if (failedAgents > 0) {
    insights.push(`${failedAgents} agent(s) encountered errors`);
  }
  
  // Generate next steps
  const nextSteps: string[] = [];
  if (context.findings.needsDeepAnalysis) {
    nextSteps.push('Consider engaging domain specialists for deeper analysis');
  }
  if (context.findings.domains.includes('security')) {
    nextSteps.push('Review security findings and implement recommendations');
  }
  if (qualityScore < 70) {
    nextSteps.push('Re-run workflow with adjusted parameters for better coverage');
  }
  nextSteps.push('Use findings to create implementation plan with /plan command');
  
  return {
    totalAgents,
    successfulAgents,
    failedAgents,
    totalDuration,
    qualityScore,
    confidence,
    insights,
    nextSteps,
  };
}

/**
 * Select domain specialists based on workflow findings
 */
export async function selectDomainSpecialists(
  findings: WorkflowFindings,
  registry: Map<string, Agent>
): Promise<string[]> {
  const specialists: string[] = [];
  
  // Map domains to specialist agents
  const domainMapping: Record<string, string[]> = {
    security: ['security-scanner', 'security-auditor', 'frontend-security-coder', 'backend-security-coder'],
    performance: ['performance-engineer', 'quality-testing-performance-tester', 'database-optimizer'],
    database: ['database-expert', 'database-optimizer', 'database-admin'],
    api: ['api-builder', 'graphql-architect', 'api-documenter'],
    infrastructure: ['infrastructure-builder', 'devops-operations-specialist', 'cloud-architect'],
    frontend: ['frontend-developer', 'ui-ux-designer', 'accessibility-pro'],
    testing: ['test-automator', 'test-generator', 'quality-testing-performance-tester'],
  };
  
  // Select specialists based on identified domains
  for (const domain of findings.domains) {
    const domainSpecialists = domainMapping[domain] || [];
    for (const specialistId of domainSpecialists) {
      if (registry.has(specialistId) && !specialists.includes(specialistId)) {
        specialists.push(specialistId);
      }
    }
  }
  
  // Limit to top 5 specialists
  return specialists.slice(0, 5);
}

/**
 * Create initial workflow context
 */
export function createWorkflowContext(
  query: string,
  domain?: string,
  requirements?: string
): WorkflowContext {
  return {
    query,
    domain,
    requirements,
    results: new Map(),
    metadata: {},
    findings: {
      domains: [],
      criticalIssues: [],
      recommendations: [],
      needsDeepAnalysis: false,
      confidence: 'medium',
    },
  };
}
